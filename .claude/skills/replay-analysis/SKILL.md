---
name: replay-analysis
description: Analyze game replays, demo files and match data — the user's own and pros' — with real parsers and public APIs to find measurable mistakes and compare against top players. Use when the user provides a replay/demo file, a match ID, a profile link, or asks to compare their play to pros with data.
---

# Replay & Data Analysis

Data beats opinion. Before advising, try to get numbers. APIs and parsers change — check their current docs
before using, and tell the user if a key or login is needed.

## Per-game toolbox (verify current state before use)
| Game | Own data | Replays / demos |
|---|---|---|
| Counter-Strike 2 | Leetify / FACEIT / CS2 stats sites | `.dem` files → `pip install awpy` (Python ≥3.11) or `demoparser2`; pro demos from HLTV |
| Dota 2 | OpenDota API (free, no key) / STRATZ | OpenDota parsed matches; replay files via OpenDota |
| League of Legends | Riot API (free dev key) match-v5 + timeline | No replay parser — use timeline data + VOD frames |
| Valorant | tracker sites / community APIs | VOD frames via `tools/yt.py frames` |
| StarCraft II | — | `.SC2Replay` → `pip install sc2reader` |
| Age of Empires II | aoe2 stat sites | `.aoe2record` → `mgz` library |
| Rocket League | ballchasing.com API (free key) | replays uploaded to ballchasing |
| Chess | lichess / chess.com public APIs (no key) | PGN → `python-chess` + Stockfish |
| Fighting games | — | no replay parsers: record matches, use frame grabs + frame-data wiki |
| osu! / rhythm | osu! API (free key) | `.osr` replays via community parsers |
| Anything else | search `<game> replay parser github` / `<game> API` | screen-record → `tools/yt.py frames` on the file |

Write analysis scripts in `tools/analysis/<slug>_*.py`; outputs to `research/analysis/`.

## Method
1. Pull the user's last 20–100 games if an API exists; compute the metrics that matter for this game
   (e.g. CS2: ADR, KAST, utility damage, trade %, first-death rate per side/map; LoL/Dota: CS@10, deaths
   before 15, vision, gold diff @15; chess: accuracy by phase, blunders by time left).
2. Pull the same metrics for players 1–2 brackets above and for pros (stat sites, pro demos).
3. The biggest gaps = the top training priorities. Turn each into a lead + a drill in `practice-plan.md`.
4. For a single replay: find the 3 biggest *repeatable* mistakes, with timestamps/ticks, what a pro does
   instead (link a KB file or pro VOD timestamp), and a drill.
5. Log results in `progress-log.md` with date, so improvement is measured over time.
