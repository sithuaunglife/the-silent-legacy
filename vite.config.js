import { defineConfig } from 'vite';

// React 17+ automatic JSX runtime: eliminates React.createElement global requirements.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/the-silent-legacy/' : '/',
  esbuild: { jsx: 'automatic' },
});
