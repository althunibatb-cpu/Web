# Assets

Every asset is our own or properly licensed. Never generate from, trace, or reference the
original game's characters, art, UI, logos, music, or sounds, even in a prompt.

Every movable item follows the item model contract in the moving-crew skill
(`references/content-pipelines.md`): a `Body` PrimaryPart, `Grip` (small) or `GripA`/`GripB`
(heavy) attachments, and simple collisions.

Style words for every generation prompt: *"chunky low-poly toy-like, rounded edges, flat bright
colors, single object, neutral background, no text"*. Placeholders until M3: small = blue,
heavy = orange, fragile = pink.

**Budgets:** small items ≤ 800 triangles, heavy items ≤ 2,000, trucks ≤ 5,000, characters ≤
6,000. Check Roblox's current mesh import limits before import.

## Items (launch set, M3)

| Name | Type | Source | Prompt or reference | Needed by | Status | Notes (rights, triangles) |
|---|---|---|---|---|---|---|
| Cardboard box (S/M/L) | model ×3 | built from parts | tape stripe decal | M1 placeholder, M3 final | planned | Most common item; must be readable from the Mover cam |
| Lamp (fragile) | model | Higgsfield | "a table lamp with a round shade, [style words]" | M3 | planned | Fragile; M4 adds a cord |
| Vase (fragile) | model | Creator Store search "low poly vase" | — | M3 | planned | Fragile; check the license |
| Kitchen chair | model | Higgsfield | "a wooden kitchen chair, [style words]" | M3 | planned | Small |
| Armchair | model | Higgsfield | "a puffy armchair, [style words]" | M3 | planned | Heavy |
| Couch | model | Higgsfield | "a three-seat sofa, [style words]" | M3 | planned | Heavy |
| L-shaped couch | model | Higgsfield | "an L-shaped corner sofa, [style words]" | M3 | planned | Heavy, awkward shape |
| Bed | model | Higgsfield | "a single bed with a blanket, [style words]" | M3 | planned | Heavy, flat |
| Fridge | model | Higgsfield | "a tall rounded fridge, [style words]" | M3 | planned | Heavy, tall; tips over in the truck |
| Piano | model | Higgsfield | "an upright piano, [style words]" | Area 2+ | planned | Heavy + fragile |
| TV (fragile) | model | Higgsfield | "a chunky flat TV, [style words]" | M3 | planned | Fragile, plugged in (M4) |
| Fish tank (fragile) | model | Higgsfield | "a small fish tank with water and one fish, [style words]" | M3 | planned | Fragile |
| Potted plant | model | Creator Store search "low poly potted plant" | — | M3 | planned | Small |
| Bookshelf | model | Higgsfield | "a tall bookshelf, [style words]" | M3 | planned | Heavy |
| Garden gnome | model | Higgsfield | "a garden gnome statue, [style words]" | M3 | planned | Small; a good bonus-objective prop |

## Movers, trucks, and world (M3)

| Name | Type | Source | Prompt or reference | Needed by | Status | Notes (rights, triangles) |
|---|---|---|---|---|---|---|
| Mover cast ×8 | characters | Higgsfield → Avatar Setup | 8 original, silly mover designs in one shared style; neutral pose, arms away from the body | M3 | planned | Our own designs only. Avatar Setup gives the R15 rig. Pending the GAME.md decision. |
| Crew uniform | clothing | built in Studio | overalls with our own logo | M3 | planned | For the "use my avatar" option |
| Moving truck (small) | model | Higgsfield | "a small boxy moving van with the back open, [style words]" | M1 placeholder, M3 final | planned | The load zone and bed walls are invisible parts, not the mesh |
| Moving truck (large) | model | Higgsfield | "a big box moving truck with the back open, [style words]" | M3 | planned | For bigger jobs; truck size is set per job |
| Lever and switch | model ×2 | built from parts | — | M1 placeholder, M3 final | planned | Tag `Slappable` |
| Hidden arcade token | model | Higgsfield | "a small glowing retro game cartridge, [style words]" | M3 | planned | Our own design, not a copy of the original's collectible |
| Lobby yard kit | models | Creator Store + parts | depot building, crew pads, job map board | M3 | planned | Modular pieces, not one mesh |

## UI images (M4)

| Name | Type | Source | Prompt or reference | Needed by | Status | Notes (rights, triangles) |
|---|---|---|---|---|---|---|
| Item badges (heavy, fragile, plugged-in) | UI image ×3 | Higgsfield | "flat game UI icon, thick outline, [meaning], transparent background" | M4 | planned | Must read by shape, not only color |
| Medal set and coin | UI image ×4 | Higgsfield | "bronze/silver/gold medal and a coin, flat game UI, thick outline" | M4 | planned | Our own designs |
| Action icons (grab, throw, slap, jump, help) | UI image ×5 | Higgsfield | "flat game UI icon, thick outline, [action], transparent background" | M4 | planned | Phone buttons |
| Panel 9-slice | UI image | built | rounded panel with a 4 px outline | M4 | planned | `ScaleType.Slice` |

## Sounds
The sound-designer fills this section in M3 (see the moving-crew skill, `references/ui-hud.md`,
for the events that need sounds and visual cues). No music or sounds taken from the original.
