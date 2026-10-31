#!/usr/bin/env bash
# PreToolUse hook for Bash. Usage: bash-guard.sh [ALLOW_REGEX [DENY_REGEX]]
#   from an agent's frontmatter, with that agent's path-guard regexes: rules 1-5
#   from .claude/settings.json, without args (the main session):        rules 2-5
# Branching (ADR 0001): develop (integration, default) and main (released) are the long-lived branches.
# feature/* and chore/* PR into develop; hotfix/* PRs into main. Every merge is a regular merge by the user.
# Exit 2 blocks the command and shows the reason to the model.
#
# 1. Scope: every write-shaped target (>, >>, tee, sed -i, cp/mv/install dest, touch/rm/mkdir,
#    git checkout -- / git restore / git rm) is put through scope-lib's PO-owned -> DENY -> ALLOW.
# 2. Stale refs: git merge/rebase/diff/log/merge-base/cherry-pick/reset against a bare main or develop.
#    Local main/develop are stale by design; compare against origin/<branch> after git fetch.
# 3. Long-lived branches: git merge while ON main/develop, or git push to main/develop. PRs only.
#    Tag pushes (git push origin vX.Y.Z) are not refused; tagging a release is the user's step.
# 4. git add -A|--all|. and git push --force|-f|--force-with-lease.
# 5. Staging a secret or signing file: .env* (not .env.example), *.jks/.keystore/.p8/.p12/.mobileprovision/.pem,
#    google-services.json, GoogleService-Info.plist. Secrets never enter git (.claude/rules/privacy.md).
set -u
set -f   # no glob expansion while word-splitting the command's segments
allow=${1:-}; deny=${2:-}
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0
root=${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}
GUARD_AGENT=$(printf '%s' "$input" | jq -r '.agent_type // empty' | tr -cd 'A-Za-z0-9_-')
export GUARD_AGENT
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty'); cwd=${cwd:-$root}
refuse() { echo "bash-guard: $1" >&2; exit 2; }

# The segments of a compound command, one per line, heredoc bodies dropped, leading VAR= stripped.
# The split is quote-aware: a | or ; inside a quoted sed script or commit message does not end the
# segment (it used to, and `sed -i '' 's/a | b/c/' file` then escaped rule 1). A newline inside
# quotes becomes a space so each segment stays on one line.
segments=$(python3 -I - "$cmd" <<'PY'
import re, sys
lines = sys.argv[1].split("\n"); out = []; i = 0
while i < len(lines):
    l = lines[i]; out.append(l)
    m = re.search(r"<<-?\s*['\"]?([A-Za-z_][A-Za-z0-9_]*)['\"]?", l)
    if m:
        term = m.group(1); i += 1
        while i < len(lines) and lines[i].strip() != term: i += 1
    i += 1
text = "\n".join(out); segs = []; buf = []; q = None; k = 0
while k < len(text):
    ch = text[k]
    if q == "'":
        buf.append(" " if ch == "\n" else ch)
        if ch == "'": q = None
    elif ch == "\\" and k + 1 < len(text):
        buf.append(ch + text[k + 1]); k += 1
    elif q == '"':
        buf.append(" " if ch == "\n" else ch)
        if ch == '"': q = None
    elif ch in "'\"":
        q = ch; buf.append(ch)
    elif ch in ";\n" or (ch == "|") or (ch == "&" and text[k + 1:k + 2] == "&"):
        segs.append("".join(buf)); buf = []
        if text[k + 1:k + 2] in ("|", "&") and ch in "|&": k += 1
    else:
        buf.append(ch)
    k += 1
segs.append("".join(buf))
for s in segs:
    s = s.strip()
    s = re.sub(r"^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+", "", s)
    if s: print(s)
PY
)

while IFS= read -r seg; do
  [ -z "$seg" ] && continue
  # shellcheck disable=SC2086
  set -- $seg
  [ "$(basename "$1")" = git ] || continue
  sub=${2:-}; shift 2 2>/dev/null || continue
  case "$sub" in
    merge|rebase|diff|log|merge-base|cherry-pick|reset)
      for t in "$@"; do
        t=$(printf '%s' "$t" | sed -E 's#origin/(main|develop)##g')
        b=$(printf '%s' "$t" | grep -Eo '(^|[^A-Za-z0-9_/-])(main|develop)([^A-Za-z0-9_/-]|$)' | head -1 | tr -cd 'a-z')
        [ -n "$b" ] && refuse "'git $sub' against local $b — it is stale by design. Run 'git fetch origin' and use origin/$b."
      done
      if [ "$sub" = merge ]; then
        cur=$(git -C "$cwd" branch --show-current 2>/dev/null || true)
        case "$cur" in main|develop) refuse "a local merge into $cur. Push the branch and open a PR into $cur; the merge is the user's." ;; esac
      fi ;;
    add)
      for t in "$@"; do
        case "$t" in -A|--all|.) refuse "'git add $t'. Stage explicit paths only; never CLAUDE.md, .claude/** or another agent's files." ;; esac
        # 5. secrets and signing material never enter git (.env.example is the one allowed .env file)
        if printf '%s' "$t" | grep -Eq '(^|/)[.]env([.][A-Za-z0-9_-]+)?$|[.](jks|keystore|p8|p12|mobileprovision|pem)$|(^|/)(google-services[.]json|GoogleService-Info[.]plist)$' \
           && ! printf '%s' "$t" | grep -Eq '(^|/)[.]env[.]example$'; then
          refuse "staging a secret or signing file ($t). Secrets never enter git (.claude/rules/privacy.md); keep it in .gitignore."
        fi
      done ;;
    push)
      cur=$(git -C "$cwd" branch --show-current 2>/dev/null || true)
      for t in "$@"; do
        case "$t" in
          -f|--force|--force-with-lease*) refuse "'git push $t'. Force pushes are not allowed." ;;
          main|develop|*:main|*:develop|*:refs/heads/main|*:refs/heads/develop)
            refuse "a push to $t. PRs only — push the feature branch and open a PR into develop (hotfix/*: into main)." ;;
        esac
      done
      case "$cur" in main|develop) refuse "a push from $cur. PRs only — work on a feature/*, chore/* or hotfix/* branch." ;; esac ;;
  esac
done <<< "$segments"

# 1. scope — only when this hook carries an agent's regexes
[ -z "$allow" ] && exit 0
# shellcheck source=scope-lib.sh
. "$(dirname "$0")/scope-lib.sh"
GUARD_NAME=bash-guard
targets=$(python3 -I - "$cwd" <<'PY' "$segments"
import os, re, shlex, sys
cwd = sys.argv[1]; segs = sys.argv[2].split("\n"); out = set()
RED = re.compile(r"^(?:\d*|&)>>?(.*)$")
EXT = (".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".sql", ".md", ".css", ".yml", ".yaml", ".sh", ".html", ".txt", ".csv", ".xml", ".env")
cur = cwd
for s in segs:
    try: toks = shlex.split(s)
    except ValueError: toks = s.split()
    if not toks: continue
    c = os.path.basename(toks[0]); args = toks[1:]
    if c == "cd" and args and not args[0].startswith("$"):
        cur = os.path.normpath(os.path.join(cur, args[0])); continue
    for j, t in enumerate(toks):
        m = RED.match(t)
        if m:
            tgt = m.group(1) or (toks[j + 1] if j + 1 < len(toks) else "")
            if tgt and not tgt.startswith("&"): out.add((cur, tgt))
    nonflag = [a for a in args if not a.startswith("-") and not RED.match(a) and a != ">"]
    if c == "tee": out.update((cur, a) for a in nonflag)
    elif c == "sed" and any(a == "-i" or a.startswith("-i") for a in args):
        out.update((cur, a) for a in nonflag if a.endswith(EXT) or os.path.isfile(os.path.join(cur, a)))
    elif c in ("cp", "mv", "install") and len(nonflag) >= 2: out.add((cur, nonflag[-1]))
    elif c in ("touch", "rm", "truncate", "ln"): out.update((cur, a) for a in nonflag)
    elif c in ("mkdir", "rmdir"): out.update((cur, a.rstrip("/") + "/") for a in nonflag)  # directories keep a trailing slash for the scope regexes
    elif c == "git" and args:
        sub = args[0]; rest = args[1:]
        if sub in ("checkout", "restore", "rm"):
            after = rest[rest.index("--") + 1:] if "--" in rest else (rest if sub != "checkout" else [])
            out.update((cur, a) for a in after if not a.startswith("-"))
for d, t in sorted(out):
    if t in ("-", "/dev/null", "/dev/stdout", "/dev/stderr") or t.startswith("$") or "*" in t or t.startswith("&"): continue
    full = os.path.normpath(t if os.path.isabs(t) else os.path.join(d, t))
    print(full + "/" if t.endswith("/") else full)
PY
)
while IFS= read -r p; do [ -n "$p" ] && scope_check "$p" "$root" "$allow" "$deny"; done <<< "$targets"
exit 0
