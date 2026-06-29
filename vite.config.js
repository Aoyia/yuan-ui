import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true, // 将所有类型定义打包至单个 index.d.ts 文件中，对标大厂组件库规范
    }),
  ],
  optimizeDeps: {
    exclude: ['fsevents'] // 排除 fsevents 预构建，避免 esbuild .node 二进制加载报错，保障开发服务器平稳运行
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'YuanUI',
      formats: ['es', 'umd'],
      fileName: (format) => `yuan-ui.${format}.js`,
    },
    rollupOptions: {
      // 将 Vue 3 及其主要外部组件排除在打包产物之外
      external: ['vue', '@lucide/vue', 'markstream-vue', '@vueuse/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@lucide/vue': 'LucideVue',
          'markstream-vue': 'MarkstreamVue',
          '@vueuse/core': 'VueUse'
        },
      },
    },
    cssCodeSplit: false, // 所有 CSS 合并到一个 style.css
    sourcemap: true,
    emptyOutDir: true,
  },
});
