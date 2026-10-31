#!/usr/bin/env bash
# Stop hook for the reviewers (converted to SubagentStop). Usage: review-format-check.sh 'review-1' | 'review-2'
# The review file this run wrote must carry the handoff contract —
# a severity per finding row (B/S/N), an owner, and a final REVIEW PASSED / REVIEW FAILED line —
# or the reviewer is sent back once to complete it (stop_hook_active guards the loop).
# why: orchestrator gates parse these signals; a review without them stalls the sprint. expires: when reviews are emitted as JSON (D30).
set -u
kind=${1:?review-1 or review-2}
input=$(cat 2>/dev/null || true)
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0
root=${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}; root=${root:-$(pwd)}
cd "$root" 2>/dev/null || exit 0
# shellcheck source=base-ref.sh
. "$(dirname "$0")/base-ref.sh"
# the review file written most recently (uncommitted or committed on this branch)
f=$( { git status --short --untracked-files=all 2>/dev/null | awk '{print $2}'; git log --name-only --pretty=format: "$(base_ref)"..HEAD 2>/dev/null; } \
     | grep -E "^docs/[^/]+/${kind}(-recheck|-followup(-[0-9]+)?)?[.]md$" | head -1 )
[ -z "$f" ] || [ ! -f "$f" ] && exit 0
problems=()
grep -qE '^(\*\*)?REVIEW (PASSED|FAILED)' "$f" || problems+=("no final 'REVIEW PASSED' / 'REVIEW FAILED' line")
if grep -qE '^\| *\*?\*?(B|S|N)[0-9]*\*?\*? *\|' "$f"; then
  rows=$(grep -cE '^\| *\*?\*?(B|S|N)[0-9]*\*?\*? *\|' "$f")
  owned=$(grep -E '^\| *\*?\*?(B|S|N)[0-9]*\*?\*? *\|' "$f" | grep -ciE 'planner|designer|data-coder|frontend-coder|tester|documenter|orchestrator|user|PO')
  [ "$owned" -lt "$rows" ] && problems+=("$((rows-owned)) finding row(s) without an owner (planner / designer / data-coder / frontend-coder / tester / documenter / orchestrator / user)")
elif grep -qiE 'REVIEW FAILED' "$f"; then
  problems+=("REVIEW FAILED but no finding rows of the form '| B1 | file:line | defect | owner | fixed looks like |'")
fi
[ ${#problems[@]} -eq 0 ] && exit 0
{ echo "review-format-check: $f is missing the handoff contract:"; printf '  - %s\n' "${problems[@]}"; echo "Complete it, then finish."; } >&2
exit 2
