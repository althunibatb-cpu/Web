---
name: practice-plan
description: Turn researched game knowledge into a deliberate-practice training plan, run VOD/replay reviews, and track progress over time. Use when the user asks for a practice routine, training schedule, drills, help reviewing their own gameplay, or wants to know why they're stuck at a rank.
---

# Practice Plan & Review

Knowledge doesn't make anyone a top player — structured practice does. Build plans on these principles:

- **Deliberate practice:** one narrow focus per session, clear success criteria, immediate feedback.
- **80/20 by rank:** at low/mid ranks, fundamentals beat flashy tech. Pick the 1–3 weaknesses that lose
  the most games, not the coolest techniques.
- **Isolate → integrate:** drill a skill in training mode / aim trainer / custom game, then apply it in
  real matches with that single focus.
- **Review loop:** play → review own replay → compare to a pro doing the same thing → adjust.
- **Sustainable volume:** respect the hours in `profile.md`; include warm-up, breaks, and rest days.
  Tilt and fatigue are performance problems — stop-loss rules (e.g. stop after 2 losses in a row) are part
  of the plan.

- **Measure everything:** each focus gets a number (accuracy %, combo success /10, CS@10, ADR, deaths
  before 15, puzzle rating…). Use `replay-analysis` to pull real stats where an API or replay exists.
- **Memorise with spaced repetition:** frame data, timings, matchup rules and spawn timers go to
  `games/<slug>/flashcards.csv` (`python3 tools/kb.py anki <slug>`) for Anki; `/quiz` drills them in chat.
- **Copy the best:** each focus links to a pro doing it (KB timestamp or frame grab) as the model to imitate.

## practice-plan.md template

```markdown
# Practice plan — <game> — weeks of <date>
**Goal:** <rank/result by date>   **Hours/week:** <n>   **Current focus:** <1–3 skills>

## Daily session (<length>)
1. Warm-up (10 min): <specific drill>
2. Focused drill (20–30 min): <drill> — success = <measurable criterion>
3. Applied games (n games): focus ONLY on <skill>; after each game rate it 1–5
4. Review (15 min): one replay, look for <specific moment>; compare to <pro / video timestamp>

## Weekly
- Mon/Wed/Fri: <focus A>   Tue/Thu: <focus B>   Weekend: longer review + new tech
- End of week: update progress-log.md, decide keep / swap focus

## Exit criteria to move on
- <e.g. "hits the combo 9/10 in training and 3+ times per match">
```

## Reviewing the user's own gameplay
If the user gives a replay, VOD link, screenshots, stats page or match history:
1. Get the facts (stats, timeline, transcript/description if a video).
2. Find the 3 biggest *repeatable* mistakes — patterns, not one-off misplays.
3. For each: what happened, what a top player does instead (link to the relevant knowledge-base file or
   pro video timestamp), and a drill.
4. Log it in `progress-log.md` and adjust `practice-plan.md`.
