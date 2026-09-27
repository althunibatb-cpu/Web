# Maps (jobs)

A job map is a house (or zoo, or space station) plus a curb, a truck slot, and items. Maps are
built in Studio through the MCP, from modular pieces on a 4-stud grid, and stored in the place
file under `ServerStorage/Jobs/<JobId>`.

## Map contract

```
ServerStorage/Jobs/<JobId>   (Model; attributes: JobId, CameraYaw)
  Geometry/      floors, walls (tag Wall), roofs (tag Roof), upper floors (tag Floor2), terrain props
  Breakables/    windows and doors (tag Breakable; attribute BreakType = "Window" | "Door")
  Items/         item models (tag MovableItem; attribute ItemId; optional attribute MinCrew)
  CrewSpawns/    at least 8 parts (tag CrewSpawn), on the curb, facing the house
  TruckSlot      a part: the truck's back-center position and facing
  KillFloor      a part under the map; anything that touches it respawns (players) or returns to its start (items)
```

- An item's rules come only from ItemDefs through its `ItemId`. `MinCrew` marks crew-size extras: an item with `MinCrew = 3` is Required only with 3 or more movers, and Optional below that.
- The job's list, medal times, and unlock live in JobDefs, not in the map.
- `CameraYaw` sets the Mover cam's fixed angle for this map (degrees; 45 = looking from the southwest).

## Building rules

| Rule | Why |
|---|---|
| 4-stud grid for walls, floors, and doors | Items, trucks, and doors line up with the truck grid |
| Walls 12 studs tall and 1 stud thick; tag them `Wall` | The camera fades them; thick walls stop items clipping through |
| Normal doors 8 studs wide; at least one "puzzle" door 4 studs wide per job | Heavy items fit through 4-stud doors only lengthwise: the couch-steering puzzle |
| Paths at least 8 studs wide where heavy items should go | Two carriers plus a couch |
| At least 2 routes to the truck: a door and a breakable window | Smashing should be a real shortcut |
| The truck visible from the house's front door | Kids always know where things go |
| Heavy items farthest from the truck, small items scattered | The crew has to split up and regroup |
| Stairs 8 studs wide with gentle slopes, and no ladders | Heavy items must go up and down stairs |
| Roofs as separate parts tagged `Roof` | Hidden during matches, so the camera sees in |
| Upper floors tagged `Floor2` | Hidden while you're downstairs |
| No single giant mesh; modular pieces only | The kit's asset rules and phone performance |
| Anchored geometry; only items and breakables' pieces unanchored | Physics budget |

## Breakables

- **Windows:** a single glass pane (tag `Breakable`, `BreakType = "Window"`). An item or player hitting it above the window break speed breaks it: the server destroys the pane and sets `Broken`; clients spawn shards (collision group `Debris`, gone within 3 s). The hole becomes a shortcut.
- **Doors:** a door panel on a hinge (`HingeConstraint`), or simply an anchored panel. Above the door break speed, the server unanchors it and knocks it over (it's then just debris, and it's removed after 5 s).
- Breakables reset because the whole map is re-cloned each job.

## Mover cam and cutaway

- The camera looks down from about 55° pitch at the map's `CameraYaw`, and follows the player smoothly.
- The Cutaway controller: hides `Roof` parts during matches (client-side `LocalTransparencyModifier`); fades `Wall` parts that sit between the camera and your character (raycast each frame, to about 70% transparency); hides `Floor2` parts while you're on the ground floor.
- Players can choose the Classic camera in Settings. Cutaway still hides roofs.

## Map lint (`server/Dev/MapLint`, run through the MCP)

The builder runs it after every map change, before any playtest. It prints one line per problem:

- The contract's folders and parts exist; there are 8+ `CrewSpawn`s; `TruckSlot` and `KillFloor` exist.
- Every `MovableItem` has an `ItemId` that exists in ItemDefs, and its model follows the item contract (`content-pipelines.md`).
- The job exists in JobDefs, with medal times (or `TBD` before measuring).
- **The full list at crew 8 fits the Starter Van at ≤ 85% of its cells** (using TruckGrid's cell math).
- Every heavy item has a path to the truck at least 8 studs wide (a coarse check: PathfindingService with an agent radius of 4 studs).
- The part count is under 6,000; there are at most 60 movable items.
- No unanchored geometry outside Items and Breakables.

The optional add-on `roblox-map-audit-skill` (docs/ADDONS.md) can run similar checks outside Studio.
