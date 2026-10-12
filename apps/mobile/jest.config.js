module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-maps$': '<rootDir>/src/test/react-native-maps.mock.js',
  },
};
