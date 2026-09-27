# UI and HUD

The HUD shows the same *information* the original's players need (the moving list, the clock,
the medal to beat, bonus objectives), in our own layout and art. Never trace the original's
screens, icons, or fonts.

The audience is roughly 8–14, often on a phone. Rules for every screen:

- **Icon + 1–3 words.** Never a sentence during play.
- **One prompt at a time,** on the one thing you can act on now.
- **Shape and color.** Every status (heavy, fragile) has a distinct icon shape, not just a color.
- **Phone first.** Design at a small phone size, then check a tablet and 1080p. Use Scale sizes, `UIAspectRatioConstraint`, layout objects, and 9-slice panels. Touch targets are at least 44 px; the Grab button is at least 90 px.
- **Respect Roblox's own UI:** the top bar (menu and chat, top left) and the default jump button (bottom right on phones). Either place our buttons around the jump button, or hide it and draw our own Jump in the cluster.
- **The server decides, the UI shows.** Never tick an item or show a medal before the server confirms.

## Match HUD: always on screen

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Roblox]  ┌──────────────┐     ┌───────────────────┐    ┌──────────┐ │
│  topbar   │ Items 7/13   │     │ (medal) 1:12  ▓▓▓░ │    │ ●  ●  ●  ● │ │
│           │ ▾ list        │     │ Gold in 0:48       │    │   crew   │ │
│           │ ○ ○ ● objectives│   └───────────────────┘    └──────────┘ │
│           └──────────────┘                              [ASSIST]     │
│                          (game world)                          ➤     │ ← edge arrow
│                                                    ┌────┐ ┌────┐      │
│   ( joystick )                                     │SLAP│ │JUMP│      │
│                                                    └────┘ └────┘ ┌──────┐│
│                                                                  │ GRAB ││
└──────────────────────────────────────────────────────────────────┴──────┘
```

| Element | Name in StarterGui | Where | Shows |
|---|---|---|---|
| Moving list | `HUD.MovingList` | top left, below the Roblox top bar | "Items 7/13". Tap or Tab to expand into an icon grid: each list item's icon, a tick when it's in the truck, heavy and fragile badges, and a crossed-out crack for broken items. Collapsed by default on phones. |
| Bonus objectives | `HUD.MovingList.Objectives` | under the list | Only after the job's first clear: 3 short lines ("Break nothing", "Smash both windows"…) with a circle each. Filled circles are done on your save; a circle turns red when this run can no longer earn it. |
| Timer | `HUD.Timer` | top center | elapsed time, the medal you're chasing, and a bar draining toward it: "Gold in 0:48". It pulses in the last 10 s before a medal is lost. After Bronze: "No medal" in gray, and the clock keeps running. |
| Crew panel | `HUD.Crew` | top right | up to 4 mover portraits, a small icon of what each is holding, a crown on the leader, and a "!" on anyone calling for help |
| Assist badge | `HUD.Assist` | under the crew panel | "Assist" plus small icons of the active options; hidden when assist is off |
| Edge arrows | `HUD.Arrows` | screen edges | the truck, when you're holding something and it's off screen; a teammate who pinged Help, while the ping lasts |
| Action buttons | `HUD.Actions` | bottom right, phone only | Grab (the big button; it reads Drop while holding), Slap, and Jump always; Throw appears only while holding a throwable; Help only while dragging a heavy item alone |

## Contextual: what appears when

Contextual UI is world-space (a BillboardGui on the item) or a slim hint bar at the bottom center
(PC and gamepad). The Prompt controller shows exactly one at a time, for the Target controller's
current target.

| Situation | What appears | Where |
|---|---|---|
| **Near an item, hands empty** | A glow on the item (Highlight). A prompt: `[E] Grab` / Grab / `[X] Grab`, with the item's name and badges: "2 movers" for heavy items, "Fragile" for fragile ones. | billboard above the item |
| **Holding a small item** | Hint: `[E] Drop · [Hold LMB] Throw`. On phones the big button reads **Drop**, and a **Throw** button appears. The truck edge arrow turns on. | hint bar; buttons |
| **Charging a throw** | A dotted arc and a landing ring. On phones and gamepads, aim assist turns the ring green over a teammate with empty hands or over the truck's open back. A charge meter fills around the Throw button. | world; button |
| **Holding a fragile item** | The "Fragile" badge on the hint bar. While a fragile item is in the air, it has a red outline. | hint bar; world |
| **Dragging a heavy item alone** | A slow icon and "Drag" over the item; the free grip glows "+1" for teammates. A **Help** button appears (Q / Help / gamepad Y): it pings the crew with an edge arrow and "Help!" over you for 5 s. | billboard; buttons; teammates' screens |
| **Two movers carrying** | Both grips light up and the slow icon disappears; a crew grunt plays. | on the item |
| **Near a lever or switch** | `[F] Slap` over it. | billboard |
| **A thrown item is coming to you** | A "Catch!" ring at your feet, if catching is confirmed by T0.3. | world |
| **Item settles in the truck** | A tick pops over the truck; the list icon ticks with a bounce; a rising ding. | world; list |
| **Item falls out of the truck** | A toast: "Couch fell out!"; the list icon un-ticks. | toast |
| **Item broken** | A shatter burst and a toast: "Vase broken"; the list item is crossed out. | toast |
| **A bonus objective becomes impossible this run** | Its circle turns red, with no toast (don't nag). | objectives list |
| **Window smashed** | A glass burst. No toast; smashing is free. | world |
| **Someone leaves** | A toast: "Sam left the crew." | toast |
| **Every list item is in** | A 1-second "Hold it…" ring, then a big `JOB DONE!` banner, then results. | full width |

Toasts stack up to 3 and last 2.5 s each; new ones push the oldest out. There's no money or
score on screen at any time: only the clock matters.

## Match screens

- **Waiting for crew** (up to 15 s): "Waiting for crew 2/3" with portraits.
- **Job map** (`JobMap`): our own town map, one area at a time, with area tabs. Each job is a stop on a road: its name, best medal, and 3 objective circles; locked jobs are grayed with a padlock. Arcade stops show a coin cost or a token slot. The leader (crown) taps a job to pick it; everyone else sees a highlight on the pick and a Ready button. An **Assist** button (leader only) opens the five options. A 30-second idle timer shows under the leader's name.
- **Job intro** (`JobIntro`, 4 s): the job's name, the list size, the three medal times for this crew size, and the objectives (after the first clear). Then a big 3-2-1 and "Go!" (movement locked during the count).
- **Results** (`Results`):
  1. The final time counts up, and the medal lands (or "No medal").
  2. The three medal times, with yours placed between them.
  3. The 3 bonus objectives, each ticking in; new ones pop "+1 coin". A new personal best gets a "Best!" stamp.
  4. Unlock messages: "Next job unlocked", "New area!", "Arcade level unlocked".
  5. Buttons: **Retry** (leader), **Job map**, **Back to lobby**, and an auto-continue timer.

## Lobby screens

| Element | Where | Shows |
|---|---|---|
| Progress | top right | medals (gold/silver/bronze counts) and coins |
| Menu buttons | right edge, vertical | Movers, Job map (view only), Settings |
| Pad panel | bottom center, while on a pad | "Crew 2/4", "Leaving in 14s", a crown on the leader, and a Leave button |
| Pad billboards | above each pad | the crew count and countdown |
| Movers | a panel | the mover cast (locked ones show how to unlock them), color variants, and "Use my avatar" if enabled |
| Settings | a panel | Music, SFX, and UI volumes; camera (Mover/Classic); reduce shake; UI scale |
| Teleport screen | full screen | our truck driving across the screen: "Heading out…" (set with `SetTeleportGui`) |

## Controls

| Action | PC | Phone | Gamepad |
|---|---|---|---|
| Move | WASD | thumbstick | left stick |
| Grab / Drop | E | Grab button | X |
| Throw (hold to aim and charge) | hold left mouse, aim with the mouse | hold Throw; aims where you face, with assist | hold R2; aim with the left stick |
| Slap | F | Slap button | B |
| Jump | Space | Jump button | A |
| Help ping | Q | Help (only when dragging alone) | Y |
| Expand the list | Tab | tap the list | D-pad up |

## Sound cue pairs (every important sound gets a visual cue)

| Event | Sound | Visual cue | Volume group |
|---|---|---|---|
| Grab | a soft grunt | the item lifts; the prompt changes | SFX |
| Two-mover lift | a crew grunt | the slow icon disappears | SFX |
| Drag | a scraping loop | the dragging end kicks up dust | SFX |
| Throw | a whoosh | the arc | SFX |
| Slap | a cartoon "thwack" | a star burst | SFX |
| Lever | a clunk | the linked gate moves | SFX |
| In the truck | a ding, rising in pitch as the list fills | a tick pop, list tick | UI |
| Falls out | a "whoops" thud | a toast, list un-tick | UI |
| Fragile break | glass shatter | shards, a toast | SFX |
| Window smash | glass | shards | SFX |
| Help ping | a two-note horn | edge arrow, "Help!" | UI |
| Medal about to be lost | ticking | the timer pulses | UI |
| Job done | a fanfare | the banner | UI |

## Accessibility checklist (every screen)

- Readable text at the smallest phone size (scaled text at least 14 px), with a stroke over the world.
- Icons read without color (shape first).
- Reduce shake turns off screen shake and big flashes.
- Nothing needs fast repeated tapping; holds show a fill ring.
- Every sound has its visual cue (the table above).
- Assist Mode is one tap away on the job map and is never labeled as "easy" or "cheating".
