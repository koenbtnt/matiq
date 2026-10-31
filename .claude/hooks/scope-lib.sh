#!/usr/bin/env bash
# Shared by path-guard.sh (Write|Edit|NotebookEdit) and bash-guard.sh (Bash). Source it, never run it.
#
# relpath ABS ROOT  -> the path the scope regexes are matched against:
#   - inside the main checkout: relative to ROOT
#   - inside any git worktree (a dir with a .git entry that is not ROOT, e.g. .claude/worktrees/<wt>/
#     or a scratchpad worktree): relative to THAT worktree's root, so scope rules follow the agent
#   - anywhere else: unchanged (absolute)
relpath() {
  local p=$1 root=$2 rel=$1 d
  d=$(dirname "$p")
  while [ "$d" != "/" ] && [ "$d" != "." ]; do
    if [ -e "$d/.git" ]; then
      if [ "$d" != "$root" ]; then printf '%s' "${p#"$d"/}"; return; fi
      break
    fi
    d=$(dirname "$d")
  done
  if [ -n "$root" ]; then case "$p" in "$root"/*) rel=${p#"$root"/} ;; esac; fi
  case "$rel" in .claude/worktrees/*/*) rel=${rel#.claude/worktrees/*/} ;; esac
  printf '%s' "$rel"
}

# scope_check ABS ROOT ALLOW DENY -> exit 2 with the reason on stderr, or return 0.
# Order: PO-owned -> DENY -> ALLOW. A scratch path (/tmp, /private/tmp) that is not inside a worktree
# skips only the ALLOW test; it never skips PO-owned or DENY.
scope_check() {
  local p=$1 root=$2 allow=$3 deny=$4 rel scratch=0 who=${GUARD_NAME:-path-guard}
  rel=$(relpath "$p" "$root")
  case "$rel" in /private/tmp/*|/tmp/*) scratch=1 ;; esac
  # A subagent with `memory: project` owns .claude/agent-memory/<its own name>/ and nothing else under .claude/
  if [ -n "${GUARD_AGENT:-}" ] && printf '%s' "$rel" | grep -Eq "^[.]claude/agent-memory/${GUARD_AGENT}/"; then return 0; fi
  if printf '%s' "$rel" | grep -Eq '^([.]claude/|CLAUDE[.]md$)'; then
    echo "$who: '$rel' is PO-owned (.claude/, CLAUDE.md). No agent edits it." >&2; exit 2
  fi
  if [ -n "$deny" ] && printf '%s' "$rel" | grep -Eq "$deny"; then
    echo "$who: '$rel' is outside this agent's edit scope (deny $deny). Delegate or report it." >&2; exit 2
  fi
  [ "$scratch" = 1 ] && return 0
  if [ -n "$allow" ] && ! printf '%s' "$rel" | grep -Eq "$allow"; then
    echo "$who: '$rel' is outside this agent's edit scope (allow $allow). Delegate or report it." >&2; exit 2
  fi
  return 0
}
