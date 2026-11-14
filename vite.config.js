import { defineConfig } from 'vite';

// React 17+ automatic JSX runtime: eliminates React.createElement global requirements.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
});
