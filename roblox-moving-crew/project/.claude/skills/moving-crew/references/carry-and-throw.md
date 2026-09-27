# Carry, throw, catch, break

The core action. Everything here should be tuned by feel with the user; the numbers are starting
points and live in `shared/Config/Tuning`.

## Item classes (from ItemDefs)

| Class | Carriers | Speed | Throw | Examples |
|---|---|---|---|---|
| Small | 1 | 100% | yes | boxes, lamps, chairs, plants |
| Heavy | 1–2 | 35% alone, 100% with two, 75% alone with the Dolly | no | couches, beds, fridges, pianos |
| Flag: `Fragile` | — | — | throwing it is allowed, but it breaks unless caught | vases, TVs, fish tanks, the piano |
| Flag: `Plugged` (M4) | — | — | — | TVs, lamps: a cord to the wall until yanked free |
| Flag: `Awkward` | — | — | — | the L-couch: an L-shaped footprint and collision |

```lua
-- shared/Config/ItemDefs entry
Couch = { name = "Couch", class = "Heavy", fragile = false, footprint = { 3, 1, 2 },
          pay = 15, icon = "rbxassetid://…", sound = "Thud" },
```

## Grab and drop (small items)

1. The client's Target controller shows one prompt, on the best target. Grab sends `Grab(uid)`.
2. The server checks the rules in the Net table, then attaches the item with a `RigidConstraint` from the item's `Grip` attachment to an attachment in front of the character's chest, sets the item's parts to `Massless` and the `HeldItems` collision group, and sets `HeldBy` and the player's `Holding`.
3. Welded to the character, the item joins the character's assembly, so the carrier's client simulates it: carrying feels instant, with no network-ownership work.
4. **Drop:** remove the constraint, restore mass and collision group, set the network owner back to the server after 1 s, and clear the attributes. Drop the item just in front of the character, never inside a wall (raycast forward; if blocked, drop at the character's feet).
5. On death, reset, or leaving, the server drops everything that player holds.

## Heavy items: the two-person carry

This is the riskiest system in the game. T1.1 tests approach A before anything is built on it.

### Approach A: lead carrier owns the physics (default)

- The heavy item has two grips, `GripA` and `GripB`, at its ends. The first player to grab takes the nearer one and becomes the **lead**; the second takes the other.
- The item is **never welded to characters.** Welding two characters to one item makes one assembly, and Roblox gives the whole assembly one network owner, so the helper would lose control of their own character.
- The server sets the item's network owner to the lead (`SetNetworkOwner(leadPlayer)`). An `AlignPosition` and `AlignOrientation` on the item (driven by a target attachment) pull it toward a target the **lead's client** computes each frame:
  - **Two carriers:** position = midpoint of the two carriers' hand points, lifted to carry height; facing = along the line from carrier A to carrier B. Walking different directions turns the couch.
  - **One carrier:** that end is lifted and follows the carrier's hand point; the other end rests on the floor and drags (lower the target on that side and let friction work). This is the funny "one mover dragging a couch" look.
- **The tether.** Each carrier's own client keeps its character within 3 studs of its grip, by adding a pull (a `VectorForce` or `LinearVelocity` on the character's root) that grows as the gap grows. Nobody moves another player's character.
- **Speed.** The server sets each carrier's `WalkSpeed` from the carrier count: 35% alone (75% with the Dolly), 100% with two.
- **Handover.** When the lead drops or leaves, the helper becomes the lead and the server moves network ownership to them.
- **Server sanity checks** every 0.2 s: the item stays within 6 studs of every carrier's grip and moves no faster than the fastest walk speed plus a margin. On a failure, drop the item, set the owner to the server, and log it. This stops flinging and item teleports.

### Approach B: Server Authority (only if A fails T1.1)

Try it in the same throwaway test place, never in the game first. Load `roblox-server-authority`.
The item and both characters are predicted near each client, the carry target is computed inside
a `BindToSimulation` function from both players' `InputAction`s, and carrier state lives in
attributes on the item. It changes place-wide settings (streaming, deferred signals, the input
system), so **ask the user before turning it on** in the real place, and record the decision.

## Throw

- Only small items (non-heavy) can be thrown. Hold to charge (0 → 1 over 0.8 s); release to throw.
- The client sends `Throw(direction, charge)`. The server flattens and unitizes the direction, clamps the charge, and computes a launch velocity for a fixed 35° arc: distance = 8 studs (tap) to 40 studs (full charge), with gravity from `workspace.Gravity`.
- The server removes the constraint, restores the item, sets `AssemblyLinearVelocity`, keeps network ownership with the thrower for 1.5 s (a smooth arc on their screen), then returns it to the server. It marks the item `InFlight` until it lands.
- **Aim:** PC aims at the mouse's ground point. Phone and gamepad throw where the character faces, with **aim assist**: within a 20° cone, snap to a teammate with empty hands, or to the truck's open back if it's within range.
- The arc preview and landing ring are client-only (the same formula, drawn with a Beam or dotted parts).

## Catch

- While an item is `InFlight`, the server checks every Heartbeat for a player within 5 studs of it, with empty hands, and facing it within 100°. The first match catches it automatically: the item attaches as if grabbed.
- Players near the predicted landing spot see a "Catch!" ring (client-side, from the same arc formula), so kids learn to stand under throws.
- You can't catch your own throw in the first 0.4 s.

## Fragile items

- A fragile item breaks when it's `InFlight` and hits anything other than a catcher at over 25 studs/s, or when any impact exceeds 40 studs/s (a long fall).
- Carrying, walking into walls, and normal drops never break it.
- On break: the server sets `Broken`, removes the item from the list (it no longer blocks completion), caps the job at 2★, applies the breakage fee, and sends a `Toast`. Clients play the shatter effect. The item is destroyed after 0.2 s.

## Plugged-in items (M4)

- A `Plugged` item has a `RopeConstraint` from the item to an outlet attachment on the wall.
- Carrying it past the cord's length for 0.5 s causes a **yank**: the cord pops free with "Unplugged!", and the carrier spins about 180° and stumbles for 0.6 s (a short animation plus a brief input lock). The item stays in their hands.
- Alternative: press Grab at the outlet to unplug it quietly. Kids should discover the yank first.

## Starting tuning values (`Tuning`)

| Value | Start | Tune in |
|---|---|---|
| Grab range | 8 studs | T1.4 |
| Heavy speed alone / with Dolly | 35% / 75% | T1.5 |
| Tether max gap | 3 studs | T1.5 |
| Carry height (heavy) | 3 studs | T1.5 |
| Charge time | 0.8 s | T1.6 |
| Throw distance | 8–40 studs | T1.6 |
| Throw arc | 35° | T1.6 |
| Catch radius / facing | 5 studs / 100° | T1.6 |
| Fragile break speed (thrown / any) | 25 / 40 studs/s | T1.9 |
| Window / door break speed | 20 / 30 studs/s | T1.9 |
