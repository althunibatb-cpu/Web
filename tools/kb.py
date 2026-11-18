#!/usr/bin/env python3
"""kb.py — the Game Mastery knowledge engine (SQLite + full-text search). No dependencies.

Claims = atomic, sourced facts/techniques. Leads = the research queue that drives "dig until nothing new".

  claim add  --game G --topic T --claim "..." --url U [--creator C --ts 12:34 --patch 9.1 --kind technique
             --tier 2 --confidence high]                   (or pipe JSON lines to: claim add --game G --stdin)
  claim search G "<fts query>" [--limit 30]
  claim topic  G <topic>                                    all claims for a topic, best first
  claim verify <id> confirmed|outdated|contested|false [--note "..."]
  claim dupes  G                                            likely duplicates (same topic, similar text)
  lead add  --game G --lead "drive rush oki" [--kind term|person|channel|url|question] [--priority 1-5] [--origin "..."]
  lead next G [--n 10]                                      highest-priority unexplored leads (marks them in_progress)
  lead done <id> [--yield N]                                N = how many new claims it produced
  lead list G [--status open]
  saturation G [--window 15]                                is research still producing new knowledge?
  stats G
  anki G [--out file.csv] [--topic T]                       flashcards from claims that have a "q" question, (front;back;tags) for spaced repetition
  coverage G <tree.md>                                      which skill-tree nodes have few/no verified claims
"""
import argparse, json, os, sqlite3, sys, time, re, csv, difflib

DB = os.environ.get("GM_DB", "kb/knowledge.db")
SCHEMA = """
CREATE TABLE IF NOT EXISTS claims(id INTEGER PRIMARY KEY, game TEXT, topic TEXT, kind TEXT, claim TEXT,
  url TEXT, creator TEXT, ts TEXT, patch TEXT, tier INTEGER, confidence TEXT, q TEXT, status TEXT DEFAULT 'unverified',
  note TEXT, added REAL);
CREATE VIRTUAL TABLE IF NOT EXISTS claims_fts USING fts5(claim, topic, creator, content='claims', content_rowid='id');
CREATE TRIGGER IF NOT EXISTS claims_ai AFTER INSERT ON claims BEGIN
  INSERT INTO claims_fts(rowid, claim, topic, creator) VALUES (new.id, new.claim, new.topic, new.creator); END;
CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY, game TEXT, lead TEXT, kind TEXT, priority INTEGER,
  origin TEXT, status TEXT DEFAULT 'open', yield INTEGER, added REAL, done REAL, UNIQUE(game, lead));
"""
CONF = {"high": 3, "med": 2, "medium": 2, "low": 1}
STATUS_RANK = {"confirmed": 4, "unverified": 3, "contested": 2, "outdated": 1, "false": 0}


def db():
    os.makedirs(os.path.dirname(DB) or ".", exist_ok=True)
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    c.executescript(SCHEMA)
    return c


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def _insert_claim(c, game, d):
    c.execute("INSERT INTO claims(game,topic,kind,claim,url,creator,ts,patch,tier,confidence,q,added) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
              (slug(game), slug(d.get("topic", "general")), d.get("kind", "fact"), d["claim"], d.get("url"),
               d.get("creator"), d.get("ts"), d.get("patch"), d.get("tier"), d.get("confidence", "med"), d.get("q"), time.time()))


def claim_add(a):
    c = db()
    n = 0
    if a.stdin:
        for line in sys.stdin:
            line = line.strip()
            if line:
                _insert_claim(c, a.game, json.loads(line)); n += 1
    else:
        _insert_claim(c, a.game, {"topic": a.topic, "kind": a.kind, "claim": a.claim, "url": a.url,
                                  "creator": a.creator, "ts": a.ts, "patch": a.patch, "tier": a.tier,
                                  "confidence": a.confidence, "q": a.q}); n = 1
    c.commit(); print(f"added {n} claim(s)")


def _print(rows):
    for r in rows:
        print(json.dumps({k: r[k] for k in r.keys() if r[k] is not None}, ensure_ascii=False))


def claim_search(a):
    rows = db().execute("""SELECT c.* FROM claims_fts f JOIN claims c ON c.id=f.rowid
                           WHERE claims_fts MATCH ? AND c.game=? ORDER BY rank LIMIT ?""",
                        (a.query, slug(a.game), a.limit)).fetchall()
    _print(rows)


def claim_topic(a):
    rows = db().execute("SELECT * FROM claims WHERE game=? AND topic=?", (slug(a.game), slug(a.topic))).fetchall()
    rows = sorted(rows, key=lambda r: (-STATUS_RANK.get(r["status"], 0), r["tier"] or 9, -CONF.get(r["confidence"] or "med", 2)))
    _print(rows)


def claim_verify(a):
    c = db(); c.execute("UPDATE claims SET status=?, note=? WHERE id=?", (a.status, a.note, a.id)); c.commit(); print("ok")


def claim_dupes(a):
    rows = db().execute("SELECT id, topic, claim FROM claims WHERE game=? ORDER BY topic", (slug(a.game),)).fetchall()
    by = {}
    for r in rows:
        by.setdefault(r["topic"], []).append(r)
    for topic, rs in by.items():
        for i in range(len(rs)):
            for j in range(i + 1, len(rs)):
                ratio = difflib.SequenceMatcher(None, rs[i]["claim"].lower(), rs[j]["claim"].lower()).ratio()
                if ratio > 0.72:
                    print(json.dumps({"topic": topic, "ids": [rs[i]["id"], rs[j]["id"]], "similarity": round(ratio, 2)}))


def lead_add(a):
    c = db()
    try:
        c.execute("INSERT INTO leads(game,lead,kind,priority,origin,added) VALUES(?,?,?,?,?,?)",
                  (slug(a.game), a.lead.strip(), a.kind, a.priority, a.origin, time.time()))
        c.commit(); print("queued")
    except sqlite3.IntegrityError:
        print("already known")


def lead_next(a):
    c = db()
    rows = c.execute("SELECT * FROM leads WHERE game=? AND status='open' ORDER BY priority DESC, added LIMIT ?",
                     (slug(a.game), a.n)).fetchall()
    for r in rows:
        c.execute("UPDATE leads SET status='in_progress' WHERE id=?", (r["id"],))
    c.commit(); _print(rows)


def lead_done(a):
    c = db(); c.execute("UPDATE leads SET status='done', yield=?, done=? WHERE id=?", (a.yield_, time.time(), a.id)); c.commit(); print("ok")


def lead_list(a):
    q, args = "SELECT * FROM leads WHERE game=?", [slug(a.game)]
    if a.status:
        q += " AND status=?"; args.append(a.status)
    _print(db().execute(q + " ORDER BY priority DESC", args).fetchall())


def saturation(a):
    rows = db().execute("SELECT yield FROM leads WHERE game=? AND status='done' ORDER BY done DESC LIMIT ?",
                        (slug(a.game), a.window)).fetchall()
    ys = [r["yield"] or 0 for r in rows]
    open_n = db().execute("SELECT count(*) FROM leads WHERE game=? AND status='open'", (slug(a.game),)).fetchone()[0]
    avg = sum(ys) / len(ys) if ys else None
    saturated = bool(ys) and len(ys) >= a.window and avg < 1.0 and open_n == 0
    print(json.dumps({"recent_leads": len(ys), "avg_new_claims_per_lead": avg, "open_leads": open_n,
                      "saturated": saturated,
                      "advice": "stop — diminishing returns" if saturated else "keep digging"}))


def stats(a):
    c, g = db(), slug(a.game)
    out = {"claims": c.execute("SELECT count(*) FROM claims WHERE game=?", (g,)).fetchone()[0],
           "by_status": dict(c.execute("SELECT status,count(*) FROM claims WHERE game=? GROUP BY status", (g,)).fetchall()),
           "topics": dict(c.execute("SELECT topic,count(*) FROM claims WHERE game=? GROUP BY topic ORDER BY 2 DESC", (g,)).fetchall()),
           "sources": c.execute("SELECT count(DISTINCT url) FROM claims WHERE game=?", (g,)).fetchone()[0],
           "leads": dict(c.execute("SELECT status,count(*) FROM leads WHERE game=? GROUP BY status", (g,)).fetchall())}
    print(json.dumps(out, indent=1))


def anki(a):
    q, args = "SELECT * FROM claims WHERE game=? AND status IN ('confirmed','unverified') AND q IS NOT NULL", [slug(a.game)]
    if a.topic:
        q += " AND topic=?"; args.append(slug(a.topic))
    rows = db().execute(q, args).fetchall()
    out = a.out or f"games/{slug(a.game)}/flashcards.csv"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        for r in rows:
            front = f"[{r['topic']}] {r['q']}"
            back = f"{r['claim']}<br><small>{r['creator'] or ''} {r['url'] or ''} {('patch ' + r['patch']) if r['patch'] else ''}</small>"
            w.writerow([front, back, f"{slug(a.game)} {r['topic']} {r['kind']}"])
    print(f"{len(rows)} cards -> {out} (Anki: File > Import, separator ';', allow HTML)")


def coverage(a):
    nodes = [re.sub(r"^[\s\-\*\d\.#]+", "", l).strip() for l in open(a.tree, encoding="utf-8")
             if re.match(r"^\s*([-*]|\d+\.|#{2,})\s+\S", l)]
    c, g = db(), slug(a.game)
    for n in nodes:
        name = re.sub(r"[`*_\[\]()]", "", n).split(" — ")[0].split(" - ")[0][:60]
        if not name:
            continue
        terms = " OR ".join(f'"{w}"' for w in re.findall(r"[A-Za-z0-9']{3,}", name)[:4])
        cnt = 0
        if terms:
            try:
                cnt = c.execute("SELECT count(*) FROM claims_fts f JOIN claims c ON c.id=f.rowid WHERE claims_fts MATCH ? AND c.game=?",
                                (terms, g)).fetchone()[0]
            except sqlite3.OperationalError:
                pass
        if cnt < a.min:
            print(json.dumps({"node": name, "claims": cnt, "status": "GAP" if cnt == 0 else "THIN"}))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    cl = sp.add_parser("claim").add_subparsers(dest="sub", required=True)
    s = cl.add_parser("add"); s.add_argument("--game", required=True); s.add_argument("--topic", default="general")
    s.add_argument("--claim"); s.add_argument("--url"); s.add_argument("--creator"); s.add_argument("--ts")
    s.add_argument("--patch"); s.add_argument("--kind", default="fact"); s.add_argument("--tier", type=int)
    s.add_argument("--confidence", default="med"); s.add_argument("--q", help="flashcard question"); s.add_argument("--stdin", action="store_true"); s.set_defaults(f=claim_add)
    s = cl.add_parser("search"); s.add_argument("game"); s.add_argument("query"); s.add_argument("--limit", type=int, default=30); s.set_defaults(f=claim_search)
    s = cl.add_parser("topic"); s.add_argument("game"); s.add_argument("topic"); s.set_defaults(f=claim_topic)
    s = cl.add_parser("verify"); s.add_argument("id", type=int); s.add_argument("status", choices=list(STATUS_RANK)); s.add_argument("--note"); s.set_defaults(f=claim_verify)
    s = cl.add_parser("dupes"); s.add_argument("game"); s.set_defaults(f=claim_dupes)
    ld = sp.add_parser("lead").add_subparsers(dest="sub", required=True)
    s = ld.add_parser("add"); s.add_argument("--game", required=True); s.add_argument("--lead", required=True)
    s.add_argument("--kind", default="term"); s.add_argument("--priority", type=int, default=3); s.add_argument("--origin"); s.set_defaults(f=lead_add)
    s = ld.add_parser("next"); s.add_argument("game"); s.add_argument("--n", type=int, default=10); s.set_defaults(f=lead_next)
    s = ld.add_parser("done"); s.add_argument("id", type=int); s.add_argument("--yield", dest="yield_", type=int, default=0); s.set_defaults(f=lead_done)
    s = ld.add_parser("list"); s.add_argument("game"); s.add_argument("--status"); s.set_defaults(f=lead_list)
    s = sp.add_parser("saturation"); s.add_argument("game"); s.add_argument("--window", type=int, default=15); s.set_defaults(f=saturation)
    s = sp.add_parser("stats"); s.add_argument("game"); s.set_defaults(f=stats)
    s = sp.add_parser("anki"); s.add_argument("game"); s.add_argument("--out"); s.add_argument("--topic"); s.set_defaults(f=anki)
    s = sp.add_parser("coverage"); s.add_argument("game"); s.add_argument("tree"); s.add_argument("--min", type=int, default=3); s.set_defaults(f=coverage)
    a = p.parse_args(); a.f(a)


if __name__ == "__main__":
    main()
