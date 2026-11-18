---
description: Recursive deep research on a game until the knowledge is saturated, then build the knowledge base and training plan
argument-hint: <game> [rank] [main/role] [quick|deep|max]
---

Run the `game-mastery` skill's full pipeline for: $ARGUMENTS  (depth defaults to max = until saturated)

1. Profile (ask only for what's missing) → full skill tree in `00-roadmap.md` → queue every node as a lead.
2. `pro-scout` → queue every pro/coach/channel/community.
3. Research waves: `kb.py lead next <slug> --n 8`, dispatch to the right agents **in parallel in a single
   message**, queue returned leads, mark leads done with yield. `gap-finder` + `meta-analyst` every 2nd wave.
   Check `kb.py saturation` after each wave; one-line progress update to me each wave.
4. Parallel `fact-checker`s per topic → `kb.py claim dupes`.
5. Write all knowledge-base files from the KB, `practice-plan.md` (practice-plan skill), and `kb.py anki`.
6. Final reply: KB stats, top 3-5 fixes for my rank, today's session, file paths.
