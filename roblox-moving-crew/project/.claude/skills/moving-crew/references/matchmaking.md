# Lobby, crews, and match servers

The original is couch co-op for 1–4 players who share one screen and pick levels from a map
together. Online, strangers need a way to become a crew. The pattern: walk-on crew pads in the
lobby, then a teleport to a reserved server of the **same place**, where the crew picks jobs on a
shared job map and plays as many as it likes together.

## Why this shape

- **Short waits.** A countdown starts when the first player steps on a pad. The crew leaves with whoever is on it (minimum 1, maximum 4, the original's crew size).
- **The original's session flow.** Inside the match server, the crew moves from job to job through the job map, like the original moves between levels, without re-queueing.
- **Kids learn by watching.** Players see others step onto a pad and a truck drive off. No menus.
- **One place.** One place file, one Rojo project, one Studio target for the MCP.

## Crew pads (PadService, lobby)

| Setting | Value |
|---|---|
| Pads per lobby | 4–6 identical crew pads (any job is picked later, on the job map) |
| Capacity | 4 |
| Countdown | 20 s from the first player; 5 s once the pad is full |
| Minimum crew | 1 |
| Membership check | a spatial query (`GetPartsInPart` or `GetPartBoundsInBox`) on the pad's zone every 0.25 s; never `.Touched` |

Pad attributes (`Members`, `LeavesAt`) drive the pad's billboard and the Pad panel on screen. The
countdown resets only when the pad empties.

**The crew leader** is the first player who stepped onto the pad. The leader's unlocks decide
which jobs the crew can pick.

**Parties (M5):** players with the same `Player.PartyId` go to the same pad. If the pad would
overflow, the party waits for the next pad together. Test with Studio's Party Simulator
(multiplayer ladder rung 6).

## Launching a match (MatchLauncher, lobby)

1. When the countdown ends, lock the pad and snapshot its members and leader.
2. `TeleportService:ReserveServer(game.PlaceId)` returns an access code and a private server ID.
3. Write the crew config to a MemoryStore hash map, keyed by that private server ID, with a 10-minute expiry: `{ crew = { userIds }, leader = userId, createdAt }`.
4. `TeleportAsync(game.PlaceId, players, options)`, with the access code set on `TeleportOptions`. Set the client's teleport screen (`TeleportService:SetTeleportGui`) first.
5. On `TeleportInitFailed`, retry up to 3 times with backoff (1 s, 2 s, 4 s), then return the players to the lobby floor with a toast: "Couldn't reach the truck. Try again!".

Check the current TeleportService and MemoryStore APIs in the docs before writing this; don't
rely on memory. **Teleport data isn't secure**, so never put the crew in it; that's why the
config lives in MemoryStore.

## Starting the match (MatchConfig, match)

1. Read the config with `game.PrivateServerId`. If it's missing (in Studio, or it expired), use DevMatch in Studio; in a live server, teleport everyone back to the lobby.
2. Wait up to 15 s for the expected crew, showing "Waiting for crew 2/3". Start with whoever arrived.
3. If the leader didn't arrive, the next crew member to arrive becomes the leader.
4. Anyone not in the crew list who arrives is sent back to the lobby.

## The job map (JobMap, match)

- The crew starts on the job map. The leader picks an unlocked job (and assist options); everyone else sees the pick live and can press "Ready".
- If the leader doesn't pick within 30 s, the leader's next unfinished unlocked job starts.
- Arcade levels are picked the same way, once the leader has unlocked them.

## During the match

- **Leavers:** CarryService drops their items; medal times are recomputed for the new crew size (CrewScaling); a toast says "Sam left the crew." If the leader leaves, the longest-serving remaining member becomes the leader.
- **Everyone leaves:** the server shuts down on its own. Saves happen at results, so nothing else is needed.
- **Results always save**, even if a player leaves during the results screen (ProfileStore releases on leave).

## After a job (ReturnService, match)

- Results show for up to 20 s, with **Retry** (the leader's call) and **Back to lobby** (anyone's own choice). Then the crew returns to the job map.
- **Back to lobby** teleports that player to `game.PlaceId` without an access code, which lands them on a public lobby server. Try to teleport friends as a group.

## Testing (honest limits)

- **Teleports don't work in Studio.** Test everything up to the teleport in Studio (the dev path runs the match locally). Test the teleport only in the published game: first with a second account or a friend, then (M5) in a separate private Dev experience before the public one.
- MemoryStore and DataStores need the place published, with Studio API access on for Studio tests.
- Run multiplayer ladder rung 4 on pads (step on and off; leave during the countdown) and rung 7 for real teleports.

## Later: cross-server matchmaking

When lobbies often have fewer than 4 players, a MemoryStore sorted-map queue can pool players
across lobby servers. It adds a new failure mode for every server, so it stays in PLAN.md's
Later section until analytics show it's needed.
