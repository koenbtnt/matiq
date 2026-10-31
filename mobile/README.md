# matIQ — mobile app

Expo + Expo Router app for iOS and Android. Everything about how this repo is developed lives at
the repository root: `../README.md`, `../CLAUDE.md`, `../.claude/rules/`, `../docs/`.

```bash
npm install
npx expo start --ios          # Expo Go on the iOS simulator
npx expo run:ios              # dev-client build (needs CocoaPods)
npx tsc --noEmit && npx jest --watchAll=false
npx drizzle-kit generate --name <slug>   # after a schema change in src/db/schema/
```
