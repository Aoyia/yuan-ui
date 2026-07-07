export const mockBasicFlow = [
  { type: 'reasoning-delta', delta: '正在接收并分析用户提出的工程化重构诉求：对标大厂品质开源组件库...' },
  { type: 'reasoning-delta', delta: '\n\n经过对 Vue 3 社区的横向比对，优秀开源组件库的工程骨架一般包含：自动声明文件编译（vite-plugin-dts）、全局 CSS 变量主题底座、Husky 提交校验。' },
  { type: 'reasoning-delta', delta: '\n\n为了保障文档站的极速响应与良好的 Live 演示交互，使用 VitePress 是性价比最高的策略。我们只需要在其基础上对其进行 Layout 换头，即可获得 Arco 级别的颜值。' },
  { type: 'reasoning-delta', delta: '\n\n分析完毕，下面给出基本的重构核心路线说明。' },
  { type: 'text-delta', delta: "# 基础思维链演示完成\n\n通过该基础流，你可以看到 `AgentTrace` 能够完美实现流式 Reasoning Deltas 的打字机追加以及思考完成状态的过渡。" },
  { type: 'finish' }
]

export const mockIntermediateFlow = [
  { type: 'reasoning-delta', delta: '正在为您扫描当前项目依赖包情况，我需要读取本地包描述文件 package.json...' },
  { type: 'tool-input-start', id: 'file-package', toolName: 'read_package_json', title: '读取 package.json 文件', input: { path: 'package.json' } },
  { type: 'tool-output', id: 'file-package', output: { name: 'yuan-ui', version: '0.1.0', dependencies: { vue: '^3.4.0', '@vueuse/core': '^10.9.0' } } },
  { type: 'reasoning-delta', delta: '\n\n读取包配置成功。Vue 版本为 3.4.0。为了保障组件库强类型支持，我需要进一步确认本地的打包输出路径...' },
  { type: 'tool-input-start', id: 'dist-check', toolName: 'check_dist_dir', title: '检查 dist 目标目录', input: { mode: 'check-exist' } },
  { type: 'tool-output', id: 'dist-check', output: { exists: true, filesCount: 3, totalBytes: 11860 } },
  { type: 'reasoning-delta', delta: '\n\n环境检测全部通过，我已将项目状态整理就绪。' },
  { type: 'text-delta', delta: "## 中阶工具链演示总结\n\n在中阶演示中，我们成功调用了两个自定义工具。因为这两个工具不属于组件库默认的高频特化工具，`AgentTrace` 自动启用 **JSON Fallback 折叠渲染器**。你可以点击组件上方的 `输入参数` 与 `输出结果` 查看折叠缓动。" },
  { type: 'finish' }
]

export const mockAdvancedFlow: any[] = [
  { type: 'group-start', id: 'g-env', title: '第一阶段：环境调研与扫描' },
  { type: 'reasoning-delta', id: 'r-1', delta: '为了重构出具有 CodeX 和 Cursor 级别的嵌套思维链，我需要先对多级树形 Timeline 和滚动渐进折叠策略做可行性调研。', parentId: 'g-env' },
  { type: 'group-start', id: 'g-search', title: '流式折叠技术规范调研', parentId: 'g-env' },
  { type: 'tool-input-start', id: 'search-1', toolName: 'google_search', title: '调研 Web 树形 Timeline 设计', parentId: 'g-search' },
  { type: 'tool-output', id: 'search-1', output: [
    { title: "Vue 3 组合式 API 高阶用法与实践", url: "https://vuejs.org", snippet: "本指南介绍如何利用 inject/provide 及递归挂载，优雅开发具有树形层级连接线的 Timeline 混合折叠组件。" },
    { title: "ChatGPT o1 思维链折叠机制解析", url: "https://openai.com", snippet: "o1 在流式生成步骤时，会把已完成的大步骤自动折叠，仅保留当前的活跃大组展开，降低大量日志对屏幕空间占用的负担。" }
  ]},
  { type: 'group-end', id: 'g-search' },
  { type: 'group-start', id: 'g-read-conf', title: '验证本地打包器环境', parentId: 'g-env' },
  { type: 'tool-input-start', id: 'file-1', toolName: 'read_file', title: '读取本地配置文件 vite.config.js', input: { path: 'vite.config.js' }, parentId: 'g-read-conf' },
  { type: 'tool-output', id: 'file-1', output: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()]
})` },
  { type: 'group-end', id: 'g-read-conf' },
  { type: 'group-end', id: 'g-env' },
  { type: 'group-start', id: 'g-refactor', title: '第二阶段：智能体组件重构' },
  { type: 'group-start', id: 'g-patch', title: '重构库组件入口导出', parentId: 'g-refactor' },
  { type: 'tool-input-start', id: 'diff-1', toolName: 'replace_file_content', title: '追加组件树导出', parentId: 'g-patch' },
  { type: 'tool-output', id: 'diff-1', output: `@@ -1,3 +1,5 @@
 export * from './components/ChainOfThought'
+export { default as AgentTrace } from './components/AgentTrace/AgentTrace.vue'
+export { default as GroupTraceNode } from './components/AgentTrace/renderers/GroupTraceNode.vue'
` },
  { type: 'group-end', id: 'g-patch' },
  { type: 'group-start', id: 'g-approve', title: '敏感构建目录清理', parentId: 'g-refactor' },
  { type: 'tool-input-start', id: 'approve-demo', toolName: 'execute_command', title: '清空编译输出目录 dist/', input: { command: 'rm -rf dist/' }, parentId: 'g-approve' },
  { type: 'tool-approval-request', id: 'approve-demo' },
  { type: 'tool-output', id: 'approve-demo', output: '\x1b[32m[SUCCESS] 成功清除构建缓存目录: dist/\x1b[0m' },
  { type: 'group-end', id: 'g-approve' },
  { type: 'group-start', id: 'g-build', title: '编译器打包构建与校验', parentId: 'g-refactor' },
  { type: 'tool-input-start', id: 'cmd-build-new', toolName: 'execute_command', title: '执行打包构建', input: { command: 'npm run build' }, parentId: 'g-build' },
  { type: 'tool-output', id: 'cmd-build-new', output: `\x1B[90mvite v5.4.21 building for production...\x1B[0m
\x1B[32m✓ 34 modules transformed.\x1B[0m
\x1B[36mdist/yuan-ui.es.js   12.45 kB │ gzip: 4.12 kB\x1B[0m
\x1B[32;1m[SUCCESS] 打包库编译完成，无任何警告。\x1B[0m` },
  { type: 'group-end', id: 'g-build' },
  { type: 'group-end', id: 'g-refactor' },
  { type: 'text-delta', delta: "# 智能体多级 Grouping 与渐进收缩折叠报告\n\n" },
  { type: 'text-delta', delta: "我们已经在优化后，让 `AgentTrace` 成功具备了类似 **ChatGPT (o1) 与 CodeX 级别**的思维链特质，包含两大革命性提升：\n\n" },
  { type: 'text-delta', delta: "1. **递归树形多级嵌套 Group 机制**：支持无限级树形结构（如大分组嵌套子分组，子分组包含工具或推理）。子级在视觉上缩进排列，左侧配有极细的代码引导折叠虚线（Dashed Guideline），层级感犹如现代 IDE，赏心悦目。\n" },
  { type: 'text-delta', delta: "2. **滚动渐进式折叠策略 (Progressive Collapse)**：采用同级注意力坍缩算法。当任意层级下有新的活跃节点开启时，该层级内所有已完成（Complete）的兄弟大步骤/子步骤会被自动平滑收纳折叠，时刻保证页面高度在视口黄金阅读区内，彻底解决多轮工具调用带来的页面撑爆问题。\n\n" },
  { type: 'text-delta', delta: "这项升级真正突破了 MVP 的限制，使交互体验完美迈入顶级工业级生产力 AI产品序列！" },
  { type: 'finish' }
]
