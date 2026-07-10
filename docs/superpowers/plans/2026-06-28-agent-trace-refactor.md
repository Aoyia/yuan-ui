# Agent Trace 重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将当前 `ChainOfThought` 从 demo 型“硬编码思维链渲染器”重构为生产级 `AgentTrace` 组件，用于展示类似 Cursor 的智能体执行过程：推理摘要、工具调用、文件/命令/搜索活动、产物和最终正文状态。

**架构：** 新增 `AgentTrace` 作为数据模型和 UI 原语层，保留 `ChainOfThought` 作为兼容入口。核心拆分为三层：流式事件 reducer 负责状态归一化，展示组件负责折叠、时间线和状态样式，工具渲染器通过默认组件和插槽扩展。组件默认展示 reasoning summary / trace activity，不展示模型内部 raw chain-of-thought。

**技术栈：** Vue 3 SFC、Composition API、TypeScript、Vite library build、Vitest 纯函数测试、`@lucide/vue` 图标、`@vueuse/core` 的受控/非受控状态。

---

## 背景与问题

当前实现集中在 `src/components/ChainOfThought`：

- `src/components/ChainOfThought/ChainOfThoughtRenderer.vue` 同时承担节点循环、工具名判断、图标选择、文案生成和工具详情展示。
- `src/components/ChainOfThought/useAgentStreamParser.ts` 同时承担流式事件解析、节点状态机、标题生成、工具输出归并和正文流切换。
- `src/components/ChainOfThought/types.ts` 只有 `thought`、`tool_call`、`image`、`text`，无法表达审批、失败、取消、部分输入、部分输出、被拒绝、敏感内容脱敏。
- `src/index.d.ts` 只导出 `Loading` 类型，和 `src/index.js` 的实际导出不一致。

生产级目标不是直接展示完整模型内部思维链，而是展示可解释、可控、可审计的执行轨迹。组件命名建议从 `ChainOfThoughtRenderer` 收敛到 `AgentTrace` 或 `ReasoningTimeline`，其中 `ChainOfThought` 继续作为兼容别名存在。

## 参考资料

- 本地参考：`ai-elements-vue/packages/elements/src/reasoning/*`
- 本地参考：`ai-elements-vue/packages/elements/src/tool/*`
- 官方文档：[AI Elements Reasoning](https://elements.ai-sdk.dev/components/reasoning)
- 官方文档：[AI Elements Tool](https://elements.ai-sdk.dev/components/tool)
- 官方文档：[OpenAI Reasoning guide](https://platform.openai.com/docs/guides/reasoning)

## 文件结构

创建：

- `src/components/AgentTrace/types.ts`：生产级 trace 节点、事件、状态类型。
- `src/components/AgentTrace/reducer.ts`：纯函数事件归一化和状态机。
- `src/components/AgentTrace/useAgentTraceStream.ts`：Vue composable，包装 reducer 并暴露响应式状态。
- `src/components/AgentTrace/context.ts`：折叠状态、streaming、duration 的 provide/inject。
- `src/components/AgentTrace/AgentTrace.vue`：根组件，管理受控/非受控展开状态。
- `src/components/AgentTrace/AgentTraceTrigger.vue`：头部触发器，显示 streaming / duration 状态。
- `src/components/AgentTrace/AgentTraceContent.vue`：折叠内容容器。
- `src/components/AgentTrace/AgentTraceList.vue`：节点分发器，提供具名插槽扩展工具渲染。
- `src/components/AgentTrace/renderers/ReasoningTraceNode.vue`：推理摘要节点。
- `src/components/AgentTrace/renderers/ToolTraceNode.vue`：通用工具节点。
- `src/components/AgentTrace/renderers/ArtifactTraceNode.vue`：图片、文件、链接等产物节点。
- `src/components/AgentTrace/renderers/TextTraceNode.vue`：普通文本节点。
- `src/components/AgentTrace/legacy.ts`：旧 `AgentStepNode` 到新 `AgentTraceNode` 的适配。
- `src/components/AgentTrace/index.ts`：统一导出。
- `src/components/AgentTrace/__tests__/reducer.test.ts`：reducer 单测。

修改：

- `src/components/ChainOfThought/ChainOfThoughtRenderer.vue`：改成兼容 wrapper，内部调用 `AgentTraceList`。
- `src/components/ChainOfThought/index.ts`：导出新旧兼容能力。
- `src/index.js`：导出 `AgentTrace`。
- `src/index.d.ts`：补齐 `ChainOfThought` 和 `AgentTrace` 类型导出。
- `package.json`：新增 `test` 脚本和 Vitest 依赖。
- `src/App.vue`：把 demo 改成新 `AgentTrace` API，同时保留兼容示例。

## 核心类型

```ts
export type TraceStatus = 'pending' | 'active' | 'complete' | 'error' | 'cancelled'

export type ToolTraceState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied'

export type AgentTraceVisibility = 'summary' | 'details' | 'redacted'

export interface AgentTraceBaseNode {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text'
  title: string
  status: TraceStatus
  startedAt: number
  endedAt?: number
  duration?: number
}

export interface ReasoningTraceNode extends AgentTraceBaseNode {
  kind: 'reasoning'
  summary: string
  visibility: AgentTraceVisibility
}

export interface ToolTraceNode extends AgentTraceBaseNode {
  kind: 'tool'
  toolName: string
  state: ToolTraceState
  input?: unknown
  output?: unknown
  errorText?: string
  metadata?: Record<string, unknown>
}

export interface ArtifactTraceNode extends AgentTraceBaseNode {
  kind: 'artifact'
  artifactType: 'image' | 'file' | 'link'
  url?: string
  caption?: string
}

export interface TextTraceNode extends AgentTraceBaseNode {
  kind: 'text'
  content: string
}

export type AgentTraceNode =
  | ReasoningTraceNode
  | ToolTraceNode
  | ArtifactTraceNode
  | TextTraceNode
```

## 目标 API

```vue
<AgentTrace
  v-model:open="traceOpen"
  :is-streaming="isStreaming"
  :duration="duration"
>
  <AgentTraceTrigger />
  <AgentTraceContent>
    <AgentTraceList :nodes="nodes">
      <template #tool:google_search="{ node }">
        <SearchTraceNode :node="node" />
      </template>

      <template #tool:execute_command="{ node }">
        <CommandTraceNode :node="node" />
      </template>
    </AgentTraceList>
  </AgentTraceContent>
</AgentTrace>
```

兼容入口：

```vue
<ChainOfThought v-model:open="open" :is-thinking="isThinking">
  <ChainOfThoughtHeader />
  <ChainOfThoughtContent>
    <ChainOfThoughtRenderer :nodes="legacyNodes" />
  </ChainOfThoughtContent>
</ChainOfThought>
```

---

### 任务 1：新增生产级类型模型

**文件：**

- 创建：`src/components/AgentTrace/types.ts`
- 创建：`src/components/AgentTrace/index.ts`
- 修改：`src/index.js`

- [ ] **步骤 1：创建类型文件**

在 `src/components/AgentTrace/types.ts` 写入“核心类型”章节中的类型定义，并补充事件类型：

```ts
export type AgentTraceEvent =
  | { type: 'reasoning-delta'; id?: string; delta: string; title?: string }
  | { type: 'tool-input-start'; id: string; toolName: string; input?: unknown; title?: string }
  | { type: 'tool-input-delta'; id: string; inputDelta: unknown }
  | { type: 'tool-output'; id: string; output?: unknown; errorText?: string }
  | { type: 'artifact'; id?: string; artifactType: 'image' | 'file' | 'link'; title: string; url?: string; caption?: string }
  | { type: 'text-delta'; id?: string; delta: string; title?: string }
  | { type: 'finish' }
  | { type: 'reset' }
```

- [ ] **步骤 2：创建导出入口**

在 `src/components/AgentTrace/index.ts` 写入：

```ts
export * from './types'
```

- [ ] **步骤 3：导出组件模块**

在 `src/index.js` 增加：

```js
export * from './components/AgentTrace'
```

- [ ] **步骤 4：运行构建验证类型语法**

运行：`npm run build`

预期：Vite build 成功，未出现 TypeScript 或 Vue SFC 语法错误。

- [ ] **步骤 5：Commit**

```bash
git add src/components/AgentTrace/types.ts src/components/AgentTrace/index.ts src/index.js
git commit -m "feat: add agent trace types"
```

### 任务 2：实现 reducer 状态机并添加单测

**文件：**

- 创建：`src/components/AgentTrace/reducer.ts`
- 创建：`src/components/AgentTrace/__tests__/reducer.test.ts`
- 修改：`package.json`

- [ ] **步骤 1：安装测试依赖并增加脚本**

运行：

```bash
npm install -D vitest
```

修改 `package.json`：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "prepublishOnly": "npm run build"
  }
}
```

- [ ] **步骤 2：先写 reducer 测试**

在 `src/components/AgentTrace/__tests__/reducer.test.ts` 写入：

```ts
import { describe, expect, it } from 'vitest'
import { createAgentTraceState, reduceAgentTraceEvent } from '../reducer'

describe('reduceAgentTraceEvent', () => {
  it('appends reasoning summary deltas into one active reasoning node', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'reasoning-delta', delta: '分析需求' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'reasoning-delta', delta: '，确认组件边界' }, 1500)

    expect(state.nodes).toHaveLength(1)
    expect(state.nodes[0]).toMatchObject({
      kind: 'reasoning',
      status: 'active',
      summary: '分析需求，确认组件边界',
    })
    expect(state.isStreaming).toBe(true)
  })

  it('closes active reasoning when a tool starts', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'reasoning-delta', delta: '需要读取配置' }, 1000)
    state = reduceAgentTraceEvent(
      state,
      { type: 'tool-input-start', id: 'tool-1', toolName: 'read_file', input: { path: 'vite.config.js' } },
      2500,
    )

    expect(state.nodes[0]).toMatchObject({
      kind: 'reasoning',
      status: 'complete',
      duration: 2,
    })
    expect(state.nodes[1]).toMatchObject({
      kind: 'tool',
      toolName: 'read_file',
      state: 'input-available',
      status: 'active',
    })
  })

  it('updates matching tool output without relying on list order', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'search', toolName: 'google_search' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'cmd', toolName: 'execute_command' }, 1200)
    state = reduceAgentTraceEvent(state, { type: 'tool-output', id: 'search', output: [{ title: 'Vue docs' }] }, 2000)

    expect(state.nodes.find(node => node.id === 'search')).toMatchObject({
      kind: 'tool',
      status: 'complete',
      state: 'output-available',
      output: [{ title: 'Vue docs' }],
    })
    expect(state.nodes.find(node => node.id === 'cmd')).toMatchObject({
      kind: 'tool',
      status: 'active',
      state: 'input-available',
    })
  })

  it('marks tool output errors as error nodes', () => {
    let state = createAgentTraceState()

    state = reduceAgentTraceEvent(state, { type: 'tool-input-start', id: 'cmd', toolName: 'execute_command' }, 1000)
    state = reduceAgentTraceEvent(state, { type: 'tool-output', id: 'cmd', errorText: 'Command failed' }, 2000)

    expect(state.nodes[0]).toMatchObject({
      kind: 'tool',
      status: 'error',
      state: 'output-error',
      errorText: 'Command failed',
    })
  })
})
```

- [ ] **步骤 3：运行测试验证失败**

运行：`npm test -- --runInBand`

预期：FAIL，报错包含 `Cannot find module '../reducer'`。

- [ ] **步骤 4：实现 reducer**

在 `src/components/AgentTrace/reducer.ts` 实现：

```ts
import type { AgentTraceEvent, AgentTraceNode, ToolTraceNode } from './types'

export interface AgentTraceState {
  nodes: AgentTraceNode[]
  content: string
  isStreaming: boolean
  duration?: number
  startedAt?: number
}

export function createAgentTraceState(): AgentTraceState {
  return {
    nodes: [],
    content: '',
    isStreaming: false,
  }
}

function secondsBetween(startedAt: number, endedAt: number) {
  return Math.ceil((endedAt - startedAt) / 1000)
}

function closeActiveNodes(nodes: AgentTraceNode[], now: number): AgentTraceNode[] {
  return nodes.map((node) => {
    if (node.status !== 'active') {
      return node
    }

    return {
      ...node,
      status: 'complete',
      endedAt: now,
      duration: secondsBetween(node.startedAt, now),
    }
  })
}

export function reduceAgentTraceEvent(
  state: AgentTraceState,
  event: AgentTraceEvent,
  now = Date.now(),
): AgentTraceState {
  if (event.type === 'reset') {
    return createAgentTraceState()
  }

  const startedAt = state.startedAt ?? now

  if (event.type === 'finish') {
    return {
      ...state,
      nodes: closeActiveNodes(state.nodes, now),
      isStreaming: false,
      duration: secondsBetween(startedAt, now),
    }
  }

  if (event.type === 'reasoning-delta') {
    const activeReasoning = state.nodes.findLast(
      node => node.kind === 'reasoning' && node.status === 'active',
    )

    if (activeReasoning?.kind === 'reasoning') {
      return {
        ...state,
        isStreaming: true,
        startedAt,
        nodes: state.nodes.map(node =>
          node.id === activeReasoning.id
            ? { ...node, summary: node.summary + event.delta }
            : node,
        ),
      }
    }

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: [
        ...state.nodes,
        {
          id: event.id ?? `reasoning-${state.nodes.length + 1}`,
          kind: 'reasoning',
          title: event.title ?? '分析问题',
          status: 'active',
          startedAt: now,
          summary: event.delta,
          visibility: 'summary',
        },
      ],
    }
  }

  if (event.type === 'tool-input-start') {
    const node: ToolTraceNode = {
      id: event.id,
      kind: 'tool',
      title: event.title ?? event.toolName,
      status: 'active',
      startedAt: now,
      toolName: event.toolName,
      state: event.input === undefined ? 'input-streaming' : 'input-available',
      input: event.input,
    }

    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: [...closeActiveNodes(state.nodes, now), node],
    }
  }

  if (event.type === 'tool-output') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: state.nodes.map((node) => {
        if (node.id !== event.id || node.kind !== 'tool') {
          return node
        }

        return {
          ...node,
          status: event.errorText ? 'error' : 'complete',
          state: event.errorText ? 'output-error' : 'output-available',
          output: event.output,
          errorText: event.errorText,
          endedAt: now,
          duration: secondsBetween(node.startedAt, now),
        }
      }),
    }
  }

  if (event.type === 'artifact') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      nodes: [
        ...closeActiveNodes(state.nodes, now),
        {
          id: event.id ?? `artifact-${state.nodes.length + 1}`,
          kind: 'artifact',
          artifactType: event.artifactType,
          title: event.title,
          status: 'complete',
          startedAt: now,
          endedAt: now,
          duration: 0,
          url: event.url,
          caption: event.caption,
        },
      ],
    }
  }

  if (event.type === 'text-delta') {
    return {
      ...state,
      isStreaming: true,
      startedAt,
      content: state.content + event.delta,
    }
  }

  return state
}
```

- [ ] **步骤 5：运行测试验证通过**

运行：`npm test`

预期：4 个 reducer 测试通过。

- [ ] **步骤 6：Commit**

```bash
git add package.json package-lock.json src/components/AgentTrace/reducer.ts src/components/AgentTrace/__tests__/reducer.test.ts
git commit -m "test: cover agent trace reducer"
```

### 任务 3：实现 AgentTrace 根组件和上下文

**文件：**

- 创建：`src/components/AgentTrace/context.ts`
- 创建：`src/components/AgentTrace/AgentTrace.vue`
- 创建：`src/components/AgentTrace/AgentTraceTrigger.vue`
- 创建：`src/components/AgentTrace/AgentTraceContent.vue`
- 修改：`src/components/AgentTrace/index.ts`

- [ ] **步骤 1：实现上下文**

在 `src/components/AgentTrace/context.ts` 写入：

```ts
import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

export interface AgentTraceContextValue {
  isOpen: Ref<boolean>
  isStreaming: Ref<boolean>
  duration: Ref<number | undefined>
  setIsOpen: (value: boolean) => void
}

export const AgentTraceKey: InjectionKey<AgentTraceContextValue> = Symbol('AgentTraceContext')

export function useAgentTraceContext() {
  const context = inject(AgentTraceKey)
  if (!context) {
    throw new Error('AgentTrace components must be used within <AgentTrace>')
  }
  return context
}
```

- [ ] **步骤 2：实现根组件**

在 `src/components/AgentTrace/AgentTrace.vue` 实现受控展开、streaming 自动展开和结束后延迟收起。默认 `autoCloseDelay` 为 `1200`。

- [ ] **步骤 3：实现触发器**

`AgentTraceTrigger.vue` 默认文案：

- streaming：`正在处理...`
- duration 存在：`已完成，用时 {{ duration }} 秒`
- duration 不存在：`执行轨迹`

- [ ] **步骤 4：实现内容容器**

`AgentTraceContent.vue` 使用现有 `ChainOfThoughtContent.vue` 的 grid 折叠动画，但 class 前缀改为 `yuan-agent-trace-*`，避免样式语义继续绑定 `cot`。

- [ ] **步骤 5：更新导出**

`src/components/AgentTrace/index.ts` 增加：

```ts
export { default as AgentTrace } from './AgentTrace.vue'
export { default as AgentTraceTrigger } from './AgentTraceTrigger.vue'
export { default as AgentTraceContent } from './AgentTraceContent.vue'
export * from './context'
```

- [ ] **步骤 6：运行构建**

运行：`npm run build`

预期：构建通过。

- [ ] **步骤 7：Commit**

```bash
git add src/components/AgentTrace
git commit -m "feat: add agent trace shell"
```

### 任务 4：实现节点列表和默认渲染器

**文件：**

- 创建：`src/components/AgentTrace/AgentTraceList.vue`
- 创建：`src/components/AgentTrace/renderers/ReasoningTraceNode.vue`
- 创建：`src/components/AgentTrace/renderers/ToolTraceNode.vue`
- 创建：`src/components/AgentTrace/renderers/ArtifactTraceNode.vue`
- 创建：`src/components/AgentTrace/renderers/TextTraceNode.vue`
- 修改：`src/components/AgentTrace/index.ts`

- [ ] **步骤 1：实现列表分发器**

`AgentTraceList.vue` 接收：

```ts
interface Props {
  nodes: AgentTraceNode[]
  maxOutputLength?: number
}
```

工具节点插槽规则：

```vue
<slot
  v-if="node.kind === 'tool'"
  :name="`tool:${node.toolName}`"
  :node="node"
>
  <ToolTraceNode :node="node" :max-output-length="props.maxOutputLength" />
</slot>
```

- [ ] **步骤 2：实现推理摘要节点**

`ReasoningTraceNode.vue` 只展示 `summary`。当 `visibility === 'redacted'` 时显示 `推理内容已隐藏`。

- [ ] **步骤 3：实现工具节点**

`ToolTraceNode.vue` 默认展示：

- title：`node.title`
- badge：由 `node.state` 派生中文状态
- input：JSON pretty print，默认折叠
- output：字符串截断到 `maxOutputLength`，对象 JSON pretty print
- error：使用红色弱提示区域展示 `errorText`

- [ ] **步骤 4：实现产物节点**

`ArtifactTraceNode.vue` 处理：

- image：展示缩略图和 caption
- file：展示文件名/链接
- link：展示外链

- [ ] **步骤 5：实现文本节点**

`TextTraceNode.vue` 使用 `white-space: pre-wrap` 展示普通文本内容。

- [ ] **步骤 6：导出渲染器**

`src/components/AgentTrace/index.ts` 增加：

```ts
export { default as AgentTraceList } from './AgentTraceList.vue'
export { default as ReasoningTraceNode } from './renderers/ReasoningTraceNode.vue'
export { default as ToolTraceNode } from './renderers/ToolTraceNode.vue'
export { default as ArtifactTraceNode } from './renderers/ArtifactTraceNode.vue'
export { default as TextTraceNode } from './renderers/TextTraceNode.vue'
```

- [ ] **步骤 7：运行构建**

运行：`npm run build`

预期：构建通过。

- [ ] **步骤 8：Commit**

```bash
git add src/components/AgentTrace
git commit -m "feat: render agent trace nodes"
```

### 任务 5：实现流式 composable

**文件：**

- 创建：`src/components/AgentTrace/useAgentTraceStream.ts`
- 修改：`src/components/AgentTrace/index.ts`

- [ ] **步骤 1：实现 composable**

`useAgentTraceStream.ts` 包装 reducer：

```ts
import { computed, ref } from 'vue'
import type { AgentTraceEvent } from './types'
import { createAgentTraceState, reduceAgentTraceEvent } from './reducer'

export function useAgentTraceStream() {
  const state = ref(createAgentTraceState())

  const nodes = computed(() => state.value.nodes)
  const content = computed(() => state.value.content)
  const isStreaming = computed(() => state.value.isStreaming)
  const duration = computed(() => state.value.duration)

  function handleTraceEvent(event: AgentTraceEvent) {
    state.value = reduceAgentTraceEvent(state.value, event)
  }

  function reset() {
    state.value = reduceAgentTraceEvent(state.value, { type: 'reset' })
  }

  return {
    state,
    nodes,
    content,
    isStreaming,
    duration,
    handleTraceEvent,
    reset,
  }
}
```

- [ ] **步骤 2：导出 composable**

`src/components/AgentTrace/index.ts` 增加：

```ts
export * from './useAgentTraceStream'
```

- [ ] **步骤 3：运行测试和构建**

运行：

```bash
npm test
npm run build
```

预期：reducer 测试通过，构建通过。

- [ ] **步骤 4：Commit**

```bash
git add src/components/AgentTrace/useAgentTraceStream.ts src/components/AgentTrace/index.ts
git commit -m "feat: add agent trace stream composable"
```

### 任务 6：兼容旧 ChainOfThoughtRenderer

**文件：**

- 创建：`src/components/AgentTrace/legacy.ts`
- 修改：`src/components/ChainOfThought/ChainOfThoughtRenderer.vue`
- 修改：`src/components/ChainOfThought/index.ts`

- [ ] **步骤 1：实现旧节点适配**

`legacy.ts` 导出：

```ts
import type { AgentStepNode } from '../ChainOfThought/types'
import type { AgentTraceNode } from './types'

export function mapLegacyAgentStepNode(node: AgentStepNode): AgentTraceNode {
  if (node.type === 'tool_call' && node.toolCall) {
    return {
      id: node.id,
      kind: 'tool',
      title: node.label,
      status: node.status === 'active' ? 'active' : 'complete',
      startedAt: node.startTime,
      duration: node.duration,
      toolName: node.toolCall.name,
      state: node.toolCall.status === 'failed'
        ? 'output-error'
        : node.toolCall.status === 'complete'
          ? 'output-available'
          : 'input-available',
      input: node.toolCall.arguments,
      output: node.toolCall.output ?? node.toolCall.results,
      errorText: node.toolCall.status === 'failed' ? String(node.toolCall.output ?? '工具执行失败') : undefined,
      metadata: {
        filePath: node.toolCall.filePath,
        command: node.toolCall.command,
        results: node.toolCall.results,
      },
    }
  }

  if (node.type === 'image') {
    return {
      id: node.id,
      kind: 'artifact',
      title: node.label,
      status: 'complete',
      startedAt: node.startTime,
      duration: node.duration,
      artifactType: 'image',
      url: node.imageUrl,
      caption: node.imageCaption,
    }
  }

  return {
    id: node.id,
    kind: 'reasoning',
    title: node.label,
    status: node.status,
    startedAt: node.startTime,
    duration: node.duration,
    summary: node.content,
    visibility: 'summary',
  }
}
```

- [ ] **步骤 2：改造 renderer 为 wrapper**

`ChainOfThoughtRenderer.vue` 接收旧 `nodes`，computed 映射为新节点，模板只调用 `AgentTraceList`。保留 `#tool:*` 插槽透传。

- [ ] **步骤 3：更新导出**

`src/components/ChainOfThought/index.ts` 增加：

```ts
export { mapLegacyAgentStepNode } from '../AgentTrace/legacy'
```

- [ ] **步骤 4：运行测试和构建**

运行：

```bash
npm test
npm run build
```

预期：测试通过，构建通过，旧 demo 不出现导入错误。

- [ ] **步骤 5：Commit**

```bash
git add src/components/AgentTrace/legacy.ts src/components/ChainOfThought/ChainOfThoughtRenderer.vue src/components/ChainOfThought/index.ts
git commit -m "refactor: route chain of thought renderer through agent trace"
```

### 任务 7：更新类型声明和 demo

**文件：**

- 修改：`src/index.d.ts`
- 修改：`src/App.vue`
- 修改：`README.md`

- [ ] **步骤 1：补齐类型声明**

`src/index.d.ts` 至少导出：

```ts
export * from './components/AgentTrace'
export * from './components/ChainOfThought'
export { Loading } from './components/Loading/Loading'
export type { LoadingProps } from './components/Loading/Loading'
```

- [ ] **步骤 2：更新 demo**

`src/App.vue` 使用：

```ts
import {
  AgentTrace,
  AgentTraceContent,
  AgentTraceList,
  AgentTraceTrigger,
  useAgentTraceStream,
} from './components/AgentTrace'
```

demo 事件改为 `AgentTraceEvent`：

```ts
{ type: 'reasoning-delta', delta: '正在分析组件边界...' }
{ type: 'tool-input-start', id: 'search-1', toolName: 'google_search', input: { query: 'AI reasoning UI component' } }
{ type: 'tool-output', id: 'search-1', output: [{ title: 'AI Elements Reasoning', url: 'https://elements.ai-sdk.dev/components/reasoning' }] }
{ type: 'finish' }
```

- [ ] **步骤 3：更新 README**

增加 `AgentTrace` 章节，明确说明：

- 组件展示执行轨迹和推理摘要。
- 默认不展示模型内部完整 raw chain-of-thought。
- 自定义工具渲染通过 `#tool:<toolName>` 插槽完成。
- 旧 `ChainOfThought` 仍可用，但新项目推荐 `AgentTrace`。

- [ ] **步骤 4：运行测试和构建**

运行：

```bash
npm test
npm run build
```

预期：测试通过，构建通过。

- [ ] **步骤 5：Commit**

```bash
git add src/index.d.ts src/App.vue README.md
git commit -m "docs: document agent trace usage"
```

## 验收标准

- `npm test` 通过 reducer 单测。
- `npm run build` 成功生成库产物。
- `AgentTrace` 支持受控和非受控展开状态。
- streaming 开始时自动展开，finish 后根据配置延迟折叠。
- `AgentTraceList` 能渲染 reasoning、tool、artifact、text 四类节点。
- 工具节点支持默认渲染，也支持 `#tool:<toolName>` 定制。
- 旧 `ChainOfThoughtRenderer` 继续接受 `AgentStepNode[]`。
- 文档明确说明“展示推理摘要和执行轨迹，不展示模型内部完整 raw chain-of-thought”。

## 执行方式

计划已保存到 `docs/superpowers/plans/2026-06-28-agent-trace-refactor.md`。两种执行方式：

**1. 子代理驱动（推荐）**：每个任务调度一个新的子代理，任务间进行审查，适合这类跨类型、状态机、组件 API 的重构。

**2. 内联执行**：在当前会话中使用 executing-plans 执行任务，批量执行并设检查点。
