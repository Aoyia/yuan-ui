# 快速开始

Yuan UI 是一套完全数据驱动、面向高阶 AI Agent 工作流开发的 Vue 3 组件库。它提供了强大的思维链/执行轨迹展示、终端模拟器、Diff 对比面板以及敏感操作的审批机制。

## 安装

你可以通过各种主流的包管理器来安装：

```bash
npm install yuan-ui @lucide/vue @vueuse/core
# 或使用 pnpm
pnpm add yuan-ui @lucide/vue @vueuse/core
```

## 快速使用

在你的入口文件（如 `main.ts` 或 `App.vue`）中引入组件和样式：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  AgentTrace,
  AgentTraceTrigger,
  AgentTraceContent,
  AgentTraceList,
  useAgentTraceStream
} from 'yuan-ui'

// 1. 引入样式 (内含全局变量定义)
import 'yuan-ui/dist/style.css'

// 2. 初始化流式状态解析器
const trace = useAgentTraceStream()

// 3. 在需要的地方分发流式事件
// trace.handleTraceEvent({ type: 'reasoning-delta', delta: '正在分析...' })
</script>

<template>
  <div class="chat-container">
    <AgentTrace
      v-model:open="isOpen"
      :is-streaming="trace.isStreaming.value"
      :duration="trace.duration.value"
    >
      <AgentTraceTrigger />
      <AgentTraceContent>
        <AgentTraceList :nodes="trace.nodes.value" />
      </AgentTraceContent>
    </AgentTrace>
  </div>
</template>
```

## 主题与样式覆盖

Yuan UI 抽取了公共的全局主题变量，这使得定制配色非常容易。你只需要在你的本地 CSS 中复写对应的 CSS 变量即可：

```css
/* 自定义你的 Primary 主题色和圆角 */
:root {
  --yuan-primary: #8b5cf6;       /* 紫色 */
  --yuan-primary-hover: #7c3aed;
  --yuan-primary-light: #f5f3ff;
  --yuan-radius: 12px;           /* 更加圆润的外观 */
}
```
