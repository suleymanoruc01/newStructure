/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#F3E8CF',
          1: '#EADCC5',
          2: '#DDD4C7',
          inverted: '#252823',
        },
        text: {
          high: '#252823',
          medium: '#344A32',
          low: '#83947A',
          on: '#F3E8CF',
        },
        action: {
          primary: '#E97A3D',
          'primary-pressed': '#D4692F',
        },
        feedback: {
          error: '#B84A3A',
          success: '#3D6B4F',
        },
        forest: {
          DEFAULT: '#234D3C',
          deep: '#252823',
        },
      },
    },
  },
};
