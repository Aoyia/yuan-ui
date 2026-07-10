# 设计文档：Playground 瘦身与组件库 CSS 样式 BEM 规范化重构

本文档定义了 Yuan UI Playground 演示页面的组件化拆分方案，以及组件库本身的 CSS 样式体系由 `scoped` 转向 `BEM 规范` 的技术规格。

## 背景与目的
目前 Playground 的 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue) 包含了近 1300 行代码，其中 CSS 样式占比超过 2/3，导致代码臃肿、难以阅读和维护。另外，组件库的 CSS 样式当前使用了 SFC 中的 `<style scoped>`，使得外部用户在使用组件库时覆盖及定制样式极为困难。
为了提升 Playground 的可读性与可维护性，以及提升组件库的主题可定制性，需要进行以下重构。

---

## 1. Playground 重构规格

### 1.1 结构拆分
我们将 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue) 的两个演示 tab（新版 AgentTrace 和流式 Markdown VNode 渲染）拆分为两个独立的单文件组件：

*   **[TraceDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/TraceDemo.vue)**：
    *   **职责**：负责“新版 AgentTrace (List)”演示模块。
    *   **状态与逻辑**：
        *   调用 `useAgentTraceStream()`。
        *   使用 `useSimulator(traceParser)` 并传入 trace 解析器，绑定 `startSimulation` 和 `handleReset` 控制行为。
        *   维护 `traceOpen` 的展开收起状态，以及场景选择逻辑。
        *   提供文档渲染正文，并监听变化执行滚动锚底 `scrollToBottom`。
*   **[RendererDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/RendererDemo.vue)**：
    *   **职责**：负责“流式 VNode 渲染 (Renderer)”演示模块。
    *   **状态与逻辑**：
        *   使用 `useSimulator(null)` 的 Markdown 模拟输出状态（`streamText`、`isMarkdownStreaming`、`notification`、`selectedTemplate` 等）。
        *   实现 AST Token 安全拦截监视器的解析计算（`parsedComponents`）。
        *   渲染并传入 `StreamMarkdownRenderer`，并在捕获到 Zod 校验失败时触发自我纠错机制（`handleFeedback`）。
*   **[App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)**：
    *   **职责**：全局入口与 Tab 切换。
    *   **逻辑**：仅保留全局顶栏和基于 `activeTab` 切换的组件动态挂载。

### 1.2 样式提取
*   **[playground.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/style.css)**（或写为 `style.css`）：
    *   将原 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue) 中所有的样式（以 `.demo-workbench` 开始，直至文件结尾）提取至此全局 CSS 文件中。
    *   在 [playground/main.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/main.ts) 中通过 `import './style.css'` 引入。

---

## 2. 组件库 CSS 样式 BEM 规范化重构规格

### 2.1 样式非 Scoped 化
*   将 `src/components/AgentTrace` 组件下的四个 SFC 文件：
    1.  [AgentTrace.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTrace.vue)
    2.  [AgentTraceContent.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceContent.vue)
    3.  [AgentTraceList.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceList.vue)
    4.  [AgentTraceTrigger.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceTrigger.vue)
    中的 `<style scoped>` 变更为普通的 `<style>` 标签。

### 2.2 BEM 命名约定
所有组件内部采用以 `yuan-` 开头的 BEM 规范命名，废弃原先散乱的局部类名，建立清晰的层级命名。
具体命名映射表：

| 组件名称 | 原类名/结构 | 重构后的 BEM 类名 | 说明 |
| :--- | :--- | :--- | :--- |
| **AgentTrace** | `.yuan-agent-trace` | `.yuan-agent-trace` | 根 Block |
| **AgentTraceTrigger** | 各种局部类 | `.yuan-agent-trace__trigger` | 触发器 Element |
| **AgentTraceContent** | 各种局部类 | `.yuan-agent-trace__content` | 内容容器 Element |
| **AgentTraceList** | 各种局部类 | `.yuan-agent-trace__list` | 列表 Block/Element |
| **状态修饰符** | - | `.yuan-agent-trace--streaming` | 流式运行中的 Modifier 状态 |

组件内引用 CSS 变量方式维持不变，以继续支持通过 [theme.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/styles/theme.css) 的定制。

---

## 3. 验证与测试方案
*   **构建验证**：运行 `npm run build` 和 `npm run build:demo`，确保没有任何 Typescript 或编译打包错误，样式打包输出正常。
*   **功能对齐**：使用 Playground 进行手动验证，确保拆分后：
    1.  Tab 切换流畅，两个面板在运行模拟时功能完全与重构前一致。
    2.  Markdown 流式渲染的 Zod 纠错功能、沙箱拦截与滚动锚底在不同组件下工作正常。
