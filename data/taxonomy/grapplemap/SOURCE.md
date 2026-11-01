# GrappleMap snapshot (vendored)

| field | value |
|---|---|
| source | https://github.com/Eelis/GrappleMap — `GrappleMap.txt` |
| fetched from | https://raw.githubusercontent.com/Eelis/GrappleMap/master/GrappleMap.txt |
| fetched on | 2026-11-01 (data-coder, the one vendoring fetch; the converter never touches the network) |
| branch / commit at fetch | `master` @ `032c8f91809786b7b784852abd07cf3e10c0ea35` (committer date 2020-03-14) |
| last commit touching the file | `fc0a470730bca971e81db795d7d11f387dc3ab1d` (2017-07-02, "db: Don't have multiple positions with the same name.") |
| git blob sha of the file | `dd9cecb4e5e53c0870c93dd82eb1eabae221e3a7` |
| snapshot label (`source_version`) | `2023-02-06` — the repository's last push date, the label `.claude/rules/data.md` pins |
| size | 2,674,097 bytes |
| sha256 | `734c5af03958f7384af1c09b18bf06500748a8c505573e5be9a48174ddcfb74e` |
| licence | Public domain (repository `LICENSE` and README FAQ) |
| records | 2086 = 601 positions (one pose) + 1485 transitions (≥ 2 poses); validator: 0 errors |

## Layout

`records/NNNN-<slug>.txt` holds record `NNNN` (0-based, file order) as its exact bytes, so
`node scripts/taxonomy/join.ts data/taxonomy/grapplemap/records` reproduces `GrappleMap.txt`
byte-for-byte (sha256 above; Jest checks it). The original file is not committed. A record's
source id is `gm:<NNNN without padding>`.

## Re-vendoring

Fetch the new file, `node scripts/taxonomy/split.ts <file> data/taxonomy/grapplemap/records`
(after removing the old records), update this table, run `node scripts/taxonomy/convert.ts --mint`,
bump `data/taxonomy/curated/release.json`, review `mobile/src/db/seed/report.json`, commit.
