# Taxonomy attribution

The seed taxonomy combines public-domain GrappleMap data, CC BY 4.0 alias data from Grapple Flows,
and matIQ's own curated layer. The JSON block below is emitted as `mobile/src/db/seed/attribution.json`
for the app's about screen (sprint 2+).

```json
{
  "sources": [
    {
      "name": "GrappleMap",
      "url": "https://github.com/Eelis/GrappleMap",
      "licence": "Public domain",
      "snapshot": "2023-02-06",
      "use": "positions, transitions, citations"
    },
    {
      "name": "bjj-data by Grapple Flows",
      "url": "https://github.com/grapple-flows/bjj-data",
      "licence": "CC BY 4.0",
      "licenceUrl": "https://creativecommons.org/licenses/by/4.0/",
      "commit": "aecbd792dd54d674d91513d9ef4a4ccb599bff1a",
      "credit": "Data from bjj-data by Grapple Flows (https://grappleflows.com)",
      "use": "position and submission aliases",
      "changes": "slugs rendered as display names; aliases equal to our canonical names omitted"
    },
    {
      "name": "matIQ curated layer",
      "licence": "matIQ",
      "use": "canonical names, core set, parents, edge types, gi techniques"
    }
  ]
}
```
