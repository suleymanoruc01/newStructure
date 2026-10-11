#!/usr/bin/env node
/**
 * NativeWind's css-interop touches React Native's ImageBackground export at
 * startup. RN 0.87 warns on that getter even when the app never renders one.
 * Load the component from its library file, which is in package exports and
 * does not warn.
 */
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(
  __dirname,
  '../apps/mobile/node_modules/react-native-css-interop/dist/runtime/components.js',
);
const needle = '(0, api_1.remapProps)(react_native_1.ImageBackground, {';
const replacement =
  '(0, api_1.remapProps)(require("react-native/Libraries/Image/ImageBackground").default, {';

if (!fs.existsSync(file)) {
  console.error(`patch-css-interop: missing ${file}`);
  process.exit(1);
}

const src = fs.readFileSync(file, 'utf8');
if (src.includes(replacement)) {
  console.log('patch-css-interop: ImageBackground already patched');
  process.exit(0);
}
if (!src.includes(needle)) {
  console.error('patch-css-interop: ImageBackground call site not found');
  process.exit(1);
}

fs.writeFileSync(file, src.replace(needle, replacement));
console.log('patch-css-interop: skipped deprecated ImageBackground export');
