const React = require('react');
const { View } = require('react-native');

function GestureHandlerRootView(props) {
  return React.createElement(View, props, props.children);
}

module.exports = {
  __esModule: true,
  GestureHandlerRootView,
  RectButton: View,
  BorderlessButton: View,
  BaseButton: View,
  ScrollView: View,
  FlatList: View,
  Switch: View,
  TextInput: View,
  DrawerLayoutAndroid: View,
  NativeViewGestureHandler: View,
  TapGestureHandler: View,
  FlingGestureHandler: View,
  ForceTouchGestureHandler: View,
  LongPressGestureHandler: View,
  PanGestureHandler: View,
  PinchGestureHandler: View,
  RotationGestureHandler: View,
  State: {},
  Directions: {},
  GestureDetector: ({ children }) => children,
  Gesture: {
    Pan: () => ({
      onBegin: () => ({}),
      onUpdate: () => ({}),
      onEnd: () => ({}),
    }),
    Tap: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
  },
};
