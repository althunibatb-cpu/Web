# Plan: Moving Crew
Current milestone: M0

Specs for every system named here are in the `moving-crew` skill. Load it for every task.
Rules follow the original game; `references/original-parity.md` says which ones are confirmed
and which still need the reference playthrough (T0.3). Build order inside each milestone follows
the kit's rule: dependencies first, then the scariest unknown. For this game, that's the
two-person carry and the physics truck.

## M0 Setup check

### T0.1 The kit is proven on this machine
- **Player outcome:** a test script prints in a Studio playtest, and edits made on disk show up in Studio.
- **Depends on:** none
- **Skills:** roblox-studio-mcp, roblox-tooling
- **Server/client:** n/a
- **Done when:** Studio MCP connected; `rojo serve` connected; check script clean; one Jest test runs; the place is published with Studio API access on (DataStores and MemoryStores need it). Skip anything already proven in SETUP-LOG.md.
- **Verify:** check script, MCP playtest console line
- **You:** confirm Studio shows the Rojo plugin as connected.
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T0.2 The game knows whether it's a lobby or a match
- **Player outcome:** pressing Play shows a small debug label, "Mode: Lobby" or "Mode: Match", and switching a dev toggle flips it.
- **Depends on:** T0.1
- **Skills:** moving-crew (references/systems.md: Modes, folder layout), roblox-architecture
- **Server/client:** server decides the mode from `game.PrivateServerId` / `PrivateServerOwnerId`; in Studio, a `DevMode` attribute on ServerStorage overrides it. Mode is published as a Workspace attribute; clients only read it.
- **Done when:** the folder layout and Net module from systems.md exist; Bootstrap starts only lobby services or only match services; the dev toggle works in Studio; zero errors on both sides.
- **Verify:** check script; MCP playtest in both modes with console lines
- **You:** press Play twice, once with each toggle value, and read the label.
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T0.3 Reference playthrough of the original
- **Player outcome:** every "Verify" row in the parity reference has an answer, so the game copies the original's rules and not guesses.
- **Depends on:** none (can run alongside T0.1)
- **Skills:** moving-crew (references/original-parity.md)
- **Server/client:** n/a
- **Done when:** the 10 questions in original-parity.md are answered; the Verify rows and GAME.md defaults are updated to match; nothing about levels, text, or art is recorded.
- **Verify:** original-parity.md has no "Verify" rows left, or each remaining one says why it can't be checked
- **You:** play the original's first area (it's on Steam) and answer the 10 questions; the builder writes your answers into the files.
- **Owner:** you, with the builder recording
- **Size:** S
- **Status:** todo

## M1 Core loop: "move the couch"

Goal: two players in a greybox house can grab, drag, carry, throw, slap, and jump items into a
physics truck against the clock, and it's funny. Placeholder shapes only. Test with 2 clients
from the first carry task, because co-op *is* the core loop.

### T1.1 Carry spike: two players lift a test couch
- **Player outcome:** in a throwaway test place, two players pick up a couch, walk it around, and it feels responsive for both.
- **Depends on:** T0.1
- **Skills:** moving-crew (references/carry-and-throw.md), roblox-server-authority, roblox-physics, roblox-multiplayer-testing
- **Server/client:** server owns who holds what; the lead carrier's client owns the couch's physics (approach A); each client pulls only its own character with the tether.
- **Done when:** approach A is built and tested at 0 ms, typical Wi-Fi, and poor mobile network settings; both players rate it; the decision (A, or try B = Server Authority in the same throwaway place) is recorded in GAME.md's decision log with the numbers.
- **Verify:** multiplayer ladder rung 3 (2 clients + Network Simulator)
- **You:** play as both clients (Server & Clients, 2 players). Does the helper feel dragged or laggy?
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.2 A greybox house and truck to play in
- **Player outcome:** I spawn at the curb, see the house and the open truck, and can walk through every room.
- **Depends on:** T0.2
- **Skills:** moving-crew (references/maps.md), roblox-building
- **Server/client:** the map (including its truck) is a Model in `ServerStorage/Jobs/StarterHouse`; the server clones it in at match start.
- **Done when:** the house follows the map contract (folders, tags, 4-stud grid, one narrow door, one breakable window, 4 spawns, the truck with its load zone); color-coded placeholder items (8 small, 3 heavy, 2 fragile) have `ItemId` attributes; the map lint passes; a playtest loads it in match mode.
- **Verify:** map lint output; MCP playtest with a screenshot
- **You:** walk from the curb to the back room. Is anything confusing to walk through?
- **Owner:** builder with level-designer (writes the layout brief in JOBS.md first)
- **Size:** M
- **Status:** todo

### T1.3 The Mover camera
- **Player outcome:** in a match, the camera follows me from a high fixed angle, and walls between me and the camera fade so I can always see myself.
- **Depends on:** T1.2
- **Skills:** moving-crew (references/maps.md: camera and cutaway), roblox-camera
- **Server/client:** client only.
- **Done when:** fixed pitch and yaw come from the map's `CameraYaw` attribute; walls tagged `Wall` between the camera and the character fade; roofs tagged `Roof` are hidden in match mode; the lobby keeps the Classic camera.
- **Verify:** MCP playtest screenshots in 3 rooms; Device Simulator on a phone
- **You:** walk into each room. Did you ever lose sight of your character?
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.4 Grab: pick up small items, drag heavy ones
- **Player outcome:** list items glow; walking near one shows "Grab"; small items lift and carry at full speed; a heavy item alone gets dragged slowly along the floor.
- **Depends on:** T1.2
- **Skills:** moving-crew (references/carry-and-throw.md, references/ui-hud.md: context prompt), roblox-physics, roblox-input, roblox-networking
- **Server/client:** server validates grab and drop (distance, hands empty, item free, rate) and sets the `HeldBy` attribute; the client picks the nearest target and shows the prompt.
- **Done when:** grab/drop work on E, a phone button, and gamepad X; only the nearest item shows a prompt; the held item doesn't collide with the carrier; spam can't duplicate or fling items; two players can't hold the same small item; solo dragging a heavy item works at drag speed.
- **Verify:** multiplayer ladder rung 2; spam test from both clients
- **You:** with 2 players, both try to grab the same box at once, then each drag a couch alone.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.5 Heavy items: carried together at full speed
- **Player outcome:** when a teammate grabs the other end of the couch I'm dragging, we lift it and move at full speed, steering it together.
- **Depends on:** T1.1, T1.4
- **Skills:** moving-crew (references/carry-and-throw.md), roblox-physics, roblox-multiplayer-testing
- **Server/client:** server owns grip assignment (`GripA`/`GripB`) and walk speeds; the lead carrier's client drives the item (the T1.1 decision); each client tethers its own character.
- **Done when:** 2 carriers = full speed with the item lifted; the couch turns when carriers walk different directions; a carrier letting go drops it back to dragging; a carrier leaving hands the lead over; no fling at doors or corners.
- **Verify:** multiplayer ladder rung 3; 20 carries through the narrow door with no fling
- **You:** with 2 players, get the couch through the narrow door. Was it funny or frustrating?
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.6 Throw and catch
- **Player outcome:** holding a small item, I hold the button to aim and charge, then release to throw it; a teammate with empty hands can catch it.
- **Depends on:** T1.4
- **Skills:** moving-crew (references/carry-and-throw.md), roblox-physics, game-feel
- **Server/client:** client sends aim direction and charge (0–1); server clamps both, checks rate, and applies the velocity; the server decides catches.
- **Done when:** throws work on PC (mouse aim), phone (facing direction plus aim assist), and gamepad; heavy items follow the parity default (no throw); catching follows the parity default; a thrown item breaks the greybox window.
- **Verify:** multiplayer ladder rung 3; 10 throw-and-catch attempts per device profile
- **You:** throw a box out the window toward the truck.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.7 Slap and jump
- **Player outcome:** I can slap a teammate (a small knockback), slap a loose item to nudge it, and slap a lever to open a wall; I can jump, but not while carrying something heavy.
- **Depends on:** T1.4
- **Skills:** moving-crew (references/carry-and-throw.md: slap and jump), roblox-physics, roblox-input
- **Server/client:** client sends `Slap(direction)`; the server finds the target in a short cone, applies the effect, and rate-limits it; jumping uses the character's normal jump, disabled by the server while carrying heavy items.
- **Done when:** slap works on players, items, and a test lever (tag `Slappable`); a slapped player keeps what they carry (parity default); slap spam is throttled; jump rules match the parity defaults.
- **Verify:** multiplayer ladder rung 2; spam test
- **You:** slap your teammate, a box, and the lever. Does it feel cartoony, not mean?
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.8 The truck counts what stays inside
- **Player outcome:** items that come to rest inside the truck tick off the moving list ("Items 3/13"); if one falls out, it un-ticks and a toast says so.
- **Depends on:** T1.4
- **Skills:** moving-crew (references/truck-packing.md), roblox-physics, roblox-gui
- **Server/client:** server decides what's loaded (inside the load zone and at rest); resting items become server-owned; the list is replicated state; the client only draws it.
- **Done when:** loading and spilling update the count within 0.5 s for every client; items resting on the truck's edge don't count; the list is readable on a phone.
- **Verify:** multiplayer ladder rung 2; MCP screenshot on a phone profile
- **You:** stack the truck badly on purpose until something falls out.
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.9 Beat the clock
- **Player outcome:** a 3-2-1 starts the job; a timer shows the time and the next medal to beat; when the last item settles in the truck, "Job done!" shows my time and medal.
- **Depends on:** T1.8
- **Skills:** moving-crew (references/systems.md: JobDirector, Medals), roblox-gui
- **Server/client:** server owns the start time (`workspace:GetServerTimeNow()` stored as an attribute) and the result; clients compute the display; medal logic lives in the pure `Medals` module with Jest tests.
- **Done when:** all clients show the same time within 0.1 s; medals match placeholder times; past Bronze the job still finishes with no medal (parity default); Medals tests pass.
- **Verify:** Jest; multiplayer ladder rung 2
- **You:** finish the house as fast as you can. Does the timer make you rush?
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.10 Fragile items break; windows smash
- **Player outcome:** a thrown lamp that hits the ground hard shatters; throwing things through a window breaks it and opens a shortcut.
- **Depends on:** T1.6
- **Skills:** moving-crew (references/carry-and-throw.md: fragile; references/maps.md: breakables), roblox-physics, roblox-animation-vfx
- **Server/client:** server decides breaks (impact speed above a threshold) and sets `Broken` attributes; clients spawn shards and effects locally.
- **Done when:** fragile items survive normal carrying and gentle drops but break on hard throws and falls; a broken list item follows the parity default; windows break from item hits; shards clean up within 3 s.
- **Verify:** multiplayer ladder rung 2; server memory after 20 breaks
- **You:** try to break everything. Did anything break that shouldn't have?
- **Owner:** builder
- **Size:** M
- **Status:** todo

## M2 Game systems: "the crew loop"

Goal: strangers form a crew in the lobby, land in a match together, pick jobs on the job map,
earn medals and bonus objectives, save their progress, and keep playing together.

### T2.1 A truck that's fun to stack
- **Player outcome:** stacking the truck feels fair: big items settle, small items sit on top, and a bad stack spills in a way I can see coming.
- **Depends on:** T1.8
- **Skills:** moving-crew (references/truck-packing.md), roblox-physics
- **Server/client:** server owns resting items in the truck; friction, elasticity, and settle damping come from `Tuning`.
- **Done when:** 10 test stacks of the StarterHouse list fit when big items go first and spill when they don't; items never jitter or creep once settled; a "fell out" toast names the item; no client disagrees on what's inside.
- **Verify:** multiplayer ladder rung 3
- **You:** pack small items first, then big ones first. Did the right order clearly win?
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.2 The job loop: map → job → results → map
- **Player outcome:** after results, my crew returns to the job map and picks the next job, or retries, without leaving the server.
- **Depends on:** T1.9
- **Skills:** moving-crew (references/systems.md: JobDirector), roblox-architecture
- **Server/client:** the JobDirector state machine on the server; state replicated as attributes; clients show screens for each state.
- **Done when:** 5 loops in a row with no leftover items, effects, or connections; the map resets fully (windows, doors, items); server memory is flat across the 5 loops.
- **Verify:** multiplayer ladder rung 2; memory before and after
- **You:** play 3 jobs in a row without leaving.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.3 Medal times fit the crew, and survive leavers
- **Player outcome:** a solo mover and a crew of 4 face fair medal times; if someone leaves mid-job, the times adjust and the job continues.
- **Depends on:** T2.2
- **Skills:** moving-crew (references/systems.md: CrewScaling, JobDefs)
- **Server/client:** pure `CrewScaling` module computes times; the server applies it at job start and on every leave.
- **Done when:** jobs come only from JobDefs; crew-scaled times follow the T0.3 finding; a leaver's held item drops; Jest tests for CrewScaling.
- **Verify:** Jest; multiplayer ladder rung 4 (leave mid-job)
- **You:** start with 3 players and have one leave halfway.
- **Owner:** builder with balance-analyst
- **Size:** S
- **Status:** todo

### T2.4 Progress is saved
- **Player outcome:** my best times, medals, bonus objectives, coins, and unlocked jobs are all still there after I leave and rejoin.
- **Depends on:** T2.2
- **Skills:** moving-crew (references/systems.md: PlayerData), roblox-data, roblox-server-data
- **Server/client:** server only, with ProfileStore; clients get a read-only replica of their own data.
- **Done when:** the data format in systems.md is approved by the user (**ask first**); rejoin loads exactly once; leaving during results still saves; the data has a version field.
- **Verify:** leave-and-rejoin test; multiplayer ladder rung 4
- **You:** finish a job, leave, rejoin, and check the job map.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.5 Bonus objectives and coins
- **Player outcome:** after I finish a job once, its 3 bonus objectives appear; completing one shows a tick and earns a coin, even across separate runs.
- **Depends on:** T2.4
- **Skills:** moving-crew (references/systems.md: Objectives; references/maps.md: objective hooks)
- **Server/client:** the server records a job event log (packed, broken, smashed, zones entered); the pure `Objectives` module evaluates it; results show the outcome.
- **Done when:** the StarterHouse has 3 objectives of different types; hidden before the first clear; each pays 1 coin once; Jest tests for every objective type.
- **Verify:** Jest; multiplayer ladder rung 2
- **You:** clear one objective, then another in a second run.
- **Owner:** builder with level-designer (writes the 3 objectives)
- **Size:** M
- **Status:** todo

### T2.6 HUD v1 and controls on every device
- **Player outcome:** every always-on and contextual HUD element from the spec works (plain styling), and all five actions work on a phone, a keyboard and mouse, and a gamepad.
- **Depends on:** T2.5
- **Skills:** moving-crew (references/ui-hud.md), roblox-gui, roblox-input
- **Server/client:** client only; it reads replicated state.
- **Done when:** the always-on HUD, contextual prompts, phone buttons (Grab, Throw, Slap, Jump), the Help ping, and the edge arrows work; one prompt at a time; nothing overlaps on a small phone or Roblox's own buttons.
- **Verify:** Device Simulator on a small phone, a tablet, and 1080p; gamepad pass
- **You:** play one job on a phone in Device Simulator. Did you ever not know what to press?
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.7 Lobby and crew pads
- **Player outcome:** in the lobby I walk onto a crew pad, see "Crew 2/4 · Leaving in 14s", and the countdown sends us off together.
- **Depends on:** T2.2
- **Skills:** moving-crew (references/matchmaking.md), roblox-networking
- **Server/client:** the server's PadService owns pad membership (polled spatial queries, never `.Touched`) and countdowns.
- **Done when:** the countdown starts on the first player; a full pad (4) shortens to 5 s; stepping off leaves; in Studio, launch runs the match locally through the dev path instead of teleporting.
- **Verify:** multiplayer ladder rungs 2 and 4 (step on and off quickly; leave during countdown)
- **You:** with 2 players, both step on, one steps off, then back on.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.8 Queue to a real match server and back
- **Player outcome:** in the published game, the pad sends my crew to our own match server, and "Back to lobby" returns us.
- **Depends on:** T2.7, T2.4
- **Skills:** moving-crew (references/matchmaking.md), roblox-networking, roblox-cloud
- **Server/client:** the lobby server reserves the server and writes the crew config to MemoryStore; the match server reads it by `game.PrivateServerId`; teleport data is never trusted.
- **Done when:** **ask before publishing**; teleport retries on failure and returns players with a message; the match waits up to 15 s for the crew, then starts with whoever arrived; the config expires on its own.
- **Verify:** multiplayer ladder rung 7 (a published private test with a friend or a second account). Teleports don't run in Studio.
- **You:** join the published game with a friend, queue together, play, and return.
- **Owner:** builder with qa-tester (writes the published test plan)
- **Size:** M
- **Status:** todo

### T2.9 The job map
- **Player outcome:** my crew sees a map of jobs with medals and objective ticks; the crew leader picks an unlocked job, and finishing one unlocks the next.
- **Depends on:** T2.4, T2.5
- **Skills:** moving-crew (references/ui-hud.md: Job map; references/matchmaking.md: crew leader), roblox-gui
- **Server/client:** the server knows the leader and validates the pick against the leader's unlocks; everyone who finishes gets the unlock saved.
- **Done when:** locked, unlocked, and medal states show correctly; the leader's pick is validated; if the leader idles for 30 s, the next unlocked job starts; arcade entries show their coin cost (locked for now).
- **Verify:** multiplayer ladder rung 2 with two saves at different progress
- **You:** with a friend at different progress, check who picks and what unlocks.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.10 Assist Mode
- **Player outcome:** the crew leader can turn on assist options before a job: extra time, items vanish on delivery, lighter items, and skip job. Everyone sees an Assist badge.
- **Depends on:** T2.9
- **Skills:** moving-crew (references/systems.md: Assist)
- **Server/client:** the server applies options at job start; the options are replicated for the HUD badge; the save records that assist was used.
- **Done when:** each option works as specified; "no hazards" is wired to hazards as they arrive in M3; skipping a job unlocks the next without a medal; the badge shows for all.
- **Verify:** multiplayer ladder rung 2
- **You:** play the same job with and without assist.
- **Owner:** builder
- **Size:** S
- **Status:** todo

## M3 Content & assets (outline)
Refine at the M2 gate. Owners: asset-planner and level-designer plan; the builder imports and builds.
- Our own mover cast: about 8 original characters through Avatar Setup (plus the "use my avatar" option, if chosen)
- Launch item catalog: about 30 items, all with grips and simple collisions (ASSETS.md)
- Area 1, six story jobs with 3 bonus objectives each, including the tutorial job that teaches stacking (JOBS.md)
- Area 1 hazards and interactables: levers, gates, garden hazards, a sprinkler (one twist per job)
- Hidden arcade tokens in 2 Area 1 jobs; the first 2 arcade levels
- The lobby: our moving company's yard with crew pads
- Crew animations: carry, heavy lift, drag, throw, slap, jump with an item, stumble
- Medal times measured for crews of 1–4 on every Area 1 job
- First sound pass (sound-designer)

## M4 Feel & polish (outline)
- Game-feel pass: exaggerated physics tuning, throw arc, couch wobble, landing squash, slap timing
- Plugged-in items: cords that snap you back when you walk off
- UI art pass: icons, 9-slice panels, medal and coin art, the job map
- Onboarding: the tutorial job's first 60 seconds, tested with a new player
- Settings: volume groups, camera mode, reduce shake, UI scale
- Teleport loading screen
- Second sound pass and the headphone check

## M5 Launch readiness (outline)
- Multiplayer ladder rung 5 (8 clients in the lobby; full 4-mover crews) and rung 7 with friends on real phones
- Security review of every remote (roblox-best-practices, roblox-security)
- Phone budgets on the heaviest Area 1 job
- Tunable values in Configs: medal times, crew scaling, assist values
- Analytics funnel: join → pad → match → finish → next job or back to lobby
- Parties: `Player.PartyId` keeps parties on the same pad
- A private Dev experience for teleport testing before the public one
- Store page: our own name, icon, thumbnails, and description (no original IP); maturity questionnaire
- Monetization (ask first): cosmetic mover skins and private servers only

## M6 Soft launch (outline)
- A small audience; everything flows through /game-feedback
- Watch: queue wait time, jobs per session, the next-job rate, and day-1 return rate
- Content cadence: one new area of 5–6 jobs about every 4 weeks, with 1–2 arcade levels each, until the campaign reaches about 30 story jobs (the original's size)

## Later
Parked ideas, each with a one-line cost note.
- Cross-server matchmaking with MemoryStore queues: M, plus a new failure mode per server. Only when lobbies are often under 4 players.
- Speedrun leaderboards: M; needs server-side checks on item physics first.
- A versus mode: L; not in the original.
- Driving the truck between jobs: L; not in the original.
