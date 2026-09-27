# Content pipelines

After M2, most of the work is content: new items, new jobs, new screens, new cosmetics. Each
has a fixed pipeline, so every addition gets the same checks. Each numbered step is either one
PLAN.md task or one step inside a task; the owner is in brackets.

## Item model contract

```
<ItemName> (Model; tag MovableItem; attribute ItemId; PrimaryPart = Body)
  Body        the main part: CollisionFidelity Box (or Hull for the L-couch), CanTouch on
  Grip        Attachment (small items): where the hand holds it
  GripA/GripB Attachments (heavy items): one at each end, at carry height
  Outlet      Attachment (plugged-in items only): where the cord starts
  (visual meshes: CanCollide off, Massless on, welded to Body)
```

The Body's size matches the ItemDefs footprint × 4 studs (a 3×1×2 couch is about 12×4×8 studs),
so it lines up with the truck grid.

## New item

1. **Define** it in ItemDefs: ID, name, class, flags, footprint, pay, icon, sound category. [builder]
2. **Plan the asset**: a row in ASSETS.md with a source and a prompt. [asset-planner]
3. **Placeholder**: a color-coded block with the right footprint and grips, placed in a test job. [builder]
4. **Playtest the feel**: carry it, throw it, pack it. Is it funny? [you]
5. **Final model**: generate or source it → Blender cleanup (triangle budget) → 3D Importer → apply the item contract. [builder; you approve paid generation batches]
6. **Icon**: a clean render for the moving list (a ViewportFrame snapshot or an image). [builder]
7. **Check**: map lint, a phone device profile, the triangle budget. [builder]

## New job (the level-designer pipeline)

1. **Brief** in JOBS.md: fantasy, twist, layout sketch, list (core and extras), puzzle, camera yaw, routes. [level-designer]
2. **Greybox** from modular parts following the map contract; placeholder items. [builder]
3. **Lint**: map lint is clean. [builder]
4. **First play**: 1 player and 2 players. Is the twist fun? Is the truck easy to find? [you]
5. **Timing runs**: your best times with crews of 1, 2, and 4 (plus 8 at M5). [you + builder, recorded in JOBS.md]
6. **Medal times** from the rule of thumb in GAME.md; balance-analyst checks that a 1-player crew reaches Bronze. [balance-analyst]
7. **Art pass**: modular pieces, terrain, Material Generator surfaces; no giant mesh. [builder with asset-planner]
8. **Sound**: ambience and the job's music loop. [sound-designer plans, builder implements, you do the headphone check]
9. **Performance**: phone profile under the budgets; part count; memory across 5 job loops. [builder]
10. **Ship**: add to JobDefs with its unlock; add a truck pad in the lobby; publish (ask first). [builder]

## New screen

1. **Spec**: add it to `ui-hud.md` (what shows, when, element names). [builder, approved by you]
2. **Layout** in Studio through the MCP: Scale sizes, layout objects, 9-slice panels, named elements. [builder]
3. **Logic** in `client/UI/<Screen>`: reads state, sends requests; nothing decides outcomes. [builder]
4. **Device check**: Device Simulator on a small phone, a tablet, and 1080p; a gamepad pass. [builder]
5. **You**: can you use it without reading anything? [you]
6. **Art pass** (M4+): icons and panels from ASSETS.md. [asset-planner plans, builder applies]

## New cosmetic or gadget

1. **Define** it in Config (Cosmetics, or Trucks for paint), with a price checked by balance-analyst. [balance-analyst recommends; you decide]
2. **Asset** row in ASSETS.md. [asset-planner]
3. **Shop card** and locker slot come from Config automatically; no new UI code. [builder]
4. **Gadgets only**: a Tuning entry and a feel playtest, since gadgets change the carry rules. [builder + you]
5. **Check**: purchase spam test, rejoin test. [builder]

## Sound pass

The kit's standard process: sound-designer writes the plan in ASSETS.md (Sounds), using the event
table in `ui-hud.md` → the builder implements with SoundGroups (Music, SFX, UI, Ambience, Voice)
and pitch variation → you do the headphone check in docs/PLAYBOOK.md.

## Release (M5 onward)

1. Every task in the release is `done` with evidence; the check script is clean; Jest passes.
2. The multiplayer ladder to the rung the release needs (rung 5 for launch; rung 7 for anything touching teleports).
3. `roblox-best-practices` review of the changed remotes.
4. **Publish to the private Dev experience first** and test the teleport path with a friend.
5. Publish to the public experience (ask first). Note the place version number in PROGRESS.md so it can be rolled back.
6. Commit with `Release: <what shipped>`.

## Live cadence (M6 onward)

| When | What | Command |
|---|---|---|
| Every session | Where are we | `/game-status` |
| Weekly | Read analytics: queue waits, jobs per session, play-again rate, day-1 return | D2 prompt in docs/PROMPTS.md, then `/game-feedback` |
| Every ~2 weeks | One new job, through the new-job pipeline | `/next-task` |
| Monthly | Check what's new in Roblox and the kit's tools | C14 prompt in docs/PROMPTS.md |
