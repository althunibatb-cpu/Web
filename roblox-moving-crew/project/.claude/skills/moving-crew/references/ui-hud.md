# UI and HUD

The audience is roughly 8–14, often on a phone. Rules for every screen:

- **Icon + 1–3 words.** Never a sentence during play.
- **One prompt at a time,** on the one thing you can act on now.
- **Shape and color.** Every status (heavy, fragile, optional) has a distinct icon shape, not just a color.
- **Phone first.** Design at a small phone size, then check a tablet and 1080p. Use Scale sizes, `UIAspectRatioConstraint`, layout objects, and 9-slice panels. Touch targets are at least 44 px; the main action button is at least 90 px.
- **Respect the Roblox top bar** (menu and chat buttons at the top left). Nothing important goes under it.
- **The server decides, the UI shows.** Never show "Packed!" or "+$" before the server confirms.

## Match HUD: always on screen

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Roblox]  ┌──────────────┐     ┌───────────────────┐    ┌──────────┐ │
│  topbar   │ 📦 Items 7/13 │     │ 🥇 1:12  ▓▓▓▓▓░░░ │    │ 👤👤👤👤 │ │
│           │ ▾ list        │     │ Gold in 0:48       │    │ crew     │ │
│           │ 🚚 ▓▓▓▓░ 58%  │     └───────────────────┘    └──────────┘ │
│           └──────────────┘                                            │
│                                                                      │
│                          (game world)                          ➤ 🚚  │ ← edge arrow
│                                                                      │
│                                                    ┌────┐            │
│   ( joystick )                                     │HELP│  ┌──────┐  │
│                                                    └────┘  │ GRAB │  │ ← phone only
│                                                            └──────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

| Element | Name in StarterGui | Where | Shows |
|---|---|---|---|
| Moving list | `HUD.MovingList` | top left, below the Roblox top bar | "📦 Items 7/13". Tap or Tab to expand into an icon grid: each list item's icon, ✓ when packed, heavy/fragile badges, a crossed-out crack for broken items, and optional items in a separate gray row. Collapsed by default on phones. |
| Truck meter | `HUD.MovingList.TruckMeter` | under the list | the truck's fill % as a bar; turns orange above 80% |
| Timer | `HUD.Timer` | top center | elapsed time, the current target medal's icon, a bar draining toward that medal, and "Gold in 0:48". Pulses and turns red in the last 10 s before a medal is lost. After Bronze: "Overtime" with the cap countdown. |
| Crew panel | `HUD.Crew` | top right | each crew member's headshot, with a small icon of what they're holding; a "!" badge on anyone who pinged Help |
| Edge arrows | `HUD.Arrows` | screen edges | the truck, when you're holding something and it's off screen; a teammate who pinged Help, while their ping lasts |
| Action buttons | `HUD.Actions` | bottom right, phone only | the main button changes label and icon with context (Grab / Drop / Place). Throw and Rotate appear only when usable. Help appears only when you're holding a heavy item alone. |

There is **no cash counter during a match.** Pay shows at results; money on screen during play is
clutter.

## Contextual: what appears when

Contextual UI is world-space (a BillboardGui on the item) or a small hint under the character.
The Prompt controller shows exactly one at a time, for the Target controller's current target.

| Situation | What appears | Where |
|---|---|---|
| **Near an item, hands empty** | A glow on the item (Highlight). A prompt: `[E] Grab` / 👆 Grab / `[X] Grab`, with the item's name and badges: 👥 "2 movers" for heavy items, 🥚 "Fragile". Optional items say "Bonus". | billboard above the item |
| **Holding a small item** | A slim hint bar: `[E] Drop · [Hold LMB] Throw`. On phones the main button says **Drop**, and a **Throw** button appears. The truck edge arrow turns on. | bottom center; the buttons |
| **Charging a throw** | A dotted arc and a landing ring. The ring turns green over a teammate with empty hands or over the truck's open back (aim assist target). A charge meter fills around the Throw button. | world; the button |
| **Holding a fragile item** | The 🥚 badge shows on the hint bar, and the Throw button gets a warning border. While a fragile item is in the air, it has a red outline and a "Catch!" ring for everyone near the landing spot. | hint bar; world |
| **Holding a heavy item alone** | Over the item: 🐢 "Too heavy! Get help". The free grip glows with a "+1" marker for teammates. A **Help** button appears (Q / 📣 / B): pressing it pings the crew with an edge arrow and a "Help Sam!" label on their screens for 5 s. | billboard; the buttons; teammates' screens |
| **Two players carrying** | Both grips light up, the speed icon changes 🐢 → 🏃, and a crew "hup!" plays. If the carriers pull in opposite directions, a small strain wobble shows on the item. | on the item |
| **Plugged-in item (M4)** | A cord line to the outlet and `🔌 Plugged in`. After a yank: "Unplugged!" and a spin. | on the item |
| **Near the truck while holding** | A ghost of the item on the truck grid (green fits, red doesn't), `[R] Rotate · [E] Place`, and the cells the item would fill. The truck's fill % shows next to the ghost. | world; the hint bar |
| **Near a packed item, hands empty** | `Hold [E] Unpack`, with a fill ring; a 🔒 on items that have something on top. | billboard |
| **A teammate's throw is coming to you** | A "Catch!" ring at your feet if you're within 5 studs of the landing spot. | world |
| **Item packed** | A +1 pop on the truck; the list icon gets a ✓ with a bounce; a ding. | world; list |
| **Item broken** | A shatter burst; a toast: `💥 Vase broken  −$5`. The list item is crossed out. | toast (top center, under the timer) |
| **Window or door smashed** | A glass burst or dust, and a smash sound. No toast; smashing is free. | world |
| **Truck full** | The ghost turns red, with a toast: `🚚 Truck full! Repack`. | toast |
| **Someone leaves** | A toast: `👋 Sam left. List shortened.` | toast |
| **All required items packed** | A big `JOB DONE!` banner, then results. | full width |

Toasts stack up to 3 and last 2.5 s each; new ones push the oldest out.

## Other match screens

- **Waiting for crew** (MatchConfig, up to 15 s): "Waiting for crew 2/3" with the crew's headshots.
- **Job intro** (`JobIntro`, 4 s): the job's name and location art, the list size, the medal times for this crew size, and the truck being used. Then a big 3-2-1 **MOVE IT!** (movement locked during the count).
- **Results** (`Results`, 20 s):
  1. Stars pop in one at a time (1★ Bronze, 2★ Silver, 3★ Gold), with a "Handle with care" cap icon if a fragile item broke.
  2. The time against the three medal times.
  3. A pay breakdown that counts up: items, fragile bonus, optional items, star bonus, first-time star bonus, breakage fee, then the total.
  4. Fun awards (M4): Best Catch, Wrecking Ball (most smashes), Couch Captain (most heavy carries), Butterfingers (most breaks).
  5. Buttons: **Play again** (with a count of who voted) and **Back to lobby**; the next-job vote; an auto-return countdown.

## Lobby HUD and screens

| Element | Where | Shows |
|---|---|---|
| Cash and total stars | top right | `$1,240 · ⭐ 7` |
| Menu buttons | right edge, vertical | Shop 🛒, Locker 👕, Jobs 🗺, Settings ⚙ (each also a physical spot in the HQ yard) |
| Pad panel | bottom center, while standing on a pad | the job's name and your best stars on it, "Crew 2/8", "Leaving in 14s", and a Leave button |
| Pad billboards | above each pad | the job, the crew count, the countdown, or 🔒 "Need 4★" |
| Shop | a panel | tabs for Trucks, Gadgets, Hats, Uniforms, and Paint; cards with a 3D preview (ViewportFrame), the price, and Buy/Owned/Equip |
| Locker | a panel | your character preview with equip slots |
| Jobs board | a panel | all jobs with best stars, lock state, and the stars needed |
| Settings | a panel | Music, SFX, and UI volumes; camera (Mover/Classic); reduce shake; UI scale |
| Teleport screen | full screen | a truck driving across the screen with "Heading to the job…" (set with `SetTeleportGui`) |

## Controls

| Action | PC | Phone | Gamepad |
|---|---|---|---|
| Move | WASD | thumbstick | left stick |
| Grab / Drop / Place | E | the main button | X |
| Throw (hold to charge) | hold the left mouse button, aim with the mouse | hold Throw; aims where you face, with assist | hold R2; aims with the left stick |
| Rotate (at the truck) | R | Rotate | Y |
| Help ping | Q | Help (only when needed) | B |
| Expand the list | Tab | tap the list | D-pad up |

## Sound cue pairs (every important sound gets a visual cue)

| Event | Sound | Visual cue | Volume group |
|---|---|---|---|
| Grab | a soft "hup" | the item lifts, the prompt changes | SFX |
| Two-person lift | the crew's "hup!" | 🐢 → 🏃 on the item | SFX |
| Throw | a whoosh | the arc | SFX |
| Catch | a "thwap" | a catch spark | SFX |
| Packed | a ding (rising pitch as the list fills) | +1 pop, list ✓ | UI |
| Fragile break | a glass shatter | shards, a toast | SFX |
| Window smash | glass | shards | SFX |
| Door smash | a crunch | dust | SFX |
| Help ping | a two-note horn | an edge arrow, "Help Sam!" | UI |
| Medal lost soon | a ticking | the timer pulses red | UI |
| Job done | a fanfare | the banner | UI |
| Truck full | a buzz | a red ghost, a toast | UI |

## Accessibility checklist (every screen)

- Readable text at the smallest phone size (scaled text at least 14 px), with a stroke over the world.
- Icons read without color (shape first).
- Reduce shake turns off screen shake and big flashes.
- Nothing needs fast repeated tapping; holds show a fill ring.
- Every sound has its visual cue (the table above).
