const partonPreset = require('@parton/design-tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.js'],
  presets: [partonPreset],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-base': '#F3E8CF',
        'surface-1': '#EADCC5',
        'surface-2': '#DDD4C7',
        'text-high': '#252823',
        'text-medium': '#344A32',
        'text-low': '#83947A',
        'text-on': '#F3E8CF',
        'action-primary': '#E97A3D',
        'action-primary-pressed': '#D4692F',
        'feedback-error': '#B84A3A',
        'feedback-success': '#3D6B4F',
      },
    },
  },
  plugins: [],
};
