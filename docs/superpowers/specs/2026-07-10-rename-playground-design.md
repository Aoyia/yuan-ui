# 设计文档：项目与组件库重命名为“AiStream-vue”

本项目旨在将整个组件库及 Playground 的名称进行深度重构：
1. **项目与包名**：将原“Yuan UI”（包名 `yuan-ui`）重构为“AiStream-vue”（包名 `aistream-vue`），突出其专门为 AI 智能体和流式渲染服务的定位。
2. **组件重命名**：
   - 将思维链轨迹组件 `AgentTrace` 重命名为 `AsThoughtChain`（包括其子组件 `AsThoughtChainTrigger`、`AsThoughtChainContent`、`AsThoughtChainList` 等，前缀 `As` 代表 **A**i **S**tream）。
   - 将流式 Markdown 渲染组件 `StreamMarkdownRenderer` 重命名为 `AsMarkdown`。
3. **Playground 页面同步**：顶栏文字和网页标题同步修改，右侧切换按钮修改为 `AsMarkdown` 和 `AsThoughtChain`。

为了降低对现有非 Scope 样式的破坏性风险，我们将**保持底层的 CSS 类名前缀（`.yuan-`）和 CSS 变量前缀（`--yuan-`）不变**，只在源码物理文件名、核心类/组件导出名、Hook 命名以及 Playground 和包配置中实施重命名。

## 变更范围

### 1. 物理重命名（使用 Git 移动文件）
我们将执行以下文件重命名：
- `src/components/StreamMarkdownRenderer` -> `src/components/AsMarkdown`
- `src/components/StreamMarkdownRenderer/StreamMarkdownRenderer.vue` -> `src/components/AsMarkdown/AsMarkdown.vue`
- `src/components/AgentTrace` -> `src/components/AsThoughtChain`
- `src/components/AgentTrace/AgentTrace.vue` -> `src/components/AsThoughtChain/AsThoughtChain.vue`
- `src/components/AgentTrace/AgentTraceContent.vue` -> `src/components/AsThoughtChain/AsThoughtChainContent.vue`
- `src/components/AgentTrace/AgentTraceList.vue` -> `src/components/AsThoughtChain/AsThoughtChainList.vue`
- `src/components/AgentTrace/AgentTraceTrigger.vue` -> `src/components/AsThoughtChain/AsThoughtChainTrigger.vue`
- `src/components/AgentTrace/useAgentTraceStream.ts` -> `src/components/AsThoughtChain/useAsThoughtChainStream.ts`

### 2. 配置文件修改

#### [MODIFY] [package.json](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/package.json)
- 修改 `name` 为 `aistream-vue`。
- 修改 `main`, `module`, `exports` 路径中的 `yuan-ui` 为 `aistream-vue`。

#### [MODIFY] [vite.config.js](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/vite.config.js)
- 修改 `lib.name` 为 `AiStreamVue`。
- 修改 `lib.fileName` 中的输出包名为 `aistream-vue`。

#### [MODIFY] [vite.demo.config.js](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/vite.demo.config.js)
- 修改 `base` 为 `/aistream-vue/`。

### 3. 组件内部代码与导出重命名

#### [MODIFY] [src/index.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/index.ts)
- 更新导出路径为新的物理文件夹。
- 保证对外导出的组件为 `AsMarkdown`、`AsThoughtChain`、`AsThoughtChainTrigger`、`AsThoughtChainContent`、`AsThoughtChainList` 等。

#### [MODIFY] [src/components/AsMarkdown/index.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AsMarkdown/index.ts)
- 将导出重命名为 `AsMarkdown`。

#### [MODIFY] [src/components/AsThoughtChain/index.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AsThoughtChain/index.ts)
- 更改导出为 `AsThoughtChain` 相关的子组件。

#### [MODIFY] [src/components/AsThoughtChain/context.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AsThoughtChain/context.ts)
- 将 `AgentTraceKey` 修改为 `AsThoughtChainKey`。

### 4. Playground 与展示页面修改

#### [MODIFY] [playground/App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)
- 将导入组件由 `StreamMarkdownRenderer`, `AgentTrace` 等修改为 `AsMarkdown` 和 `AsThoughtChain` 体系。
- 将顶栏文字变更为 `AiStream-vue - 思维链与 Markdown 流式渲染`。
- 两个切换 Tab 按钮名称变更为：`AsMarkdown` 和 `AsThoughtChain`。

#### [MODIFY] [playground/components/RendererDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/RendererDemo.vue)
- 更改组件引用为 `AsMarkdown`。

#### [MODIFY] [playground/components/TraceDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/TraceDemo.vue)
- 更改组件引用为 `AsThoughtChain` 体系，并将 `useAgentTraceStream` 变更为 `useAsThoughtChainStream`。

#### [MODIFY] [index.html](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/index.html)
- 将 `<title>` 更改为 `AiStream-vue - 思维链与 Markdown 流式渲染`。

#### [MODIFY] [README.md](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/README.md)
- 更新整个库的文档，使用新包名 `aistream-vue` 和新组件名 `AsMarkdown` / `AsThoughtChain`。

## 验证计划

### 自动化测试
- 运行本地测试 `npm run test` 以确保重命名后不会破坏测试用例。
- 需要将测试文件的导入和断言一并更新为新的组件名称。

### 手动验证
- 运行本地开发服务器，打开 Playground 页面，验证顶栏、标题及切换按钮名字正确无误。
- 确保思维链和 Markdown 渲染的两个 Demo 在点击切换和触发模拟时无报错，功能完好。
