const { platformSelect } = require('nativewind/theme');
const partonPreset = require('@parton/design-tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.js'],
  presets: [require('nativewind/preset'), partonPreset],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: platformSelect({
          android: 'sourcesans3',
          ios: "'Source Sans 3'",
        }),
        display: platformSelect({
          android: 'dmsans',
          ios: "'DM Sans'",
        }),
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      colors: {
        'surface-base': '#F3E8CF',
        'surface-1': '#EADCC5',
        'surface-2': '#DDD4C7',
        'text-high': '#252823',
        'text-medium': '#344A32',
        'text-low': '#83947A',
        'text-on': '#F3E8CF',
        'action-primary': '#E97A3D',
        'action-primary-pressed': '#B94E32',
        'action-secondary': '#344A32',
        'accent-mustard': '#E2B83F',
        'feedback-error': '#B94E32',
        'feedback-success': '#3D6B4F',
      },
    },
  },
  plugins: [],
};
