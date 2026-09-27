# Moving Crew (working title)

A Roblox game that plays like Moving Out (SMG Studio and DevM Games, published by Team17,
2020), with online crews instead of couch co-op. The gameplay rules follow the original as
closely as we can verify them. Everything you can see or hear is our own (see "The IP line"
below).

The full spec is in the `moving-crew` skill (`.claude/skills/moving-crew/`). How each rule maps
to the original, and which ones still need checking against the real game, is in
`references/original-parity.md`.

## One sentence
Queue up with up to 3 other players as a moving crew. Drag, carry, throw, slap, and jump your way
through a house, cram everything on the list into the truck as fast as you can, and chase the
gold medal.

## Core loop
- **Moment to moment:** spot a marked item → grab it (pick it up, or drag it if it's heavy) → carry it, throw it, or lift it with a teammate → get it into the truck and make it *stay* there. Smashing windows and slapping switches opens faster routes.
- **One session (10–20 minutes):** lobby → crew pad → the crew picks a job on the job map → a 2–5 minute job → results (time, medal, bonus objectives) → next job with the same crew.
- **Long term:** finish jobs to unlock the next ones and new areas; beat medal times; clear each job's 3 bonus objectives to earn coins; spend coins (and find hidden tokens) to unlock arcade levels.

## The hook (why players pick this game)
It's Moving Out's formula on Roblox, where there's nothing like it: exaggerated physics, being
*allowed* to wreck the house, and the comedy of two people steering a couch through a door. Its
design philosophy carries over: **only time counts**, so every chaotic shortcut (throwing the
couch off the balcony, smashing through a window) is a legitimate strategy.

## The IP line
Game mechanics can be copied; creative expression can't. Roblox removes experiences that
infringe (DMCA takedowns), and repeat claims put the account at risk.

| We match the original | We make our own |
|---|---|
| The five actions: grab (pick up or drag), throw, slap, jump, move | The name. Never "Moving Out", in the title, description, thumbnails, or tags |
| Item behavior: small, heavy two-person, and fragile items | The town, the moving company, the crew's job title, the boss, and every character |
| Physics truck stacking, with items that can fall out | The story, dialogue, and every piece of text |
| Time-only Bronze/Silver/Gold medals | Level layouts: our own floor plans, never traced from the original |
| 3 bonus objectives per level, revealed after the first clear | Bonus objectives: our own, even when they're the same *kind* of challenge |
| Coins from objectives unlock arcade levels; hidden tokens in levels | Art, models, UI graphics, fonts, icons, and logos |
| Assist Mode options | Music and sound effects |
| Hazards and interactables (levers, fire, ice, ghosts, fans…) as level twists | Area themes may share *genres* (farm, haunted house, space) but not specific designs |
| A campaign of about 30 story jobs plus arcade levels (long-term target) | |

## Target
- **Crew size:** 1–4, like the original. A pad never waits for a full crew.
- **Lobby:** up to 20 players per server.
- **Devices:** phone and PC first, gamepad supported. Phone is the design target for UI size.
- **Session length:** 2–5 minute jobs; 15–20 minute sessions.
- **Audience:** roughly 8–14. Every screen must work without reading a paragraph.

## Progression and rewards
There's no currency to spend on upgrades; the original has no shop. Progress is medals,
unlocks, and coins.

- **Medals (time only):** Gold, Silver, or Bronze by finishing time. Slower than Bronze finishes with no medal. There's no hard fail and no points. Each job keeps your best time and best medal.
- **Bonus objectives:** 3 per job, hidden until you first finish it. Each one done once earns 1 coin, forever. They can be done in separate runs.
- **Arcade levels:** short challenge levels, each built on one mechanic. They're unlocked with coins, or by finding a hidden arcade token inside a story job.
- **Unlocks:** finishing a job unlocks the next job in its area; finishing an area's last job unlocks the next area.
- **Crew rule (online):** the crew plays jobs the crew leader has unlocked. Everyone who finishes a job gets its medal, objectives, and the next job's unlock recorded on their own save.
- **Cosmetics:** mover characters and color variants unlock at medal and coin milestones (to verify against how the original unlocks its cast; see the parity reference).

## Tuning numbers
Starting values for balance-analyst to test. They move into Configs at M5.

| Value | Start | Notes |
|---|---|---|
| Medal times | measured per job and per crew size (1–4) | Gold = best dev-team run +10%, Silver = +35%, Bronze = +75% |
| Assist extra time | +50% or +100% on every medal time | Leader's choice on the job map |
| Coins per objective | 1 | 3 per job; about 90 in the full campaign |
| Arcade level cost | 3–8 coins, rising | Every arcade level is also unlockable by a hidden token where one exists |
| Jobs per area | 5–6 | 5–6 areas for the full campaign of about 30 |

**Balance questions to answer first (balance-analyst):**
1. Can a solo player reach Bronze on every Area 1 job without assist?
2. Do 2-, 3-, and 4-player crews find Gold about equally hard with the crew-scaled times?
3. Do coins from Area 1–2 objectives unlock arcade levels at a steady pace (about one per area)?

## Art direction
Placeholder shapes until M3, color-coded by item class: small = blue, heavy = orange,
fragile = pink.

From M3: chunky, low-poly, toy-like furniture with rounded edges and flat bright colors,
readable from a high camera angle. Houses are modular (4-stud grid) with thick walls and
cutaway roofs. Style words for every generation prompt: *"chunky low-poly toy-like, rounded
edges, flat bright colors, single object, neutral background, no text"*. Our movers are our own
character designs; never reference the original's cast in prompts.

## Audio direction
Bouncy and cartoony: rubber thumps, glass tinkles, a crew grunt when two players lift together,
and a slap "thwack". One upbeat loop per area, faster in the last 30 seconds before a medal is
lost. A calmer loop for the lobby and job map. Every important sound gets a visual cue (see the
moving-crew skill, `references/ui-hud.md`). All music and sound effects are ours or licensed.

## Out of scope for now
- Driving the truck.
- Cross-server matchmaking (MemoryStore queues). Crews form within one lobby server.
- Speedrun leaderboards (they need server-side checks on item physics first).
- A versus mode.

## Open decisions
- **Game name.** Candidates: Moving Crew, Heave Ho Movers, Couch Chaos, Box Brigade.
- **Movers:** our own cast of characters (closer to the original) or Roblox avatars in a crew uniform (cheaper, and kids like their own avatars). Recommended: our own cast, plus an "Use my avatar" option.
- **Carry tech (T1.1):** network-ownership carry (A) or Server Authority (B). A is the default.
- **Unverified original behaviors:** everything marked "verify" in `references/original-parity.md`, settled by the reference playthrough (T0.3).
- **Monetization (ask first, M5):** cosmetic mover skins and private servers only. The original is a paid game with no in-game purchases, so nothing may affect gameplay.

## Decision log
- 2026-09-27: Rojo instead of Script Sync from day one, because the core loop is multiplayer.
- 2026-09-27: One place with two modes (lobby on public servers, matches on reserved servers).
- 2026-09-27: Pads launch with whoever is on them after a 20-second countdown (minimum 1).
- 2026-09-27: The gameplay follows the original's rules exactly where they can be verified. The earlier cash economy, shop, truck upgrades, gadgets, grid truck, and 8-player crews are removed because the original has none of them. Its name, characters, story, levels, art, and audio are never copied.
- 2026-09-27: Online additions the original doesn't need (it's couch co-op): crew pads, a Help ping, aim assist and a catch ring for phones, and the leader-picks job map. Each is marked as an addition in the parity reference.
