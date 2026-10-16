const React = require('react');
const { View } = require('react-native');

function DatePicker(props) {
  return React.createElement(View, { testID: props.testID || 'react-native-date-picker', ...props });
}

module.exports = {
  __esModule: true,
  default: DatePicker,
};
