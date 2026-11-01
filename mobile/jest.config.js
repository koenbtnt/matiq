/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // A-33: the taxonomy converter's tests live beside it in scripts/taxonomy; modulePaths lets files
  // outside mobile/ resolve mobile's node_modules (babel runtime helpers).
  roots: ['<rootDir>', '<rootDir>/../scripts/taxonomy'],
  modulePaths: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/android/', '<rootDir>/ios/'],
  modulePathIgnorePatterns: ['<rootDir>/android/', '<rootDir>/ios/'],
  // jest-expo's recommended list (docs.expo.dev/develop/unit-testing), plus drizzle-orm.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|drizzle-orm)',
  ],
};
