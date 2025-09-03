import type { Config } from 'tailwindcss';

// Avoid TS "satisfies" to keep runners happy.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
