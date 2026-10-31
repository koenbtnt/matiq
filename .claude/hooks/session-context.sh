#!/usr/bin/env bash
# SessionStart hook (startup | resume | compact). Prints the working state as context so a fresh or
# compacted session starts from facts, not from memory: fetched branch state, last commits, dirty
# files, the active sprint's `## Current state`, open carry-over rows, the last compaction pointers.
# Output ≤ ~60 lines; failures never block the session.
set -u
input=$(cat 2>/dev/null || true)
src=$(printf '%s' "$input" | jq -r '.source // "startup"' 2>/dev/null || echo startup)
root=${CLAUDE_PROJECT_DIR:-$(pwd)}
cd "$root" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
# shellcheck source=base-ref.sh
. "$(dirname "$0")/base-ref.sh"
base=$(base_ref)

echo "## Session context ($src, $(date -u +%Y-%m-%dT%H:%MZ), hook)"
if GIT_SSH_COMMAND='ssh -o ConnectTimeout=5 -o BatchMode=yes' GIT_TERMINAL_PROMPT=0 git fetch -q origin 2>/dev/null; then
  fetched="origin fetched"
else
  fetched="origin NOT fetched (offline?) — local main/develop may be stale"
fi
echo "branch: $(git status -sb 2>/dev/null | head -1 | sed 's/^## //') · $fetched"
# The branch flow (ADR 0001), so no session has to remember it.
case "$(git branch --show-current 2>/dev/null)" in
  main|develop) echo "flow: long-lived branch — cut feature/* or chore/* from origin/develop, hotfix/* from origin/main (ADR 0001)" ;;
  *) echo "flow: base $base · PRs into develop; release = the user's develop→main PR + tag vX.Y.Z; hotfix/* PRs into main, then a back-merge PR main→develop" ;;
esac
git log --oneline -5 2>/dev/null | sed 's/^/  /'
dirty=$(git status --short 2>/dev/null | head -15)
[ -n "$dirty" ] && { echo "uncommitted:"; printf '%s\n' "$dirty" | sed 's/^/  /'; }

# The sprint this branch works on: docs/<slug>/progress.md for a feature/<slug> branch, else the
# newest progress.md the branch itself touched. Never another sprint's file by mtime.
br=$(git branch --show-current 2>/dev/null || true)
p=""
case "$br" in feature/*) [ -f "docs/${br#feature/}/progress.md" ] && p="docs/${br#feature/}/progress.md" ;; esac
[ -z "$p" ] && p=$(git log --name-only --pretty=format: "$base"..HEAD -- 'docs/*/progress.md' 2>/dev/null | grep -m1 . || true)
if [ -n "$p" ] && [ -f "$p" ]; then
  echo "$p — ## Current state:"
  awk '/^## Current state/{f=1;next} /^## /{if(f)exit} f' "$p" | grep -v '^[[:space:]]*$' | head -15 | sed 's/^/  /'
else
  echo "no sprint progress.md on this branch"
fi

if [ -f docs/carry-over.md ]; then
  rows=$(grep -E '^\| [0-9]+ \|' docs/carry-over.md | grep -viE '\| *done *\|?[[:space:]]*$' | head -10)
  [ -n "$rows" ] && { echo "docs/carry-over.md — open rows:"; printf '%s\n' "$rows" | cut -c1-160 | sed 's/^/  /'; }
fi

[ -f .claude/session-log.md ] && { echo "recent compactions/kills (.claude/session-log.md):"; tail -3 .claude/session-log.md | sed 's/^/  /'; }
exit 0
