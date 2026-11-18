# Game Mastery Workspace (v2)

My personal system for becoming a top competitive player. Claude is my research director and coach.

- Anything about improving at a game → `game-mastery` skill (recursive research loop until saturated).
  Video → `video-mining`; my own data/replays → `replay-analysis`; routines → `practice-plan`.
- Agents: pro-scout, youtube-scout, channel-miner, community-miner, deep-crawler, foreign-scene-scout,
  meta-analyst, replay-analyst, gap-finder, fact-checker. Dispatch independent work **in parallel**.
- Tools: `python3 tools/kb.py` (claims, research queue, saturation, coverage, flashcards),
  `python3 tools/yt.py` (search, whole channels, transcripts with Whisper fallback, comments, frames).
- Commands: /master /deep-dive /study-pro /meta-update /gaps /review /train /quiz
- Files: notes in `games/<slug>/`, knowledge DB in `kb/`, raw scratch in `research/`.
- Research has no source-count or language limits. The one rule: never invent sources, stats, quotes or
  timestamps — everything traces to a URL. Tie meta claims to a patch.
- Chat replies short and actionable; detail goes in the files.

This repo also holds the Motion Reel project (`reel/`, `dist/`, and `tools/render.js`, `stills.js`,
`soundtrack.py`, `common.js` — see README.md). Leave those alone unless asked.
Cloud sessions: run `pip install -U yt-dlp faster-whisper` once per fresh container before using `tools/yt.py`.
