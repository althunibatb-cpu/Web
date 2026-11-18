#!/usr/bin/env bash
# Runs /meta-update headlessly for each game. Schedule it, e.g. weekly with cron:
#   crontab -e  →  0 18 * * 3  cd ~/game-mastery && bash tools/meta_watch.sh >> research/meta_watch.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
for g in games/*/; do
  slug=$(basename "$g")
  echo "== $(date) meta-update $slug"
  claude -p "/meta-update $slug" || echo "failed: $slug"
done
