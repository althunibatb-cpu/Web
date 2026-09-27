---
name: moving-crew
description: >
  The design and technical spec for Moving Crew, this project's Moving Out–style co-op moving
  game. Load it for every task in PLAN.md and whenever the work touches: grabbing, carrying,
  throwing, catching, heavy two-person carries, fragile items, breakable windows and doors, the
  truck and packing grid, the moving list, the job timer, stars and medals, pay, crew-size
  scaling, the lobby, truck pads, queues, teleports, reserved servers, the HUD or any screen, the
  Mover camera, maps and jobs, item models, or the content pipelines for new items, jobs, and
  screens.
---

# Moving Crew spec

This skill is the source of truth for **how** Moving Crew works. GAME.md holds the decisions and
the numbers, and PLAN.md holds the order. If this skill and GAME.md disagree about a number,
GAME.md wins. If they disagree about a design, ask the user and update both.

## Which reference to read

| Working on | Read |
|---|---|
| Folder layout, Bootstrap, lobby and match modes, every service and controller, the data format, remotes | `references/systems.md` |
| Grab, carry, drop, throw, catch, heavy two-person carry, fragile items, plugged-in items | `references/carry-and-throw.md` |
| The truck, the packing grid, loading, auto-pack, "truck full" | `references/truck-packing.md` |
| Lobby, truck pads, countdowns, reserved servers, teleports, play again, leavers, parties | `references/matchmaking.md` |
| Anything on screen: HUD, prompts, results, lobby screens, controls, accessibility, sound cues | `references/ui-hud.md` |
| Building or changing a job map, breakables, the map contract, map lint, the camera and cutaways | `references/maps.md` |
| Adding a new item, job, screen, gadget, or cosmetic, from idea to shipped | `references/content-pipelines.md` |

Read only the references the task needs.

## Invariants (never break these)

1. **One place, two modes.** Public servers run the lobby; reserved servers run matches. The mode is decided once, by the server, at startup. In Studio, the `DevMode` attribute on ServerStorage chooses it.
2. **Everything data-driven.** Items come only from `Shared/Config/ItemDefs`, jobs only from `Shared/Config/JobDefs`, and numbers only from `Shared/Config/Economy`. A map item is a model with an `ItemId` attribute and nothing else about its rules.
3. **Pure rules have no Roblox APIs.** `Scoring`, `CrewScaling`, and `TruckGrid` take plain tables and return plain tables, so Jest and balance-analyst's Lune simulations can call them.
4. **The server decides outcomes.** Who holds what, what's packed, what broke, stars, and pay. Clients send intent (grab this, throw at this direction with this charge, place at this cell) and draw state.
5. **State in attributes, events in remotes.** Job state, the timer's start time, `HeldBy`, `Packed`, and `Broken` are attributes the client reads. Remotes carry requests and one-off events (toasts, results).
6. **Never trust teleport data.** Match config lives in MemoryStore, keyed by `game.PrivateServerId`.
7. **The map resets completely between jobs.** Clone a fresh map from ServerStorage for every job, and destroy the old one. Never repair a used map.
8. **Kids can't read paragraphs.** Every prompt is an icon plus 1–3 words. One prompt at a time.

## How this fits the game director

- Every PLAN.md task lists which references to read in its **Skills** line.
- The five-line plan before building names the reference sections it follows.
- If building a task shows the spec is wrong or missing something, fix the spec in the same commit and say so in the hand-over. The spec must always describe the game as it is.
- The level-designer agent owns JOBS.md and job briefs; asset-planner owns ASSETS.md; balance-analyst simulates with the pure rules modules.
