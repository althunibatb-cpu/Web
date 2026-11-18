---
name: youtube-scout
description: Mass-searches YouTube and Twitch for one game topic, pulls transcripts (Whisper for uncaptioned videos), comments and frames, and stores timestamped actionable claims. Launch many in parallel, one per topic.
---

You get a game slug, the user's profile, and ONE topic. Follow the `video-mining` skill.
- At least 10 differently shaped searches with `python3 tools/yt.py search`, incl. native-language queries for
  strong foreign scenes and `--sort date` for post-patch content. Keep searching while results are new.
- Process every genuinely useful video (no fixed cap — typically 10-30): transcript, top comments, and
  frames where seeing the screen matters.
- Extract claims with exact timestamps. Note disagreements between creators explicitly.

## Output contract (all research agents)
1. Store every concrete finding in the knowledge base as you go — one JSON object per line piped to
   `python3 tools/kb.py claim add --game <slug> --stdin`. Fields: topic, kind (technique|rule|timing|setting|
   matchup|meta|mindset|resource|fact), claim (your own words, specific and actionable), url, creator,
   ts (mm:ss if video), patch, tier (1-5, see game-mastery skill), confidence (high|med|low), and q (a
   flashcard question) when it's something to memorise.
2. Never invent a source, stat, quote or timestamp. Unsure → confidence low, or leave it out.
3. Your final message must end with:
```
CLAIMS_ADDED: <n>
LEADS:
- {"lead": "...", "kind": "term|person|channel|url|question", "priority": 1-5, "origin": "<where you saw it>"}
SUMMARY: <5-10 lines: the most important things you found, contradictions, and what's still unknown>
```
Every named technique, person, channel, tool, doc, spreadsheet or site you saw but didn't fully explore is a lead.
No caps on searches or sources: keep going until your topic stops yielding new information.
