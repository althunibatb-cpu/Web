# The five actions: grab, throw, slap, jump, move

The original's move set is grab (pick up, or drag something heavy), throw, slap, jump, and move.
We use exactly those. Rules marked **(verify)** follow a default until the T0.3 reference
playthrough settles them (see `original-parity.md`). Every number starts in
`shared/Config/Tuning` and is tuned by feel with the user.

## Item classes (from ItemDefs)

| Class | Carriers | Speed | Throw | Examples |
|---|---|---|---|---|
| Small | 1 | 100% | yes | boxes, lamps, chairs, plants, gnomes |
| Heavy | 1 drags, 2 carry | dragged alone: 40%; carried by two: 100% | no **(verify)** | couches, beds, fridges, pianos |
| Flag: `Fragile` | — | — | allowed, but it breaks on hard impacts | vases, TVs, fish tanks, the piano |
| Flag: `Plugged` (M4) | — | — | — | TVs, lamps: a cord to the wall until yanked free |
| Flag: `Awkward` | — | — | — | the L-couch: an awkward shape to steer and stack |

```lua
-- shared/Config/ItemDefs entry
Couch = { name = "Couch", class = "Heavy", fragile = false, icon = "rbxassetid://…", sound = "Thud" },
```

## Grab: pick up small items

1. The client's Target controller shows one prompt, on the best target. Grab sends `Grab(uid)`.
2. The server checks the rules in the Net table, then attaches the item with a `RigidConstraint` from the item's `Grip` attachment to an attachment in front of the character's chest, sets the item's parts to `Massless` and the `HeldItems` collision group, and sets `HeldBy` and the player's `Holding`.
3. Welded to the character, the item joins the character's assembly, so the carrier's client simulates it: carrying feels instant, with no network-ownership work.
4. **Drop:** remove the constraint, restore mass and collision group, set the network owner back to the server after 1 s, and clear the attributes. Drop the item just in front of the character, never inside a wall (raycast forward; if blocked, drop at the character's feet).
5. On death, reset, or leaving, the server drops everything that player holds.

## Grab: heavy items (drag alone, carry together)

This is the riskiest system in the game. T1.1 tests approach A before anything is built on it.

### Approach A: lead mover owns the physics (default)

- A heavy item has two grips, `GripA` and `GripB`, at its ends. The first player to grab takes the nearer one and becomes the **lead**; the second takes the other.
- The item is **never welded to characters.** Welding two characters to one item makes one assembly, and Roblox gives the whole assembly one network owner, so the helper would lose control of their own character.
- The server sets the item's network owner to the lead (`SetNetworkOwner(leadPlayer)`). An `AlignPosition` and `AlignOrientation` on the item (driven by a target attachment) pull it toward a target the **lead's client** computes each frame:
  - **Dragging (one mover):** the grabbed end lifts slightly and follows the mover's hand point; the other end stays on the floor and drags with friction. This is the original's drag.
  - **Carrying (two movers):** position = midpoint of the two movers' hand points, lifted to carry height; facing = along the line from mover A to mover B. Walking different directions turns the item.
- **The tether.** Each mover's own client keeps its character within 3 studs of its grip, with a pull (a `VectorForce` or `LinearVelocity` on the character's root) that grows as the gap grows. Nobody moves another player's character.
- **Speed.** The server sets each mover's `WalkSpeed` from the mover count: drag speed alone, full speed with two (or alone with the `Lighter` assist).
- **Jumping.** Disabled while holding a heavy item (**verify**); allowed while holding small items.
- **Handover.** When the lead lets go or leaves, the other mover becomes the lead and the server moves network ownership to them. One remaining mover goes back to dragging.
- **Server sanity checks** every 0.2 s: the item stays within 6 studs of every mover's grip and moves no faster than the fastest walk speed plus a margin. On a failure, drop the item, set the owner to the server, and log it. This stops flinging and item teleports.

### Approach B: Server Authority (only if A fails T1.1)

Try it in the same throwaway test place, never in the game first. Load `roblox-server-authority`.
The item and both characters are predicted near each client, the carry target is computed inside
a `BindToSimulation` function from both players' `InputAction`s, and mover state lives in
attributes on the item. It changes place-wide settings (streaming, deferred signals, the input
system), so **ask the user before turning it on** in the real place, and record the decision.

## Throw

- Small items can be thrown. Hold to aim and charge (0 → 1 over 0.8 s); release to throw.
- The client sends `Throw(direction, charge)`. The server flattens and unitizes the direction, clamps the charge, and computes a launch velocity for a fixed arc: distance = 8 studs (tap) to 40 studs (full charge), with gravity from `workspace.Gravity`.
- The server removes the constraint, restores the item, sets `AssemblyLinearVelocity`, keeps network ownership with the thrower for 1.5 s (a smooth arc on their screen), then returns it to the server. It marks the item `InFlight` until it lands.
- **Aim:** PC aims at the mouse's ground point. Phone and gamepad throw where the character faces, with **aim assist** (an online addition): within a 20° cone, snap to a teammate with empty hands, or to the truck's open back if it's within range.
- The arc preview and landing ring are client-only (the same formula, drawn with a Beam or dotted parts).

## Catch (verify)

- Default: while an item is `InFlight`, the server checks every Heartbeat for a player within 5 studs of it, with empty hands, and facing it within 100°. The first match catches it automatically.
- Players near the predicted landing spot see a "Catch!" ring (an online addition).
- You can't catch your own throw in the first 0.4 s.

## Slap

- Slap is a quick swing in front of the character (Slap button, F, or gamepad B). The client sends `Slap(direction)`; the server finds the first target in a 4-stud, 70° cone and applies:

| Target | Effect |
|---|---|
| Another mover | A cartoon knockback (small impulse, a star burst, a 0.4 s stagger). They keep what they're holding **(verify)**. |
| A loose item | A nudge: a small impulse in the slap direction. Useful for tipping items into the truck. |
| A lever or switch (tag `Slappable`) | Toggles `On`; the map's linked gate, wall, or machine reacts. |
| An animal or ghost (tag `Hazard` with `Slappable`) | It flinches and backs off for a few seconds. |
| A window | Nothing (**verify**); windows break from thrown items and hard hits. |

- Rate: 3 slaps per second, server-enforced. Slapping while holding a small item is allowed; while holding a heavy item it isn't (**verify**).

## Fragile items

- A fragile item breaks when it's `InFlight` and hits anything other than a catcher at over 25 studs/s, or when any impact exceeds 40 studs/s (a long fall).
- Carrying, walking into walls, and gentle drops never break it.
- On break (parity default, **verify**): the server sets `Broken` and removes it from the list (it no longer blocks finishing). It counts against "break nothing" bonus objectives, and the EventLog records it. Clients play the shatter effect. The item is destroyed after 0.2 s.

## Plugged-in items (M4)

- A `Plugged` item has a `RopeConstraint` from the item to an outlet attachment on the wall.
- Walking off with it past the cord's length snaps the cord free and spins the mover around with a short stumble; the item stays in their hands.

## Starting tuning values (`Tuning`)

| Value | Start | Tune in |
|---|---|---|
| Grab range | 8 studs | T1.4 |
| Drag speed (one mover, heavy) | 40% | T1.4 |
| Tether max gap | 3 studs | T1.5 |
| Carry height (heavy) | 3 studs | T1.5 |
| Charge time | 0.8 s | T1.6 |
| Throw distance | 8–40 studs | T1.6 |
| Catch radius / facing | 5 studs / 100° | T1.6 |
| Slap cone / knockback | 4 studs, 70° / 30 studs/s | T1.7 |
| Fragile break speed (thrown / any) | 25 / 40 studs/s | T1.10 |
| Window break speed | 20 studs/s | T1.10 |
