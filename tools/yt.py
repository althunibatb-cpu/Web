#!/usr/bin/env python3
"""yt.py — video research toolbox for the Game Mastery System (YouTube, Twitch VODs, and anything yt-dlp supports).

No API keys. Everything lands in research/ (scratch) as files Claude can read.

  search   "<query>" [--n 40] [--sort relevance|date]   -> JSON lines of videos
  channel  <channel_or_playlist_url> [--n 300]           -> every upload of a coach/pro, JSON lines
  transcript <url> [--lang en] [--whisper auto|force|off] [--model small]
                                                          -> research/transcripts/<id>.txt with [mm:ss] links
  info     <url> [--comments 100]                         -> description, chapters, top comments
  frames   <url> --at 12:34,13:05 | --every 5 --start 10:00 --end 11:00
                                                          -> research/frames/<id>/*.jpg (Claude can look at these)
  bulk     <file_with_urls> [--lang en]                    -> transcripts for many videos in one go
"""
import argparse, json, os, re, subprocess, sys, glob, html

try:
    import yt_dlp
except ImportError:
    sys.exit("yt-dlp missing: pip install -U yt-dlp")

ROOT = os.environ.get("GM_RESEARCH", "research")
TR_DIR, FR_DIR, INFO_DIR = (os.path.join(ROOT, d) for d in ("transcripts", "frames", "info"))


def _ydl(**opts):
    base = {"quiet": True, "no_warnings": True, "skip_download": True, "ignoreerrors": True}
    base.update(opts)
    return yt_dlp.YoutubeDL(base)


def _ts(sec):
    sec = int(sec)
    h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def _parse_ts(t):
    parts = [float(p) for p in t.strip().split(":")]
    sec = 0
    for p in parts:
        sec = sec * 60 + p
    return sec


def _link(url, vid, sec):
    if "youtube" in url or "youtu.be" in url:
        return f"https://youtu.be/{vid}?t={int(sec)}"
    return f"{url}{'&' if '?' in url else '?'}t={int(sec)}s"


def _emit(entries):
    for e in entries or []:
        if not e:
            continue
        print(json.dumps({
            "id": e.get("id"), "title": e.get("title"),
            "channel": e.get("channel") or e.get("uploader"),
            "url": e.get("url") if str(e.get("url", "")).startswith("http") else
                   f"https://www.youtube.com/watch?v={e.get('id')}",
            "duration": e.get("duration"), "views": e.get("view_count"),
            "upload_date": e.get("upload_date") or e.get("timestamp"),
        }, ensure_ascii=False))


def cmd_search(a):
    prefix = "ytsearchdate" if a.sort == "date" else "ytsearch"
    with _ydl(extract_flat=True) as y:
        info = y.extract_info(f"{prefix}{a.n}:{a.query}", download=False)
    _emit((info or {}).get("entries"))


def cmd_channel(a):
    url = a.url
    if re.search(r"youtube\.com/(@|c/|channel/|user/)", url) and not re.search(r"/(videos|streams|shorts|playlist)", url):
        url = url.rstrip("/") + "/videos"
    with _ydl(extract_flat=True, playlistend=a.n) as y:
        info = y.extract_info(url, download=False)
    _emit((info or {}).get("entries"))


# ---------- transcripts ----------
def _clean_vtt(path):
    """Return list of (start_sec, text) with rolling auto-caption duplicates removed."""
    cues, last = [], ""
    with open(path, encoding="utf-8", errors="ignore") as f:
        blocks = f.read().replace("\r", "").split("\n\n")
    for b in blocks:
        lines = b.strip().splitlines()
        idx = next((i for i, l in enumerate(lines) if "-->" in l), None)
        if idx is None:
            continue
        start = _parse_ts(lines[idx].split("-->")[0].strip().replace(",", "."))
        for raw in lines[idx + 1:]:
            t = html.unescape(re.sub(r"<[^>]+>", "", raw)).strip()
            if not t or t == last:
                continue
            new = t[len(last):].strip() if last and t.startswith(last) else t
            last = t
            if new:
                cues.append((start, new))
    return cues


def _chunk(cues, url, vid, every=30):
    out, buf, chunk_start = [], [], None
    for s, t in cues:
        if chunk_start is None:
            chunk_start = s
        if s - chunk_start >= every and buf:
            out.append(f"[{_ts(chunk_start)}]({_link(url, vid, chunk_start)}) " + " ".join(buf))
            buf, chunk_start = [], s
        buf.append(t)
    if buf:
        out.append(f"[{_ts(chunk_start)}]({_link(url, vid, chunk_start)}) " + " ".join(buf))
    return "\n".join(out)


def _whisper(url, vid, model):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None, "faster-whisper not installed (pip install faster-whisper)"
    os.makedirs(TR_DIR, exist_ok=True)
    audio_tmpl = os.path.join(TR_DIR, f"{vid}.audio.%(ext)s")
    with _ydl(skip_download=False, format="bestaudio/best", outtmpl=audio_tmpl) as y:
        y.download([url])
    files = glob.glob(os.path.join(TR_DIR, f"{vid}.audio.*"))
    if not files:
        return None, "audio download failed"
    m = WhisperModel(model, device="auto", compute_type="auto")
    segs, _ = m.transcribe(files[0], vad_filter=True)
    cues = [(s.start, s.text.strip()) for s in segs]
    for fp in files:
        os.remove(fp)
    return cues, None


def transcript(url, lang="en", whisper="auto", model="small", quiet=False):
    os.makedirs(TR_DIR, exist_ok=True)
    with _ydl() as y:
        info = y.extract_info(url, download=False)
    if not info:
        return None, "could not read video"
    vid = info["id"]
    out_path = os.path.join(TR_DIR, f"{vid}.txt")
    cues, method = None, None
    if whisper != "force":
        langs = [f"{lang}.*", lang, "en.*"] if lang != "en" else ["en.*", "en"]
        with _ydl(writesubtitles=True, writeautomaticsub=True, subtitleslangs=langs,
                  subtitlesformat="vtt", outtmpl=os.path.join(TR_DIR, f"{vid}.%(ext)s")) as y:
            y.download([url])
        vtts = sorted(glob.glob(os.path.join(TR_DIR, f"{vid}*.vtt")))
        # prefer human-made subs (yt-dlp names them the same; pick the first non-empty)
        for v in vtts:
            cues = _clean_vtt(v)
            if cues:
                method = f"captions ({os.path.basename(v)})"
                break
        for v in vtts:
            os.remove(v)
    if not cues and whisper in ("auto", "force"):
        cues, err = _whisper(url, vid, model)
        method = f"whisper-{model}" if cues else None
        if not cues:
            return None, f"no captions and whisper failed: {err}"
    if not cues:
        return None, "no captions (run with --whisper auto)"
    header = (f"# {info.get('title')}\nchannel: {info.get('channel') or info.get('uploader')}\n"
              f"url: {url}\nupload_date: {info.get('upload_date')}\nduration: {_ts(info.get('duration') or 0)}\n"
              f"views: {info.get('view_count')}\nmethod: {method}\n")
    chapters = info.get("chapters") or []
    if chapters:
        header += "chapters:\n" + "\n".join(f"  [{_ts(c['start_time'])}] {c['title']}" for c in chapters) + "\n"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header + "\n" + _chunk(cues, url, vid) + "\n")
    if not quiet:
        print(out_path)
    return out_path, None


def cmd_transcript(a):
    p, err = transcript(a.url, a.lang, a.whisper, a.model)
    if err:
        sys.exit(f"ERROR: {err}")


def cmd_bulk(a):
    urls = [l.strip() for l in open(a.file) if l.strip() and not l.startswith("#")]
    for u in urls:
        p, err = transcript(u, a.lang, a.whisper, a.model, quiet=True)
        print(json.dumps({"url": u, "file": p, "error": err}))


def cmd_info(a):
    os.makedirs(INFO_DIR, exist_ok=True)
    opts = {}
    if a.comments:
        opts = {"getcomments": True,
                "extractor_args": {"youtube": {"max_comments": [str(a.comments)], "comment_sort": ["top"]}}}
    with _ydl(**opts) as y:
        info = y.extract_info(a.url, download=False)
    if not info:
        sys.exit("ERROR: could not read video")
    out = {k: info.get(k) for k in ("id", "title", "channel", "upload_date", "duration", "view_count",
                                    "like_count", "description", "tags")}
    out["chapters"] = [{"t": _ts(c["start_time"]), "title": c["title"]} for c in info.get("chapters") or []]
    out["comments"] = [{"likes": c.get("like_count"), "author": c.get("author"), "text": c.get("text")}
                       for c in sorted(info.get("comments") or [], key=lambda c: -(c.get("like_count") or 0))]
    path = os.path.join(INFO_DIR, f"{info['id']}.json")
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(path)


def cmd_frames(a):
    with _ydl() as y:
        info = y.extract_info(a.url, download=False)
    vid = info["id"]
    d = os.path.join(FR_DIR, vid)
    os.makedirs(d, exist_ok=True)
    # get a direct stream URL (<=720p) and let ffmpeg seek into it — no full download
    with _ydl(format="bv*[height<=720]/b[height<=720]/b") as y:
        fmt = y.extract_info(a.url, download=False)
    stream = fmt.get("url") or (fmt.get("requested_formats") or [{}])[0].get("url")
    if not stream:
        sys.exit("ERROR: no stream url")
    points = []
    if a.at:
        points = [_parse_ts(t) for t in a.at.split(",")]
    else:
        s, e = _parse_ts(a.start), _parse_ts(a.end)
        t = s
        while t <= e:
            points.append(t)
            t += a.every
    for t in points:
        out = os.path.join(d, f"{vid}_{_ts(t).replace(':', '-')}.jpg")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(t), "-i", stream,
                        "-frames:v", "1", "-q:v", "3", out], check=False)
        if os.path.exists(out):
            print(out)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("search"); s.add_argument("query"); s.add_argument("--n", type=int, default=40)
    s.add_argument("--sort", choices=["relevance", "date"], default="relevance"); s.set_defaults(f=cmd_search)
    s = sp.add_parser("channel"); s.add_argument("url"); s.add_argument("--n", type=int, default=300); s.set_defaults(f=cmd_channel)
    for name, fn in (("transcript", cmd_transcript), ("bulk", cmd_bulk)):
        s = sp.add_parser(name)
        s.add_argument("file" if name == "bulk" else "url")
        s.add_argument("--lang", default="en"); s.add_argument("--whisper", choices=["auto", "force", "off"], default="auto")
        s.add_argument("--model", default="small"); s.set_defaults(f=fn)
    s = sp.add_parser("info"); s.add_argument("url"); s.add_argument("--comments", type=int, default=100); s.set_defaults(f=cmd_info)
    s = sp.add_parser("frames"); s.add_argument("url"); s.add_argument("--at")
    s.add_argument("--every", type=float, default=5); s.add_argument("--start", default="0"); s.add_argument("--end", default="0:30")
    s.set_defaults(f=cmd_frames)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
