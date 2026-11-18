#!/usr/bin/env python3
"""Printed at session start so Claude knows the state of every game being studied."""
import os, sqlite3, time, glob
db = os.environ.get("GM_DB", "kb/knowledge.db")
games = sorted(d for d in glob.glob("games/*") if os.path.isdir(d))
if not games:
    print("Game Mastery: no games yet. Suggest /master <game>."); raise SystemExit
print("Game Mastery status:")
con = sqlite3.connect(db) if os.path.exists(db) else None
for g in games:
    slug = os.path.basename(g); line = f"- {slug}:"
    if con:
        try:
            c = con.execute("SELECT count(*), sum(status='confirmed') FROM claims WHERE game=?", (slug,)).fetchone()
            o = con.execute("SELECT count(*) FROM leads WHERE game=? AND status!='done'", (slug,)).fetchone()[0]
            line += f" {c[0]} claims ({c[1] or 0} confirmed), {o} open leads;"
        except sqlite3.Error:
            pass
    meta = os.path.join(g, "meta", "current-patch.md")
    if os.path.exists(meta):
        days = (time.time() - os.path.getmtime(meta)) / 86400
        line += f" meta updated {days:.0f}d ago" + (" — STALE, suggest /meta-update" if days > 14 else "")
    log = os.path.join(g, "progress-log.md")
    if os.path.exists(log):
        line += f"; last log entry {(time.time()-os.path.getmtime(log))/86400:.0f}d ago"
    print(line)
