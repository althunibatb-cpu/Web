# Duck Derby: the Roblox game we're building

**The pick:** a multiplayer Roblox version of *Duck Life*. You hatch a duckling, train it by
playing quick minigames (run, swim, fly, climb), then race it live against other players on
tracks that mix all four terrains.

**Working title:** Duck Derby (test *Raise a Duck* against it). **Pitch:** train your duck,
race your friends.

Researched 27 Sep 2026 using item 1 of Cole's checklist from the video: *has this idea been
done outside Roblox before, and did it work?*

---

## Why this one

| Checklist question | Duck Derby |
|---|---|
| Done outside Roblox, and it worked? | Yes, at scale. The four original *Duck Life* Flash games have **1B+ combined plays**. *Duck Life 4* alone has **250M+**. |
| Is the demand still there? | Yes. Coolmath calls it one of its most popular series, "probably only behind the Run series and the Fireboy and Watergirl series". The developer remastered *Duck Life 4* in **Sept 2025** and sells *Duck Life 9* on Steam, mobile and Switch 2. |
| Already done well on Roblox? | No. The only Duck Life remake I found is a small solo project. The rest are simulator-style pet races where you grind for speed and race the clock or NPCs, which isn't the same game (details below). |
| Would a kid understand it? | "Make your duck faster, win races." |
| Fun with friends, and clippable? | Live races, photo finishes, rare-duck hatches, and relay races where each friend's duck runs one leg. |
| Cheap enough to build? | Yes. There are no vehicle physics, each minigame uses one input, and the server simulates the races. MVP in about 6 weeks. |

It passes the video's test: go look at what exists on Roblox, what genre it's in, and whether it
really fulfills the same core fantasy. What exists is a different, shallower genre. And the
Duck Life Flash games are single-player, so racing your friends' ducks live is the new part
Roblox adds.

---

## How we applied the method

1. **Scanned the sources the video lists:** browser games (Coolmath, CrazyGames, Poki), Steam
   and Game Pass hits, TikTok challenges, mobile, Minecraft minigames and Garry's Mod modes.
2. **Kept only ideas with numbers:** plays, copies sold, concurrent players, downloads, big
   YouTube videos.
3. **Checked Roblox for each one.** If a version already exists, does it deliver the same core
   fantasy? If it does, the idea is out.
4. **Scored the survivors** on kid-readability, play-with-friends, build cost and how well it
   monetizes on Roblox. The full table is under
   [What else we checked](#what-else-we-checked-and-why-it-lost).

The main lesson: **new viral Steam hits get copied on Roblox within days.** *Meccha Chameleon*
launched 9 Jun 2026, and one Roblox copy had 26M visits by 27 Jun. *How to Fish* launched
20 Aug 2026 and already has a Roblox version with code guides. The better opportunities are
older proven loops that nobody has rebuilt for Roblox. As the video puts it: "there was a point
in time when there's demand for it … just no one has made a newer updated version of that core
loop."

---

## The evidence

### Outside Roblox: the loop works

- **1B+ combined plays** across the four original Duck Life Flash games (Wix Games, 2010 on).
  [1][2]
- **Duck Life 4: 250M+ plays**, per the store listing of its Sept 2025 remaster. [3][4]
- **Coolmath (where kids play at school):** Duck Life is one of its biggest series, behind only
  Run and Fireboy & Watergirl. [5]
- **Still selling in 2025–26:** *Duck Life 4 Classic* came out on mobile on 1 Sep 2025 and on
  Steam on 17 Sep 2025. *Duck Life 9: The Flock* is on Steam, iOS, Android, Switch and
  Switch 2. [4][6]
- **YouTube already uses the title format we want:** "I Made The WORLD'S FASTEST DUCK! | Duck
  Life 4". [7]
- **The train-then-race loop works outside Duck Life too:** *Umamusume: Pretty Derby* (train a
  runner, then race) peaked at **87,453 concurrent players** on Steam on 16 Jul 2025. [8]
- **Ducks are a hot theme:** *Escape from Duckov* sold **2M copies in 12 days** (Oct 2025). [9]

### On Roblox: every piece already works, just not in this combination

| Game | What it proves | Size |
|---|---|---|
| Race Clicker (2022) | Train speed, then race: works on Roblox | ~950M visits (May 2026) [10] |
| Wild Horse Islands | Raising animals you care about | 585M visits [11] |
| Animal Race | Kids play animal races even as shallow click-vs-NPC sims | 44.9M visits [12] |
| Dog Race (created 18 Jun 2026) | Same clicker loop is still growing in 2026 | 28.2M visits in ~3 months; code guides on Dexerto, PCGamesN, Beebom [13] |
| Duck Duck (Tag) | Ducks work as a Roblox theme; 300+ duck accessories | 18.7M visits in ~6 months [14] |
| Steal An Egg (25 Jul 2026) | Eggs, pets and treadmill "training" are the hottest mechanics right now | Big enough to trigger a Roblox policy change [15] |

### Is it already on Roblox?

| Existing game | What it actually is | Does it deliver Duck Life's fantasy? |
|---|---|---|
| Duck Dash (solo dev, devlog Mar 2026) [16] | A Duck Life remake by one person; no tracker or code-site coverage found | Partly, but small and early |
| Pet Race, Race Animals, Pet Racer Simulator, Animal Race [12][17] | Simulator races: click or grind for speed, then race the clock or NPCs | No: clicking isn't training, and there's no terrain strategy |
| Dog Race [13] | Same simulator loop with dogs: train, race the timer, hatch pets | No |
| Duck Duck (Tag) [14] | Hot-potato tag, ducks vs geese | No, different game |
| Duck Simulator, Raise Animals [17] | Feeding ducks; zoo tycoon | No |

Roblox kids already put tens of millions of visits into shallow animal-racing sims. **No one
has built the version with real training minigames, terrain strategy and live races against
people.** That gap is what we're building.

---

## The game

### Core fantasy

**Raise a champion.** Take a scrappy duckling, turn it into the fastest duck in the server, then
beat your friends with it.

### Core loop

```
Hatch a duck → Train (30–45 s minigames) → Race (60–90 s, vs players) → Earn Bread + trophies
      ↑                                                                          │
      └──── Upgrade: food buffs · hats · new eggs · next cup ◄───────────────────┘
```

Long-term loop: collect breeds → grow them to Champion → retire them to the Hall of Fame for a
permanent Coach bonus → start a new duckling with better odds.

### First session (under 3 minutes to the first win)

1. You spawn at the farm pond next to a wobbling egg. Tap it to hatch and name your duckling.
2. An arrow points to the Run track: one 20-second Hurdle Dash. The stat bar fills where you can
   see it.
3. An arrow points to the Pond Cup gate. First race against 3 bot ducks, tuned so you win in a
   photo finish.
4. Podium, confetti, a Bread reward, then a prompt to buy your first hat.

### Training: four minigames, one input each, mobile-first

| Stat | Minigame | Input |
|---|---|---|
| Run | **Hurdle Dash**: auto-run, jump hurdles and puddles | tap |
| Swim | **River Weave**: dodge logs, grab bubbles | steer |
| Fly | **Ring Glide**: flap through rings | tap |
| Climb | **Cliff Hop**: grab the ledge when the marker lines up | timed tap |

- Your score becomes XP for that stat. Streaks of "Perfect" give bonus XP.
- Food is a buff (+XP% for a few minutes), never an energy wall. Kids can always keep playing.
- **Duck Daycare:** your duck trains a little while you're offline, so there's a reason to come
  back.

### Races

- **Cups by level:** Pond → Farm → River → Mountain → Sky. Each cup caps stats, so new players
  never race maxed ducks.
- **Tracks mix terrain:** grass (Run), water (Swim), gaps (Fly) and cliffs (Climb). Swimmers win
  river-heavy tracks and flyers win canyon tracks. The track rotation makes you choose between a
  specialist and an all-rounder.
- **Up to 8 ducks per race.** If a gate doesn't fill in about 15 seconds, "ghost ducks" copied
  from real players take the empty lanes, so there's always a race even in a quiet server.
- **Stats decide about 80% of the result; skill decides the rest.** You get a stamina boost
  button, plus timed "Perfect Dive / Takeoff / Grab" prompts at each terrain change. This fixes
  Duck Life's biggest weakness, which is that its races play themselves.
- **The server simulates each race** (hard to exploit); clients just animate it.
- **Close finishes** trigger a slow-motion photo-finish camera. That's the clip moment.
- **Later: Chaos Cup**, a power-up mode (splash bombs, bread boosts) for pure chaos clips.

### Ducks

- **Breeds with a natural strength:** Mallard (all-rounder), Indian Runner (run; a real breed
  that runs upright), Rubber Duck (swim), Mandarin (fly), Mountain Duck (climb), and more.
- **Rarity** from Common to Mythic. **Mutations** (Golden, Rainbow, Galaxy, Giant) are mostly
  cosmetic, with a small bonus to stat caps.
- **Visible growth:** Duckling → Teen → Adult → Champion. Each stage raises stat caps and changes
  the model. Kids love watching things grow (see Grow a Garden).
- **Cosmetics:** hats, sunglasses, sweatbands, capes and trails.
- **Hall of Fame:** retiring a Champion gives a permanent Coach bonus and a statue at your pond.
  This is the prestige loop.

### Playing with friends

- **Race My Friends:** private race gates.
- **Relay Cup** (first update): three friends, and each duck takes one terrain leg. This gives
  friends a reason to specialize and play together.
- **Cheering:** spectators throw bread at the jumbotron. Racers get a tiny boost and particles.
- **Breeding** (later update): pair two adult ducks, yours or a friend's, to get an egg that
  inherits traits. This is Duck Life 3's "Evolution" idea, made social.
- **Leaderboards:** fastest time per track, a weekly cup, and a friends board.

### Monetization (within Roblox's 2026 rules)

- **Game passes:** 2× Training XP · +2 Duck Slots · VIP (gold nameplate, VIP pond) ·
  Auto-Train · +25% race rewards.
- **Developer products:** food buffs, instant evolution, instant hatch, cosmetic bundles.
- **Eggs cost Bread you earn by playing only.** An egg sold for Robux, or for any currency Robux
  can buy, counts as a Paid Random Item. That means exact odds on screen, plus PolicyService
  checks under the May 2026 policy update. [18][19]
- **Never reward watching a video or content feed.** Roblox banned that in Kids and Select
  experiences after Steal An Egg. [15]
- **Fair cups:** paid items speed up training but never raise stat caps. That keeps PvP from
  feeling pay-to-win.

### Built to be clipped

- **Clip moments:** photo finishes, rare-hatch reveals, and "0 → World's Fastest Duck" runs
  (already a proven YouTube title [7]).
- **Update rhythm:** weekly updates plus codes on Discord and X.
- **Thumbnail:** one big determined duck in a sweatband mid-sprint, rivals behind, a water splash
  and speed lines.

### IP

The Duck Life name, art, music and UI belong to Wix Games. We borrow the loop (game mechanics
generally aren't covered by copyright) and none of the assets. Every duck, name, track and piece
of music is original.

---

## MVP plan: 6 weeks, 1 scripter + 1 builder/artist

| Week | Deliverable |
|---|---|
| 1 | Duck rig and animations (idle, run, swim, flap, climb, celebrate); hub greybox; save data (ProfileStore) |
| 2 | All four training minigames playable; stats and XP; food buffs |
| 3 | Race system: server sim, 3 cups × 1 track, ghost-duck fill, podium and rewards |
| 4 | Eggs (6 breeds × 4 rarities), 3 growth stages, 20 hats, shop, mobile UI, first-session flow |
| 5 | Passes and products, leaderboards, daily rewards, codes, analytics funnels, bug bash |
| 6 | Soft launch, watch the funnels, tune; start the Relay Cup |

**Not in the MVP:** trading, breeding, relay, personal ponds, more cups.

**Timing:** six weeks from today is about 8 Nov 2026. That leaves time to tune before winter
break, and a Winter Cup event can be the first content drop.

### Go / no-go after soft launch

These are our own targets, set before launch. They are not official Roblox benchmarks.

- At least 80% of new players get through hatch → train → first race.
- Day-1 retention of 20% or more. Below about 10%, the loop isn't working; fix it before
  spending on ads.
- Average session of 12 minutes or more.
- Race gates start within 15 seconds.

### Risks

| Risk | Mitigation |
|---|---|
| Looks like "another pet race clicker" | The icon, thumbnail and first minute show minigames and terrain variety. No click-to-gain-speed anywhere. |
| Races feel passive (Duck Life's biggest flaw) | Stamina boost and timed transitions. Playtest the 80/20 stats-to-skill split. |
| Pay-to-win complaints in PvP | Cups cap stats. Paid items save time; they don't add power. |
| Empty servers early on | Ghost ducks fill the gates; races start within 15 seconds. |
| Copycats once it takes off | Ship fast, update weekly, own the "duck racing" brand. Duck Dash shows others have had the idea, so speed matters. |
| IP complaint | Everything original; no Duck Life names or assets. |

---

## What else we checked (and why it lost)

Scores are 1–5, where 5 is best. A **Roblox gap** score of 1–2 rules an idea out, because
someone has already built it.

| Idea (where it's proven) | Proof outside Roblox | Roblox gap | Kid-readable | Friends / clips | Build cost | Fits Roblox monetization | Total |
|---|---|---|---|---|---|---|---|
| **Duck Life-style train & race** (Coolmath) | 5 | 4 | 5 | 3 | 4 | 5 | **26: pick** |
| Smash Karts-style kart battle (Poki, CrazyGames) | 5 | 3 | 5 | 5 | 2 | 3 | 23: runner-up |
| Egg Roulette 1v1 (TikTok, Tonight Show) | 3 | 3 | 5 | 4 | 5 | 3 | 23: side project |
| Run 3-style tunnel runner (Coolmath #1) | 5 | 4 | 4 | 2 | 3 | 2 | 20: single-player, weak fit |
| How to Fish-style chaos fishing (Steam, Aug 2026) | 5 | 1 | 4 | 4 | 2 | 4 | Out: already on Roblox |
| Meccha Chameleon-style paint & hide (Steam, Jun 2026) | 5 | 1 | 5 | 5 | 3 | 3 | Out: 5+ Roblox copies |
| Ragdoll Archers / Bowmasters duels (CrazyGames, mobile) | 3 | 2 | 4 | 4 | 3 | 3 | Out: Archery Duels exists |

- **Smash Karts (runner-up).** It has 4M+ monthly players and is a top-10 web game [20]. On
  Roblox there's only Ro-Karts Racing and the 2012 Roblox Karts [21]. It lost for two reasons:
  the video itself calls PvP karts underserved, so expect its viewers to build them, and getting
  kart handling to feel good over Roblox networking is the hardest build on this list. It's our
  next project if Duck Derby works.
- **Egg Roulette (side project).** Players take turns cracking eggs on their heads until someone
  hits the raw one. It's the Bomb Chip formula (267.8M visits [22]) with the hottest Roblox theme
  of 2026 (eggs), and I found no dedicated Roblox game for it [23][24]. It's a good 1–2 week
  warm-up to learn publishing, but it's not a flagship: the pick-the-hidden-item genre is getting
  crowded (Squishy Dumpling Duel has 40.6M visits since 29 Apr 2026 [25]).
- **Meccha Chameleon.** 20M+ copies in two months [26], but Super Chameleon (26.4M visits by
  27 Jun 2026), PAINT OR DIE, Paint to Hide, Paint And SEEK and Paint Or Seek already
  exist [27][28].
- **How to Fish.** 260K+ concurrent players days after its 20 Aug 2026 launch [29]. A Roblox
  *How to Fish* already has code guides, *How to Really Fish* exists too, and fishing is already
  saturated on Roblox by Fisch [30].
- **TikTok challenges.** They still work (Bomb Chip, Lying Challenge, Squishy Dumpling Duel, Don't
  Overfill, Guess the Number), but YouTubers now make "We tested every viral TikTok game on
  Roblox" videos (May 2026) [31]. One of 2026's top TikTok trends, the Imposter word game,
  already has a Roblox version [32].
- **Also already on Roblox:** Overcooked → Cooking Chaos [33] · Learn to Fly → Launch a
  Penguin! [34] · Age of War → Battle Ages, War Age Tycoon [35] · Garry's Mod "Guess Who" →
  Dingus, The Secret Player [36] · Minecraft Pillars of Fortune → Pillars of Fortune [37].

## Caveats

- Visit counts are Rolimon's and RobloxGo snapshots surfaced through web search on
  27 Sep 2026, so their dates vary.
- This research environment couldn't load Roblox, Coolmath, CrazyGames or Poki pages directly,
  so on-site vote counts aren't included. Before building, search Roblox for "duck", "duck race"
  and "duck life" to make sure nothing new launched this week.
- This covers checklist item 1 only. Run the idea through the rest of Cole's checklist once parts
  2 and 3 of the series are out.

## Sources

1. [Wix Games and Duck Life (ArcGIS StoryMap)](https://storymaps.arcgis.com/stories/feb7b0fd09e343b5af49d4c3666bc6e4)
2. [Duck Life 9 FAQ, Steam Community](https://steamcommunity.com/app/2416880/discussions/0/4358998287105638892/)
3. [Duck Life 4 Classic, Google Play](https://play.google.com/store/apps/details?id=com.wixgames.dl4classic&hl=en_US)
4. [Duck Life 4 Classic, Duck Life Wiki](https://ducklife.fandom.com/wiki/Duck_Life_4_Classic)
5. [The History of Duck Life, Coolmath Games blog](https://www.coolmathgames.com/blog/the-history-of-duck-life-a-storied-series)
6. [Duck Life 9: The Flock, Duck Life Wiki](https://ducklife.fandom.com/wiki/Duck_Life_9)
7. ["I Made The WORLD'S FASTEST DUCK! | Duck Life 4", YouTube](https://www.youtube.com/watch?v=7SSEmGdpNz4)
8. [Umamusume: Pretty Derby, Steam Charts](https://steamcharts.com/app/3224770)
9. [Escape from Duckov has sold 2 million copies in two weeks, Game Developer](https://www.gamedeveloper.com/business/escape-from-duckov-has-sold-2-million-copies-in-two-weeks)
10. [Race Clicker, Rolimon's](https://www.rolimons.com/game/9285238704) · [Race Clicker codes, game.guide](https://www.game.guide/roblox-codes/race-clicker)
11. [Wild Horse Islands, Rolimon's](https://www.rolimons.com/game/6989310863)
12. [Animal Race, Rolimon's](https://www.rolimons.com/game/17360443692)
13. [Dog Race, Rolimon's](https://www.rolimons.com/game/119609933650338) · [Dog Race codes, Dexerto](https://www.dexerto.com/roblox/dog-race-codes-3390615/)
14. [Duck Duck (Tag), Rolimon's](https://www.rolimons.com/game/135486323963203) · [Duck Duck codes, Destructoid](https://www.destructoid.com/duck-duck-codes/)
15. [Roblox takes down controversial doomscrolling game, GamesRadar+](https://www.gamesradar.com/games/simulation/roblox-takes-down-controversial-doomscrolling-game-promises-to-remove-others-that-reward-watching-a-continuous-feed-of-content-as-theyre-not-appropriate-for-younger-users/)
16. ["So I made Duck Life in Roblox | Devlog", YouTube](https://www.youtube.com/watch?v=jLX674fU0_8) · [Duck Dash on Roblox](https://www.roblox.com/games/15923772852/Duck-Dash)
17. [Pet Race](https://www.roblox.com/games/14350188056/Pet-Race) · [Race Animals](https://www.roblox.com/games/96569261546148/Race-Animals) · [Pet Racer Simulator](https://www.roblox.com/games/14041207387/Pet-Racer-Simulator) · [Duck Simulator](https://www.roblox.com/games/2791730398/Duck-Simulator) · [Raise Animals](https://www.roblox.com/games/122826953758426/Raise-Animals)
18. [Paid random items policy, Roblox Creator Hub](https://create.roblox.com/docs/production/monetization/paid-random-items)
19. [Korea's loot-box rules push Roblox to disclose item odds worldwide, Tech Times](https://www.techtimes.com/articles/319148/20260626/koreas-loot-box-rules-push-roblox-disclose-item-odds-worldwide.htm)
20. [Tall Team brings its latest title to Poki (Smash Karts stats), Poki blog](https://poki.com/blog/tall-teams-launches-obby-roads-poki)
21. [Ro-Karts Racing](https://www.roblox.com/games/87428725975907/Ro-Karts-Racing) · [Roblox Karts](https://www.roblox.com/games/8006171291/Roblox-Karts)
22. [Bomb Chip, Rolimon's](https://www.rolimons.com/game/82084053899394)
23. [Egg Russian Roulette with Ryan Reynolds, The Tonight Show](https://www.nbc.com/the-tonight-show/video/egg-russian-roulette-with-ryan-reynolds/2850598)
24. ["Egg Roulette" on Roblox is only an avatar item](https://www.roblox.com/catalog/6567985015/Egg-Roulette)
25. [Squishy Dumpling Duel, Rolimon's](https://www.rolimons.com/game/75555951777956)
26. [Best-selling PC game of 2026 passes 20M on Steam, ComicBook.com](https://comicbook.com/gaming/news/steam-pc-game-best-selling-2026/)
27. [Super Chameleon, Rolimon's](https://www.rolimons.com/game/90390610040462) · [Paint to Hide!, Rolimon's](https://www.rolimons.com/game/105281019603659) · [Paint And SEEK!, Rolimon's](https://www.rolimons.com/game/78724049937437) · [Paint Or Seek, Rolimon's](https://www.rolimons.com/game/85245205758607)
28. [This free Meccha Chameleon-style game is blowing up on Roblox, Game Rant](https://gamerant.com/roblox-codes-paint-or-die-discord-server-links/)
29. [How to Fish passes 260,000 concurrent players, gHacks](https://www.ghacks.net/2026/08/24/indie-fishing-game-how-to-fish-passes-260000-concurrent-players-days-after-steam-launch/)
30. [Roblox How To Fish codes, Pro Game Guides](https://progameguides.com/roblox/roblox-how-to-fish-codes/) · [How to Really Fish](https://www.roblox.com/games/112778631702542/How-to-Really-Fish)
31. ["We Tested EVERY Viral TikTok Game on Roblox", YouTube](https://www.youtube.com/watch?v=2lgrLMVzGGo)
32. [Imposter Game on Roblox](https://www.roblox.com/games/117713240925195/Imposter-Game)
33. [Cooking Chaos](https://www.roblox.com/games/115585193927985/Cooking-Chaos)
34. [Launch a Penguin!](https://www.roblox.com/games/135973019386884/Launch-a-Penguin)
35. [Battle Ages](https://www.roblox.com/games/16570906386/Battle-Ages) · [War Age Tycoon](https://www.roblox.com/games/7663535308/War-Age-Tycoon)
36. [This new Roblox NPC game is just like Among Us (Dingus), Distractify](https://www.distractify.com/p/roblox-game-among-us-npcs) · [The Secret Player](https://www.roblox.com/games/14267234824/The-Secret-Player)
37. [Pillars of Fortune](https://www.roblox.com/games/81463261330977/Pillars-of-Fortune)
