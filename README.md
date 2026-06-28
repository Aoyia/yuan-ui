# yuan-ui

一套精致的 Vue 3 UI 组件库 — Apple 风格极简设计。

## 安装

```bash
npm install yuan-ui
```

## 使用

### 1. 新版智能体轨迹展示 (AgentTrace) - 推荐

```vue
<script setup>
import { ref } from 'vue'
import {
  AgentTrace,
  AgentTraceTrigger,
  AgentTraceContent,
  AgentTraceList,
  useAgentTraceStream
} from 'yuan-ui'
import 'yuan-ui/style.css'

const traceOpen = ref(true)
const { nodes, isStreaming, duration, handleTraceEvent } = useAgentTraceStream()

// 模拟事件推送
handleTraceEvent({ type: 'reasoning-delta', delta: '正在规划步骤...' })
handleTraceEvent({ type: 'tool-input-start', id: 'cmd-1', toolName: 'execute_command' })
handleTraceEvent({ type: 'tool-output', id: 'cmd-1', output: '构建成功' })
handleTraceEvent({ type: 'finish' })
</script>

<template>
  <AgentTrace v-model:open="traceOpen" :is-streaming="isStreaming" :duration="duration">
    <AgentTraceTrigger />
    <AgentTraceContent>
      <!-- 支持使用插槽自定义特定工具的渲染 -->
      <AgentTraceList :nodes="nodes">
        <template #tool:execute_command="{ node }">
          <div class="custom-tool">自定义命令渲染: {{ node.input }}</div>
        </template>
      </AgentTraceList>
    </AgentTraceContent>
  </AgentTrace>
</template>
```

### 2. 旧版思维链 (ChainOfThought) - 兼容保留

```vue
<script setup>
import { ref } from 'vue'
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtRenderer
} from 'yuan-ui'
import 'yuan-ui/style.css'

const open = ref(true)
const nodes = ref([
  {
    id: '1',
    type: 'thought',
    label: '思考阶段',
    content: '分析中...',
    status: 'complete',
    startTime: Date.now()
  }
])
</script>

<template>
  <ChainOfThought v-model:open="open" :is-thinking="false">
    <ChainOfThoughtHeader />
    <ChainOfThoughtContent>
      <ChainOfThoughtRenderer :nodes="nodes" />
    </ChainOfThoughtContent>
  </ChainOfThought>
</template>
```

## 组件

### `<AgentTrace />`

用于展示智能体在执行任务过程中的可视化决策轨迹。
- 组件只展示推理摘要（Reasoning Summary）和执行活动（Trace Activity），默认不展示模型内部的 raw chain-of-thought。
- 支持受控和非受控展开状态。流式处理开始时会自动展开，在 `isStreaming` 结束后会自动延迟折叠（通过 `autoClose` 和 `autoCloseDelay` 控制）。
- 自定义工具节点的渲染可以通过 `#tool:<toolName>` 插槽完成扩展。

### `<ChainOfThought />`

兼容旧版 CoT 方式的思维链渲染器，已升级为通过新版 `AgentTrace` 进行桥接与向下兼容。

### `<Loading />`

Apple 风格 ♾️ 伯努利双纽线动画加载指示器。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fullScreen` | `boolean` | `false` | 全屏遮罩模式 |
| `text` | `string \| null` | `'Loading'` | 提示文本，传空可隐藏 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸档位 |
| `color` | `string` | — | 自定义流光颜色 |
| `className` | `string` | — | 附加 CSS 类名 |
| `style` | `CSSProperties` | — | 附加行内样式 |

### CSS 变量 (Design Tokens)

可通过覆盖 CSS 变量实现全局主题定制：

```css
.yuan-loading {
  --yuan-accent: #00f2fe;       /* 流光色 */
  --yuan-text-color: #94a3b8;   /* 文本色 */
  --yuan-track-opacity: 0.06;   /* 轨迹线透明度 */
  --yuan-bg: #0f1117;           /* 全屏模式背景色 */
}
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## License

MIT
