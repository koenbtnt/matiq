# 01. Introduction and goals

matIQ is a native iOS and Android app for one Brazilian jiu-jitsu practitioner: plan a session and its focuses, train, log what was actually worked on, review it, and see which areas are improving or lacking. Taxonomy and algorithm weights are user-editable. Source: `docs/PRODUCT.md` §1 (S-12, R-01).

## Goals

| # | Goal | Source |
|---|---|---|
| G1 | Close the loop plan -> train -> log -> review -> progress for a single practitioner | R-01 |
| G2 | Logging is fast: <= 30 s, <= 2 taps from Home to the prefilled screen (reading pending PO, A-7) | R-26 |
| G3 | Progress per focus is computed, explained and tunable | R-08, R-17, R-22 |
| G4 | All personal data stays on the device and is encrypted at rest | S-02, R-12, R-24 |
| G5 | Built for publishing: export, import, erase, no analytics | S-03, R-12 |
| G6 | Nothing prevents a later coach tier (v2) | R-27 |

## Stakeholders

| Role | Interest |
|---|---|
| PO / sole v1 user | all goals; owns `CLAUDE.md`, `.claude/**`, `docs/decisions.md` rulings |
| Future coaches (v2) | follow clients; only the seam and the export format exist in v1 |
| Agent harness (ADR 0002) | planner, coders, tester, reviewers, documenter working per sprint |

Non-goals: see `docs/PRODUCT.md` §3.
