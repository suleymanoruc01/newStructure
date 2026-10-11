/**
 * @format
 */

import 'react-native-gesture-handler';
import './global.css';

import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';

import App from './src/app/App';
import { name as appName } from './app.json';

try {
  setBackgroundMessageHandler(getMessaging(getApp()), async () => {});
} catch {
  // shortcut: no google-services.json / GoogleService-Info.plist yet, add the Firebase project files to deliver push
}

AppRegistry.registerComponent(appName, () => App);
