// Native modules are unavailable under Jest. Database behaviour is covered by the real-SQLite
// migration tests (better-sqlite3); this mock only keeps `src/db/client.ts` importable.
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    databasePath: ':memory:',
    closeSync: jest.fn(),
    execSync: jest.fn(),
    prepareSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(),
  })),
  addDatabaseChangeListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
}));
