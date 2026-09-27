# Lobby, queues, and match servers

The pattern is walk-on truck pads in the lobby (like the elevators in Doors), then a teleport to
a reserved server of the **same place** running in Match mode.

## Why this shape

- **Short waits.** A countdown starts when the first player steps on. The job launches with whoever is on the pad (minimum 1), and jobs scale to crew size. At launch there may be 10 players online, not 500.
- **Kids learn by watching.** Players see others step on a pad and a truck drive off. No menus.
- **One place.** One place file, one Rojo project, one Studio target for the MCP.

## Truck pads (PadService, lobby)

| Setting | Value |
|---|---|
| Pads per lobby | one per unlocked launch job, plus a "Random job" pad |
| Capacity | 8 |
| Countdown | 20 s from the first player; 5 s once the pad is full |
| Minimum crew | 1 |
| Membership check | a spatial query (`GetPartsInPart` or `GetPartBoundsInBox`) on the pad's zone every 0.25 s; never `.Touched` |
| Locked pads | if the player's total stars are below the job's unlock, they're pushed off gently with a toast: "Need 4★" |

Pad attributes (`Members`, `LeavesAt`) drive the pad's billboard and the Pad panel on screen. The
countdown resets only when the pad empties.

**Parties (M5):** players with the same `Player.PartyId` who are in the server go to the same pad.
If the pad would overflow, the party goes together to the next launch. Test with Studio's Party
Simulator (multiplayer ladder rung 6).

## Launching a match (MatchLauncher, lobby)

1. When the countdown ends, lock the pad and snapshot its members.
2. `TeleportService:ReserveServer(game.PlaceId)` returns an access code and a private server ID.
3. Write the match config to a MemoryStore hash map, keyed by that private server ID, with a 10-minute expiry:
   `{ jobId, crew = { userIds }, truck = best truck tier in the crew, createdAt }`.
4. `TeleportAsync(game.PlaceId, players, options)`, with the access code set on `TeleportOptions`. Set the client's teleport screen (`TeleportService:SetTeleportGui`) first.
5. On `TeleportInitFailed`, retry up to 3 times with backoff (1 s, 2 s, 4 s), then return the players to the lobby floor with a toast: "Couldn't reach the truck. Try again!".

Check the current TeleportService and MemoryStore APIs in the docs before writing this; don't
rely on memory. **Teleport data isn't secure**, so never put the job or crew in it; that's why
the config lives in MemoryStore.

## Starting the match (MatchConfig, match)

1. Read the config with `game.PrivateServerId`. If it's missing (in Studio, or it expired), use DevMatch in Studio; in a live server, teleport everyone back to the lobby.
2. Wait up to 15 s for the expected crew, showing "Waiting for crew 2/3". Start with whoever arrived.
3. Anyone not in the crew list who arrives is sent back to the lobby. This shouldn't happen in reserved servers, but check anyway.

## During the match

- **Leavers:** CarryService drops their items; CrewScaling marks extras above the new crew size as `Optional`; medal times are recomputed for the new crew size; a toast says "Sam left. List shortened." Items already packed stay packed.
- **Everyone leaves:** the server shuts down on its own. Nothing to save beyond the per-player saves that happen at results.
- **Results always save**, even if a player leaves during the results screen (ProfileStore releases on leave).

## After the job (ReturnService, match)

- The results screen shows two buttons for 20 s: **Play again** and **Back to lobby**.
- If at least one player voted Play again when time runs out, the job reloads **in the same server** for those players (no teleport; the same crew stays together). Players who chose Back to lobby teleport to `game.PlaceId` without an access code, which lands them on a public lobby server. Try to teleport them as a group so friends stay together.
- The next job is the same job, or the next unlocked one, chosen by a quick vote on the results screen (majority wins, ties keep the current job).

## Testing (honest limits)

- **Teleports don't work in Studio.** Test everything up to the teleport in Studio (the dev path runs the match locally). Test the teleport itself only in the published game: first with a second account or a friend, then (M5) in a separate private Dev experience before the public one.
- MemoryStore and DataStores need the place published, with Studio API access on for Studio tests.
- Run multiplayer ladder rung 4 on pads (step on and off; leave during the countdown) and rung 7 for real teleports.

## Later: cross-server matchmaking

When lobbies often have fewer than 4 players, a MemoryStore sorted-map queue can pool players
across lobby servers. It adds a new failure mode for every server, so it stays in PLAN.md's
Later section until analytics show it's needed.
