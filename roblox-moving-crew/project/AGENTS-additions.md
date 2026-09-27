
## This game: Moving Crew

- Load the `moving-crew` skill for every task. Its references are the spec; if code and spec disagree, fix one of them in the same commit and say which.
- Gameplay rules follow the original game as recorded in `references/original-parity.md`. Build "Verify" rows as their stated defaults, and keep them easy to change.
- Never copy the original's protected content: the name "Moving Out", its town, company, job title, characters, story, text, level layouts, bonus objective wording, art, UI graphics, fonts, logos, music, or sounds. Don't trace screenshots or footage. If asked to, stop and explain why.
- One place, two modes: public servers are the lobby and reserved servers are matches. In Studio, set the `DevMode` attribute on ServerStorage to test either mode. Teleports don't work in Studio; test them only in the published game, and ask before publishing.
- Crews are 1–4 players.
- Items, jobs, objectives, and tuning come only from `shared/Config`. Never hard-code an item's rules in a map or a script.
- `Medals`, `CrewScaling`, and `Objectives` in `shared/Rules` must not use Roblox APIs, and every change to them needs a passing Jest test.
- Never weld a heavy item to two characters. Follow the two-person carry in `references/carry-and-throw.md`.
- Items resting in the truck are server-owned. Never anchor them.
- Pads use polled spatial queries, never `.Touched`.
- Never trust teleport data; the crew config lives in MemoryStore, keyed by `game.PrivateServerId`.
- Clone a fresh map for every job; never repair a used one.
- Use a Highlight only for the targeted item and up to 12 nearest list items.
- Run the map lint (`server/Dev/MapLint`, including the test pack) after every map change, before playtesting.
- Co-op tasks are tested with at least 2 clients (Server & Clients) from M1 onward, not only at the gate.
- Level-design work goes to the `level-designer` agent (JOBS.md), just as art goes to `asset-planner`. At every gate, game-critic also checks parity and IP.
