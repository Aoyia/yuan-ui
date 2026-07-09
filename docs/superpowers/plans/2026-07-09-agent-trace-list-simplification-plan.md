# AgentTraceList 平铺化与去复杂化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 按照用户“不要搞那么复杂，直接元素平铺”的明确指示，彻底移除 `AgentTraceList.vue` 中的 `<TransitionGroup>` 过渡，恢复为最纯粹、稳定的标准 `div` 平铺，解决初次渲染时节点在绝对定位下发生重叠和塌陷的 Bug。

**架构：**
1. 还原 `AgentTraceList.vue` 中的列表包裹器，将 `<TransitionGroup>` 恢复为 `div.yuan-agent-trace-list`。
2. 彻底删除 `AgentTraceList.vue` 中所有 `.yuan-list-` 开头的 CSS 过渡和移动动画样式，移除 `position: absolute` 的重叠隐患。

**技术栈：** Vue 3, CSS, Vitest

---

## 拟修改与新增文件

- [MODIFY] [AgentTraceList.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceList.vue)

---

## 详细任务步骤

### 任务 1：还原 AgentTraceList.vue 为标准平面平铺结构

**文件：**
- 修改：`src/components/AgentTrace/AgentTraceList.vue`

- [ ] **步骤 1：将模板中的 TransitionGroup 恢复为 div 容器**
  将 `<TransitionGroup name="yuan-list" tag="div" class="yuan-agent-trace-list">` 替换回 `<div class="yuan-agent-trace-list">`    。

- [ ] **步骤 2：删除样式表中所有的过渡动画类名**
  在 `<style scoped>` 中清除 `.yuan-list-move`、`.yuan-list-enter-active`、`.yuan-list-leave-active` 等全部过渡样式定义，保持样式清爽。

- [ ] **步骤 3：跑通自动化测试**
  运行：`npx vitest run src --exclude "**/.worktrees/**"`
  预期：所有测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/AgentTraceList.vue
  git commit -m "feat: simplify AgentTraceList to flat elements by removing TransitionGroup"
  ```
