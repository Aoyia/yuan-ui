# AgentTraceList 平铺与极简定位重构规范

本文档定义了回滚 `AgentTraceList` 上的 `<TransitionGroup>` 动画，以及回滚 `AgentTraceTrigger` 上的 `sticky` 吸附定位，回归最坚固稳定的原生文档流平铺方案。

## 1. 第一性原理与剃刀原理自省

- **回归第一性**：组件库的第一生命线是渲染的绝对准确和结构稳定。递归树形列表嵌套 `<TransitionGroup>` 绝对定位会导致层级上下文丢失，从而在流式渲染初期引起不可接受的节点大面积重合 Bug。
- **应用剃刀**：如无必要，勿增实体。删除复杂的 `position: sticky` 吸附及过渡动画，只保留最稳定的平铺机制。滚动抖动问题交给在 `App.vue` 中已经实现的“保护浏览器原生滚动锚定”逻辑，保持代码极致清爽。

---

## 2. 详细重构方案

### 2.1 还原 AgentTraceList 稳定平铺结构
将 `src/components/AgentTrace/AgentTraceList.vue` 回滚，删除 `<TransitionGroup>`，用回原生 `div`，并移除 CSS 中的过渡规则：
```html
<template>
  <div class="yuan-agent-trace-list">
    <template v-for="node in currentLevelNodes" :key="node.id">
      <!-- 递归及节点渲染逻辑保持不变 -->
      ...
    </template>
  </div>
</template>
```

### 2.2 还原 AgentTraceTrigger 静态文档流
修改 `src/components/AgentTrace/AgentTraceTrigger.vue` 的 CSS 样式，去除 `sticky` 等粘性定位和 Z-index 属性，使其静静地以平铺文档流呈现：
```css
.yuan-agent-trace-header {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.35rem 0.2rem; /* 恢复原 padding */
  font-size: 0.75rem;
  font-weight: 500;
  color: #86868b;
  background: transparent; /* 恢复透明背景 */
  border: none;
  border-bottom: 1px solid var(--yuan-border);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  user-select: none;
  margin-bottom: 0.5rem;
}
```

---

## 3. 验证计划
- 运行 `npm run test` 进行最终单元测试运行，排除 worktree 并确保所有测试 100% 成功。
- 在本地浏览器验证渲染，确认没有任何元素重叠，且折叠操作在平铺文档流下极其流畅。
