# design-system/artifact/: exported design

- **Live canvas (source):** https://claude.ai/artifact/BJQCTGcpWTzTV2wA6bwyiR. It's a private Claude Design canvas; only the owner and people it's shared with can open it.
- **Exported version:** 13, on 2026-10-31.
- **Accent:** Emerald `#2EDB7F`, confirmed by the user on 2026-10-31.

| File | What it is |
|---|---|
| `matiq-design.html` | Static, self-contained export of the canvas, covering principles, color tokens (dark + light), belts, typography, space/shape/motion, components, platform mapping and screens. Intake cites this file. |
| `canvas/*.dc.html`, `canvas/canvas.json` | Raw canvas source: board index, components, theming and the five interactive screens in dark and light. Exact styles live here. These files need the canvas runtime (`support.js`, not included), so read them as source. Opening them in a browser won't work. |

## Notes

- Canvas tweaks offer other accents (blue, orange, teal, gold, mono, volt). They are rejected alternatives. Only the `green` default is part of the system.
- `Theming.dc.html` mentions SwiftUI asset catalogs and Compose `MatiqColors`. The app is Expo / React Native, so the tokens reach the UI through `mobile/src/theme/tokens.ts` instead.
- To update the design: change the canvas, re-export it here, then re-run the intake (`../README.md`).
