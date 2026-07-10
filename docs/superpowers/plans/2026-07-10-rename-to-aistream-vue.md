# 重命名项目为 aistream-vue 且重构核心组件实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将组件库重命名为 `aistream-vue`，并将核心组件重构重命名为 `AsMarkdown` 和 `AsThoughtChain`，同步修改 Playground 及所有代码引用，确保单元测试全部通过。

**架构：**
- 使用 `git mv` 物理重命名组件目录及核心 Vue 文件。
- 更新 `package.json`、`vite.config.js`、`vite.demo.config.js` 中的库打包和部署配置。
- 替换源码中所有的 `StreamMarkdownRenderer` ➡️ `AsMarkdown` 以及 `AgentTrace` ➡️ `AsThoughtChain` 引用（包括导出、类型及 Hook）。
- 更新测试文件，确保单元测试完美通过。

---

## 变更文件列表与职责
- [MODIFY] [package.json](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/package.json)：修改项目包名及构建产物路径。
- [MODIFY] [vite.config.js](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/vite.config.js)：修改打包库配置。
- [MODIFY] [vite.demo.config.js](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/vite.demo.config.js)：修改 Demo 站 base 部署路径。
- [MODIFY] [src/index.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/index.ts)：更新顶级组件导出。
- [NEW] [src/components/AsMarkdown/](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AsMarkdown/)：存放重构后的流式 Markdown 渲染组件。
- [NEW] [src/components/AsThoughtChain/](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AsThoughtChain/)：存放重构后的思维链组件。
- [DELETE] [src/components/StreamMarkdownRenderer/](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/StreamMarkdownRenderer/)：旧 Markdown 渲染目录（将物理移动）。
- [DELETE] [src/components/AgentTrace/](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/)：旧思维链组件目录（将物理移动）。
- [MODIFY] [playground/App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)：Playground 主入口文件，修改引用、顶栏和按钮。
- [MODIFY] [playground/components/RendererDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/RendererDemo.vue)：流式渲染 Demo 组件。
- [MODIFY] [playground/components/TraceDemo.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/components/TraceDemo.vue)：思维链 Demo 组件。
- [MODIFY] [index.html](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/index.html)：更新 Playground 网页 Title。
- [MODIFY] [README.md](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/README.md)：更新项目文档。

---

## 任务拆解

### 任务 1：物理移动与重命名组件文件

**文件：**
- 移动：`src/components/StreamMarkdownRenderer` ➡️ `src/components/AsMarkdown`
- 重命名：`src/components/AsMarkdown/StreamMarkdownRenderer.vue` ➡️ `src/components/AsMarkdown/AsMarkdown.vue`
- 重命名：`src/components/AsMarkdown/__tests__/StreamMarkdownRenderer.test.ts` ➡️ `src/components/AsMarkdown/__tests__/AsMarkdown.test.ts`
- 移动：`src/components/AgentTrace` ➡️ `src/components/AsThoughtChain`
- 重命名：`src/components/AsThoughtChain/AgentTrace.vue` ➡️ `src/components/AsThoughtChain/AsThoughtChain.vue`
- 重命名：`src/components/AsThoughtChain/AgentTraceContent.vue` ➡️ `src/components/AsThoughtChain/AsThoughtChainContent.vue`
- 重命名：`src/components/AsThoughtChain/AgentTraceList.vue` ➡️ `src/components/AsThoughtChain/AsThoughtChainList.vue`
- 重命名：`src/components/AsThoughtChain/AgentTraceTrigger.vue` ➡️ `src/components/AsThoughtChain/AsThoughtChainTrigger.vue`
- 重命名：`src/components/AsThoughtChain/useAgentTraceStream.ts` ➡️ `src/components/AsThoughtChain/useAsThoughtChainStream.ts`

- [ ] **步骤 1：执行 Markdown 渲染组件物理移动命令**
  ```bash
  git mv src/components/StreamMarkdownRenderer src/components/AsMarkdown
  git mv src/components/AsMarkdown/StreamMarkdownRenderer.vue src/components/AsMarkdown/AsMarkdown.vue
  git mv src/components/AsMarkdown/__tests__/StreamMarkdownRenderer.test.ts src/components/AsMarkdown/__tests__/AsMarkdown.test.ts
  ```

- [ ] **步骤 2：执行思维链组件物理移动命令**
  ```bash
  git mv src/components/AgentTrace src/components/AsThoughtChain
  git mv src/components/AsThoughtChain/AgentTrace.vue src/components/AsThoughtChain/AsThoughtChain.vue
  git mv src/components/AsThoughtChain/AgentTraceContent.vue src/components/AsThoughtChain/AsThoughtChainContent.vue
  git mv src/components/AsThoughtChain/AgentTraceList.vue src/components/AsThoughtChain/AsThoughtChainList.vue
  git mv src/components/AsThoughtChain/AgentTraceTrigger.vue src/components/AsThoughtChain/AsThoughtChainTrigger.vue
  git mv src/components/AsThoughtChain/useAgentTraceStream.ts src/components/AsThoughtChain/useAsThoughtChainStream.ts
  ```

- [ ] **步骤 3：Commit 移动记录**
  ```bash
  git commit -m "refactor: rename component files physically to AsMarkdown and AsThoughtChain"
  ```

---

### 任务 2：更新库配置文件以重命名为 aistream-vue

**文件：**
- 修改：`package.json`
- 修改：`vite.config.js`
- 修改：`vite.demo.config.js`

- [ ] **步骤 1：修改 package.json 中的库名称与导出**
  - 修改 `package.json` 的第 2 行 `"name": "aistream-vue"`
  - 修改第 6-7 行和第 12-14 行，将所有的 `yuan-ui.umd.js` ➡️ `aistream-vue.umd.js`，`yuan-ui.es.js` ➡️ `aistream-vue.es.js`

- [ ] **步骤 2：修改 vite.config.js 中的打包名**
  - 修改 `vite.config.js` 第 20 行 `name: 'AiStreamVue'`
  - 修改第 22 行 `fileName: (format) => \`aistream-vue.\${format}.js\``

- [ ] **步骤 3：修改 vite.demo.config.js 中的基础路径**
  - 修改 `vite.demo.config.js` 第 10 行 `base: '/aistream-vue/'`

- [ ] **步骤 4：运行 `npm run build` 测试打包能否顺利生成 `dist/aistream-vue.es.js`**
  - 预期：生成符合规范的打包文件且无报错。

- [ ] **步骤 5：Commit 配置文件更新**
  ```bash
  git add package.json vite.config.js vite.demo.config.js
  git commit -m "build: rename library to aistream-vue in build configurations"
  ```

---

### 任务 3：更新源码中的引用与重命名组件内部逻辑

**文件：**
- 修改：`src/index.ts`
- 修改：`src/components/AsMarkdown/index.ts`
- 修改：`src/components/AsMarkdown/AsMarkdown.vue`
- 修改：`src/components/AsMarkdown/useStreamRenderer.ts`
- 修改：`src/components/AsThoughtChain/index.ts`
- 修改：`src/components/AsThoughtChain/context.ts`
- 修改：`src/components/AsThoughtChain/types.ts`
- 修改：`src/components/AsThoughtChain/useAsThoughtChainStream.ts`
- 修改：`src/components/AsThoughtChain/useQwenAgentStream.ts`
- 修改：`src/components/AsThoughtChain/reducer.ts`
- 修改：`src/components/AsThoughtChain/AsThoughtChain.vue`
- 修改：`src/components/AsThoughtChain/AsThoughtChainContent.vue`
- 修改：`src/components/AsThoughtChain/AsThoughtChainList.vue`
- 修改：`src/components/AsThoughtChain/AsThoughtChainTrigger.vue`
- 修改：`src/components/AsThoughtChain/renderers/ArtifactTraceNode.vue` (及其他渲染器中的导入)

- [ ] **步骤 1：重构 `src/index.ts`**
  - 将所有指向 `AgentTrace` 和 `StreamMarkdownRenderer` 的导出更新为 `AsThoughtChain` 与 `AsMarkdown` 体系。

- [ ] **步骤 2：重构 `AsMarkdown` 组件内部引用**
  - 更新 `src/components/AsMarkdown/index.ts`，导出 `AsMarkdown`。
  - 更新 `AsMarkdown.vue` 内部的 Vue 组件名称定义为 `AsMarkdown`。

- [ ] **步骤 3：重构 `AsThoughtChain` 组件内部引用**
  - 更新 `context.ts`：将 `AgentTraceKey` 修改为 `AsThoughtChainKey`。
  - 更新 `reducer.ts`、`types.ts`、`useAsThoughtChainStream.ts`、`useQwenAgentStream.ts` 将所有的 `AgentTrace` 字样更新为 `AsThoughtChain` 体系。
  - 更新 `AsThoughtChain.vue`、`AsThoughtChainContent.vue`、`AsThoughtChainList.vue`、`AsThoughtChainTrigger.vue` 的组件定义、内部逻辑以及 slots/provide 等。

- [ ] **步骤 4：Commit 源码引用更新**
  ```bash
  git add src/
  git commit -m "refactor: update all codebase imports and export definitions for AsMarkdown and AsThoughtChain"
  ```

---

### 任务 4：更新 Playground 页面及 Demo 引用

**文件：**
- 修改：`playground/App.vue`
- 修改：`playground/components/RendererDemo.vue`
- 修改：`playground/components/TraceDemo.vue`
- 修改：`index.html`

- [ ] **步骤 1：更新 playground/App.vue 顶栏与导入**
  - 将导入库由 `StreamMarkdownRenderer` ➡️ `AsMarkdown`，`AgentTrace` ➡️ `AsThoughtChain` 体系。
  - 将顶栏 brand-text 替换为 `AiStream-vue - 思维链与 Markdown 流式渲染`。
  - 将两个 Tab 按钮文案替换为 `AsMarkdown` 和 `AsThoughtChain`。

- [ ] **步骤 2：更新 Demo 中的组件标签**
  - 更新 `playground/components/RendererDemo.vue` 里的组件标签为 `<AsMarkdown />`。
  - 更新 `playground/components/TraceDemo.vue` 里的组件标签为 `<AsThoughtChain>`、`<AsThoughtChainTrigger>`、`<AsThoughtChainContent>`、`<AsThoughtChainList>`。
  - 将 `TraceDemo.vue` 引入的 hook `useAgentTraceStream` 替换为 `useAsThoughtChainStream`。

- [ ] **步骤 3：更新 index.html 的网页标题**
  - 将 `<title>` 更改为 `AiStream-vue - 思维链与 Markdown 流式渲染`。

- [ ] **步骤 4：Commit Playground 更改**
  ```bash
  git add playground/ index.html
  git commit -m "refactor(playground): update demo imports, names, and titles to AiStream-vue"
  ```

---

### 任务 5：更新文档与单元测试并验证

**文件：**
- 修改：`README.md`
- 修改：`src/components/AsMarkdown/__tests__` 下的所有测试文件
- 修改：`src/components/AsThoughtChain/__tests__` 下的所有测试文件

- [ ] **步骤 1：更新 README.md 中的使用说明**
  - 将所有的包名 `yuan-ui` 替换为 `aistream-vue`。
  - 将快速开始示例中的组件名替换为 `AsMarkdown`、`AsThoughtChain` 等。

- [ ] **步骤 2：重构单元测试的导入和断言**
  - 更新 `src/components/AsMarkdown/__tests__/` 和 `src/components/AsThoughtChain/__tests__/` 下的所有测试文件，确保它们导入新的组件名称。

- [ ] **步骤 3：运行单元测试进行验证**
  - 运行命令：`npm run test`
  - 预期：所有单元测试（包括 Markdown 渲染和思维链流程）顺利通过，无报错。

- [ ] **步骤 4：运行本地开发服务器测试**
  - 运行命令：`npm run dev`
  - 预期：Playground 成功启动，在浏览器中切换 `AsMarkdown` 和 `AsThoughtChain` 正常，流式渲染与思维链轨迹模拟运行完美。

- [ ] **步骤 5：Commit 并完成工作**
  ```bash
  git add README.md src/components/AsMarkdown/__tests__/ src/components/AsThoughtChain/__tests__/
  git commit -m "test: update test cases and documentation for AiStream-vue rename"
  ```

---

## 验证计划

### 自动化测试
- 运行 `npm run test`，确认所有测试通过。

### 手动验证
- 启动 `npm run dev`，浏览器访问 `http://localhost:5173/`。
- 确认顶栏展示为 `AiStream-vue - 思维链与 Markdown 流式渲染`。
- 确认 Tab 按钮名称为 `AsMarkdown` 和 `AsThoughtChain`。
- 确认两个演示功能运行逻辑正常，无 JS 报错。
