---
description: Refresh the meta for the current patch and flag outdated notes
argument-hint: <game>
---

For $ARGUMENTS: `meta-analyst` → if the patch changed, archive the old meta file, then search the KB and
notes for everything affected (`kb.py claim search`), mark claims `outdated` or re-verify with `fact-checker`,
add `> ⚠️ Possibly outdated since patch X` to affected files. Reply: what changed, what it means for my main/rank,
practice-plan changes.
