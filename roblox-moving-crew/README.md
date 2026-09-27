# Moving Crew: production pack for the Roblox AI Dev Kit

A complete production pipeline for a Roblox game that **plays like Moving Out** (2020), with
online crews of 1–4. The gameplay rules follow the original. The name, characters, story, levels,
art, and audio are our own, because copying those would get the game taken down. The pack is
written *for* the kit's game director, so nothing here is a separate process: the director reads
these files and works through them one verified task at a time.

**Install:** see [INSTALL.md](INSTALL.md).

## What's inside

| File | Goes to | What it is |
|---|---|---|
| `project/GAME.md` | project root | The design: core loop, the IP line, medals, objectives, arcade, Assist Mode, tuning, decisions |
| `project/PLAN.md` | project root | M0–M2 fully detailed (23 tasks, in the kit's task format); M3–M6 outlined; Later |
| `project/PROGRESS.md` | project root | The board, ready at M0 |
| `project/ASSETS.md` | project root | Items, our own mover cast, trucks, lobby, UI images, with prompts and budgets |
| `project/JOBS.md` | project root | The campaign roster (6 areas, arcade levels) and the first map brief |
| `project/.claude/skills/moving-crew/` | `.claude/skills/` | The game's spec, as a skill the builder loads for every task |
| `project/.claude/agents/level-designer.md` | `.claude/agents/` | A sixth specialist for jobs, areas, and arcade levels |
| `project/AGENTS-additions.md` | appended to AGENTS.md | Game-specific rules, including the IP rules |

### The spec (`moving-crew` skill references)

| Reference | Covers |
|---|---|
| `original-parity.md` | Every mechanic of the original, its confidence (confirmed or verify), our version, the online additions, what must stay our own, and the 10-question reference playthrough |
| `systems.md` | Folder layout, lobby and match modes, every service and controller, attributes, remotes with their server checks, Assist Mode, the saved-data format, budgets |
| `carry-and-throw.md` | The five actions (grab or drag, throw, slap, jump, move), the two-person carry, catching, fragile and plugged-in items, tuning values |
| `truck-packing.md` | The physics truck: what counts as loaded, spilling, fair stacking online, the test pack |
| `matchmaking.md` | Crew pads, reserved servers, the crew leader, the job map, leavers, testing limits |
| `ui-hud.md` | The always-on HUD, what appears in each situation, the job map, results, lobby screens, controls, sound cue pairs, accessibility |
| `maps.md` | The map contract, building rules, windows, levers and hazards, bonus objective hooks, hidden tokens, the camera, map lint |
| `content-pipelines.md` | Step-by-step pipelines for new jobs, areas, arcade levels, items, screens, mover characters, sound, and releases |

## The pipeline at a glance

```
M0 Setup ──► M1 Core loop ──► M2 Crew loop ──► M3 Area 1 ──► M4 Polish ──► M5 Launch ──► M6 Soft launch
+ reference   "move the couch"  pads, job map,   6 jobs, cast,  feel, UI art,  security,    a new area
  playthrough 2 movers, greybox objectives,      2 arcade       onboarding     publish      every ~4 weeks
                                assist, saving   levels                                     to ~30 jobs
```

## What matches the original, and what doesn't

- **Matches:** 1–4 movers; grab (pick up or drag), throw, slap, and jump; heavy two-person items; fragile items; smashable windows; a physics truck where bad stacks spill; time-only Bronze/Silver/Gold medals; 3 bonus objectives per level revealed after the first clear; coins and hidden tokens unlocking arcade levels; the five Assist Mode options; a campaign of about 30 story jobs in themed areas.
- **Our own, by law:** the name, town, company, characters, story, text, level layouts, objective wording, art, UI, music, and sound.
- **Online additions** (the original is couch co-op): crew pads, a leader-picks job map, a Help ping, aim assist and a catch ring on phones, and leaver handling.
- **Still to verify:** a handful of behaviors (what a broken item does to the list, catching, slap effects, time limits). The reference playthrough task (T0.3) settles them against the real game.
