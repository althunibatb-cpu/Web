---
name: video-mining
description: Find and extract knowledge from YouTube, Twitch VODs and other video for game improvement — mass search, whole-channel mining, transcripts (with Whisper for uncaptioned videos), top comments, and frame grabs to visually study pro gameplay. Use when researching a game via video, or when the user shares a video link.
---

# Video Mining v2

## Find (go wide)
`python3 tools/yt.py search "<query>" --n 40` (add `--sort date` for post-patch content). No API key, no
limits beyond what YouTube returns. Run many query shapes per topic:
- `<game> <topic> guide | explained | tutorial | deep dive | in-depth`
- `<game> coaching <rank>` / `VOD review <rank>` / `<rank> vs <higher rank> difference`
- `<pro> POV` / `<pro> <character> ranked` / `<pro> stream highlights <topic>`
- `<game> mistakes <rank>` / `<game> habits of top players` / `<game> tech nobody uses`
- `<game> grand final analysis` / `<game> pro breakdown <team>`
- Native-language queries (write them in that script — e.g. Korean, Japanese, Chinese, Russian, Portuguese)
- Twitch: search `site:twitch.tv/videos <pro>` or open the pro's videos page with Playwright; yt.py handles
  Twitch VOD URLs the same way as YouTube

Rank by: creator proof-of-level, recency vs. patch, views relative to channel size, comment consensus.

## Mine a whole channel
Best coaches and pros are worth their entire catalogue:
`python3 tools/yt.py channel https://www.youtube.com/@<handle> --n 500` → filter titles relevant to the
user's game/role/rank → write URLs to `research/<slug>-<handle>.txt` → `python3 tools/yt.py bulk <file>`.

## Extract
- `python3 tools/yt.py transcript <url> [--lang ko]` → `research/transcripts/<id>.txt`, already chunked
  with clickable `[mm:ss]` links. Uses captions first and Whisper if a video has none (`--whisper off` to skip).
- `python3 tools/yt.py info <url> --comments 150` → description, chapters, top comments (comments often
  contain corrections, timestamps and "this changed in patch X").
- `python3 tools/yt.py frames <url> --at 4:12,4:15` or `--start 4:00 --end 4:30 --every 2` → JPGs you can
  **Read and look at**: crosshair placement, positioning, minimap, HUD, spacing, build order, settings screens.
  Use this to verify what a creator says actually happens on screen, and to study pro POVs that have no commentary.
- The `youtube-transcript` MCP works too when installed; use whichever succeeds.

## Turn into knowledge
- Extract every concrete, actionable claim: technique, decision rule, timing, setting, matchup, mindset.
- Store each in the KB with URL, creator, `ts`, patch, tier, confidence (and `q` if memorisable):
  pipe JSON lines into `python3 tools/kb.py claim add --game <slug> --stdin`.
- Every named technique, person, tool or resource mentioned → a new lead.
- Keep raw transcripts in `research/` (personal scratch); notes in `games/` are your own synthesis with links.
