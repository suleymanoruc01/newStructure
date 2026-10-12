module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-maps$': '<rootDir>/src/test/react-native-maps.mock.js',
    '^react-native-adapty$': '<rootDir>/src/test/react-native-adapty.mock.js',
  },
};
