<script setup>
import { ref } from 'vue'
import { useAgentTraceStream } from '../../src/index'

const trace = useAgentTraceStream()
const traceOpen = ref(true)

function triggerSimulation() {
  trace.reset()
  trace.handleTraceEvent({ type: 'group-start', id: 'g-init', title: '大步骤一：网络状态扫描' })
  trace.handleTraceEvent({ type: 'reasoning-delta', delta: '正在检测本地网络代理，准备拉取 API 规范...', parentId: 'g-init' })
  trace.handleTraceEvent({ type: 'tool-input-start', id: 'search-opt', toolName: 'google_search', title: '调研 Web 最佳实践', parentId: 'g-init' })
  trace.handleTraceEvent({ type: 'tool-output', id: 'search-opt', output: [
    { title: "VitePress Custom Themes Guide", url: "https://vitepress.dev" },
    { title: "CSS Grid Row Height Transitions", url: "https://mdn.mozilla.org" }
  ]})
  trace.handleTraceEvent({ type: 'group-end', id: 'g-init' })
  
  // 开启新步骤，旧步骤 g-init 自动折叠！
  trace.handleTraceEvent({ type: 'group-start', id: 'g-build', title: '大步骤二：项目编译与打包' })
  trace.handleTraceEvent({ type: 'tool-input-start', id: 'cmd-opt', toolName: 'execute_command', title: '执行库文件打包', input: { command: 'npm run build' }, parentId: 'g-build' })
  trace.handleTraceEvent({ type: 'tool-output', id: 'cmd-opt', output: '\x1B[32m✓ 79 modules transformed.\x1B[0mdist/yuan-ui.es.js  50.14 kB\x1B[32;1m\n[SUCCESS] Build finished successfully!\x1B[0m' })
  trace.handleTraceEvent({ type: 'group-end', id: 'g-build' })
  
  trace.handleTraceEvent({ type: 'finish' })
}

const demoCode = `<template>
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
</template>`
</script>

# AgentTrace 执行轨迹

用于渲染智能体（Agent）复杂的执行状态。包括大步骤/子步骤嵌套树（Group）、终端日志 ANSI 彩色解析、Diff 差异行对比、Google Search 卡片渲染，以及阻断性的双向 Human-in-the-loop 审批流。

---

## 实时交互演示

请在下方直接点击 **“开始仿真执行”** 按钮。你可以在文档站中直接把玩组件（尝试手动点击展开 Group 文件夹、查看终端 ANSI 色彩日志等）：

<DemoBox 
  title="VitePress 内置 Live 预览沙盒" 
  description="此 Demo 直接使用组件库源码运行。点击按钮即可查看流式生成和旧步骤组自动渐进折叠（Progressive Collapse）的视觉效果。"
  :code="demoCode"
>
  <div style="width: 100%; display: flex; flex-direction: column; gap: 14px; padding: 0.5rem 0;">
    <button 
      type="button"
      @click="triggerSimulation" 
      style="width: fit-content; padding: 0.35rem 0.85rem; background-color: var(--vp-c-brand-1); color: #fff; border-radius: 6px; border: none; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;"
      onmouseover="this.style.opacity=0.9"
      onmouseout="this.style.opacity=1"
    >
      开始仿真流式执行
    </button>
    <div style="border: 1px solid rgba(0,0,0,0.04); border-radius: 8px; padding: 0.75rem; width: 100%;">
      <AgentTrace 
        v-model:open="traceOpen" 
        :is-streaming="trace.isStreaming.value" 
        :duration="trace.duration.value"
      >
        <AgentTraceTrigger />
        <AgentTraceContent>
          <AgentTraceList :nodes="trace.nodes.value" />
        </AgentTraceContent>
      </AgentTrace>
    </div>
  </div>
</DemoBox>

---

## API 参考

### `<AgentTrace />`

根组件，用于向下 provide 组件上下文，并管理展开/折叠。

#### Props

| 参数 | 说明 | 类型 | 默认值 |
| :--- | :--- | :--- | :--- |
| `open` / `v-model:open` | 组件是否折叠展开 | `boolean` | `false` |
| `defaultOpen` | 默认是否展开 | `boolean` | `false` |
| `autoClose` | 流式执行结束后，是否在指定延迟后自动折叠 | `boolean` | `true` |
| `autoCloseDelay` | 自动折叠的延迟毫秒数 | `number` | `1200` |
| `isStreaming` | 智能体是否处于活跃工作状态 | `boolean` | `false` |
| `duration` | 总执行耗时（秒） | `number` | `undefined` |

#### Events

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `approve` | 内部有工具请求敏感操作，且用户点击“同意”时触发 | `(nodeId: string)` |
| `reject` | 用户点击“拒绝授权”时触发 | `(payload: { nodeId: string, reason?: string })` |
| `toggle-collapse` | 用户手动点击分组的 Chevron 时触发 | `(nodeId: string)` |

---

### `<AgentTraceTrigger />`

控制折叠状态的头部触发器，自动根据 `isStreaming` 和 `duration` 显示“正在处理”、“已完成用时X秒”或“执行轨迹”文字。

---

### `<AgentTraceContent />`

内容包裹层。利用 `grid-template-rows` 缓动，实现极其平滑的高度过渡滑动动画，内部限制了 `max-height: 280px` 与自带轻量自定义滚动条，防止多轮执行撑破布局。

---

### `<AgentTraceList />`

核心节点渲染列表分发器。

#### Props

| 参数 | 说明 | 类型 | 默认值 |
| :--- | :--- | :--- | :--- |
| `nodes` | 流式解析器积攒的扁平节点数组 | `AgentTraceNode[]` | `[]` |
| `maxOutputLength` | 默认 JSON fallback 渲染器截断最大字数 | `number` | `1000` |

#### Slots

支持通过具名插槽来完全接管任意特定工具的 UI 表现形式：

| 插槽名 | 说明 | 参数 |
| :--- | :--- | :--- |
| `tool:[toolName]` | 匹配到指定 `toolName` 时接管其渲染 | `{ node: ToolTraceNode }` |

例如，接管 `read_file` 的自定义渲染：
```vue
<AgentTraceList :nodes="nodes">
  <template #tool:read_file="{ node }">
    <div class="custom-file-viewer">
      文件名：{{ node.input.path }}
    </div>
  </template>
</AgentTraceList>
```
