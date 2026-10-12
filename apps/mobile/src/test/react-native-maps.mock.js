const React = require('react');
const { View } = require('react-native');

function MapView(props) {
  return React.createElement(View, props, props.children);
}

function Child(props) {
  return React.createElement(View, props, props.children);
}

module.exports = {
  __esModule: true,
  default: MapView,
  Marker: Child,
  Circle: Child,
  PROVIDER_DEFAULT: undefined,
  PROVIDER_GOOGLE: 'google',
};
