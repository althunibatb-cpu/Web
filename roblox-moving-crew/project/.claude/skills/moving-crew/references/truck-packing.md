# Truck packing

The truck is the second puzzle. Bad packing wastes space, and when the truck fills up the crew
has to repack. It's Tetris dropped into a box, and it's readable at a glance.

## v0 (M1, T1.7): a loading volume

An invisible part covers the truck bed. An item counts as loaded when its center is inside the
volume and its speed has stayed under 2 studs/s for 0.5 s. No grid yet. This proves the loop.

## v1 (M2, T2.1): the grid

### The grid

- A truck is a W×D×H grid of 4-stud cells. The truck model holds an invisible `Grid` part whose corner is cell (0,0,0).

| Truck | Grid (W×D×H) | Cells |
|---|---|---|
| Starter Van | 4×6×3 | 72 |
| Box Truck | 5×7×3 | 105 |
| Big Rig | 6×9×3 | 162 |

- Item footprints come from ItemDefs as W×D×H cells (the L-couch uses a cell list instead of a box). Rotation turns the footprint in 90° steps around the vertical axis only.

### Gravity drop

A placement picks a column (x, z) and a rotation. The item drops to the lowest height where every
cell of its footprint is free: its bottom sits on the highest occupied cell under any part of its
footprint. Overhangs are allowed and leave holes underneath. That's the Tetris: careless
placement wastes space.

A placement fails (red ghost) when the item would stick out of the top or sides of the grid.

### Placing (held items)

1. Within 12 studs of the truck, the Pack controller shows a **ghost** of the held item on the grid, at the column nearest to where the player is aiming: green when `canPlace` is true, red when it isn't.
2. Rotate: R, a Rotate button on phones, or Y on a gamepad.
3. Grab/Drop while the ghost shows places it: the client sends `Place(x, z, rot)`; the server re-runs `canPlace`, snaps the item to the cell's position, anchors it, sets `Packed`, and updates the grid.
4. Heavy items are placed by the lead carrier; both carriers let go.

### Thrown items (auto-pack)

A small item that lands inside the truck's volume is auto-packed by `TruckGrid:findSpot`: the
lowest free spot nearest to where it landed. If nothing fits anywhere, it **bounces out** with a
"Truck full!" toast. That's how badly packed trucks spit items out.

### Unpacking

Hold Grab on a packed item for 1 s (a fill ring shows the hold) to pull it out. Only items with
nothing packed on top can come out; the others show a small lock icon. This lets crews repack
without making it easy for a stranger to empty the truck.

### Completion

TruckService tells JobDirector when every `Required` item is `Packed`. Packed optional items pay
their bonus.

## Level-design rule

For every job, the footprint of the full list at the largest crew size must be **≤ 85% of the
Starter Van's cells**, so every job is solvable with the free truck. A bigger truck makes packing
easier and leaves room for optional items (more cash). The map lint checks this rule.

## Tests (Jest, `TruckGrid.spec.luau`)

- An item fits on an empty grid; its rotated version fits where only the rotation fits.
- Gravity drop lands on the highest cell under the footprint, and overhangs leave holes.
- An item that would exceed the height or sides fails.
- The L-shape fits in an L-shaped gap and fails in a 2×2 gap.
- `findSpot` returns the lowest spot nearest a point, or nil when full.
- Remove frees exactly the item's cells; items underneath others can't be removed.
- `fillRatio` is correct after a mix of places and removes.
