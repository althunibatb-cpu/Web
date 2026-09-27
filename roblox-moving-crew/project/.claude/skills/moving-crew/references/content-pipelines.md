# Content pipelines

After M2, most of the work is content: new jobs, areas, arcade levels, items, and screens. The
long-term target is the original's scale (about 30 story jobs in 5–6 areas, plus arcade levels),
built entirely from our own designs. Each kind of content has a fixed pipeline, so every addition
gets the same checks. The owner of each step is in brackets.

## Item model contract

```
<ItemName> (Model; tag MovableItem; attribute ItemId; PrimaryPart = Body)
  Body        the main part: simple collision (a box, or a few boxes for awkward shapes)
  Grip        Attachment (small items): where the hand holds it
  GripA/GripB Attachments (heavy items): one at each end, at carry height
  Outlet      Attachment (plugged-in items only): where the cord starts
  (visual meshes: CanCollide off, Massless on, welded to Body)
```

Friction and elasticity come from Tuning (see truck-packing.md), so every item stacks the same
way.

## New job (the level-designer pipeline)

1. **Brief** in JOBS.md: fantasy, twist, layout sketch (our own), list, puzzle, camera yaw, routes, and 3 bonus objectives. [level-designer]
2. **Greybox** to the map contract, with placeholder items. [builder]
3. **Lint**: map lint is clean, including the test pack. [builder]
4. **First play** with 1 and 2 movers. Is the twist fun? Is the truck easy to find? Does the stack fit when packed sensibly? [you]
5. **Timing runs**: your best times with crews of 1, 2, and 4. [you + builder, recorded in JOBS.md]
6. **Medal times** from GAME.md's rule; check that a solo mover can reach Bronze. [balance-analyst]
7. **Objectives** tested: each of the 3 can be completed, and none by accident. [builder]
8. **Art pass**: modular pieces, terrain, Material Generator surfaces; no giant mesh. [builder with asset-planner]
9. **Sound**: ambience and the area's music loop. [sound-designer plans, builder implements, you do the headphone check]
10. **Performance**: phone profile under the budgets; part count; memory across 5 job loops. [builder]
11. **Ship**: JobDefs entry with its unlock order; publish (ask first). [builder]

## New area (every ~4 weeks after launch)

1. **Area brief** in JOBS.md: theme, 5–6 jobs, the twist each one introduces (one new twist per job, building on the last), and 1–2 arcade levels. [level-designer]
2. **New twists** built as reusable HazardService modules first, each tested in a throwaway job. [builder]
3. Each job through the new-job pipeline above. [everyone]
4. **Area art kit** (walls, floors, props) planned once and reused. [asset-planner]
5. **Parity check**: game-critic confirms nothing was copied from the original's areas. [game-critic]

## New arcade level

1. **Brief**: one mechanic, pushed hard (for example, fans that blow items off course); a short list; a small map. [level-designer]
2. Build it through the new-job pipeline, skipping the timing-run step for crews of 4 (arcade levels are often solo). [builder]
3. **Unlock**: its coin cost and/or hidden token in JobDefs; place the token in its story job. [builder]

## New item

1. **Define** it in ItemDefs: ID, name, class, flags, icon, sound category. [builder]
2. **Plan the asset**: a row in ASSETS.md with a source and a prompt (our own design). [asset-planner]
3. **Placeholder**: a color-coded block with grips, placed in a test job. [builder]
4. **Playtest the feel**: drag it, carry it, throw it, stack it. Is it funny? [you]
5. **Final model**: generate or source it → Blender cleanup (triangle budget) → 3D Importer → apply the item contract. [builder; you approve paid generation batches]
6. **Icon** for the moving list. [builder]
7. **Check**: map lint, a phone device profile, the triangle budget. [builder]

## New screen

1. **Spec**: add it to `ui-hud.md` (what shows, when, element names). [builder, approved by you]
2. **Layout** in Studio through the MCP: Scale sizes, layout objects, 9-slice panels, named elements. Our own design; never trace the original's screens. [builder]
3. **Logic** in `client/UI/<Screen>`: reads state, sends requests; nothing decides outcomes. [builder]
4. **Device check**: Device Simulator on a small phone, a tablet, and 1080p; a gamepad pass. [builder]
5. **You**: can you use it without reading anything? [you]
6. **Art pass** (M4+): icons and panels from ASSETS.md. [asset-planner plans, builder applies]

## New mover character or color

1. **Design brief**: our own original character, in the cast's shared style. [asset-planner]
2. **Generate** → Blender cleanup → Avatar Setup (R15 rig) → check the carry, drag, throw, and slap animations on it. [builder; you approve paid batches]
3. **Unlock rule** in `Config/Movers` (medal or coin milestone, following the T0.3 finding). [builder]
4. **Check**: it reads clearly from the Mover cam at phone size. [you]

## Sound pass

The kit's standard process: sound-designer writes the plan in ASSETS.md (Sounds), using the event
table in `ui-hud.md` → the builder implements with SoundGroups (Music, SFX, UI, Ambience, Voice)
and pitch variation → you do the headphone check in docs/PLAYBOOK.md. Our own or licensed audio
only.

## Release (M5 onward)

1. Every task in the release is `done` with evidence; the check script is clean; Jest passes.
2. The multiplayer ladder to the rung the release needs (rung 5 for launch; rung 7 for anything touching teleports).
3. `roblox-best-practices` review of the changed remotes.
4. **IP check**: the name, description, thumbnails, and new content contain nothing from the original. [game-critic]
5. **Publish to the private Dev experience first** and test the teleport path with a friend.
6. Publish to the public experience (ask first). Note the place version number in PROGRESS.md so it can be rolled back.
7. Commit with `Release: <what shipped>`.

## Live cadence (M6 onward)

| When | What | Command |
|---|---|---|
| Every session | Where are we | `/game-status` |
| Weekly | Read analytics: queue waits, jobs per session, next-job rate, day-1 return | D2 prompt in docs/PROMPTS.md, then `/game-feedback` |
| Every ~4 weeks | One new area, through the new-area pipeline | `/next-task` |
| Monthly | Check what's new in Roblox and the kit's tools | C14 prompt in docs/PROMPTS.md |
