# The physics truck

Like the original, the truck is a real physics container. There's no grid and no snapping.
Items stack on each other; big items first leaves room, small items first wastes it; and a bad
stack spills out the back. It's the second puzzle of every job.

## The truck model

```
Truck (Model, part of the job map; attribute Size = "Small" | "Large")
  Body        the visible mesh (CanCollide off)
  Bed         the floor (collides)
  WallL, WallR, Front, Roof   invisible collision parts that match the visible box
  Lip         a low (1-stud) ledge at the open back: items resting past it tip out
  LoadZone    an invisible, non-colliding part filling the inside of the box, from the bed to the roof, ending at the lip
  Ramp        optional: a ramp at the back for dragging heavy items up
```

The truck's size is set by the job, never upgraded. Small jobs use the small truck, big jobs the
large one. The level designer checks that the full list fits (see "Level-design rule").

## What counts as loaded

- An item is `InTruck` when its center is inside `LoadZone` and its speed has stayed under 1.5 studs/s for 0.5 s.
- It stops counting the moment its center leaves the zone. The moving list un-ticks it, and a toast names it: "Couch fell out!"
- Items being held never count, even inside the truck. Let go, and it counts once it settles.
- The job ends when every non-broken list item has been `InTruck` continuously for 1 s. That 1-second hold stops a tumbling stack from finishing the job by accident.
- Extra items that aren't on the list can go in the truck; they just take up room.

## Making physics stacking fair (T2.1)

Online physics is where this breaks down if left to defaults. The rules:

- **Server-owned when resting.** When an item is dropped or lands inside the load zone, the server takes network ownership (`SetNetworkOwner(nil)`). Every client sees the same stack, and no client can "hold up" a stack that the server sees falling.
- **High friction, low bounce** on the bed, the walls, and every item (`CustomPhysicalProperties`: friction about 0.9, elasticity about 0.05) so stacks settle instead of sliding.
- **Settle damping.** An item inside the load zone moving slower than 3 studs/s gets extra linear and angular damping (a gentle `LinearVelocity`/`AngularVelocity` toward zero, removed when it's grabbed). This stops the endless jitter that makes Roblox stacks creep apart.
- **Sleep.** Once an item has been still for 2 s inside the truck, leave it to Roblox's physics sleep. Don't anchor it, because players must be able to knock a bad stack loose and repack it.
- **Collision shapes.** Items use simple collisions (a box, or a few boxes for awkward shapes). Detailed mesh collisions make stacks unpredictable.

Tune these with the user in T2.1. The goal is the original's feel: packing mostly works if you're
sensible, and sloppy packing visibly spills.

## Assist: vanish on delivery

With the `VanishOnDelivery` assist, an item that enters the load zone (held or not) counts
immediately and fades out. There's no stacking at all, like the original's option.

## Level-design rule

For every job, a sensible pack (heavy items first, flat items flat) of the full list must fit
with room to spare. Check it in Studio before the job ships: the builder runs a **test pack**
script that places each list item in order, biggest first, and reports whether everything
settled inside. A job whose test pack fails needs the large truck or a shorter list. The map
lint runs the same test pack.

## Tests

- Jest can't test physics, so the pure parts are small: the "counts as loaded" rule (center inside, speed under the limit for 0.5 s) is a pure function of samples, with tests.
- Physics is verified by the T2.1 playtests: 10 test stacks of the StarterHouse list with big items first (all fit) and small items first (some spill), with 2 clients agreeing on the result each time.
