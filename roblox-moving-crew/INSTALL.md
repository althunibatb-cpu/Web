# Moving Crew pack: install into your game project

This pack turns the Roblox AI Dev Kit's game director into a production pipeline for a
Moving Out–style co-op moving game with online queues. It's already filled in, so you skip
`/new-game`. The director starts at M0 with a full plan.

## For you (the human): 3 steps

1. Finish the kit's own setup first (`roblox-ai-dev-kit/START-HERE.md`). When it asks, choose
   **Option A** and **Rojo**, not Script Sync (the reason is below).
2. Copy this whole `roblox-moving-crew` folder into your game folder, next to `roblox-ai-dev-kit`.
3. In Claude Code, type:
   **`Read roblox-moving-crew/INSTALL.md and follow it.`**
   Then type **`/game-status`**.

**Why Rojo from day one:** in most games the kit lets you start on Script Sync and switch
before M2. This game is multiplayer from the first task, because carrying a couch together is
the core loop. It also runs one place in two modes (lobby and match), keeps pure rules that
need Jest tests (scoring, truck packing), and saves data by M2. That's the case the kit says
needs the stronger checks.

---

## Instructions for Claude

**PACK** means the folder containing this file. The game folder is the project root.

1. **Check the base.** The kit's setup must be complete: `SETUP-LOG.md` shows Phase 11 done,
   and `.claude/skills/game-director/` exists. If the project is on Script Sync, tell the user
   this game needs Rojo (see above), and offer `docs/BEGINNER.md` Phase 2 before continuing.
2. **Don't overwrite.** If `GAME.md`, `PLAN.md`, `PROGRESS.md`, `ASSETS.md`, or `JOBS.md`
   already exist in the project root, stop and ask whether to replace them.
3. **Copy, never retype.** Copy these with shell commands:
   - `PACK/project/GAME.md`, `PLAN.md`, `PROGRESS.md`, `ASSETS.md`, `JOBS.md` → project root
   - `PACK/project/.claude/skills/moving-crew/` → `.claude/skills/moving-crew/`
   - `PACK/project/.claude/agents/level-designer.md` → `.claude/agents/`
4. **Append the rules.** Append the contents of `PACK/project/AGENTS-additions.md` to the end
   of `AGENTS.md`. Don't change anything already in AGENTS.md.
5. **Lock file.** Add one line to `.claude/skills.lock.md`:
   `moving-crew · project-authored (roblox-moving-crew pack) · no commit pin · <today's date>`.
6. **Commit** with the message `Add Moving Crew production pack`.
7. **Restart.** Tell the user: "Close Claude Code, start it again in this folder, and type
   `/game-status`." The new skill and agent load only at startup.

**Check:** the five project files exist, `.claude/skills/moving-crew/SKILL.md` exists, `/agents`
lists `level-designer` next to the kit's five agents, and AGENTS.md ends with the
"## This game: Moving Crew" section.
