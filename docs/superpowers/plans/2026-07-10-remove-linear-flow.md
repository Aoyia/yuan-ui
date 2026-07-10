# 舍弃扁平线性流功能 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 彻底移除旧版扁平树线性流功能及组件，精简应用界面逻辑，仅默认呈现新版 `AgentTrace`（List）思维链。

**架构：**
1. 物理删除 `src/components/AgentTraceLinear` 及其下的所有文件。
2. 重构 `src/App.vue`，彻底剥离 `activeTab` 状态与相关的 UI 切换组件，直接将页面渲染绑定到新版 `AgentTrace` 思维链上。
3. 清理不再使用的 CSS 样式，并运行 vitest 测试验证。

**技术栈：** Vue 3, TypeScript, Vite, Vitest

---

### 任务 1：物理删除 AgentTraceLinear 组件

**文件：**
- 删除：`src/components/AgentTraceLinear/AgentTraceLinear.vue`
- 删除：`src/components/AgentTraceLinear/LinearStepNode.vue`
- 删除：`src/components/AgentTraceLinear/index.ts`
- 删除：`src/components/AgentTraceLinear/styles.css`

- [ ] **步骤 1：执行文件删除命令**
  运行：`rm -rf src/components/AgentTraceLinear`

- [ ] **步骤 2：验证文件已删除**
  运行：`ls src/components/AgentTraceLinear`
  预期：报错或输出无此目录

- [ ] **步骤 3：Commit 物理删除**
  ```bash
  git add src/components/AgentTraceLinear
  git commit -m "refactor: physically remove AgentTraceLinear directory"
  ```

---

### 任务 2：重构 src/App.vue 中的脚本逻辑 (Script)

**文件：**
- 修改：[App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue)

- [ ] **步骤 1：清理 import 与状态**
  修改 `src/App.vue` 脚本部分：
  1. 移除 `import { AgentTraceLinear } from './components/AgentTraceLinear'`
  2. 移除 `const activeTab = ref<'trace' | 'traceLinear'>('traceLinear')`
  3. 检查是否有引用 `activeTab` 的方法或副作用，将其精简或移除。

- [ ] **步骤 2：验证编译正常**
  由于移除了 `import` 和状态，我们需要执行 TypeScript 类型检查。
  运行：`npx tsc --noEmit`
  预期：由于 template 中仍有旧的引用，此时编译应会报错（例如找不到 `activeTab`），属于预期内的中间状态。

- [ ] **步骤 3：Commit 脚本清理**
  ```bash
  git add src/App.vue
  git commit -m "refactor(App): remove AgentTraceLinear import and activeTab state"
  ```

---

### 任务 3：重构 src/App.vue 模板结构 (Template) 与样式 (CSS)

**文件：**
- 修改：[App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue)

- [ ] **步骤 1：重构模板，删除 Tab 导航与旧渲染逻辑**
  修改 `src/App.vue` 的 `<template>` 部分：
  1. 移除 Header 里的 `<div class="nav-tabs">...</div>`（第 189-210 行）。
  2. 移除场景选择器的条件判断 `v-if="activeTab === 'trace' || activeTab === 'traceLinear'"`（第 214 行），使其常驻展示。
  3. 移除左侧代码面板中多余的 Tab 绑定和文件名绑定（如 `{{ activeFileName }}` 和 `{{ activeCodeTransformed }}` 原逻辑保持正常，但检查是否受 `activeTab` 影响）。
  4. 移除右侧预览区中的条件分支判定（第 289-313 行），直接在流式思维链存在时渲染新版 `AgentTrace`：
     ```html
     <!-- 1. 新版 AgentTrace 演示 -->
     <template v-if="traceParser.nodes.value.length > 0 || traceParser.isStreaming.value">
       <AgentTrace
         v-model:open="traceOpen"
         :is-streaming="traceParser.isStreaming.value"
         :duration="traceParser.duration.value"
         @approve="onUserApprove"
         @reject="onUserReject"
         @toggle-collapse="onUserToggleCollapse"
       >
         <AgentTraceTrigger />
         <AgentTraceContent>
           <AgentTraceList :nodes="traceParser.nodes.value" />
         </AgentTraceContent>
       </AgentTrace>
     </template>
     ```

- [ ] **步骤 2：清理废弃 CSS 样式**
  修改 `src/App.vue` 的 `<style>` 部分：
  1. 移除 `.nav-tabs`、`.tab-btn`、`.tab-icon` 相关的 Tab 切换样式（第 420-475 行）。
  2. 移除 `.linear-playground-wrapper` 及其暗色主题变体样式（第 827-837 行）。

- [ ] **步骤 3：验证编译与测试**
  运行：`npx tsc --noEmit`
  预期：编译完全成功，无报错。

- [ ] **步骤 4：Commit 模板与样式变更**
  ```bash
  git add src/App.vue
  git commit -m "refactor(App): clean template and styles, remove tabs"
  ```

---

### 任务 4：运行本地单元测试验证

**文件：**
- 测试：`src/components/AgentTrace/__tests__/reducer.test.ts`
- 测试：`src/components/AgentTrace/__tests__/FileRenderer.test.ts`
- 测试：`src/components/AgentTrace/__tests__/DiffRenderer.test.ts`

- [ ] **步骤 1：运行本地单元测试**
  运行：`npx vitest run src/components/AgentTrace/__tests__/`
  预期：本地所有 AgentTrace 测试全部通过 (PASS)。

- [ ] **步骤 2：验证完成，项目运行正常**
  运行开发服务器：`npm run dev` 并在浏览器中验证界面上没有报错，默认且仅渲染 `AgentTrace (List)`，功能无异常。
