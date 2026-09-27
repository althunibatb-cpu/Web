# Parity with the original

The goal is gameplay that plays like Moving Out (2020). This file maps each of the original's
mechanics to our version, says how sure we are about the original's behavior, and lists what
must stay our own.

**Confidence:**
- **Confirmed** means several independent reviews or guides describe it.
- **Verify** means it's plausible but unconfirmed. The reference playthrough (T0.3) settles it; update this file and GAME.md with what you find.

Sources used: reviews and guides from Nintendo Life, Destructoid, Well Played, Stevivor, Xbox
Achievements, and Wikipedia's summary (via search, September 2026).

## Mechanics

| Original | Confidence | Our version | Spec |
|---|---|---|---|
| Up to 4 players, couch co-op | Confirmed | 1–4 per job, online | matchmaking.md |
| Actions: drag, pick up, throw, slap, jump | Confirmed | The same five actions | carry-and-throw.md |
| Marked items must go into the truck under the clock | Confirmed | List items glow; the job ends when every list item is in the truck | systems.md |
| Heavy items need two movers to carry | Confirmed | Two carry at full speed; one drags slowly | carry-and-throw.md |
| Fragile items break when thrown or dropped hard | Confirmed | The same, with speed thresholds | carry-and-throw.md |
| What happens to a broken list item (gone, or still owed) | Verify | Default: it's gone and no longer blocks finishing; it fails "don't break" objectives | carry-and-throw.md |
| Throwing, including heavy furniture being flung | Confirmed that items can be thrown | Small items throw; heavy items can't | carry-and-throw.md |
| Whether heavy items can be thrown by two players together | Verify | Default: no | carry-and-throw.md |
| Catching thrown items | Verify | Default: auto-catch with empty hands (plus a catch ring as an online addition) | carry-and-throw.md |
| Slap hits players, ghosts, and animals, and flips levers and switches | Confirmed | The same; slap also nudges loose items | carry-and-throw.md |
| Windows can be smashed for shortcuts | Confirmed | Windows break from thrown items and hard hits | maps.md |
| Physics truck: items stack, and a bad stack spills out | Confirmed | A physics truck bed; an item counts only while it rests inside | truck-packing.md |
| Big items first is the winning strategy; no stacking tutorial | Confirmed | Same physics; our tutorial job does teach stacking (a clarity fix) | JOBS.md |
| Time-only ranking: Bronze, Silver, Gold | Confirmed | The same; no points | systems.md |
| A hard time limit that fails the level | Verify | Default: no fail; slower than Bronze gets no medal | systems.md |
| 3 bonus objectives per level, revealed after the first completion | Confirmed | The same, with our own objectives | maps.md |
| Objectives earn coins that unlock arcade levels | Confirmed | The same | systems.md |
| Hidden collectibles in levels that unlock arcade levels | Confirmed (hidden consoles) | Hidden arcade tokens, our own design | maps.md |
| Arcade levels: short challenges built on one mechanic | Confirmed | The same | content-pipelines.md |
| Hazards and gimmicks: rakes, fire, ice, ghosts, levers, fans, spinning blocks | Confirmed | Our own hazards of the same kinds, one twist per job | maps.md |
| About 30 story levels plus arcade levels (50+ total) | Confirmed | Long-term target: about 30 story jobs in 5–6 areas, plus arcade levels | PLAN.md |
| Levels unlock one after another through a town map | Confirmed in outline | A job map with sequential unlocks per area | ui-hud.md |
| Assist Mode: more time, items vanish on delivery, fewer obstacles, lighter items, skip levels | Confirmed | The same five options, chosen by the crew leader | systems.md |
| A fixed, high camera | Confirmed | The Mover cam with cutaway roofs and walls | maps.md |
| Medal times change with player count | Verify | Default: medal times per crew size (1–4) | systems.md |
| How the playable cast unlocks | Verify | Default: medal and coin milestones | GAME.md |
| Slapping another player while they carry something | Verify | Default: a small knockback; they keep the item | carry-and-throw.md |
| Carrying a heavy item stops you jumping | Verify | Default: no jumping while carrying anything heavy | carry-and-throw.md |

## Online additions (the original is couch co-op, we're not)

These don't exist in the original. Keep each one small, and never let it change the rules above.

| Addition | Why |
|---|---|
| Lobby crew pads with a countdown | Strangers need a way to form a crew |
| Job map where the crew leader picks | One shared screen doesn't exist online |
| Help ping (Q / button) | No voice chat for most kids; heavy items need a second mover |
| Catch ring and aim assist on phones and gamepads | Throwing with a thumb, without a shared screen, at network latency |
| Crew-scaled medal times, if the original doesn't scale | Crews change size when people leave |
| Leaver handling | Couch co-op players don't disconnect |

## Must stay our own

Never copy these, even "just as a placeholder": the name "Moving Out", the town, the moving
company, the crew's job title, the boss and every character, the story and dialogue, level names
and floor plans, bonus objective wording, art, models, UI graphics, fonts, logos, music, and
sound effects. Don't trace screenshots or footage when building levels or UI. Placeholder shapes
are always ours.

## Reference playthrough (T0.3)

Play the first area of the original (solo, then with a friend if you can). Record the answers in
this file's Verify rows, then change the defaults to match:

1. What happens when a fragile list item breaks? Is it still required?
2. Can two players throw a heavy item together? Can a solo player throw a heavy item at all?
3. Can you catch an item a teammate throws? Does it need a button press?
4. What does slapping a player who's carrying something do?
5. Is there a hard time limit? What happens after the Bronze time?
6. Can you jump while carrying something heavy?
7. With 1 player and with 2, do the medal times change?
8. How do new playable characters unlock?
9. Roughly how long does a Gold run of the first 3 levels take? (It sets our job length.)
10. Which Assist Mode options exist, and what values do they offer (for example, how much extra time)?

Write down behaviors only. Don't record level layouts, text, or art to copy.
