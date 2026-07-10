# AgentTrace 首次展开内层收缩 Bug 修复计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复当 AI 模拟结束自动折叠后，用户首次手动展开大面板时，内层 Group 步骤当着用户的面播放一次“收缩折叠”动画的交互 Bug。

**架构：**
将 `App.vue` 里的子步骤一键折叠（`collapse-all-groups`）动作的触发时机由 `traceOpen === true` (开门时) 调整为 `traceOpen === false` (关门时)，使得所有状态重置工作均在大面板关闭后的“黑暗后台”静默完成。

**技术栈：** Vue 3, Vitest

---

## 拟修改与新增文件

- [MODIFY] [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue)

---

## 详细任务步骤

### 任务 1：重构 App.vue 中一键折叠的触发时机

**文件：**
- 修改：`src/App.vue`

- [ ] **步骤 1：重构 `watch(traceOpen)` 监听器**
  将 `watch(traceOpen)` 内判定 `newVal === true` 变更为 `newVal === false`，使得面板折叠时静默收纳所有子组。

- [ ] **步骤 2：跑通自动化测试**
  运行：`npx vitest run src --exclude "**/.worktrees/**"`
  预期：全部 18 个单元测试 100% 成功。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/App.vue
  git commit -m "fix: reset inner groups to collapsed state silently when closing AgentTrace panel"
  ```
