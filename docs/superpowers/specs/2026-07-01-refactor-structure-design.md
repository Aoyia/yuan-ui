# Yuan UI 代码结构重构设计规范

本项目旨在对标大厂品质的 Vue 3 智能体思维链/执行轨迹 UI 组件库。为了让核心架构更加精简，我们基于**第一性原理**移除历史残留的废弃代码，并将 React 混入的 Loading 组件转换为标准的 Vue 3 单文件组件（SFC），以确保包大小和强类型一致性。

---

## 1. 核心诉求与清理范围

### 1.1 移除已废弃的旧版组件
彻底废弃并移除 `ChainOfThought` 系列组件，不再保留历史负担。
*   **删除目录**：`src/components/ChainOfThought/` 及其下所有文件。
*   **删除文件**：`src/components/AgentTrace/legacy.ts`（用于将旧 CoT 数据格式转换适配为 AgentTrace 格式的逻辑，现在无需保留）。

### 1.2 移除关联依赖与引用
*   清理 `src/components/AgentTrace/reducer.ts` 和 `useQwenAgentStream.ts` 中对旧 CoT 模块的任何 `import`。

---

## 2. Loading 组件 Vue 3 化重构

原 `Loading` 组件采用了 React 形式的 tsx 编写方式，并引入了 `react` 依赖，重构后将转为纯正的 Vue 3 组件。

### 2.1 新建 `src/components/Loading/Loading.vue`
使用 Vue 3 SFC 重写，保留 Apple 风格的 ♾️ 伯努利双纽线动画。

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  fullScreen?: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  fullScreen: false,
  text: 'Loading',
  size: 'md',
})

const SIZE_MAP = {
  sm: { width: 64, height: 38, gap: 14, fontSize: 11 },
  md: { width: 96, height: 58, gap: 22, fontSize: 13 },
  lg: { width: 128, height: 78, gap: 28, fontSize: 15 },
}

const sizeConfig = computed(() => SIZE_MAP[props.size] || SIZE_MAP.md)

const modeClass = computed(() => props.fullScreen ? 'yuan-loading--fullscreen' : 'yuan-loading--inline')

const rootStyle = computed(() => {
  return props.color ? { '--yuan-accent': props.color } : {}
})
</script>

<template>
  <div class="yuan-loading" :class="[modeClass]" :style="rootStyle">
    <div class="yuan-loading__content" :style="{ gap: `${sizeConfig.gap}px` }">
      <svg
        class="yuan-loading__spinner"
        viewBox="0 0 100 60"
        xmlns="http://www.w3.org/2000/svg"
        :style="{ width: `${sizeConfig.width}px`, height: `${sizeConfig.height}px` }"
      >
        <defs>
          <path
            id="yuan-infinity-path"
            d="M 80.000 30.000 L 79.877 31.564 L 79.513 33.085 L 78.923 34.525 L 78.129 35.848 L 77.159 37.029 L 76.045 38.048 L 74.820 38.895 L 73.516 39.565 L 72.162 40.062 L 70.785 40.392 L 69.404 40.568 L 68.038 40.603 L 66.700 40.510 L 65.399 40.304 L 64.142 40.000 L 62.932 39.610 L 61.771 39.148 L 60.658 38.622 L 59.592 38.045 L 58.571 37.423 L 57.592 36.765 L 56.651 36.076 L 55.744 35.363 L 54.868 34.629 L 54.017 33.880 L 53.188 33.118 L 52.376 32.346 L 51.577 31.568 L 50.786 30.785 L 50.000 30.000 L 49.214 29.215 L 48.423 28.432 L 47.624 27.654 L 46.812 26.882 L 45.983 26.120 L 45.132 25.371 L 44.256 24.637 L 43.349 23.924 L 42.408 23.235 L 41.429 22.577 L 40.408 21.955 L 39.342 21.378 L 38.229 20.852 L 37.068 20.390 L 35.858 20.000 L 34.601 19.696 L 33.300 19.490 L 31.962 19.397 L 30.596 19.432 L 29.215 19.608 L 27.838 19.938 L 26.484 20.435 L 25.180 21.105 L 23.955 21.952 L 22.841 22.971 L 21.871 24.152 L 21.077 25.475 L 20.487 26.915 L 20.123 28.436 L 20.000 30.000 L 20.123 31.564 L 20.487 33.085 L 21.077 34.525 L 21.871 35.848 L 22.841 37.029 L 23.955 38.048 L 25.180 38.895 L 26.484 39.565 L 27.838 40.062 L 29.215 40.392 L 30.596 40.568 L 31.962 40.603 L 33.300 40.510 L 34.601 40.304 L 35.858 40.000 L 37.068 39.610 L 38.229 39.148 L 39.342 38.622 L 40.408 38.045 L 41.429 37.423 L 42.408 36.765 L 43.349 36.076 L 44.256 35.363 L 45.132 34.629 L 45.983 33.880 L 46.812 33.118 L 47.624 32.346 L 48.423 31.568 L 49.214 30.785 L 50.000 30.000 L 50.786 29.215 L 51.577 28.432 L 52.376 27.654 L 53.188 26.882 L 54.017 26.120 L 54.868 25.371 L 55.744 24.637 L 56.651 23.924 L 57.592 23.235 L 58.571 22.577 L 59.592 21.955 L 60.658 21.378 L 61.771 20.852 L 62.932 20.390 L 64.142 20.000 L 65.399 19.696 L 66.700 19.490 L 68.038 19.397 L 69.404 19.432 L 70.785 19.608 L 72.162 19.938 L 73.516 20.435 L 74.820 21.105 L 76.045 21.952 L 77.159 22.971 L 78.129 24.152 L 78.923 25.475 L 79.513 26.915 L 79.877 28.436 L 80.000 30.000 Z"
            fill="none"
            pathLength="200"
          />
        </defs>
        <use href="#yuan-infinity-path" class="yuan-loading__track" fill="none" />
        <use href="#yuan-infinity-path" class="yuan-loading__path" fill="none" />
      </svg>
      <p
        v-if="text"
        class="yuan-loading__text"
        :style="{ fontSize: `${sizeConfig.fontSize}px` }"
      >
        {{ text }}
      </p>
    </div>
  </div>
</template>

<style scoped>
@import './Loading.css';
</style>
```

### 2.2 清理 Loading 旧文件
*   删除：`src/components/Loading/Loading.jsx`
*   删除：`src/components/Loading/Loading.d.ts`
*   重命名/重写：`src/components/Loading/index.js` 为 `src/components/Loading/index.ts`：
    ```typescript
    export { default as Loading } from './Loading.vue'
    ```

---

## 3. DAG 执行轨迹组件更名 (`AgentTraceDAG`)

原 `AgentTraceV2` 组件在概念上代表的是“网状 DAG 图执行轨迹”，与 “树状 Timeline” (AgentTraceV1) 各有所长。为理清包设计并防止用户困惑，决定统一改名为 `AgentTraceDAG`。

### 3.1 移动与重命名文件
*   将 `src/components/AgentTraceV2/` 重命名为 `src/components/AgentTraceDAG/`。
*   将 `src/components/AgentTraceV2/AgentTraceDAG.vue` 保留，但将内部变量、样式名和导出逻辑与新命名同步。
*   将 `src/components/AgentTraceV2/DAGTraceNode.vue` 保留，并更新其中的组件和类型引入路径。
*   更新 `src/components/AgentTraceDAG/index.ts`：
    ```typescript
    export { default as AgentTraceDAG } from './AgentTraceDAG.vue'
    export { default as DAGTraceNode } from './DAGTraceNode.vue'
    export * from './types'
    ```

---

## 4. 全局入口与示例整合

### 4.1 更新 `src/index.ts`
```typescript
import './styles/theme.css'

export * from './components/AgentTrace'
export * from './components/AgentTrace/context'
export * from './components/AgentTrace/types'
export * from './components/AgentTraceDAG'
export * from './components/Loading'
```

### 4.2 更新 `src/App.vue`
*   将原 `import { AgentTraceDAG } from './components/AgentTraceV2'` 变更为从新路径或者打包入口导入。
*   若包含对 `Loading` 的直接调用，确保改用 Vue 的 `Loading` 组件。
