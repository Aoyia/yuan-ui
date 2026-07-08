# AgentTraceList 过渡动效打磨实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `AgentTraceList` 列表容器中引入平滑的高度折叠与子节点排列过渡（Layout Move Transition），避免因“注意力坍缩”折叠旧步骤时发生像素抖动和闪烁。

**架构：**
1. 将 `AgentTraceList.vue` 中单纯的列表容器改用 Vue 的 `<TransitionGroup name="yuan-list">`。
2. 编写 `yuan-list` 的 `v-move`、`v-enter-active` 和 `v-leave-active` CSS 过渡属性。
3. 利用绝对定位的物理释放，确保同级节点能在同一时间点被触发平滑滑移。

**技术栈：** Vue 3 (Composition API), CSS Transitions, Vitest

---

## 拟修改与新增文件

- [MODIFY] [AgentTraceList.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTrace/AgentTraceList.vue)

---

## 详细任务步骤

### 任务 1：重构 AgentTraceList.vue 引入 TransitionGroup 与过渡 CSS

**文件：**
- 修改：`src/components/AgentTrace/AgentTraceList.vue`

- [ ] **步骤 1：重构模板层，用 TransitionGroup 替换原生 div**
  将 `<div class="yuan-agent-trace-list">` 改为 `<TransitionGroup name="yuan-list" tag="div" class="yuan-agent-trace-list">`。

- [ ] **步骤 2：添加 CSS 布局位移过渡规则**
  在 `<style scoped>` 中新增 `.yuan-list-move` 等过渡样式，保证兄弟节点在高度变化时能自动平滑移动。

- [ ] **步骤 3：跑通现有的单元测试**
  运行：`npm run test`
  预期：全部 18 个测试通过，无逻辑错误。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/AgentTraceList.vue
  git commit -m "feat: integrate TransitionGroup move animations into AgentTraceList"
  ```
