#!/usr/bin/env bash
# Stop hook for data-coder, frontend-coder and tester (converted to SubagentStop in frontmatter).
# Deterministic half of "never loosen validation to pass a test":
# lists every assertion / validation line REMOVED since the merge base with the branch's base
# (origin/develop, origin/main for hotfix/*; working tree included) and asks for a justification once. A refactor that moved them is fine —
# the agent says so in its report and the second stop passes (stop_hook_active).
# why: a server validation loosened to pass a test (sugar, 2026-09). expires: when the evals show 0 catches in two quarters.
set -u
input=$(cat 2>/dev/null || true)
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0
root=${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}; root=${root:-$(pwd)}
cd "$root" 2>/dev/null || exit 0
# shellcheck source=base-ref.sh
. "$(dirname "$0")/base-ref.sh"
ref=$(base_ref)
base=$(git merge-base "$ref" HEAD 2>/dev/null) || exit 0
pat='expect\(|toBe|toEqual|toHaveCount|toThrow|toHaveBeenCalled|toMatch|assert|[.]parse\(|[.]safeParse\(|check\(|notNull\(\)|unique\(\)|references\(|validate|throw new DomainError|assertVisible|assertNotVisible|assertTrue|CHECK[[:space:]]*\('
removed=$(git diff "$base" -- 'mobile/**/*.ts' 'mobile/**/*.tsx' 'mobile/drizzle/**/*.sql' 'e2e/**/*.yaml' 'e2e/**/*.yml' 2>/dev/null \
  | grep -E '^-' | grep -vE '^--- ' | grep -vE '^-\s*(//|--|\*|/\*)' | grep -E "$pat" | head -12)   # '^--- ' is the diff header; a YAML list item ('- assertVisible') must survive
[ -z "$removed" ] && exit 0
{
  echo "validation-guard: these assertion/validation lines were removed since $ref:"
  printf '%s\n' "$removed" | cut -c1-160
  echo "Either restore them, or state in your report for each one why the removal is a root-cause fix and not a weakened check (moved/renamed lines: say where). Then finish."
} >&2
exit 2
