import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        shuishui: {
          pink: '#FFB7CE',
          'pink-soft': '#FFE0EC',
          cream: '#FFF8F0',
        },
      },
      fontFamily: {
        sans: ['ui-rounded', 'Hiragino Sans', 'PingFang SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
