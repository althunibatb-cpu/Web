# Systems

Every script in the game, what it owns, and how the pieces talk. Build them in PLAN.md order;
this is the finished shape to grow toward, not a list to build all at once.

## Folder layout (Rojo)

```
src/
  server/                         → ServerScriptService
    Main.server.luau              Bootstrap: decides the mode and starts only that mode's services
    Services/
      Common/  PlayerData  Analytics  Movers
      Lobby/   PadService  MatchLauncher
      Match/   MatchConfig  JobDirector  JobMap  MapLoader  ItemService  CarryService
               ThrowService  SlapService  BreakService  HazardService  TruckService
               EventLog  ResultsService  ReturnService
    Dev/       MapLint (Studio-only)  DevMatch (Studio-only fallback config)
  client/                         → StarterPlayer.StarterPlayerScripts
    Main.client.luau              Starts the controllers for the current mode
    Controllers/  Input  Target  Carry  Throw  Slap  Camera  Cutaway  Effects  Sound
    UI/           Hud  Prompt  MovingList  Objectives  Crew  Toasts  JobMap  JobIntro
                  Results  Pad  Settings  TeleportScreen
  shared/                         → ReplicatedStorage
    Config/   ItemDefs  JobDefs  Tuning  Assist  Movers
    Rules/    Medals  CrewScaling  Objectives   (pure; *.spec.luau tests beside them)
    Net.luau  Every remote, defined once
    Types.luau
    Mode.luau Reads the mode attribute for any script
```

Screen layouts (ScreenGuis) are built in Studio through the MCP and live in StarterGui in the
place file. The code in `client/UI/` finds elements by the names in `ui-hud.md`, so layouts and
logic can change separately. Maps live in `ServerStorage/Jobs/<JobId>` in the place file. Both
are outside Git, so publish after every approved change: Roblox's version history is the undo
for them.

## Modes

`Main.server.luau` decides once:

| Condition | Mode |
|---|---|
| `game.PrivateServerId ~= ""` and `game.PrivateServerOwnerId == 0` | Match (a reserved server) |
| Anything else (public server or a paid private server) | Lobby |
| In Studio, `ServerStorage` has a `DevMode` attribute | That value ("Lobby" or "Match") |

It sets `Workspace.GameMode` and starts only that mode's services plus Common. The client reads
`Mode.get()` and starts the matching controllers. In Studio, Match mode uses `Dev/DevMatch` for
its config (the crew = whoever is in the server; the first player is the leader).

## Attribute contract

| On | Attribute | Type | Written by |
|---|---|---|---|
| Workspace | `GameMode` | "Lobby" / "Match" | Bootstrap |
| Workspace | `JobId`, `JobState` | string ("JobMap", "Loading", "Intro", "Countdown", "Playing", "Results") | JobDirector |
| Workspace | `JobStartTime` | number (`workspace:GetServerTimeNow()`) | JobDirector |
| Workspace | `GoldTime`, `SilverTime`, `BronzeTime` | seconds, crew-scaled and assist-scaled | JobDirector |
| Workspace | `CrewSize`, `LeaderId` | number, UserId | JobDirector, MatchConfig |
| Workspace | `Assist` | string list, e.g. "ExtraTime,Lighter" ("" = off) | JobMap |
| Item model | `ItemId` | string (key in ItemDefs) | Map author |
| Item model | `Uid` | string, unique per job | ItemService |
| Item model | `OnList` | boolean | ItemService |
| Item model | `HeldBy`, `HeldBy2` | UserId, 0 = none | CarryService |
| Item model | `InTruck`, `Broken` | boolean | TruckService, BreakService |
| Breakable | `BreakType` ("Window"), `Broken` | string, boolean | Map author, BreakService |
| Slappable (lever, switch) | `On` | boolean | SlapService |
| Hazard | `HazardType`, `Active` | string, boolean | Map author, HazardService |
| Player | `Holding` | item Uid or "" | CarryService |
| Crew pad | `Capacity` (4), `Members`, `LeavesAt` | number, number, server time | PadService |

**CollectionService tags:** `MovableItem`, `Breakable`, `Slappable`, `Hazard`, `ArcadeToken`,
`ObjectiveZone`, `Wall`, `Roof`, `Floor2`, `CrewPad`, `CrewSpawn`.

**Collision groups:** `Characters`; `Items`; `HeldItems` (doesn't collide with `Characters`, so a
carried item never pushes or flings its carrier); `Debris` (collides with the world only).

## Remotes (`shared/Net.luau`)

Every server handler checks the argument types first, then the rules below. Anything that fails
is ignored silently; never trust a client-sent value that isn't in this table.

| Remote | Direction | Payload | Server checks | Rate |
|---|---|---|---|---|
| `Grab` | C→S | item Uid | item exists, not broken; hands empty; within 8 studs; a free grip | 5/s |
| `Drop` | C→S | — | is holding | 5/s |
| `Throw` | C→S | direction (Vector3), charge (0–1) | holding a throwable; direction unitized and flattened; charge clamped | 3/s |
| `Slap` | C→S | direction (Vector3) | alive; direction unitized; target found server-side in a short cone | 3/s |
| `HelpPing` | C→S | — | dragging a heavy item alone | 1 per 3 s |
| `PickJob` | C→S | job ID | sender is the leader; JobState is "JobMap"; the job is unlocked for the leader | 1/s |
| `SetAssist` | C→S | option list | sender is the leader; JobState is "JobMap"; options exist in Config | 2/s |
| `Retry`, `BackToLobby` | C→S | — | JobState is "Results" | 1/s |
| `LeavePad` | C→S | — | on a pad | 1/s |
| `SetMover` | C→S | character ID, color | unlocked for this player | 1/s |
| `Toast` | S→C | kind, data | — | — |
| `Results` | S→C | the results payload | — | — |

## Server services

| Service | Mode | Owns | Notes |
|---|---|---|---|
| PlayerData | both | saved data, via ProfileStore | Session-locked; exposes read-only replicas to each owner |
| Analytics | both | funnel events | AnalyticsService; added in M5 |
| Movers | both | which mover character (or avatar) each player uses | Applies the rig or HumanoidDescription |
| PadService | Lobby | crew pad membership and countdowns | Polls each pad's zone every 0.25 s with a spatial query; never `.Touched` |
| MatchLauncher | Lobby | reserving servers and teleporting crews | See `matchmaking.md` |
| MatchConfig | Match | loading the crew and its leader | MemoryStore by `game.PrivateServerId`; DevMatch in Studio |
| JobMap | Match | the leader's job pick and assist options | Validates against the leader's unlocks |
| JobDirector | Match | the job state machine and timer | See below |
| MapLoader | Match | cloning and destroying job maps | Fresh clone every job |
| ItemService | Match | Uids, the moving list | |
| CarryService | Match | grips, `HeldBy`, drag vs carry, network ownership, walk speed, jump rules | See `carry-and-throw.md` |
| ThrowService | Match | throws and catches | See `carry-and-throw.md` |
| SlapService | Match | slap targets and effects; levers and switches | See `carry-and-throw.md` |
| BreakService | Match | fragile items and windows | Impact speed thresholds from Tuning |
| HazardService | Match | hazards (fire, ice, sprinklers, moving furniture…) | Turned off by the "No hazards" assist option |
| TruckService | Match | what's in the truck; server ownership of resting items | See `truck-packing.md` |
| EventLog | Match | a per-job log of events for bonus objectives | Plain data: packed, broken, smashed, zoneEntered, slapped |
| ResultsService | Match | time, medal, objectives, coins, unlocks, saves | Uses Medals and Objectives |
| ReturnService | Match | retry, next job, or back to the lobby | See `matchmaking.md` |

### JobDirector state machine

```
JobMap (leader picks, 30 s idle → next unlocked job) ──► Loading ──► Intro (4 s)
   ▲                                                                     │
   │                                                                     ▼
   └──── Results (20 s, or Retry) ◄──── every list item in the truck ◄── Countdown (3 s) ──► Playing
                     │
                     └── Back to lobby ──► ReturnService teleports that player to the lobby
```

- **Loading:** MapLoader clones the job (with its truck); ItemService assigns Uids; HazardService applies the assist options; players move to `CrewSpawn` points.
- **Playing:** `JobStartTime` is set once; clients compute elapsed time from `workspace:GetServerTimeNow()`. The job ends when TruckService reports every non-broken list item `InTruck` and at rest for 1 s. There's no time-out (parity default; see original-parity.md).
- **Results:** ResultsService computes the medal with Medals, evaluates the EventLog with Objectives, saves, and sends the `Results` payload. Then back to JobMap.
- Every state change cleans up the previous state's connections (use a Trove per state).

## Assist Mode (`shared/Config/Assist`)

The original's five options. The crew leader sets them on the job map; everyone sees an Assist
badge; saves record `assistUsed` for that run.

| Option | Effect |
|---|---|
| `ExtraTime` | Medal times ×1.5 or ×2 (the leader picks) |
| `VanishOnDelivery` | An item that enters the truck's load zone counts and disappears; no stacking |
| `NoHazards` | HazardService leaves every hazard inactive |
| `Lighter` | Heavy items move at full speed with one carrier |
| `SkipJob` | Marks the job finished with no medal and unlocks the next one |

## Client controllers

| Controller | Does |
|---|---|
| Input | Maps PC, phone, and gamepad to the actions: Grab/Drop, Throw (hold), Slap, Jump, Help. Shows phone buttons for the current context only. |
| Target | Picks the single best interactable (nearest item, lever, or teammate for catches), every 0.1 s |
| Carry | Heavy-item tether for your own character; lead-carrier item driving |
| Throw | Charge, arc preview, landing ring, and aim assist |
| Slap | Slap animation and a local hit flash; the server decides the effect |
| Camera | The Mover cam in matches (fixed pitch, map-set yaw, smooth follow); Classic in the lobby or by setting |
| Cutaway | Hides `Roof`, fades `Wall` parts between the camera and your character, hides `Floor2` downstairs |
| Effects | Shards, dust, slap stars, glow on list items (within the Highlight budget) |
| Sound | SoundGroups, variation, and event sounds from attributes and toasts |

## Pure rules (`shared/Rules`)

```lua
Medals.forTime(elapsed, times) -> "Gold" | "Silver" | "Bronze" | "None"
CrewScaling.times(jobDef, crewSize, assist) -> { gold, silver, bronze }
Objectives.evaluate(objectiveDefs, eventLog, summary) -> { boolean, boolean, boolean }
```

Objective definitions are data in JobDefs, built from a small set of types (see `maps.md`:
objective hooks). Each rule module has Jest tests for its edge cases. balance-analyst's
simulations require these same modules through Lune.

## Saved data (ProfileStore template, version 1)

**Ask the user before changing this format** (AGENTS.md).

```lua
{
  Version = 1,
  Jobs = {},        -- [jobId] = { bestTime = number?, medal = "None"|"Bronze"|"Silver"|"Gold",
                    --             objectives = { false, false, false }, finished = bool, assistUsed = bool }
  Unlocked = { StarterHouse = true },   -- sets: [jobId] = true
  Coins = 0,        -- earned = number of objectives done; spent on arcade unlocks
  Arcade = {},      -- [arcadeId] = true
  Tokens = {},      -- [tokenId] = true (hidden arcade tokens found)
  Mover = { Character = "Default", Color = 1, UseAvatar = false },
  MoversUnlocked = { Default = true },
  Settings = { Music = 0.7, SFX = 1, Camera = "Mover", ReduceShake = false, UIScale = 1 },
  Stats = { Jobs = 0, ItemsPacked = 0, Throws = 0, Slaps = 0, Smashes = 0, FragileBroken = 0 },
  TutorialDone = false,
}
```

## Budgets for this game

- **Movable items per job:** 60 at most, all unanchored with simple collisions.
- **Highlights:** Roblox renders a limited number of Highlight instances at once (check the current cap in the docs; it has been 31). Use a Highlight only for the targeted item and up to 12 nearest list items; the rest get a small billboard dot or nothing.
- **Shards:** client-side only, at most 40 alive, removed within 3 s.
- **Map parts:** 6,000 per job, measured with rbx-scene-analysis.
- **Streaming:** keep StreamingEnabled off unless T1.1 chooses Server Authority (which requires it). If it's on, set item and truck models to Atomic or Persistent streaming.
- Plus the kit's budgets in AGENTS.md (60 FPS on the lowest phone; memory flat after ten join/leave cycles, and after five job loops).
