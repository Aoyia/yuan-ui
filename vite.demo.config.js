import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { defineConfig } from 'vite'

// Demo 演示站专用构建配置（区别于库模式 vite.config.js）
// 产物输出到 dist-demo/，由 GitHub Actions 部署到 gh-pages 分支
export default defineConfig({
  plugins: [vue()],
  // 对应 GitHub Pages 的仓库路径：https://<user>.github.io/<repo>/
  base: '/yuan-ui/',
  optimizeDeps: {
    exclude: ['fsevents'],
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
