# Moving Crew (working title)

The full spec for every system, screen, and map lives in the `moving-crew` skill
(`.claude/skills/moving-crew/`). This file holds the design decisions and the numbers.

## One sentence
Queue up with up to 7 other players as a chaotic moving crew. Smash, throw, and team-lift
everything on the list into the truck before the clock runs out, then spend your pay growing
your moving company.

## Core loop
- **Moment to moment:** spot a glowing item → grab it → carry it, throw it, or call a teammate
  to lift it together → pack it into the truck grid. Smashing windows and doors is allowed and
  encouraged.
- **One session (10–20 minutes):** lobby → step onto a truck pad → 3–5 minute job → results
  (stars and cash) → "Play again with this crew" or back to the lobby → spend cash → next job.
- **Long term:** earn stars to unlock new locations (suburb → townhouse → mansion → zoo →
  haunted house → space). Earn cash for bigger trucks, gadgets, and crew cosmetics.

## The hook (why players pick this game)
Moving Out (2020, from the publisher of Overcooked) proved the fantasy: a moving crew that's
*allowed* to wreck the house to finish faster. There's no Roblox version. The funniest moment
is two strangers steering an L-shaped couch through a door that's too narrow. Every system
should make that moment easier to reach and funnier when it happens.

Closest Roblox relative: Overcooked-style cooking chaos games (about 900 concurrent players).

**IP note:** mechanics can't be owned, but names, art, and characters can. Never use the name
"Moving Out", its characters, logos, or art. Our crew, trucks, and locations are our own.

## Target
- **Players per server:** lobby up to 24; match 1–8 (a queue never waits for a full crew).
- **Devices:** phone and PC first, gamepad supported. Phone is the design target for UI size.
- **Session length:** 3–5 minute jobs; 15–20 minute sessions.
- **Audience:** roughly 8–14. Kids must understand every screen without reading a paragraph.

## Progression and rewards
- **Stars (1–3 per job)** unlock locations. Stars never decrease; each job keeps its best.
  - Time medal: Bronze = 1★, Silver = 2★, Gold = 3★.
  - "Handle with care": if any **fragile list item** broke, the job is capped at 2★.
  - The job is complete when every required item is packed. At the overtime cap it ends
    anyway and pays for what was packed (0★). There's no hard fail.
- **Cash** buys trucks, gadgets, and cosmetics.
- **Unlocks by total stars:** Training Day 0★ · Suburb House 0★ · Townhouse 4★ ·
  Mansion 10★ · Zoo 18★ · Haunted House 27★ · Space Station 36★ (M6+ content).
- The truck used in a job is **the best truck owned by anyone in the crew**, so upgrades help
  the whole team.

## Economy numbers
Starting values for balance-analyst to test. They move into Configs at M5.

| Where cash comes from | Amount (per player) |
|---|---|
| Each small item packed by the crew | $5 |
| Each heavy item packed | $15 |
| Fragile item bonus | ×1.5 |
| Optional (bonus) item packed | +$10 |
| Star bonus at results | 1★ $20 · 2★ $40 · 3★ $75 |
| First time earning a star on a job | +$50 per new star |
| Breakage fee per broken fragile item | −$5 (never below $0 per job) |

Target: about $120–180 per 4-minute job for a casual crew.

| Where cash goes | Price |
|---|---|
| Box Truck (5×7×3 grid) | $1,500 |
| Big Rig (6×9×3 grid) | $5,000 |
| Dolly gadget (carry a heavy item alone at 75% speed; can't throw) | $800 |
| Hats | $150–600 |
| Crew uniforms | $300–1,200 |
| Truck paint | $250 |

**Balance questions to answer first (balance-analyst):**
1. Can a casual player (20 minutes a day) afford the Box Truck by day 2?
2. Does a 1-player crew reach Bronze on every launch job within the overtime cap?
3. Does the Starter Van always fit the full list at the largest crew size (≤ 85% of cells)?

**Medal-time rule of thumb:** Gold = best dev-team run +10%, Silver = +40%, Bronze = +100%,
overtime cap = Bronze +2:00. Measured separately for crews of 1, 2, 4, and 8.

## Art direction
Placeholder shapes until M3, color-coded by item class: small = blue, heavy = orange,
fragile = pink, optional = gray.

From M3: chunky, low-poly, toy-like furniture with rounded edges, flat bright pastel colors, no
text on models, and readable from a high camera angle. Houses are modular (4-stud grid) with
thick walls and cutaway roofs. Style words for every generation prompt: *"chunky low-poly
toy-like, rounded edges, flat pastel colors, single object, neutral background, no text"*.

## Audio direction
Bouncy, cartoony, and punchy: rubber thumps, glass tinkles, and a crew "hup!" when two players
lift together. One upbeat, funky job loop per location that speeds up in the last 30 seconds.
A calmer lobby loop. Every important sound gets a visual cue (see the moving-crew skill,
`references/ui-hud.md`).

## Out of scope for now
- Cross-server matchmaking (MemoryStore queues). Pads match players within one lobby server.
- Throwing or grabbing other players (griefing risk with strangers).
- Driving the truck.
- Trading, clans, and ranked or speedrun leaderboards (they need anti-cheat on item physics).
- The furniture cannon gadget (griefing and physics cost; see PLAN.md Later).

## Open decisions
- **Game name.** Candidates: Moving Crew, Moving Mayhem, Couch Chaos, Heave Ho Movers.
- **Carry tech (T1.1):** network-ownership carry (A) or Server Authority (B). A is the default.
- **Default camera:** fixed-angle "Mover cam" with a Classic option. Confirm at the M1 gate.
- **Monetization (ask first, M5):** cosmetic game passes and paid private servers only; no
  pay-to-win. A "2× cash" pass is undecided.

## Decision log
- 2026-09-27: Rojo instead of Script Sync from day one, because the core loop is multiplayer.
- 2026-09-27: One place with two modes (lobby on public servers, match on reserved servers)
  instead of two places. One place file, one Rojo project, and one Studio target for the MCP.
- 2026-09-27: Queues launch with whoever is on the pad after a 20-second countdown (minimum
  1 player). Jobs scale to crew size. Protects the game while player counts are low.
- 2026-09-27: Smashing the house is free; breaking the customer's fragile items costs cash and
  caps stars at 2★.
