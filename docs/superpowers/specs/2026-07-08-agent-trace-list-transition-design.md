# AgentTraceList 平滑折叠与排列过渡设计规范

本文档定义了 `AgentTraceList` 列表容器及其子节点在折叠（注意力坍缩）和新增流式节点时的平滑位移过渡设计规范。

## 1. 第一性原理与剃刀原理背景

- **第一性原理**：思维链路的动态坍缩（折叠已完成的同级节点）是为了保持用户的视觉关注焦点在活跃节点上。因此，这一折叠动作本身应该是一个温和、连续的过渡，而不是突兀的、让下方兄弟节点瞬间闪烁和跳跃的机械动作。
- **剃刀原理**：利用 Vue 内建的 `<TransitionGroup>` 排列过渡（`v-move`），通过最少且最纯粹的 CSS 类名配置，在渲染层实现自适应的高度滑移位移，无需在 JS 层面进行复杂的绝对定位计算和 DOM 轮询监听，消除多余的过渡逻辑噪音。

---

## 2. 详细设计方案

### 2.1 AgentTraceList 结构重构
我们将重构 `src/components/AgentTrace/AgentTraceList.vue` 的模板结构，将子节点渲染包裹在 `<TransitionGroup>` 内，并指定统一的过渡 name 为 `yuan-list`：

```html
<template>
  <TransitionGroup 
    name="yuan-list" 
    tag="div" 
    class="yuan-agent-trace-list"
  >
    <template v-for="node in currentLevelNodes" :key="node.id">
      <!-- 递归渲染 Group 节点 -->
      <GroupTraceNodeComponent 
        v-if="node.kind === 'group'" 
        v-bind="node" 
        :all-nodes="props.nodes" 
      >
        <AgentTraceList 
          :nodes="props.nodes" 
          :parent-id="node.id" 
          :max-output-length="maxOutputLength"
        />
      </GroupTraceNodeComponent>
      
      <!-- 普通推理节点 -->
      <ReasoningTraceNode v-else-if="node.kind === 'reasoning'" v-bind="node" />
      
      <!-- 普通工具节点 -->
      <template v-else-if="node.kind === 'tool'">
        <slot :name="`tool:${node.toolName}`" :node="node">
          <ToolTraceNode v-bind="node" :max-output-length="maxOutputLength" />
        </slot>
      </template>
      
      <!-- 产物节点 -->
      <ArtifactTraceNode v-else-if="node.kind === 'artifact'" v-bind="node" />
      
      <!-- 纯文本节点 -->
      <TextTraceNode v-else-if="node.kind === 'text'" v-bind="node" />
    </template>
  </TransitionGroup>
</template>
```

### 2.2 视觉过渡 CSS 设计
在 `AgentTraceList.vue` 的样式表中新增 `yuan-list` 系列的过渡规则：
- **`v-move` 排列过渡**：在高度突变时，对其余同级兄弟节点应用平滑的位置变换（`transform`），以 `0.32s` 的贝塞尔缓动缓慢推进。
- **`v-enter` 与 `v-leave`**：配合节点自身产生和折叠消亡，完成柔和的渐入渐出。在 `yuan-list-leave-active` 时使用 `position: absolute`，释放其物理占位，以便其他节点能在第一时间触发 `move` 动画。

```css
/* 容器布局移动平滑过渡 */
.yuan-list-move {
  transition: transform 0.32s cubic-bezier(0.25, 1, 0.5, 1);
}

/* 列表节点渐入动画 */
.yuan-list-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.yuan-list-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

/* 列表节点离开动画 */
.yuan-list-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  position: absolute;
  width: 100%;
}
.yuan-list-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
```

---

## 3. 验证计划

- **模拟运行验证**：打开 `http://localhost:5174/`，运行模拟大工作流。当大步骤完成并自动折叠时，观察下方的兄弟步骤是否是以渐入的形式慢慢滑动上升，确认列表没有发生任何生硬像素抖动。
- **单元测试验证**：运行 `npm run test`，确保原有的级联过滤与逻辑判定测试 100% 通过。
