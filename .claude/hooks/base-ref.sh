#!/usr/bin/env bash
# Sourced by the hooks that compare a branch against the branch it will be merged into (ADR 0001).
# hotfix/* is cut from and merged into main; every other branch integrates into develop.
# Callers cd into the checkout first; the remote ref is used because local main/develop are stale by design.
base_ref() {
  case "$(git branch --show-current 2>/dev/null)" in
    hotfix/*) echo origin/main ;;
    *) echo origin/develop ;;
  esac
}
