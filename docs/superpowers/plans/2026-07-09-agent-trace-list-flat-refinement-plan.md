# AgentTrace 极简平铺与回滚实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 彻底回滚并移除 `AgentTraceList` 上的 `<TransitionGroup>` 列表动画以解决初始渲染时元素大面积重叠的 Bug；同时回滚 `AgentTraceTrigger` 的 `sticky` 粘性定位，回归最坚固稳定的原生文档流平铺。

**架构：**
1. 还原 `AgentTraceList.vue` 的列表容器为原生的 `div`，彻底删除相关的过渡动画样式。
2. 还原 `AgentTraceTrigger.vue` 的 `.yuan-agent-trace-header` 为普通的静态定位，去除 Z-index 与粘性定位。

**技术栈：** Vue 3 (Composition API), CSS, Vitest

---

## 拟修改与新增文件

- [MODIFY] [AgentTraceList.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceList.vue)
- [MODIFY] [AgentTraceTrigger.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceTrigger.vue)

---

## 详细任务步骤

### 任务 1：回滚还原组件的平铺样式与结构

**文件：**
- 修改：`src/components/AgentTrace/AgentTraceList.vue`
- 修改：`src/components/AgentTrace/AgentTraceTrigger.vue`

- [ ] **步骤 1：回滚 `AgentTraceList.vue`**
  将 `<TransitionGroup name="yuan-list" tag="div" ...>` 恢复为 `<div class="yuan-agent-trace-list">`。删除 `<style scoped>` 中所有关于 `yuan-list-move` 等过渡规则。

- [ ] **步骤 2：回滚 `AgentTraceTrigger.vue`**
  移除 `.yuan-agent-trace-header` 中的 `position: sticky; top: 0; z-index: 10;` 以及不透明背景，恢复最纯粹的原生文档流排版。

- [ ] **步骤 3：跑通单元测试**
  运行：`npx vitest run src --exclude "**/.worktrees/**"`
  预期：全部 18 个测试 100% 通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/AgentTraceList.vue src/components/AgentTrace/AgentTraceTrigger.vue
  git commit -m "feat: rollback TransitionGroup and sticky triggers to use flat static flow"
  ```
