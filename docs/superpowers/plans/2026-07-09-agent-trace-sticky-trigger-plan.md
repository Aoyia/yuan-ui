# AgentTrace Sticky 触发器优化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 优化 `AgentTrace` 组件在渲染结束自动折叠时折叠栏滑入顶栏下方被遮盖的问题。通过将触发器重构为不透明的 `sticky` 元素，使其智能吸附在顶栏下方边缘，始终可见且可随时点击。

**架构：**
1. 将 `AgentTraceTrigger.vue` 中的触发器样式重构为 `position: sticky; top: 0; z-index: 10;`。
2. 更改其背景色为自适应不透明底色 `var(--yuan-bg)`，防止与下方上滑的正文内容重叠。

**技术栈：** Vue 3 (Composition API), CSS Sticky, Vitest

---

## 拟修改与新增文件

- [MODIFY] [AgentTraceTrigger.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceTrigger.vue)

---

## 详细任务步骤

### 任务 1：重构 AgentTraceTrigger.vue 样式为 Sticky 结构

**文件：**
- 修改：`src/components/AgentTrace/AgentTraceTrigger.vue`

- [ ] **步骤 1：添加 Sticky、Z-index 及实底背景样式**
  在 `.yuan-agent-trace-header` 样式中增加 `position: sticky; top: 0; z-index: 10;` 并将背景替换为实色背景 `var(--yuan-bg)`，边框改用 `var(--yuan-border)`。

- [ ] **步骤 2：跑通自动化测试**
  运行：`npm run test`
  预期：全部 18 个测试通过。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/components/AgentTrace/AgentTraceTrigger.vue
  git commit -m "feat: make AgentTraceTrigger sticky and opaque to resolve folding visibility issue"
  ```
