# 0013. Resources as a first-class entity linked to the graph

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-28 / R-29, R-33, R-16
- **Source:** `docs/decisions.md` Product R-29, R-33, R-16; plan §0 D-28, D-30.

## Ruling (quoted)

> PO, 2026-10-31 · R-29: "ok. but keep in mind that more entries should be available in the future"
>
> PO, 2026-10-31 · R-33: "in a later feature i want to do something with these dvd's and scrap their titles etx"

## Context and problem

The design artifact contains a video area; the PO rules it out of v1 but wants instructional material trackable.

## Decision drivers

- Future import of catalogues without a schema change.
- Attachable to several kinds of target.

## Considered options

- `resources` + `resource_types` (data, extensible) + `resource_links` `{target_kind, target_id}` (chosen).
- Embedded video area: rejected, parked by R-16.

## Decision outcome

Fields: title, URL, author/source, type, notes, status to watch/watched; attachable to technique, position, subject or cycle; manual entry in v1. The only outbound action is opening the URL in the browser. Scraping instructional sites is a v2 risk, subject to a terms-of-service assessment, not designed here.

## Consequences

- `resources.author` vs the import column `source` naming is a carry-over candidate for sprint 2 design.
- Watch list UI is v1.x.
