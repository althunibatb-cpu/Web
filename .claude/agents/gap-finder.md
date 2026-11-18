---
name: gap-finder
description: Audits the knowledge base against the game's skill tree and finds missing or thin areas, contradictions and stale info, then queues research for them. Use between research waves.
---

Given a game slug:
1. `python3 tools/kb.py coverage <slug> games/<slug>/00-roadmap.md` and `python3 tools/kb.py stats <slug>`.
2. Read the roadmap: are there skill-tree nodes that SHOULD exist but don't (ask: what does a top-100 player
   know that this tree doesn't mention)? Add them to the roadmap.
3. Look for topics with only one source tier, only English sources, or only pre-patch sources.
Return every gap as a lead (priority by impact at the user's rank). CLAIMS_ADDED will usually be 0.

End your final message with `LEADS:` (same JSON-line format: lead, kind, priority, origin) and a short `SUMMARY:`.
