import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'YuanUI',
      formats: ['es', 'umd'],
      fileName: (format) => `yuan-ui.${format}.js`,
    },
    rollupOptions: {
      // 将 React 排除在打包产物之外，避免 ReactCurrentDispatcher 错误
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    cssCodeSplit: false, // 所有 CSS 合并到一个 style.css
    sourcemap: true,
    emptyOutDir: true,
  },
});
