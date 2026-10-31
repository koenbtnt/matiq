#!/usr/bin/env bash
# PreCompact hook: append one pointer line (time, trigger, branch@sha, transcript path) to the
# gitignored .claude/session-log.md, so a session killed mid-compaction leaves a trail the next
# SessionStart prints. Never blocks compaction.
set -u
input=$(cat 2>/dev/null || true)
root=${CLAUDE_PROJECT_DIR:-$(pwd)}
t=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)
trig=$(printf '%s' "$input" | jq -r '.trigger // "auto"' 2>/dev/null || echo auto)
sha=$(git -C "$root" rev-parse --short HEAD 2>/dev/null || echo '?')
br=$(git -C "$root" branch --show-current 2>/dev/null || echo '?')
mkdir -p "$root/.claude" 2>/dev/null
printf -- '- %s compact(%s) %s@%s %s\n' "$(date -u +%Y-%m-%dT%H:%MZ)" "$trig" "$br" "$sha" "$t" >> "$root/.claude/session-log.md"
exit 0
