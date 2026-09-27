---
name: moving-crew
description: >
  The design and technical spec for Moving Crew, this project's Roblox game that plays like
  Moving Out with online crews. Load it for every task in PLAN.md and whenever the work touches:
  grabbing, dragging, carrying, throwing, catching, slapping, jumping, heavy two-person carries,
  fragile items, breakable windows, levers and hazards, the physics truck, the moving list, the
  job timer, medals, bonus objectives, coins, arcade levels, Assist Mode, the job map, crew-size
  scaling, the lobby, crew pads, teleports, reserved servers, the HUD or any screen, the Mover
  camera, maps and jobs, item models, content pipelines, or whether something matches the
  original game.
---

# Moving Crew spec

This skill is the source of truth for **how** Moving Crew works. GAME.md holds the decisions and
the numbers, and PLAN.md holds the order. If this skill and GAME.md disagree about a number,
GAME.md wins. If they disagree about a design, ask the user and update both.

## Which reference to read

| Working on | Read |
|---|---|
| Whether a rule matches the original; what must stay our own | `references/original-parity.md` |
| Folder layout, lobby and match modes, every service and controller, the data format, remotes, Assist Mode | `references/systems.md` |
| Grab, drag, carry, throw, catch, slap, jump, heavy two-person carry, fragile and plugged-in items | `references/carry-and-throw.md` |
| The physics truck, what counts as loaded, spilling, stacking feel | `references/truck-packing.md` |
| Lobby, crew pads, reserved servers, teleports, the crew leader, leavers, parties | `references/matchmaking.md` |
| Anything on screen: HUD, prompts, job map, results, controls, accessibility, sound cues | `references/ui-hud.md` |
| Building or changing a job map, hazards, levers, breakables, hidden tokens, objective hooks, the camera, map lint | `references/maps.md` |
| Adding a new job, area, arcade level, item, screen, or cosmetic, from idea to shipped | `references/content-pipelines.md` |

Read only the references the task needs.

## Invariants (never break these)

1. **The original's rules, our own content.** Gameplay follows `original-parity.md`. Names, characters, story, text, level layouts, art, and audio are always ours. If a task would copy any of those, stop and tell the user.
2. **One place, two modes.** Public servers run the lobby; reserved servers run matches. The mode is decided once, by the server, at startup. In Studio, the `DevMode` attribute on ServerStorage chooses it.
3. **Everything data-driven.** Items come only from `Shared/Config/ItemDefs`, jobs and their bonus objectives only from `Shared/Config/JobDefs`, and tuning only from `Shared/Config/Tuning` and `Assist`. A map item is a model with an `ItemId` attribute and nothing else about its rules.
4. **Pure rules have no Roblox APIs.** `Medals`, `CrewScaling`, and `Objectives` take plain tables and return plain tables, so Jest and balance-analyst's Lune simulations can call them.
5. **The server decides outcomes.** Who holds what, what's in the truck, what broke, times, medals, objectives, and unlocks. Clients send intent (grab this, throw at this direction with this charge, slap this way) and draw state.
6. **State in attributes, events in remotes.** Job state, the timer's start time, `HeldBy`, `InTruck`, and `Broken` are attributes the client reads. Remotes carry requests and one-off events (toasts, results).
7. **Never trust teleport data.** The crew config lives in MemoryStore, keyed by `game.PrivateServerId`.
8. **The map resets completely between jobs.** Clone a fresh map from ServerStorage for every job, and destroy the old one.
9. **Kids can't read paragraphs.** Every prompt is an icon plus 1–3 words. One prompt at a time.

## How this fits the game director

- Every PLAN.md task lists which references to read in its **Skills** line.
- The five-line plan before building names the reference sections it follows.
- When a rule is marked "Verify" in `original-parity.md`, build the stated default and keep it easy to change; T0.3 settles it.
- If building a task shows the spec is wrong or missing something, fix the spec in the same commit and say so in the hand-over. The spec must always describe the game as it is.
- The level-designer agent owns JOBS.md and job briefs; asset-planner owns ASSETS.md; balance-analyst simulates with the pure rules modules; game-critic checks parity and IP at every gate.
