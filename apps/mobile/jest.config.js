module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@parton/api-contracts$':
      '<rootDir>/../../packages/api-contracts/dist/index.js',
    '^react-native-maps$': '<rootDir>/src/test/react-native-maps.mock.js',
    '^react-native-adapty$': '<rootDir>/src/test/react-native-adapty.mock.js',
    '^react-native-gesture-handler$':
      '<rootDir>/src/test/react-native-gesture-handler.mock.js',
    '^@react-native-firebase/app$':
      '<rootDir>/src/test/react-native-firebase-app.mock.js',
    '^@react-native-firebase/messaging$':
      '<rootDir>/src/test/react-native-firebase-messaging.mock.js',
    '^@sbaiahmed1/react-native-blur$':
      '<rootDir>/src/test/react-native-blur.mock.js',
    '^react-native-date-picker$':
      '<rootDir>/src/test/react-native-date-picker.mock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-navigation|react-native-screens|react-native-safe-area-context|react-native-reanimated|react-native-css-interop|nativewind)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.js'],
};
