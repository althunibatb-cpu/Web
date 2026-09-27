# Assets

Every movable item follows the item model contract in the moving-crew skill
(`references/content-pipelines.md`): a `Body` PrimaryPart, `Grip` (small) or `GripA`/`GripB`
(heavy) attachments, a Box collision, and a footprint that matches its ItemDefs entry.

Style words for every generation prompt: *"chunky low-poly toy-like, rounded edges, flat
pastel colors, single object, neutral background, no text"*. Placeholders until M3: small =
blue, heavy = orange, fragile = pink, optional = gray.

**Budgets:** small items ≤ 800 triangles, heavy items ≤ 2,000, trucks ≤ 5,000. Check Roblox's
current mesh import limits before import.

## Items (launch set, M3)

| Name | Type | Source | Prompt or reference | Needed by | Status | Notes (rights, triangles) |
|---|---|---|---|---|---|---|
| Cardboard box (S/M/L) | model ×3 | built from parts | 1×1×1 cells; tape stripe decal | M1 placeholder, M3 final | planned | Most common item; must be readable from the Mover cam |
| Lamp (fragile) | model | Higgsfield | "a table lamp with a round shade, [style words]" | M3 | planned | Fragile; M4 adds a cord (plugged-in) |
| Vase (fragile) | model | Creator Store search "low poly vase" | — | M3 | planned | Fragile; check the license |
| Kitchen chair | model | Higgsfield | "a wooden kitchen chair, [style words]" | M3 | planned | Small, 1×1×2 |
| Armchair | model | Higgsfield | "a puffy armchair, [style words]" | M3 | planned | Heavy, 2×2×2 |
| Couch | model | Higgsfield | "a three-seat sofa, [style words]" | M3 | planned | Heavy, 3×1×2 |
| L-shaped couch | model | Higgsfield | "an L-shaped corner sofa, [style words]" | M3 | planned | Heavy, L footprint; the Townhouse door puzzle |
| Bed | model | Higgsfield | "a single bed with a blanket, [style words]" | M3 | planned | Heavy, 2×4×1 |
| Fridge | model | Higgsfield | "a tall rounded fridge, [style words]" | M3 | planned | Heavy, 1×1×3 |
| Piano | model | Higgsfield | "an upright piano, [style words]" | M3 | planned | Heavy + fragile; the Mansion showpiece |
| TV (fragile) | model | Higgsfield | "a chunky flat TV, [style words]" | M3 | planned | Fragile, plugged-in in M4 |
| Fish tank (fragile) | model | Higgsfield | "a small fish tank with water and one fish, [style words]" | M3 | planned | Fragile; water slosh VFX in M4 |
| Potted plant | model | Creator Store search "low poly potted plant" | — | M3 | planned | Small |
| Bookshelf | model | Higgsfield | "a tall bookshelf, [style words]" | M3 | planned | Heavy, 2×1×3 |

## Trucks, lobby, and characters (M3)

| Name | Type | Source | Prompt or reference | Needed by | Status | Notes (rights, triangles) |
|---|---|---|---|---|---|---|
| Starter Van | model | Higgsfield | "a small boxy moving van with the back open, [style words]" | M3 | planned | 4×6×3 grid; the grid is invisible parts, not the mesh |
| Box Truck | model | Higgsfield | "a medium box moving truck with the back open, [style words]" | M3 | planned | 5×7×3 grid |
| Big Rig | model | Higgsfield | "a big moving truck with a long trailer, back open, [style words]" | M3 | planned | 6×9×3 grid |
| HQ yard kit | models | Creator Store + parts | depot building, pads, shop counter, locker | M3 | planned | Modular pieces, not one mesh |
| Crew uniforms ×3 | clothing | built in Studio | overalls in 3 colors with our logo | M3 | planned | Applied via HumanoidDescription |
| Hats ×6 | accessories | Creator Store / Higgsfield | cap, hard hat, beanie, cowboy hat, party hat, traffic cone | M3 | planned | Check accessory rights |

## UI images (M4)

| Name | Type | Source | Prompt or reference | Needed by | Status | Notes (rights, triangles) |
|---|---|---|---|---|---|---|
| Item class icons (heavy, fragile, optional, plugged-in) | UI image ×4 | Higgsfield | "flat game UI icon, thick outline, [meaning], transparent background" | M4 | planned | Must read by shape, not only color |
| Medal and star set | UI image ×4 | Higgsfield | "bronze/silver/gold medal and a star, flat game UI, thick outline" | M4 | planned | |
| Panel 9-slice | UI image | built | rounded panel with a 4 px outline | M4 | planned | `ScaleType.Slice` |

## Sounds
The sound-designer fills this section in M3 (see the moving-crew skill, `references/ui-hud.md`,
for the events that need sounds and visual cues).
