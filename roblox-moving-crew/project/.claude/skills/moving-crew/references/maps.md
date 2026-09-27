# Maps (jobs and arcade levels)

A job map is a place to move out of (house, farm, office, space station), plus a curb, a truck,
items, and usually one twist: a hazard or an interactable. Maps are built in Studio through the
MCP, from modular pieces on a 4-stud grid, and stored in the place file under
`ServerStorage/Jobs/<JobId>`.

**Every floor plan is our own.** The campaign's structure matches the original (themed areas,
one twist per job, 3 bonus objectives, hidden tokens, arcade levels), but never rebuild, trace,
or closely imitate one of its levels.

## Map contract

```
ServerStorage/Jobs/<JobId>   (Model; attributes: JobId, CameraYaw)
  Geometry/       floors, walls (tag Wall), roofs (tag Roof), upper floors (tag Floor2), props
  Breakables/     windows (tag Breakable; BreakType = "Window")
  Interactables/  levers and switches (tag Slappable) with an ObjectValue "Controls" pointing at the gate, wall, or machine they move
  Hazards/        hazards (tag Hazard; attribute HazardType)
  Items/          item models (tag MovableItem; attribute ItemId; attribute OnList = true for list items)
  ObjectiveZones/ invisible parts for zone objectives (tag ObjectiveZone; attribute ZoneId)
  ArcadeToken     optional: the hidden token (tag ArcadeToken; attribute TokenId)
  CrewSpawns/     at least 4 parts (tag CrewSpawn), on the curb, facing the house
  Truck           the truck model (see truck-packing.md), parked with its open back toward the house
  KillFloor       a part under the map; players touching it respawn, items return to their start
```

- An item's rules come only from ItemDefs through its `ItemId`. The job's medal times and bonus objectives live in JobDefs, not the map.
- `CameraYaw` sets the Mover cam's fixed angle for this map (degrees; 45 = looking from the southwest).

## Building rules

| Rule | Why |
|---|---|
| 4-stud grid for walls, floors, and doors | Consistent door widths and truck lines |
| Walls 12 studs tall and 1 stud thick; tag them `Wall` | The camera fades them; thick walls stop items clipping through |
| Normal doors 8 studs wide; at least one 4-stud "puzzle" door per job | Heavy items fit through a 4-stud door only lengthwise: the couch-steering puzzle |
| Paths at least 8 studs wide where heavy items should go | Two movers plus a couch |
| At least 2 routes to the truck: a door, plus a breakable window, a lever gate, or a balcony | Smashing and slapping should be real shortcuts |
| The truck visible from the front door | Kids always know where things go |
| Heavy items farthest from the truck; small items scattered | The crew has to split up and regroup |
| Stairs 8 studs wide with gentle slopes; no ladders | Heavy items go up and down stairs |
| Roofs tagged `Roof`; upper floors tagged `Floor2` | Hidden by the cutaway |
| One twist per job, introduced safely first (a spot where it can't cost much) | The original teaches each gimmick in context |
| No single giant mesh; modular pieces only | The kit's asset rules and phone performance |
| Anchored geometry; only items, gates, and hazards move | Physics budget |

## Breakables

- **Windows:** a single glass pane (tag `Breakable`, `BreakType = "Window"`). An item hitting it above the window break speed, or a player diving through at speed, breaks it: the server destroys the pane, sets `Broken`, and logs it in the EventLog; clients spawn shards (collision group `Debris`, gone within 3 s). The hole becomes a shortcut.
- Breakables reset because the whole map is re-cloned each job.

## Interactables and hazards (the twists)

Build each twist as a small, reusable module under `server/Services/Match/HazardService/`, driven
by tags and attributes so level designers reuse it without code.

| Kind | Examples (ours) | How it works |
|---|---|---|
| Lever or switch | opens a gate, a garage door, or a sliding wall; turns a conveyor on | tag `Slappable`; slapping toggles `On`; its `Controls` target tweens open or closed |
| Moving obstacle | a sprinkler that knocks items away, a sweeping fan, swinging doors | tag `Hazard`, server-driven motion; the "No hazards" assist parks it |
| Surface | ice, mud, a conveyor | a part with custom friction or a surface velocity |
| Creature | a wandering animal, a ghost that pushes furniture | a simple server NPC; slapping makes it back off |
| Environment | low gravity (space), lights out (spooky) | a per-job setting applied at Loading and undone at unload |

## Bonus objective hooks

Bonus objectives are data in JobDefs, built from these types (the `Objectives` module evaluates
them against the EventLog). Write our own objectives for every job; don't reuse the original's.

| Type | Example (ours) | Needs in the map |
|---|---|---|
| `NoBreaks` | Break nothing fragile | — |
| `SmashAll` | Smash every window | windows tagged `Breakable` |
| `SmashNone` | Leave every window intact | windows |
| `AvoidZone` | Never use the front door | an `ObjectiveZone` with that `ZoneId` |
| `ItemInZone` | Put the gnome in the bathtub before finishing | an `ObjectiveZone`, and the item's `ItemId` |
| `LastItem` | The fish tank must go in last | the item's `ItemId` |
| `FinishUnder` | Finish in under 1:30 | — |
| `SlapCount` | Never slap a teammate | — |

## Hidden arcade tokens

At most one per job, somewhere that rewards exploring (behind a breakable window, on a roof
reachable by jumping, in a side room). Picking it up saves `Tokens[TokenId]` for everyone in the
crew and unlocks its arcade level. It's our own collectible design.

## Mover cam and cutaway

- The camera looks down from about 55° pitch at the map's `CameraYaw`, and follows the player smoothly, like the original's high, fixed view.
- The Cutaway controller: hides `Roof` parts during matches (client-side `LocalTransparencyModifier`); fades `Wall` parts between the camera and your character (raycast each frame, to about 70% transparency); hides `Floor2` parts while you're on the ground floor.
- Players can choose the Classic camera in Settings. Cutaway still hides roofs.

## Map lint (`server/Dev/MapLint`, run through the MCP)

The builder runs it after every map change, before any playtest. It prints one line per problem:

- The contract's folders and parts exist; there are 4+ `CrewSpawn`s; the truck, its `LoadZone`, and `KillFloor` exist.
- Every `MovableItem` has an `ItemId` that exists in ItemDefs, and its model follows the item contract (`content-pipelines.md`).
- The job exists in JobDefs, with medal times (or `TBD` before measuring) and 3 bonus objectives whose hooks exist in the map.
- Every `Slappable` has a valid `Controls` target; every `Hazard` has a known `HazardType`.
- **The test pack passes:** the full list, placed biggest first, settles inside the truck (see truck-packing.md).
- Every heavy list item has a path to the truck at least 8 studs wide (a coarse check: PathfindingService with an agent radius of 4 studs).
- The part count is under 6,000; there are at most 60 movable items.
- No unanchored geometry outside Items and moving hazard parts.
