# Playground 瘦身与组件库 CSS 样式 BEM 规范化重构 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Playground 的庞大样式和结构进行拆分解耦，瘦身 App.vue，同时重构组件库 CSS 为不带 scoped 的规范 BEM 命名空间，增强用户样式可覆盖性与主题定制体验。

**架构：**
1. 提取 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue) 中约 850 行 CSS 到 [playground/style.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/style.css)。
2. 将 Playground 的两个功能面板逻辑分别抽离至 [playground/components/TraceDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/TraceDemo.vue) 和 [playground/components/RendererDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/RendererDemo.vue)，使得 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue) 仅处理 Tab 切换。
3. 移除 `src/components/AgentTrace/*.vue` 组件的 `scoped` 属性，并将内部所有类名改为 `yuan-` 前缀的 BEM 命名。

**技术栈：** Vue 3, Vite, TypeScript, Vitest

---

### 任务 1：Playground 静态样式剥离

**文件：**
*   创建：`playground/style.css`
*   修改：`playground/main.ts`
*   修改：`playground/App.vue`

- [ ] **步骤 1：创建全局样式文件**
    *   在 `playground` 目录下新建 `style.css`，将 `playground/App.vue` 尾部的 `<style>` 标签内的 CSS 样式全部移入其中。
- [ ] **步骤 2：在入口文件引入样式**
    *   修改 `playground/main.ts`，在首部引入该样式：
    ```typescript
    import { createApp } from 'vue'
    import App from './App.vue'
    import './style.css' // 引入样式

    createApp(App).mount('#app')
    ```
- [ ] **步骤 3：修改 App.vue，移除样式块**
    *   删除 `playground/App.vue` 中的 `<style>` 标签及其所有样式代码。
- [ ] **步骤 4：运行验证**
    *   运行：`npm run build:demo` 或 `npm run dev` 启动，观察界面，确认全局样式依然生效，且排版与重构前无二。
- [ ] **步骤 5：Commit**
    *   `git add playground/style.css playground/main.ts playground/App.vue`
    *   `git commit -m "style(playground): extract all app styles into separate style.css"`

---

### 任务 2：Playground 逻辑与组件拆分

**文件：**
*   创建：`playground/components/TraceDemo.vue`
*   创建：`playground/components/RendererDemo.vue`
*   修改：`playground/App.vue`

- [ ] **步骤 1：提取 Trace 演示组件**
    *   创建 `playground/components/TraceDemo.vue`，提取 `App.vue` 中关于 `trace` tab 的所有模版结构、导入和逻辑（包括 `useAgentTraceStream`, `useSimulator`, `scrollToBottom` 等）。
- [ ] **步骤 2：提取 Renderer 演示组件**
    *   创建 `playground/components/RendererDemo.vue`，提取 `App.vue` 中关于 `streamRenderer` tab 的所有模版结构、导入和逻辑（包括 `useSimulator` 的 markdown 模拟逻辑, `parsedComponents` 计算属性, `handleFeedback` 等）。
- [ ] **步骤 3：重构 App.vue**
    *   在 `playground/App.vue` 中引入 `TraceDemo` 和 `RendererDemo` 两个子组件。
    *   使用 `<KeepAlive>` 或直接通过 `<TraceDemo v-if="activeTab === 'trace'" />` 和 `<RendererDemo v-else />` 切换。
    *   清除原先混杂的脚本代码，使其缩短至仅保留 Tab 切换（`activeTab`、`isSwitching`、`handleTabChange`）。
- [ ] **步骤 4：运行和调试**
    *   运行项目，切换不同演示 tab 并点击“模拟运行”，确保无任何运行时控制台报错，且原有交互逻辑依然正常。
- [ ] **步骤 5：Commit**
    *   `git add playground/components/ playground/App.vue`
    *   `git commit -m "refactor(playground): extract TraceDemo and RendererDemo components to slim App.vue"`

---

### 任务 3：组件库样式 BEM 化改造

**文件：**
*   修改：`src/components/AgentTrace/AgentTrace.vue`
*   修改：`src/components/AgentTrace/AgentTraceTrigger.vue`
*   修改：`src/components/AgentTrace/AgentTraceContent.vue`
*   修改：`src/components/AgentTrace/AgentTraceList.vue`

- [ ] **步骤 1：重构 AgentTrace.vue 样式**
    *   将 `<style scoped>` 改为 `<style>`。
    *   将主类名 `.yuan-agent-trace` 明确作为命名空间的 Block 类，检查并规范任何内部无前缀的类名。
- [ ] **步骤 2：重构 AgentTraceTrigger.vue 样式**
    *   将 `<style scoped>` 改为 `<style>`。
    *   内部类名一律规范化为 `.yuan-agent-trace__trigger` 等 BEM 格式，替换掉内部可能散落的 ad-hoc 类名，并将 scoped 样式语法对应的嵌套选择器进行相应重写。
- [ ] **步骤 3：重构 AgentTraceContent.vue 样式**
    *   将 `<style scoped>` 改为 `<style>`，类名更新为 `.yuan-agent-trace__content`。
- [ ] **步骤 4：重构 AgentTraceList.vue 样式**
    *   将 `<style scoped>` 改为 `<style>`，类名更新为 `.yuan-agent-trace__list`，对子元素或状态（如 streaming 态）采用 `.yuan-agent-trace__list--streaming` 等格式。
- [ ] **步骤 5：运行打包与单元测试**
    *   运行命令：`npm run test` (验证已有的单元测试不受类名变动影响)。
    *   运行命令：`npm run build` (验证组件库编译正常，产出 `dist/style.css`)。
- [ ] **步骤 6：Commit**
    *   `git commit -am "refactor(style): transform AgentTrace components to non-scoped BEM CSS classnames"`

---

### 任务 4：全局验证与清理

**文件：**
*   无修改（仅运行验证）

- [ ] **步骤 1：运行所有测试用例**
    *   运行命令：`npm run test`。
- [ ] **步骤 2：构建验证**
    *   运行命令：`npm run build` 及 `npm run build:demo`，确保两个构建均成功无报错。
- [ ] **步骤 3：Playground 手动确认**
    *   启动本地开发服务器，测试各项智能体交互功能是否完美运行，并测试在 `.dark` 模式下样式变动是否无任何割裂。
