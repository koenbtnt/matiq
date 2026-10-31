#!/usr/bin/env bash
# Exit-code tests for .claude/hooks/*.sh. Run: npm run test:hooks   (CI job `claude`; needs bash, jq, python3, git)
# Each case feeds a hook the JSON Claude Code sends and asserts exit 0 (pass) or 2 (refuse). Ported from cadence's
# scripts/claude/hooks.test.sh on 2026-10-31 and adapted to matiq: data-coder instead of backend-coder, Maestro
# instead of Playwright, bash-guard rule 5 (secret and signing files), validation-guard patterns for TypeScript,
# Drizzle and Maestro. Every secret-looking path below is fake and exists only to be refused.
set -u
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
HOOKS=$ROOT/.claude/hooks
export CLAUDE_PROJECT_DIR=$ROOT
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
fail=0; n=0

# fixtures: a scratch worktree (a .git file marks its root), a repo on main, on develop, on a feature and a hotfix branch
mkdir -p "$TMP/scratch-wt/mobile/app" "$TMP/scratch-wt/e2e" "$TMP/scratch-wt/docs/x" && : > "$TMP/scratch-wt/.git"
for b in main develop feature/x hotfix/x; do
  r="$TMP/repo-${b%%/*}"; mkdir -p "$r" && git -C "$r" init -q -b "$b" && git -C "$r" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
done

json_path()  { jq -cn --arg p "$1" --arg cwd "$ROOT" '{tool_input:{file_path:$p},cwd:$cwd}'; }
json_cmd()   { jq -cn --arg c "$1" --arg cwd "${2:-$ROOT}" '{tool_input:{command:$c},cwd:$cwd}'; }
json_agent() { jq -cn --arg p "$1" --arg a "$2" --arg cwd "$ROOT" '{tool_input:{file_path:$p},cwd:$cwd,agent_type:$a}'; }

check() { # check EXPECTED NAME HOOK ARGS... <<< json
  local want=$1 name=$2 hook=$3; shift 3
  local got out
  out=$("$HOOKS/$hook" "$@" 2>&1); got=$?
  n=$((n+1))
  if [ "$got" = "$want" ]; then printf 'ok   %s\n' "$name"
  else fail=$((fail+1)); printf 'FAIL %s: expected %s got %s\n     %s\n' "$name" "$want" "$got" "$out"; fi
}

# The regexes exactly as the agent frontmatter carries them (.claude/agents/*.md). Update both together.
DC_ALLOW='^(mobile/src/(db|domain|repositories|types)/|mobile/drizzle/|mobile/drizzle[.]config[.]ts$|mobile/(package(-lock)?[.]json|babel[.]config[.]js|metro[.]config[.]js|jest[.]config[.]js|jest[.]setup[.]ts|tsconfig[.]json)$|docs/[^/]+/(data-contracts[.]md|verify[.](md|json))$|docs/stack-notes[.]md$)'
DC_DENY='^mobile/drizzle/.*(snapshot|_journal)[.]json$'
FE_ALLOW='^(mobile/|scripts/(sync-design-tokens|check-token-adherence)[.]mjs$|docs/[^/]+/verify[.](md|json)$|docs/stack-notes[.]md$|[.]github/workflows/)'
FE_DENY='^(mobile/src/(db|domain|repositories)/|mobile/drizzle/|mobile/drizzle[.]config[.]ts$|mobile/src/theme/tokens[.]ts$|e2e/|design-system/)'
DOCS_ALLOW='^docs/'                                                           # planner
DESIGN_ALLOW='^(docs/|design-system/(tokens[.]json|components[.]md|RULES[.]md)$)'  # designer
ORCH_ALLOW='^(docs/|README[.]md$)'                                            # orchestrator
R1_ALLOW='^docs/[^/]+/review-1(-recheck|-followup(-[0-9]+)?)?[.]md$'          # reviewer-design
R2_ALLOW='^docs/[^/]+/review-2(-recheck|-followup(-[0-9]+)?)?[.]md$'          # reviewer-code
DOC_ALLOW='^(docs/(architecture|adr|data-model|requirements)/|docs/[^/]+/docs-report[.](md|json)$|docs/stack-notes[.]md$|scripts/docs/|README[.]md$)'  # documenter
TEST_ALLOW='^(e2e/|docs/[^/]+/(test-report[.]md|verify[.](md|json))$|docs/stack-notes[.]md$)'  # tester

echo "# path-guard: scopes"
check 0 "frontend: screen in scope"               path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/app/sessions/index.tsx")"
check 0 "frontend: component in scope"            path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/src/components/Chip.tsx")"
check 0 "frontend: i18n resource in scope"        path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/src/i18n/en.json")"
check 0 "frontend: token sync script in scope"    path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/scripts/sync-design-tokens.mjs")"
check 0 "frontend: shared package.json"           path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/package.json")"
check 2 "frontend: generated tokens.ts denied"    path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/src/theme/tokens.ts")"
check 2 "frontend: design-system denied"          path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/design-system/tokens.json")"
check 2 "frontend: e2e denied"                    path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/e2e/maestro/flows/features/x.yaml")"
check 2 "frontend: db layer denied"               path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/src/db/schema/sessions.ts")"
check 2 "frontend: repositories denied"           path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/src/repositories/sessions.ts")"
check 2 "frontend: migrations denied"             path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/mobile/drizzle/0001_x.sql")"
check 0 "data-coder: schema in scope"             path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/src/db/schema/sessions.ts")"
check 0 "data-coder: domain in scope"             path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/src/domain/progression/score.ts")"
check 0 "data-coder: repository test in scope"    path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/src/repositories/__tests__/sessions.test.ts")"
check 0 "data-coder: generated migration sql"     path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/drizzle/0001_sessions.sql")"
check 0 "data-coder: descriptions.json"           path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/src/db/schema/descriptions.json")"
check 0 "data-coder: data-contracts.md"           path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/docs/s/data-contracts.md")"
check 0 "data-coder: verify.json"                 path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/docs/s/verify.json")"
check 0 "data-coder: shared package.json"         path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/package.json")"
check 2 "data-coder: snapshot is drizzle-kit's"   path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/drizzle/meta/0001_snapshot.json")"
check 2 "data-coder: journal is drizzle-kit's"    path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/drizzle/meta/_journal.json")"
check 2 "data-coder: screen denied"               path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/app/index.tsx")"
check 2 "data-coder: component denied"            path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/mobile/src/components/Chip.tsx")"
check 2 "data-coder: e2e denied"                  path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/e2e/maestro/flows/x.yaml")"
check 2 "data-coder: sprint plan denied"          path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_path "$ROOT/docs/s/plan.md")"
check 0 "tester: smoke flow"                      path-guard.sh "$TEST_ALLOW"           <<< "$(json_path "$ROOT/e2e/maestro/flows/smoke/app-launches.yaml")"
check 0 "tester: maestro workspace config"        path-guard.sh "$TEST_ALLOW"           <<< "$(json_path "$ROOT/e2e/maestro/config.yaml")"
check 0 "tester: test-report.md"                  path-guard.sh "$TEST_ALLOW"           <<< "$(json_path "$ROOT/docs/s/test-report.md")"
check 0 "tester: verify.json"                     path-guard.sh "$TEST_ALLOW"           <<< "$(json_path "$ROOT/docs/s/verify.json")"
check 2 "tester: root package.json"               path-guard.sh "$TEST_ALLOW"           <<< "$(json_path "$ROOT/package.json")"
check 2 "tester: product code"                    path-guard.sh "$TEST_ALLOW"           <<< "$(json_path "$ROOT/mobile/app/x.tsx")"
check 0 "designer: design.md"                     path-guard.sh "$DESIGN_ALLOW"         <<< "$(json_path "$ROOT/docs/s/design.md")"
check 0 "designer: tokens.json (intake)"          path-guard.sh "$DESIGN_ALLOW"         <<< "$(json_path "$ROOT/design-system/tokens.json")"
check 0 "designer: RULES.md (intake)"             path-guard.sh "$DESIGN_ALLOW"         <<< "$(json_path "$ROOT/design-system/RULES.md")"
check 2 "designer: the artifact is the user's"    path-guard.sh "$DESIGN_ALLOW"         <<< "$(json_path "$ROOT/design-system/artifact/matiq-design.html")"
check 2 "designer: generated tokens.ts"           path-guard.sh "$DESIGN_ALLOW"         <<< "$(json_path "$ROOT/mobile/src/theme/tokens.ts")"
check 0 "orchestrator: README"                    path-guard.sh "$ORCH_ALLOW"           <<< "$(json_path "$ROOT/README.md")"
check 2 "orchestrator: code"                      path-guard.sh "$ORCH_ALLOW"           <<< "$(json_path "$ROOT/mobile/app/x.tsx")"
check 2 "planner: README is not docs/"            path-guard.sh "$DOCS_ALLOW"           <<< "$(json_path "$ROOT/README.md")"
check 2 "planner: design-system is not docs/"     path-guard.sh "$DOCS_ALLOW"           <<< "$(json_path "$ROOT/design-system/tokens.json")"
check 2 "PO-owned .claude"                        path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/.claude/agents/x.md")"
check 2 "PO-owned CLAUDE.md"                      path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/CLAUDE.md")"
check 0 "no file_path: pass"                      path-guard.sh "$DOCS_ALLOW"           <<< '{"tool_input":{}}'

echo "# path-guard: worktrees and scratch paths"
check 0 "worktree under .claude: in scope"        path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/.claude/worktrees/wt1/mobile/app/x.tsx")"
check 2 "worktree under .claude: e2e denied"      path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/.claude/worktrees/wt1/e2e/maestro/flows/x.yaml")"
check 2 "worktree under .claude: its .claude"     path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$ROOT/.claude/worktrees/wt1/.claude/hooks/x.sh")"
check 0 "scratch worktree: in scope"              path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$TMP/scratch-wt/mobile/app/x.tsx")"
check 2 "scratch worktree: e2e denied"            path-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_path "$TMP/scratch-wt/e2e/x.yaml")"
check 2 "scratch worktree: docs-only agent"       path-guard.sh "$DOCS_ALLOW"           <<< "$(json_path "$TMP/scratch-wt/mobile/app/x.tsx")"
check 0 "scratch file: docs-only agent"           path-guard.sh "$DOCS_ALLOW"           <<< "$(json_path "/tmp/notes.log")"

echo "# path-guard: reviewers — two rounds, follow-up passes, never a third round"
check 0 "reviewer-design: review-1.md"            path-guard.sh "$R1_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-1.md")"
check 0 "reviewer-design: review-1-recheck.md"    path-guard.sh "$R1_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-1-recheck.md")"
check 0 "reviewer-design: review-1-followup.md"   path-guard.sh "$R1_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-1-followup.md")"
check 2 "reviewer-design: third round refused"    path-guard.sh "$R1_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-1-recheck-2.md")"
check 2 "reviewer-design: review-2 is not yours"  path-guard.sh "$R1_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-2.md")"
check 0 "reviewer-code: review-2.md"              path-guard.sh "$R2_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-2.md")"
check 0 "reviewer-code: review-2-followup.md"     path-guard.sh "$R2_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-2-followup.md")"
check 0 "reviewer-code: review-2-followup-2.md"   path-guard.sh "$R2_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-2-followup-2.md")"
check 2 "reviewer-code: third round refused"      path-guard.sh "$R2_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-2-recheck-2.md")"
check 2 "reviewer-code: followup needs a number"  path-guard.sh "$R2_ALLOW" <<< "$(json_path "$ROOT/docs/s/review-2-followup-x.md")"

echo "# path-guard: documenter"
check 0 "documenter: adr"                         path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/adr/0003-x.md")"
check 0 "documenter: generator script"            path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/scripts/docs/gen-data-model.mjs")"
check 0 "documenter: generated dictionary"        path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/data-model/dictionary.md")"
check 0 "documenter: docs-report.json"            path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/s/docs-report.json")"
check 0 "documenter: stack-notes"                 path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/stack-notes.md")"
check 2 "documenter: no docs/api here"            path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/api/openapi/x.json")"
check 2 "documenter: sprint plan refused"         path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/s/plan.md")"
check 2 "documenter: carry-over refused"          path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/docs/carry-over.md")"
check 2 "documenter: descriptions.json is data-coder's" path-guard.sh "$DOC_ALLOW" <<< "$(json_path "$ROOT/mobile/src/db/schema/descriptions.json")"

echo "# bash-guard: rules 2-4 (no scope args, main session) — develop and main are the long-lived branches (ADR 0001)"
check 2 "git merge main"                          bash-guard.sh <<< "$(json_cmd 'git merge main')"
check 0 "git merge origin/main"                   bash-guard.sh <<< "$(json_cmd 'git fetch origin && git merge origin/main' "$TMP/repo-feature")"
check 2 "git merge develop"                       bash-guard.sh <<< "$(json_cmd 'git merge develop' "$TMP/repo-feature")"
check 0 "git merge origin/develop"                bash-guard.sh <<< "$(json_cmd 'git fetch origin && git merge origin/develop' "$TMP/repo-feature")"
check 2 "git diff main...HEAD"                    bash-guard.sh <<< "$(json_cmd 'git diff --stat main...HEAD')"
check 2 "git diff develop...HEAD"                 bash-guard.sh <<< "$(json_cmd 'git diff --stat develop...HEAD')"
check 0 "git log origin/main..HEAD"               bash-guard.sh <<< "$(json_cmd 'git log --oneline origin/main..HEAD')"
check 0 "git diff origin/develop...HEAD"          bash-guard.sh <<< "$(json_cmd 'git diff --stat origin/develop...HEAD')"
check 2 "git rebase main"                         bash-guard.sh <<< "$(json_cmd 'git rebase main')"
check 2 "git rebase develop"                      bash-guard.sh <<< "$(json_cmd 'git rebase develop')"
check 2 "git merge-base main HEAD"                bash-guard.sh <<< "$(json_cmd 'git merge-base main HEAD')"
check 2 "git merge-base develop HEAD"             bash-guard.sh <<< "$(json_cmd 'git merge-base develop HEAD')"
check 0 "git switch main (own move)"              bash-guard.sh <<< "$(json_cmd 'git switch main')"
check 0 "git switch develop (own move)"           bash-guard.sh <<< "$(json_cmd 'git switch develop')"
check 0 "git log -15 (no ref)"                    bash-guard.sh <<< "$(json_cmd 'git log --oneline -15')"
check 0 "path containing main.tsx"                bash-guard.sh <<< "$(json_cmd 'git log -- mobile/app/main.tsx')"
check 0 "path containing develop.ts"              bash-guard.sh <<< "$(json_cmd 'git log -- scripts/develop.ts')"
check 2 "local merge while on main"               bash-guard.sh <<< "$(json_cmd 'git merge feature/x' "$TMP/repo-main")"
check 2 "local merge while on develop"            bash-guard.sh <<< "$(json_cmd 'git merge feature/x' "$TMP/repo-develop")"
check 0 "merge on a feature branch"               bash-guard.sh <<< "$(json_cmd 'git merge feature/y' "$TMP/repo-feature")"
check 2 "git add -A"                              bash-guard.sh <<< "$(json_cmd 'git add -A && git commit -m x')"
check 2 "git add ."                               bash-guard.sh <<< "$(json_cmd 'git add .')"
check 0 "git add explicit path"                   bash-guard.sh <<< "$(json_cmd 'git add docs/x/plan.md')"
check 2 "git push --force"                        bash-guard.sh <<< "$(json_cmd 'git push --force origin feature/x')"
check 2 "git push --force-with-lease"             bash-guard.sh <<< "$(json_cmd 'git push --force-with-lease origin feature/x')"
check 0 "git push -u feature"                     bash-guard.sh <<< "$(json_cmd 'git push -u origin feature/x' "$TMP/repo-feature")"
check 2 "git push HEAD:main"                      bash-guard.sh <<< "$(json_cmd 'git push origin HEAD:main' "$TMP/repo-feature")"
check 2 "git push while on main"                  bash-guard.sh <<< "$(json_cmd 'git push' "$TMP/repo-main")"
check 2 "git push HEAD:develop"                   bash-guard.sh <<< "$(json_cmd 'git push origin HEAD:develop' "$TMP/repo-feature")"
check 2 "git push origin develop"                 bash-guard.sh <<< "$(json_cmd 'git push origin develop' "$TMP/repo-feature")"
check 2 "git push HEAD:refs/heads/main"           bash-guard.sh <<< "$(json_cmd 'git push origin HEAD:refs/heads/main' "$TMP/repo-feature")"
check 2 "git push while on develop"               bash-guard.sh <<< "$(json_cmd 'git push' "$TMP/repo-develop")"
check 0 "git push -u hotfix"                      bash-guard.sh <<< "$(json_cmd 'git push -u origin hotfix/x' "$TMP/repo-hotfix")"
check 0 "git push a release tag"                  bash-guard.sh <<< "$(json_cmd 'git push origin v0.1.0' "$TMP/repo-feature")"
check 0 "quoted pipe in a commit message"         bash-guard.sh <<< "$(json_cmd 'git commit -m "docs: a | b; c" -- docs/x/plan.md')"

echo "# bash-guard: rule 5 — secret and signing files never staged (fake paths)"
check 2 "git add mobile/.env"                     bash-guard.sh <<< "$(json_cmd 'git add mobile/.env')"
check 2 "git add .env.local"                      bash-guard.sh <<< "$(json_cmd 'git add .env.local docs/x/plan.md')"
check 2 "git add a keystore"                      bash-guard.sh <<< "$(json_cmd 'git add android/app/release.jks')"
check 2 "git add an Apple key"                    bash-guard.sh <<< "$(json_cmd 'git add credentials/AuthKey_ABC123.p8')"
check 2 "git add a provisioning profile"          bash-guard.sh <<< "$(json_cmd 'git add ios/matiq.mobileprovision')"
check 2 "git add google-services.json"            bash-guard.sh <<< "$(json_cmd 'git add mobile/google-services.json')"
check 2 "git add GoogleService-Info.plist"        bash-guard.sh <<< "$(json_cmd 'git add mobile/ios/GoogleService-Info.plist')"
check 0 "git add .env.example"                    bash-guard.sh <<< "$(json_cmd 'git add .env.example mobile/.env.example')"
check 0 "git add an ordinary file"                bash-guard.sh <<< "$(json_cmd 'git add docs/x/plan.md mobile/app/index.tsx')"
check 0 "git add a file whose name contains env"  bash-guard.sh <<< "$(json_cmd 'git add mobile/src/environment.ts')"

echo "# bash-guard: rule 1 (scoped) incl. the quote-aware split"
check 2 "documenter: sed -i with a quoted pipe"           bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd "sed -i '' 's/| open |/| done |/' docs/carry-over.md")"
check 2 "documenter: sed -i with a quoted pipe, progress" bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd "sed -i '' 's/| a | b |/| c |/' docs/foundation/progress.md")"
check 0 "orchestrator: the same sed on carry-over"        bash-guard.sh "$ORCH_ALLOW" <<< "$(json_cmd "sed -i '' 's/| open |/| done |/' docs/carry-over.md")"
check 0 "documenter: sed -i with a quoted ; on stack-notes" bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd "sed -i '' 's/x;y/z/' docs/stack-notes.md")"
check 0 "documenter: append to stack-notes"       bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd 'echo "| x | y |" >> docs/stack-notes.md')"
check 0 "documenter: generator log to /tmp"       bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd 'node scripts/docs/gen-data-model.mjs > /tmp/gen.log 2>&1')"
check 2 "documenter: mkdir outside scope"         bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd 'mkdir -p mobile/src/evil')"
check 0 "documenter: mkdir -p docs/adr"           bash-guard.sh "$DOC_ALLOW" <<< "$(json_cmd 'mkdir -p docs/adr/ docs/architecture')"
check 2 "data-coder: heredoc into a screen"       bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd $'cat > mobile/app/x.tsx <<\'EOF\'\nconst a = 1;\nEOF')"
check 2 "data-coder: sed -i on a Maestro flow"    bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd "sed -i '' 's/48/50/' e2e/maestro/flows/features/x.yaml")"
check 2 "data-coder: cp into components"          bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd 'cp /tmp/x.tsx mobile/src/components/x.tsx')"
check 2 "data-coder: hand-edit the journal"       bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd 'echo x > mobile/drizzle/meta/_journal.json')"
check 0 "data-coder: write a repository"          bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd $'cat > mobile/src/repositories/sessions.ts <<EOF\nx\nEOF')"
check 0 "data-coder: cd + relative in scope"      bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd 'cd mobile/src/db && echo x > client.ts')"
check 2 "data-coder: cd + relative denied"        bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd 'cd mobile && echo x > app/foo.tsx')"
check 0 "data-coder: jest log to /tmp"            bash-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_cmd 'cd mobile && npx jest --watchAll=false > /tmp/jest.log 2>&1')"
check 2 "frontend: generated tokens.ts via Bash"  bash-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_cmd 'node scripts/sync-design-tokens.mjs > mobile/src/theme/tokens.ts')"
check 2 "frontend: writes a Maestro flow"         bash-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_cmd 'echo x > e2e/maestro/flows/features/x.yaml')"
check 2 "frontend: writes a repository"           bash-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_cmd 'echo x > mobile/src/repositories/x.ts')"
check 0 "frontend: smoke log to /tmp"             bash-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_cmd 'cd mobile && npx expo run:ios > /tmp/fe-smoke.log 2>&1')"
check 0 "frontend: writes a screen"               bash-guard.sh "$FE_ALLOW" "$FE_DENY" <<< "$(json_cmd 'echo x > mobile/app/sessions/index.tsx')"
check 2 "tester: writes product code"             bash-guard.sh "$TEST_ALLOW" <<< "$(json_cmd 'echo x > mobile/app/x.tsx')"
check 0 "tester: writes a flow"                   bash-guard.sh "$TEST_ALLOW" <<< "$(json_cmd 'echo x > e2e/maestro/flows/features/x.yaml')"
check 0 "tester: maestro log to /tmp"             bash-guard.sh "$TEST_ALLOW" <<< "$(json_cmd 'maestro test e2e/maestro/flows > /tmp/maestro.log 2>&1')"
check 0 "docs-only: heredoc '>' is not a redirect" bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd $'python3 - <<\'EOF\'\nprint(2 > 1)\nEOF')"
check 0 "docs-only: tee docs"                     bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd 'git log | tee docs/x/log.md')"
check 2 "docs-only: cp into .claude"              bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd 'cp x.sh .claude/hooks/y.sh')"
check 0 "docs-only: 2>&1 is not a target"         bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd 'npx jest > /tmp/jest.log 2>&1')"
check 0 "docs-only: glob target skipped"          bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd 'rm -f /tmp/hooks-none/*')"
check 0 "main session: write anywhere"            bash-guard.sh <<< "$(json_cmd 'echo x > e2e/maestro/flows/x.yaml')"
check 0 "docs-only: write in scratch worktree docs" bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd 'echo x > docs/x/a.md' "$TMP/scratch-wt")"
check 2 "docs-only: write in scratch worktree app"  bash-guard.sh "$DOCS_ALLOW" <<< "$(json_cmd 'echo x > mobile/app/a.tsx' "$TMP/scratch-wt")"

echo "# agent memory carve-out"
check 0 "tester writes its own MEMORY.md"         path-guard.sh "$TEST_ALLOW" <<< "$(json_agent "$ROOT/.claude/agent-memory/tester/MEMORY.md" tester)"
check 2 "tester writes planner's memory"          path-guard.sh "$TEST_ALLOW" <<< "$(json_agent "$ROOT/.claude/agent-memory/planner/MEMORY.md" tester)"
check 2 "tester writes .claude/agents"            path-guard.sh "$TEST_ALLOW" <<< "$(json_agent "$ROOT/.claude/agents/tester.md" tester)"
check 2 "no agent_type: memory dir is PO-owned"   path-guard.sh "$TEST_ALLOW" <<< "$(json_path "$ROOT/.claude/agent-memory/tester/MEMORY.md")"
check 0 "data-coder writes its own MEMORY.md"     path-guard.sh "$DC_ALLOW" "$DC_DENY" <<< "$(json_agent "$ROOT/.claude/agent-memory/data-coder/MEMORY.md" data-coder)"
check 0 "bash: tester appends to its own memory"  bash-guard.sh "$TEST_ALLOW" <<< "$(jq -cn --arg cwd "$ROOT" '{tool_input:{command:"echo x >> .claude/agent-memory/tester/MEMORY.md"},cwd:$cwd,agent_type:"tester"}')"

echo "# session hooks"
out=$(echo '{"source":"startup"}' | "$HOOKS/session-context.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ] && printf '%s' "$out" | grep -q '^branch:' && printf '%s' "$out" | grep -q '^flow:' && printf '%s' "$out" | grep -q 'Session context'; then printf 'ok   session-context prints branch state and flow\n'
else fail=$((fail+1)); printf 'FAIL session-context: exit %s\n     %s\n' "$got" "$(printf '%s' "$out" | head -5)"; fi
echo '{"transcript_path":"/tmp/t.jsonl","trigger":"auto"}' | CLAUDE_PROJECT_DIR="$TMP/repo-feature" "$HOOKS/precompact-snapshot.sh"; got=$?; n=$((n+1))
if [ "$got" = 0 ] && grep -q 'compact(auto) feature/x@' "$TMP/repo-feature/.claude/session-log.md" 2>/dev/null; then printf 'ok   precompact-snapshot appends a pointer line\n'
else fail=$((fail+1)); printf 'FAIL precompact-snapshot: exit %s\n' "$got"; fi
out=$(echo '{"source":"compact"}' | CLAUDE_PROJECT_DIR="$TMP/repo-feature" "$HOOKS/session-context.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ] && printf '%s' "$out" | grep -q 'recent compactions'; then printf 'ok   session-context prints the session log after a compaction\n'
else fail=$((fail+1)); printf 'FAIL session-context (compact): exit %s\n     %s\n' "$got" "$(printf '%s' "$out" | head -5)"; fi

echo "# base-ref: the branch a change is compared against (ADR 0001)"
for c in "feature:origin/develop" "develop:origin/develop" "hotfix:origin/main"; do
  got=$( cd "$TMP/repo-${c%%:*}" && . "$HOOKS/base-ref.sh" && base_ref ); n=$((n+1))
  if [ "$got" = "${c#*:}" ]; then printf 'ok   base-ref: %s → %s\n' "${c%%:*}" "$got"; else fail=$((fail+1)); printf 'FAIL base-ref %s: got %s\n' "${c%%:*}" "$got"; fi
done

echo "# verification hooks (SubagentStop)"
# a repo with origin/develop, a Jest test, a Maestro flow and a Drizzle schema, then removed assertions in the working tree
V="$TMP/repo-valid"; mkdir -p "$V/mobile/src/__tests__" "$V/mobile/src/db/schema" "$V/e2e/maestro/flows/features" && git -C "$V" init -q -b main
printf 'test("x", () => {\n  expect(1).toBe(1);\n  expect(2).toBe(2);\n});\n' > "$V/mobile/src/__tests__/a.test.ts"
printf 'appId: nl.btnt.matiq\n---\n- launchApp\n- assertVisible:\n    id: "home.title"\n- assertVisible:\n    id: "db.ready"\n' > "$V/e2e/maestro/flows/features/x.yaml"
printf "export const reviews = sqliteTable('session_reviews', { rating: integer('rating').notNull() }, (t) => [\n  check('rating_1_5', sql\`\${t.rating} between 1 and 5\`),\n]);\n" > "$V/mobile/src/db/schema/x.ts"
git -C "$V" add -A >/dev/null && git -C "$V" -c user.email=t@t -c user.name=t commit -q -m base
git -C "$V" update-ref refs/remotes/origin/develop HEAD && git -C "$V" switch -q -c feature/v
printf 'test("x", () => {\n  expect(1).toBe(1);\n});\n' > "$V/mobile/src/__tests__/a.test.ts"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/validation-guard.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 2 ] && printf '%s' "$out" | grep -q 'toBe(2)'; then printf 'ok   validation-guard: removed Jest assertion is flagged once\n'; else fail=$((fail+1)); printf 'FAIL validation-guard removed: exit %s\n     %s\n' "$got" "$out"; fi
out=$(echo '{"stop_hook_active":true}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/validation-guard.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ]; then printf 'ok   validation-guard: second stop passes\n'; else fail=$((fail+1)); printf 'FAIL validation-guard stop_hook_active: exit %s\n' "$got"; fi
printf 'test("x", () => {\n  expect(1).toBe(1);\n  expect(2).toBe(2);\n  expect(3).toBe(3);\n});\n' > "$V/mobile/src/__tests__/a.test.ts"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/validation-guard.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ]; then printf 'ok   validation-guard: added assertion passes\n'; else fail=$((fail+1)); printf 'FAIL validation-guard added: exit %s\n     %s\n' "$got" "$out"; fi
printf 'appId: nl.btnt.matiq\n---\n- launchApp\n- assertVisible:\n    id: "home.title"\n' > "$V/e2e/maestro/flows/features/x.yaml"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/validation-guard.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 2 ] && printf '%s' "$out" | grep -q 'assertVisible'; then printf 'ok   validation-guard: removed Maestro assertion is flagged\n'; else fail=$((fail+1)); printf 'FAIL validation-guard maestro: exit %s\n     %s\n' "$got" "$out"; fi
git -C "$V" checkout -q -- e2e
printf "export const reviews = sqliteTable('session_reviews', { rating: integer('rating').notNull() });\n" > "$V/mobile/src/db/schema/x.ts"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/validation-guard.sh" 2>&1); got=$?; n=$((n+1))
if [ "$got" = 2 ] && printf '%s' "$out" | grep -q 'check('; then printf 'ok   validation-guard: removed Drizzle check constraint is flagged\n'; else fail=$((fail+1)); printf 'FAIL validation-guard drizzle: exit %s\n     %s\n' "$got" "$out"; fi
git -C "$V" checkout -q -- mobile/src/db
# review format contract
mkdir -p "$V/docs/s"; printf '# Review 2\n\n| B1 | mobile/app/x.tsx:3 | defect | frontend-coder | fixed when |\n| S1 | mobile/src/db/schema/x.ts:9 | missing check | data-coder | fixed when |\n\nREVIEW FAILED\n' > "$V/docs/s/review-2.md"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/review-format-check.sh" review-2 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ]; then printf 'ok   review-format-check: complete review passes (frontend-coder and data-coder owners)\n'; else fail=$((fail+1)); printf 'FAIL review-format complete: exit %s\n     %s\n' "$got" "$out"; fi
printf '# Review 2\n\n| B1 | mobile/app/x.tsx:3 | defect | | |\n\nsome text\n' > "$V/docs/s/review-2.md"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/review-format-check.sh" review-2 2>&1); got=$?; n=$((n+1))
if [ "$got" = 2 ] && printf '%s' "$out" | grep -q 'REVIEW PASSED' && printf '%s' "$out" | grep -q 'without an owner'; then printf 'ok   review-format-check: missing signal and owner flagged\n'; else fail=$((fail+1)); printf 'FAIL review-format incomplete: exit %s\n     %s\n' "$got" "$out"; fi
printf '# Review 2\n\n| B1 | src/x.sql:3 | defect | backend-coder | fixed when |\n\nREVIEW FAILED\n' > "$V/docs/s/review-2.md"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/review-format-check.sh" review-2 2>&1); got=$?; n=$((n+1))
if [ "$got" = 2 ] && printf '%s' "$out" | grep -q 'without an owner'; then printf 'ok   review-format-check: backend-coder is not an owner here\n'; else fail=$((fail+1)); printf 'FAIL review-format old owner: exit %s\n     %s\n' "$got" "$out"; fi
rm "$V/docs/s/review-2.md"; printf '# Follow-up\n\n| S1 | docs/s/plan.md:9 | stale | planner | fixed when |\n\nREVIEW PASSED\n' > "$V/docs/s/review-2-followup.md"
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/review-format-check.sh" review-2 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ]; then printf 'ok   review-format-check: follow-up pass is checked and passes\n'; else fail=$((fail+1)); printf 'FAIL review-format followup: exit %s\n     %s\n' "$got" "$out"; fi
out=$(echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$V" "$HOOKS/review-format-check.sh" review-1 2>&1); got=$?; n=$((n+1))
if [ "$got" = 0 ]; then printf 'ok   review-format-check: no review-1 file written → pass\n'; else fail=$((fail+1)); printf 'FAIL review-format none: exit %s\n' "$got"; fi

echo "$((n-fail))/$n passed"
[ "$fail" = 0 ]
