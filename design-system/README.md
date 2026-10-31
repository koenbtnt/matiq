# design-system/ — the design source of truth and its derived files

The visual design of matIQ is made by the user as a **Claude Artifact** and exported here. Agents
never edit the artifact; they derive machine-readable files from it and cite it.

| Path | Who writes it | What it is |
|---|---|---|
| `artifact/matiq-design.html` | the user (export of the Claude Artifact) | The design: screens, components, colours, type, spacing. Source of truth. Re-exported whenever the design changes. |
| `tokens.json` | designer agent (intake run) | Every colour (light + dark), type style, spacing, radius, size and semantic pairing, in the shape `scripts/sync-design-tokens.mjs` reads. Until intake it is a **starter placeholder** (`"_status": "starter"`). |
| `components.md` | designer agent (intake run) | Component catalogue: one section per component with its variants, states and the artifact section it comes from. |
| `RULES.md` | designer agent (intake run) | The binding design rules derived from the artifact (typeface, accent use, chips vs colour, hit targets, contrast, iconography). |
| `mobile/src/theme/tokens.ts` | generated — `node scripts/sync-design-tokens.mjs` | Never hand-edited. CI runs `--check`. |

## Intake procedure (one-time, repeated after every re-export)

1. **User:** save the artifact's HTML as `design-system/artifact/matiq-design.html` (any other assets next to it) and commit it on a `chore/design-intake` branch.
2. **Orchestrator → designer:** "design intake" — read the artifact, write `tokens.json` (`_status` → `"intake"`, `version` +1), `components.md` and `RULES.md`, each value citing `artifact/matiq-design.html:<line>` or the artifact section. Compute every colour pair's contrast into `docs/design-system-contrast.md`. Signal `DESIGN COMPLETE`.
3. **Orchestrator → frontend-coder:** `node scripts/sync-design-tokens.mjs`, commit `mobile/src/theme/tokens.ts`; `npx tsc --noEmit` and `npx jest` green; `node scripts/check-token-adherence.mjs` exit 0.
4. **Orchestrator → reviewer-design:** a follow-up pass checking ten citations and the recomputed contrast.
5. PR into `develop`; the user merges. From then on every `design.md` cites these files.

While `tokens.json` is the starter, `.claude/rules/frontend.md` forbids any screen spec: the designer's only permitted deliverable is this intake.

## Keeping the project in sync

- The artifact changes → re-export → steps 2–5 again. The diff of `tokens.json` shows what moved.
- A component or token the app needs and the artifact lacks is a **design-system request** (`design.md §11`) to the user, never an invention in code or in these files.
