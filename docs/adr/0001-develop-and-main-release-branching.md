# 0001. develop as integration branch, main as release branch

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Source:** project setup, 2026-10-31; mirrors cadence ADR 0039 and sugar's branching

## Ruling (quoted)

> PO, 2026-10-31: "i want the setup to be similar to that of sugar and cadence w.r.t. develop and main branch"

The sugar/cadence procedure this refers to: `develop` is the default and integration branch, `main` holds released
code only, features and chores PR into `develop`, a release is the PO's `develop → main` PR plus a `vX.Y.Z` tag on
`main`, hotfixes may go via `hotfix/*` from `main` with a back-merge PR, regular merges only.

## Context and problem

The repository starts empty. Once the app is on a device, `main` has to mean "what runs on the user's phone / in the
stores", and unreleased sprint work needs a branch of its own. The agent tooling has to enforce the flow so no session
needs to remember it.

## Decision drivers

- `main` is always releasable; nothing reaches it except a deliberate release or a hotfix.
- Sprint work keeps flowing without waiting for a release.
- Guards, hooks and CI enforce the flow.

## Considered options

- `main` only, release from tags: rejected, `main` would carry unreleased work.
- Full git-flow with `release/*` branches: rejected, more ceremony than a two-branch flow needs.
- `develop` + `main`, release by a direct `develop → main` PR (chosen, the sugar/cadence procedure).

## Decision outcome

| Branch | Cut from | PR into | Merged by |
|---|---|---|---|
| `feature/<sprint-slug>`, `chore/<slug>` | `origin/develop` | `develop` | user, after green CI |
| `develop` (release) | — | `main` | user; then tags the merge commit `vX.Y.Z` (semver) |
| `hotfix/<slug>` | `origin/main` | `main`, then a back-merge PR `main → develop` | user |

- `develop` is the GitHub default branch (set 2026-10-31 with `gh repo edit --default-branch develop`).
- Regular merges only (no squash, no rebase). No agent opens a release or hotfix PR, tags, merges locally, or pushes to
  `develop` or `main`.
- Enforcement: `.claude/hooks/bash-guard.sh` refuses bare `main`/`develop` refs in compares, local merges while on
  either, and pushes to either; `.claude/hooks/base-ref.sh` gives the hooks their base (`origin/develop`, or
  `origin/main` on `hotfix/*`); CI runs on PRs into both branches and its `release-source` job fails a PR into `main`
  whose source is not `develop` or `hotfix/*`.

## Consequences

- Sprint branches, agent diffs and the verification hooks compare against `origin/develop`.
- After every hotfix a back-merge PR keeps `develop` ahead of `main`.
- Branch rulesets (require PR, block force push and deletion) and the `ci-ok` required check are GitHub settings of
  the user's (carry-over CO-11).
