#!/usr/bin/env bash
# PreToolUse hook for Write|Edit|NotebookEdit, referenced from .claude/agents/*.md frontmatter.
# Usage: path-guard.sh ALLOW_REGEX [DENY_REGEX]   (ERE, matched against the project-relative path)
# Exit 2 blocks the call and shows the message to the agent.
# A path inside a git worktree (.claude/worktrees/<wt>/ or a scratchpad one) is scoped against that
# worktree's root; a scratch file outside any worktree skips only the ALLOW test. Bash writes
# (redirections, tee, sed -i, cp/mv, git checkout --) go through the sibling bash-guard.sh.
set -u
allow=${1:?allow regex required}
deny=${2:-}
input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -z "$path" ] && exit 0
root=${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}
GUARD_AGENT=$(printf '%s' "$input" | jq -r '.agent_type // empty' | tr -cd 'A-Za-z0-9_-')
export GUARD_AGENT
# shellcheck source=scope-lib.sh
. "$(dirname "$0")/scope-lib.sh"
scope_check "$path" "$root" "$allow" "$deny"
exit 0
