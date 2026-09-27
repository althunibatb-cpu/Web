# Plan: Moving Crew
Current milestone: M0

Specs for every system named here are in the `moving-crew` skill. Load it for every task.
Build order inside each milestone follows the kit's rule: dependencies first, then the
scariest unknown. For this game that's the two-person carry, so it comes first.

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
- **Skills:** moving-crew (references/systems.md: Bootstrap, folder layout), roblox-architecture
- **Server/client:** server decides the mode from `game.PrivateServerId` / `PrivateServerOwnerId`; in Studio, a `DevMode` attribute on ServerStorage overrides it. Mode is published as a Workspace attribute; clients only read it.
- **Done when:** the folder layout and Net module from systems.md exist; Bootstrap starts only lobby services or only match services; the dev toggle works in Studio; zero errors on both sides.
- **Verify:** check script; MCP playtest in both modes with console lines
- **You:** press Play twice, once with each toggle value, and read the label.
- **Owner:** builder
- **Size:** S
- **Status:** todo

## M1 Core loop: "move the couch"

Goal: two players in a greybox house can carry, throw, and team-lift items into a truck against
a timer, and it's funny. Placeholder shapes only. Test with 2 clients from the first carry task,
because co-op *is* the core loop.

### T1.1 Carry spike: two players lift a test couch
- **Player outcome:** in a throwaway test place, two players pick up a couch, walk it around, and it feels responsive for both of them.
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
- **Player outcome:** I spawn at the curb, see the house and the truck, and can walk through every room.
- **Depends on:** T0.2
- **Skills:** moving-crew (references/maps.md), roblox-building
- **Server/client:** the map is a Model in `ServerStorage/Jobs/StarterHouse`; the server clones it in at match start.
- **Done when:** the house follows the map contract (folders, tags, 4-stud grid, one narrow door, one breakable window, 8 spawns, truck slot); color-coded placeholder items (8 small, 3 heavy, 2 fragile) have `ItemId` attributes; the map lint passes; a playtest loads it in match mode.
- **Verify:** map lint output; MCP playtest with a screenshot
- **You:** walk from the curb to the back room. Is anything confusing to walk through?
- **Owner:** builder with level-designer (writes the layout brief in JOBS.md first)
- **Size:** M
- **Status:** todo

### T1.3 The Mover camera
- **Player outcome:** in a match, the camera follows me from a high fixed angle, and walls between me and the camera fade so I can always see myself.
- **Depends on:** T1.2
- **Skills:** moving-crew (references/systems.md: CameraController), roblox-camera
- **Server/client:** client only.
- **Done when:** fixed pitch and yaw come from the map's `CameraYaw` attribute; walls tagged `Wall` between the camera and the character fade; roofs tagged `Roof` are hidden in match mode; the lobby keeps the Classic camera.
- **Verify:** MCP playtest screenshots in 3 rooms; Device Simulator on a phone
- **You:** walk into each room. Did you ever lose sight of your character?
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.4 Grab, carry, and drop small items
- **Player outcome:** items on the list glow; walking near one shows "Grab"; I pick it up, carry it at full speed, and drop it.
- **Depends on:** T1.2
- **Skills:** moving-crew (references/carry-and-throw.md, references/ui-hud.md: context prompt), roblox-physics, roblox-input, roblox-networking
- **Server/client:** server validates grab and drop (distance, hands empty, item free, rate) and sets the `HeldBy` attribute; the client picks the nearest target and shows the prompt.
- **Done when:** grab/drop work on E, a tap button, and gamepad X; only the nearest item shows a prompt; the held item doesn't collide with the carrier; spam-clicking can't duplicate or fling items; two players can't hold the same small item.
- **Verify:** multiplayer ladder rung 2; spam test from both clients
- **You:** with 2 players, both try to grab the same box at once.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.5 Heavy items: slow alone, full speed together
- **Player outcome:** alone, I can drag the couch at a crawl, and my screen tells me to get help; when a teammate grabs the other end, we move at full speed and steer it together.
- **Depends on:** T1.1, T1.4
- **Skills:** moving-crew (references/carry-and-throw.md), roblox-physics, roblox-multiplayer-testing
- **Server/client:** server owns slot assignment (`GripA`/`GripB`) and walk speeds; the lead carrier's client drives the item (the T1.1 decision); each client tethers its own character.
- **Done when:** 1 carrier = 35% speed with one end dragging on the floor; 2 carriers = 100% speed; the couch turns when carriers walk different directions; a carrier leaving or dropping hands the lead to the other; there's no fling at doors or corners.
- **Verify:** multiplayer ladder rung 3; 20 carries through the narrow door with no fling
- **You:** with 2 players, get the couch through the narrow door. Was it funny or frustrating?
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.6 Throw and catch
- **Player outcome:** holding a small item, I hold the button to charge a throw with an arc preview, and a teammate standing near the landing spot catches it automatically.
- **Depends on:** T1.4
- **Skills:** moving-crew (references/carry-and-throw.md), roblox-physics, game-feel
- **Server/client:** client sends aim direction and charge (0–1); server clamps both, checks rate, and applies the velocity; the server decides catches.
- **Done when:** throws work on PC (mouse aim), phone (facing direction plus aim assist), and gamepad; heavy items can't be thrown; the catch window works; a thrown item breaks the greybox window.
- **Verify:** multiplayer ladder rung 3; 10 throw-and-catch attempts per device profile
- **You:** throw a box out the window to a teammate at the truck.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T1.7 The truck counts what's loaded
- **Player outcome:** items I put in the truck tick off a simple moving list ("Items 3/13") that the whole crew sees.
- **Depends on:** T1.4
- **Skills:** moving-crew (references/truck-packing.md: v0), roblox-gui
- **Server/client:** server decides what counts as loaded (it's inside the truck volume and at rest); the list is replicated state; the client only draws it.
- **Done when:** loading and unloading update the count within 0.5 s for every client; items resting on the truck's edge don't count; the list is readable on a phone.
- **Verify:** multiplayer ladder rung 2; MCP screenshot on a phone profile
- **You:** load 3 items, pull one back out, and watch the counter.
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.8 Beat the clock
- **Player outcome:** a 3-2-1 "Move it!" starts the job; a timer counts toward the next medal; packing the last item shows "Job done!" with a time and 1–3 stars.
- **Depends on:** T1.7
- **Skills:** moving-crew (references/systems.md: JobDirector, Scoring), roblox-gui
- **Server/client:** server owns the start time (`workspace:GetServerTimeNow()` stored as an attribute) and the result; clients compute the display from it; star logic lives in the pure `Scoring` module with Jest tests.
- **Done when:** all clients show the same time within 0.1 s; stars match the placeholder medal times; the overtime cap ends the job and pays for packed items; Scoring tests pass.
- **Verify:** Jest; multiplayer ladder rung 2
- **You:** finish the house as fast as you can. Does the timer make you rush?
- **Owner:** builder
- **Size:** S
- **Status:** todo

### T1.9 Fragile items break; windows and doors smash
- **Player outcome:** a thrown lamp that nobody catches shatters with a "−$" toast; running or throwing things through a window breaks it, and a hard-hit door falls off its hinges.
- **Depends on:** T1.6
- **Skills:** moving-crew (references/carry-and-throw.md: fragile; references/maps.md: breakables), roblox-physics, roblox-animation-vfx
- **Server/client:** server decides breaks (impact speed above a threshold) and sets `Broken` attributes; clients spawn the shards and effects locally.
- **Done when:** fragile items survive normal carrying and drops but break when thrown and not caught; broken list items leave the list and cap stars at 2★; windows and doors break from item hits; shards clean up within 3 s.
- **Verify:** multiplayer ladder rung 2; server memory after 20 breaks
- **You:** try to break everything. Did anything break that shouldn't have?
- **Owner:** builder
- **Size:** M
- **Status:** todo

## M2 Game systems: "the crew loop"

Goal: strangers can queue in a lobby, land in a match together, play a full job, get paid, save
their progress, play again, and buy their first upgrade.

### T2.1 Tetris the truck
- **Player outcome:** near the truck, the item I'm holding shows a green or red ghost on the truck grid; I rotate it, place it, and it snaps; small items thrown into the truck pack themselves; the truck fills up and a bad pack leaves no room.
- **Depends on:** T1.7
- **Skills:** moving-crew (references/truck-packing.md), roblox-input, roblox-gui
- **Server/client:** the pure `TruckGrid` module (shared, no Roblox APIs) decides fits; the client shows the ghost; the server re-checks every placement and owns the grid.
- **Done when:** TruckGrid has Jest tests (fit, rotate, gravity drop, the L-shape, full truck); placing works on PC, phone, and gamepad; small items thrown in auto-pack, or bounce out if nothing fits; items can be pulled out again with a 1-second hold.
- **Verify:** Jest; multiplayer ladder rung 3
- **You:** fill the truck badly on purpose, then repack it.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.2 The full job loop, and "Play again"
- **Player outcome:** a job runs intro card → countdown → play → results → vote "Play again", and the same crew starts a fresh job in the same server.
- **Depends on:** T1.8
- **Skills:** moving-crew (references/systems.md: JobDirector), roblox-architecture
- **Server/client:** the JobDirector state machine on the server; state replicated as attributes; clients show screens for each state.
- **Done when:** 5 loops in a row with no leftover items, effects, or connections; the map resets fully (windows, doors, items); server memory is flat across the 5 loops.
- **Verify:** multiplayer ladder rung 2; memory before and after
- **You:** play 3 jobs in a row without leaving.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.3 Jobs scale to the crew, and survive leavers
- **Player outcome:** a solo job has a short list; 4 players get extra items; if someone leaves mid-job, the extra items become optional so the rest can still finish.
- **Depends on:** T2.2
- **Skills:** moving-crew (references/systems.md: CrewScaling, ItemDefs, JobDefs; references/maps.md: map lint)
- **Server/client:** pure `CrewScaling` module decides the list; the server applies it at job start and on every leave.
- **Done when:** items and jobs come only from ItemDefs and JobDefs; `minCrew` extras work; leaving mid-job makes extras optional and drops the leaver's held item; the map lint also checks the list fits the Starter Van at crew 8; Jest tests for CrewScaling.
- **Verify:** Jest; multiplayer ladder rung 4 (leave mid-job)
- **You:** start with 3 players and have one leave halfway.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.4 Cash and stars are saved
- **Player outcome:** my cash and my best stars per job are still there after I leave and rejoin.
- **Depends on:** T2.2
- **Skills:** moving-crew (references/systems.md: PlayerData), roblox-data, roblox-server-data
- **Server/client:** server only, with ProfileStore; clients get a read-only replica of their own data.
- **Done when:** the data format in systems.md is approved by the user (**ask first**); rejoin loads exactly once; leaving during results still saves; the data has a version field.
- **Verify:** leave-and-rejoin test; multiplayer ladder rung 4
- **You:** finish a job, leave, rejoin, and check your cash.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.5 Results screen and pay
- **Player outcome:** after a job I see my stars pop in, my time vs the medals, and a pay breakdown (items, star bonus, breakage fee).
- **Depends on:** T2.4
- **Skills:** moving-crew (references/ui-hud.md: Results), roblox-gui
- **Server/client:** the pure `Scoring` module computes pay; the server grants it; the client animates the numbers.
- **Done when:** pay matches GAME.md's numbers and balance-analyst's report; first-time star bonus works once only; results are readable on a phone.
- **Verify:** Jest (Scoring); Device Simulator on a phone and a tablet
- **You:** does the pay feel fair for the effort?
- **Owner:** builder with balance-analyst (answers GAME.md's balance questions 1–2 first)
- **Size:** S
- **Status:** todo

### T2.6 HUD v1 and controls on every device
- **Player outcome:** every always-on and contextual HUD element from the spec works (plain styling), and the game plays fully with a phone, a keyboard and mouse, and a gamepad.
- **Depends on:** T2.1
- **Skills:** moving-crew (references/ui-hud.md), roblox-gui, roblox-input
- **Server/client:** client only; it reads replicated state.
- **Done when:** the always-on HUD, all contextual prompts, the mobile action buttons, the "Help!" ping, and the teammate edge arrows work; one prompt at a time; nothing overlaps on a small phone.
- **Verify:** Device Simulator on a small phone, a tablet, and 1080p; gamepad pass
- **You:** play one job on a phone in Device Simulator. Did you ever not know what to press?
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.7 Lobby and truck pads
- **Player outcome:** in the lobby I walk onto a truck pad, see "Crew 2/8 · Leaving in 14s", and the countdown starts the job. Locked pads show how many stars they need.
- **Depends on:** T2.2
- **Skills:** moving-crew (references/matchmaking.md), roblox-networking
- **Server/client:** the server's PadService owns pad membership (polled spatial queries, never `.Touched`) and countdowns.
- **Done when:** the countdown starts on the first player; a full pad shortens to 5 s; stepping off leaves; locked pads refuse entry with a message; in Studio, launch runs the match locally through the dev path instead of teleporting.
- **Verify:** multiplayer ladder rungs 2 and 4 (step on and off quickly; leave during countdown)
- **You:** with 2 players, both step on, one steps off, then back on.
- **Owner:** builder
- **Size:** M
- **Status:** todo

### T2.8 Queue to a real match server and back
- **Player outcome:** in the published game, the pad sends my crew to our own match server, and at the end "Back to lobby" returns us.
- **Depends on:** T2.7, T2.4
- **Skills:** moving-crew (references/matchmaking.md), roblox-networking, roblox-cloud
- **Server/client:** the lobby server reserves the server and writes the match config to MemoryStore; the match server reads it by `game.PrivateServerId`; teleport data is never trusted.
- **Done when:** **ask before publishing**; teleport retries on failure and returns players to the pad with a message; the match waits up to 15 s for the crew, then starts with whoever arrived; the config expires on its own.
- **Verify:** multiplayer ladder rung 7 (a published private test with a friend or a second account). Teleports don't run in Studio.
- **You:** join the published game with a friend, queue together, finish, and return.
- **Owner:** builder with qa-tester (writes the published test plan)
- **Size:** M
- **Status:** todo

### T2.9 Shop v1: the first upgrade
- **Player outcome:** at the lobby's shop counter I buy the Box Truck and a hat; the next job uses the bigger truck, and my hat shows on my character.
- **Depends on:** T2.4, T2.5
- **Skills:** moving-crew (references/systems.md: ShopService), roblox-security, roblox-gui
- **Server/client:** the server checks price and ownership; the client only sends the item ID.
- **Done when:** purchases can't be duplicated by spam or rejoin; the crew's best truck is used; owned items survive a rejoin; prices come from GAME.md.
- **Verify:** rejoin test; spam test; roblox-best-practices review of every remote
- **You:** buy the truck, rejoin, and play a job.
- **Owner:** builder
- **Size:** M
- **Status:** todo

## M3 Content & assets (outline)
Refine at the M2 gate. Owners: asset-planner and level-designer plan; the builder imports and builds.
- Launch item catalog art: about 30 items, all with grips and simple collisions (ASSETS.md)
- Training Day: a tutorial job that works solo (JOBS.md)
- Suburb House: greybox → timing runs → art pass (JOBS.md)
- Townhouse: stairs, a balcony toss, and the L-couch puzzle (JOBS.md)
- Lobby: the moving company HQ yard with pads, the shop counter, and the locker
- Trucks: Starter Van, Box Truck, and Big Rig, with grids aligned to their models
- Crew animations: carry, heavy lift, drag, throw, catch, stumble
- Cosmetics: 3 uniforms, 6 hats, 4 truck paints
- Dolly gadget
- Medal times measured for crews of 1, 2, 4, and 8 on every launch job
- First sound pass (sound-designer)

## M4 Feel & polish (outline)
- Game-feel pass: throw arc, catch magnetism, couch wobble, landing squash, hitstop on smashes
- Plugged-in items: TV and lamp cords that yank and spin you around
- UI art pass: icons, 9-slice panels, star and medal art
- Onboarding: the first 60 seconds of Training Day, tested with a new player
- Results juice and fun awards (Best Catch, Wrecking Ball, Couch Captain)
- Settings: volume groups, camera mode, reduce shake, UI scale
- Teleport loading screen
- Second sound pass and the headphone check

## M5 Launch readiness (outline)
- Multiplayer ladder rung 5 (8 clients) and rung 7 with friends on real phones
- Security review of every remote (roblox-best-practices, roblox-security)
- Phone budgets on the heaviest launch job
- Tunable values in Configs: medal times, pay, prices, crew scaling
- Analytics funnel: join → pad → match → finish → play again or back to lobby
- Parties: `Player.PartyId` keeps parties on the same pad
- A private Dev experience for teleport testing before the public one
- Store page: icon, thumbnails, description, maturity questionnaire
- Monetization (ask first): cosmetic passes and private servers only

## M6 Soft launch (outline)
- A small audience; everything flows through /game-feedback
- Watch: queue wait time, jobs per session, the "play again" rate, and day-1 return rate
- Content cadence: a new job about every 2 weeks (Mansion → Zoo → Haunted House → School → Space Station), each through the level-designer pipeline in the moving-crew skill

## Later
Parked ideas, each with a one-line cost note.
- Cross-server matchmaking with MemoryStore queues: M, plus a new failure mode per server. Only when lobbies are often under 4 players.
- Furniture cannon gadget: M; griefing risk with strangers, and physics load.
- Speedrun leaderboards: M; needs server-side checks on item physics first.
- Player shove and slap: S; griefing risk. Friends-only servers first.
- Daily contracts ("Move 3 pianos today"): S; good for retention after launch.
- Crew names and clans: M; needs text filtering and moderation.
- Driving the truck between jobs: L.
- Live animals as items (the zoo giraffe that wanders off): M; ships with the Zoo job.
