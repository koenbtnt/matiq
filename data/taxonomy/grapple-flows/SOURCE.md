# grapple-flows/bjj-data (vendored)

| field | value |
|---|---|
| source | https://github.com/grapple-flows/bjj-data |
| file | `data/taxonomy.json` (copied verbatim) |
| commit | `aecbd792dd54d674d91513d9ef4a4ccb599bff1a` |
| commit date | 2026-09-27 |
| fetched on | 2026-11-01 (data-coder, vendoring fetch) |
| sha256 `taxonomy.json` | `485a6dc29656005e59dd4aadadac41ab87a88e1bc823449d1ead8c7f63c42da1` |
| sha256 `DATA-LICENSE` | `bcda55bc44f9afb782ad31934d9f69f86fc6b5f1634974a654923dc8b21c23a1` |
| licence | data: CC BY 4.0 (`DATA-LICENSE`, verbatim); the repository's code is MIT and is not vendored |
| entries | 45 alias entries (`aliases`), 42 vocabulary entries in 5 categories |
| credit | "Data from bjj-data by Grapple Flows (https://grappleflows.com)" |

Only the alias vocabulary is used: `data/taxonomy/curated/aliases.json` maps their tags onto our
position/technique source ids; the converter turns each mapped tag's label and aliases into alias
rows (`source = grapple-flows`, `source_id` = their slug, `source_version` = the commit date).
Changes made: slugs are rendered as display names (hyphens → spaces, sentence case); names equal to
our canonical name are skipped.
