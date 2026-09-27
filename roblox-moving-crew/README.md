# Moving Crew: production pack for the Roblox AI Dev Kit

A complete production pipeline for a Roblox take on Moving Out, where 1–8 players queue
together as a chaotic moving crew. It's written *for* the kit's game director, so nothing here
is a separate process: the director reads these files and works through them one verified task
at a time.

**Install:** see [INSTALL.md](INSTALL.md).

## What's inside

| File | Goes to | What it is |
|---|---|---|
| `project/GAME.md` | project root | The design: core loop, stars, economy numbers, art and audio direction, decisions |
| `project/PLAN.md` | project root | M0–M2 fully detailed (20 tasks, in the kit's task format); M3–M6 outlined; Later |
| `project/PROGRESS.md` | project root | The board, ready at M0 |
| `project/ASSETS.md` | project root | The launch item set, trucks, lobby, cosmetics, UI images, with prompts and budgets |
| `project/JOBS.md` | project root | The job roster and the first map brief (new; owned by level-designer) |
| `project/.claude/skills/moving-crew/` | `.claude/skills/` | The game's spec, as a skill the builder loads for every task |
| `project/.claude/agents/level-designer.md` | `.claude/agents/` | A sixth specialist for job maps |
| `project/AGENTS-additions.md` | appended to AGENTS.md | Game-specific rules |

### The spec (`moving-crew` skill references)

| Reference | Covers |
|---|---|
| `systems.md` | Folder layout, lobby/match modes, every service and controller, the attribute contract, remotes with their server checks, the saved-data format, budgets |
| `carry-and-throw.md` | Item classes, grab and drop, the two-person carry (approaches A and B), throw, catch, fragile, plugged-in items, tuning values |
| `truck-packing.md` | The loading volume (v0), the 3D grid with gravity drop (v1), auto-pack, unpacking, tests |
| `matchmaking.md` | Truck pads, reserved servers, MemoryStore config, teleports, leavers, play again, testing limits |
| `ui-hud.md` | The always-on HUD, what appears in each situation (holding, heavy, fragile, at the truck…), results, lobby screens, controls, sound cue pairs, accessibility |
| `maps.md` | The map contract, building rules, breakables, the Mover cam and cutaway, map lint |
| `content-pipelines.md` | Step-by-step pipelines for new items, jobs, screens, cosmetics, sound, releases, and the live cadence |

## The pipeline at a glance

```
M0 Setup ─► M1 Core loop ─► M2 Crew loop ─► M3 Content ─► M4 Polish ─► M5 Launch ─► M6 Soft launch
            "move the couch" "queue, play,    3 launch jobs  feel, UI art  8 clients,  a new job
            2 players, greybox  get paid,     + art + sound  onboarding    security,   every ~2 weeks
                                play again"                                 publish
```

What changed from the kit's defaults, and why:

- **Rojo from day one** instead of Script Sync, because co-op is the core loop, not an M2 add-on.
- **M1 is multiplayer.** The kit's M1 is single-player; here the riskiest unknown (the two-person carry) is T1.1, tested with 2 clients under a bad network before anything is built on it.
- **The Server Authority decision moves to M1** (T1.1), because carrying is movement and physics players fight over.
- **One place, two modes** (lobby and match) so the MCP, Rojo, and the tests all target one place.
- **A sixth agent, level-designer**, because jobs are the main content stream after launch.
- **Content pipelines** for items, jobs, and screens, so post-launch updates follow a fixed checklist.
