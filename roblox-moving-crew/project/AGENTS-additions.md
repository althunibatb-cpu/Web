
## This game: Moving Crew

- Load the `moving-crew` skill for every task. Its references are the spec; if code and spec disagree, fix one of them in the same commit and say which.
- One place, two modes: public servers are the lobby and reserved servers are matches. In Studio, set the `DevMode` attribute on ServerStorage to test either mode. Teleports don't work in Studio; test them only in the published game, and ask before publishing.
- Items, jobs, and prices come only from `shared/Config`. Never hard-code an item's rules in a map or a script.
- `Scoring`, `CrewScaling`, and `TruckGrid` in `shared/Rules` must not use Roblox APIs, and every change to them needs a passing Jest test.
- Never weld a heavy item to two characters. Follow the two-person carry in `references/carry-and-throw.md`.
- Pads use polled spatial queries, never `.Touched`.
- Never trust teleport data; the match config lives in MemoryStore, keyed by `game.PrivateServerId`.
- Clone a fresh map for every job; never repair a used one.
- Use a Highlight only for the targeted item and up to 12 nearest list items.
- Run the map lint (`server/Dev/MapLint`) after every map change, before playtesting.
- Co-op tasks are tested with at least 2 clients (Server & Clients) from M1 onward, not only at the gate.
- Level-design work goes to the `level-designer` agent (JOBS.md), just as art goes to `asset-planner`.
- Never use the name "Moving Out" or its characters or art anywhere in the game.
