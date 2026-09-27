# Systems

Every script in the game, what it owns, and how the pieces talk. Build them in PLAN.md order;
this is the finished shape to grow toward, not a list to build all at once.

## Folder layout (Rojo)

```
src/
  server/                         → ServerScriptService
    Main.server.luau              Bootstrap: decides the mode and starts only that mode's services
    Services/
      Common/  PlayerData  Analytics  Cosmetics
      Lobby/   PadService  MatchLauncher  ShopService
      Match/   MatchConfig  JobDirector  MapLoader  ItemService  CarryService
               ThrowService  BreakService  TruckService  ResultsService  ReturnService
    Dev/       MapLint (Studio-only)  DevMatch (Studio-only fallback config)
  client/                         → StarterPlayer.StarterPlayerScripts
    Main.client.luau              Starts the controllers for the current mode
    Controllers/  Input  Target  Carry  Throw  Pack  Camera  Cutaway  Effects  Sound
    UI/           Hud  Prompt  MovingList  Crew  Toasts  JobIntro  Results
                  Pad  Shop  Locker  Settings  TeleportScreen
  shared/                         → ReplicatedStorage
    Config/   ItemDefs  JobDefs  Economy  Trucks  Cosmetics  Tuning
    Rules/    Scoring  CrewScaling  TruckGrid   (pure; *.spec.luau tests beside them)
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
its config (job ID from a `DevJobId` attribute, and the crew = whoever is in the server).

## Attribute contract

| On | Attribute | Type | Written by |
|---|---|---|---|
| Workspace | `GameMode` | "Lobby" / "Match" | Bootstrap |
| Workspace | `JobId`, `JobState` | string ("Loading", "Intro", "Countdown", "Playing", "Results") | JobDirector |
| Workspace | `JobStartTime` | number (`workspace:GetServerTimeNow()`) | JobDirector |
| Workspace | `GoldTime`, `SilverTime`, `BronzeTime`, `CapTime` | seconds, crew-scaled | JobDirector |
| Workspace | `CrewSize`, `TruckTier` | number, string | JobDirector |
| Item model | `ItemId` | string (key in ItemDefs) | Map author |
| Item model | `Uid` | string, unique per job | ItemService |
| Item model | `ListRole` | "Required" / "Optional" | ItemService (from CrewScaling) |
| Item model | `HeldBy`, `HeldBy2` | UserId, 0 = none | CarryService |
| Item model | `Packed`, `Broken` | boolean | TruckService, BreakService |
| Breakable | `BreakType` ("Window", "Door"), `Broken` | string, boolean | Map author, BreakService |
| Player | `Holding` | item Uid or "" | CarryService |
| Truck pad | `JobId`, `Capacity`, `Members`, `LeavesAt` | string, number, number, server time | PadService |

**CollectionService tags:** `MovableItem`, `Breakable`, `Wall`, `Roof`, `Floor2`, `TruckPad`,
`CrewSpawn`.

**Collision groups:** `Characters`; `Items`; `HeldItems` (doesn't collide with `Characters`, so a
carried item never pushes or flings its carrier); `Debris` (collides with the world only).

## Remotes (`shared/Net.luau`)

Every server handler checks the argument types first, then the rules below. Anything that fails
is ignored silently; never trust a client-sent value that isn't in this table.

| Remote | Direction | Payload | Server checks | Rate |
|---|---|---|---|---|
| `Grab` | C→S | item Uid | item exists, not broken, not packed; hands empty; within 8 studs; a free grip | 5/s |
| `Drop` | C→S | — | is holding | 5/s |
| `Throw` | C→S | direction (Vector3), charge (0–1) | holding a throwable; direction unitized and flattened; charge clamped | 3/s |
| `Place` | C→S | cell x, cell z, rotation 0–3 | holding; within 12 studs of the truck; `TruckGrid.canPlace` | 3/s |
| `Unpack` | C→S | item Uid | item packed; within 12 studs; hands empty | 1/s |
| `HelpPing` | C→S | — | holding a heavy item alone | 1 per 3 s |
| `VotePlayAgain`, `BackToLobby` | C→S | — | JobState is "Results" | 1/s |
| `LeavePad` | C→S | — | on a pad | 1/s |
| `Buy`, `Equip` | C→S | item ID | the ID exists; price and ownership (ShopService) | 2/s |
| `Toast` | S→C | kind, data | — | — |
| `Results` | S→C | the results payload | — | — |

## Server services

| Service | Mode | Owns | Notes |
|---|---|---|---|
| PlayerData | both | saved data, via ProfileStore | Session-locked; exposes read-only replicas to each owner |
| Analytics | both | funnel and economy events | AnalyticsService; added in M5 |
| Cosmetics | both | applying uniforms, hats, and paint | Via HumanoidDescription |
| PadService | Lobby | pad membership and countdowns | Polls each pad's zone every 0.25 s with a spatial query; never `.Touched` |
| MatchLauncher | Lobby | reserving servers and teleporting crews | See `matchmaking.md` |
| ShopService | Lobby | purchases and equips | Prices from Config; validates ownership |
| MatchConfig | Match | loading the crew, job, and truck | MemoryStore by `game.PrivateServerId`; DevMatch in Studio |
| JobDirector | Match | the job state machine and timer | See below |
| MapLoader | Match | cloning and destroying job maps | Fresh clone every job |
| ItemService | Match | Uids, list roles, and the moving list | Uses CrewScaling |
| CarryService | Match | grips, `HeldBy`, network ownership, and walk speed | See `carry-and-throw.md` |
| ThrowService | Match | throws and catches | See `carry-and-throw.md` |
| BreakService | Match | fragile items, windows, and doors | Impact speed thresholds from Tuning |
| TruckService | Match | the truck grid and packing | See `truck-packing.md` |
| ResultsService | Match | stars, pay, saves, and awards | Uses Scoring |
| ReturnService | Match | votes, play again, and back to lobby | See `matchmaking.md` |

### JobDirector state machine

```
Loading ──► Intro (4 s job card) ──► Countdown (3 s, movement locked) ──► Playing
   ▲                                                                  │
   │                    all required items packed, or CapTime reached │
   │                                                                  ▼
   └───── "Play again" votes (20 s window) ◄──────────────────── Results
                        no votes / "Back to lobby" ──► ReturnService teleports to the lobby
```

- **Loading:** MapLoader clones the job; ItemService assigns Uids and list roles; TruckService spawns the crew's best truck; players move to `CrewSpawn` points.
- **Playing:** `JobStartTime` is set once; clients compute elapsed time from `workspace:GetServerTimeNow()`. The job ends when TruckService reports every `Required` item packed, or at `CapTime`.
- **Results:** ResultsService computes stars and pay with Scoring, grants cash, saves, and sends the `Results` payload.
- Every state change cleans up the previous state's connections (use a Trove per state).

## Client controllers

| Controller | Does |
|---|---|
| Input | Maps PC, phone, and gamepad to actions: Grab/Drop, Throw (hold), Rotate, Help. Shows mobile buttons for the current context only. |
| Target | Picks the single best interactable (nearest item, weighted toward facing), every 0.1 s |
| Carry | Heavy-item tether for your own character; lead-carrier item driving (see carry-and-throw.md) |
| Throw | Charge, arc preview, landing ring, and aim assist |
| Pack | Ghost preview on the truck grid, rotation, and the Place request |
| Camera | The Mover cam in matches (fixed pitch, map-set yaw, smooth follow); Classic in the lobby or by setting |
| Cutaway | Hides `Roof`, fades `Wall` parts between the camera and your character, and hides `Floor2` when you're downstairs |
| Effects | Shards, dust, smash bursts, glow on list items (see the Highlight budget) |
| Sound | SoundGroups, variation, and event sounds from attributes and toasts |

## Pure rules (`shared/Rules`)

```lua
Scoring.stars(elapsed, medals, completed, anyFragileBroken) -> number  -- 0..3
Scoring.pay(summary, economy) -> { items, fragileBonus, optional, starBonus,
                                   firstTimeBonus, breakage, total }
CrewScaling.roles(jobDef, crewSize) -> { [itemUid]: "Required" | "Optional" }
CrewScaling.medals(jobDef, crewSize) -> { gold, silver, bronze, cap }   -- interpolates the measured 1/2/4/8
TruckGrid.new(w, d, h) / :canPlace(footprint, rot, x, z) / :place(...) / :remove(uid)
         / :findSpot(footprint, nearX, nearZ) / :fillRatio()
```

Each has Jest tests for its edge cases. balance-analyst's simulations require these same
modules through Lune.

## Saved data (ProfileStore template, version 1)

**Ask the user before changing this format** (AGENTS.md).

```lua
{
  Version = 1,
  Cash = 0,
  Stars = {},                -- [jobId] = best stars, 0–3
  Owned = {                  -- sets: [id] = true
    Trucks = { StarterVan = true }, Gadgets = {}, Hats = {}, Uniforms = { Default = true }, Paints = { Default = true },
  },
  Equipped = { Gadget = "", Hat = "", Uniform = "Default", Paint = "Default" },
  Stats = { Jobs = 0, ItemsPacked = 0, Throws = 0, Catches = 0, Smashes = 0, FragileBroken = 0 },
  Settings = { Music = 0.7, SFX = 1, Camera = "Mover", ReduceShake = false, UIScale = 1 },
  TutorialDone = false,
}
```

## Budgets for this game

- **Movable items per job:** 60 at most, all unanchored with Box collision.
- **Highlights:** Roblox renders a limited number of Highlight instances at once (check the current cap in the docs; it has been 31). Use a Highlight only for the targeted item and up to 12 nearest list items; everything else gets a small billboard dot or nothing.
- **Shards:** client-side only, at most 40 alive, removed within 3 s.
- **Map parts:** 6,000 per job, measured with rbx-scene-analysis.
- **Streaming:** keep StreamingEnabled off unless T1.1 chooses Server Authority (which requires it). If it's on, set item and truck models to Atomic or Persistent streaming so a carried item never half-exists on a client.
- Plus the kit's budgets in AGENTS.md (60 FPS on the lowest phone; memory flat after ten join/leave cycles, and after five job loops).
