# 对标 Cursor 体验的 Composer 风格 AgentTrace 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将已有的 `AgentTrace` 系列组件进行 UI/UX 精细化重构，对标 Cursor Composer 的 Timeline 卡片展示风格，实现统一聚合折叠、流式计时呼吸灯、就地限高滚动以及极致高利用率排版。

**架构：** 在 Vue 3 中，通过全局 Context 提供动态正计时状态，配合 CSS Grid 高度动画、微动效关键帧、自定义滚动条与透明渐变遮罩，实现极简视觉静默。

**技术栈：** Vue 3, Vite, Vitest, Lucide Icons, CSS Grid, Vanilla CSS

---

### 任务 1：全局状态与动态计时器重构

**文件：**
- 修改：`src/components/AgentTrace/context.ts`
- 修改：`src/components/AgentTrace/AgentTrace.vue`

- [ ] **步骤 1：修改 Context，暴露动态耗时 state**
  在 `src/components/AgentTrace/context.ts` 中，增加暴露 `currentDuration` ref 以便子节点在流式执行时共享不断增加的秒数：
  ```typescript
  import { InjectionKey, Ref } from 'vue'
  export interface AgentTraceContext {
    isOpen: Ref<boolean>
    isStreaming: Ref<boolean>
    duration: Ref<number | undefined>
    currentDuration: Ref<number>
    setIsOpen: (val: boolean) => void
    onApprove: (nodeId: string) => void
    onReject: (nodeId: string, reason?: string) => void
    toggleCollapse: (nodeId: string) => void
  }
  export const AgentTraceKey: InjectionKey<AgentTraceContext> = Symbol('AgentTraceKey')
  ```

- [ ] **步骤 2：在 `AgentTrace.vue` 中实现累加计时器**
  修改 `AgentTrace.vue`，在 `isStreaming` 为真时开启 `setInterval` 以 100ms 频率累加计时，并将 `currentDuration` 提供给 context：
  ```typescript
  const currentDuration = ref(0)
  let timerId: any = null

  watch(() => props.isStreaming, (newVal) => {
    if (newVal) {
      currentDuration.value = 0
      timerId = setInterval(() => {
        currentDuration.value = +(currentDuration.value + 0.1).toFixed(1)
      }, 100)
    } else {
      if (timerId) {
        clearInterval(timerId)
        timerId = null
      }
    }
  }, { immediate: true })
  ```

- [ ] **步骤 3：编写测试验证**
  运行：`npm run test`
  预期：测试应该通过（现存单元测试）。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/context.ts src/components/AgentTrace/AgentTrace.vue
  git commit -m "feat: add dynamic timer and refactor context for AgentTrace"
  ```

---

### 任务 2：大容器 Header 精微美化及计时动画

**文件：**
- 修改：`src/components/AgentTrace/AgentTraceTrigger.vue`

- [ ] **步骤 1：更新 `AgentTraceTrigger.vue` 以支持动态计时与呼吸状态灯**
  替换 `AgentTraceTrigger.vue` 模板与样式。将状态点动画用 CSS `keyframes` 做柔和的心跳式呼吸（Scale & Opacity）；并在文本显示上根据流式状态动态插值显示 `currentDuration`：
  ```vue
  <script setup lang="ts">
  import { ChevronDown } from '@lucide/vue'
  import { useAgentTraceContext } from './context'
  const { isOpen, isStreaming, duration, currentDuration, setIsOpen } = useAgentTraceContext()
  </script>
  <template>
    <button type="button" class="yuan-agent-trace-header" @click="setIsOpen(!isOpen)">
      <div class="header-left">
        <div class="status-dot" :class="{ 'is-streaming': isStreaming, 'is-complete': !isStreaming && duration !== undefined }" />
        <span class="status-text">
          <slot>
            <template v-if="isStreaming">Thinking... ({{ currentDuration }}s)</template>
            <template v-else-if="duration !== undefined">Completed in {{ duration }}s</template>
            <template v-else>Agent Trace</template>
          </slot>
        </span>
      </div>
      <ChevronDown class="icon-chevron" :class="{ 'is-open': isOpen }" />
    </button>
  </template>
  ```
  样式上，降低边框与文字对比度：亮色下文字使用 `#64748b`，呼吸灯选用 `#0071e3` 并带 `animation: pulse-dot 1.8s infinite`。

- [ ] **步骤 2：运行单元测试确认无语法错误**
  运行：`npm run test`
  预期：通过。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/components/AgentTrace/AgentTraceTrigger.vue
  git commit -m "style: polish AgentTraceTrigger with dynamic clock and soft breathing indicator"
  ```

---

### 任务 3：极简 Tool 节点卡片与参数二级折叠

**文件：**
- 修改：`src/components/AgentTrace/renderers/ToolTraceNode.vue`

- [ ] **步骤 1：增加参数输入区域（Input JSON）的二级折叠控制**
  为防止复杂参数输入导致卡片占据过多纵向空间，增加 `isInputParamCollapsed = ref(true)` 状态，并使用极简小卡片来包裹参数。
  ```vue
  const isInputParamCollapsed = ref(true)
  ```
  并在模板中，对于非命令行/非文件的普通 JSON 输入，默认展示为 `[查看输入参数详情]`，点击后下拉展示。

- [ ] **步骤 2：对标 Cursor 紧凑布局微调**
  将卡片折叠高度压缩至 `28px`，标题字体大小设为 `11.5px`，边框圆角改至 `4px`。
  优化 `stateText` 徽标显示：取消抢眼的大面积色块底色，仅以文字颜色加左侧极淡的彩色呼吸小点区分。

- [ ] **步骤 3：测试通过**
  运行：`npm run test`
  预期：PASS。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/renderers/ToolTraceNode.vue
  git commit -m "style: compress ToolTraceNode and add secondary folding for arguments"
  ```

---

### 任务 4：Diff 与 Terminal 渲染器高度限制与滚动优化

**文件：**
- 修改：`src/components/AgentTrace/renderers/DiffRenderer.vue`
- 修改：`src/components/AgentTrace/renderers/TerminalRenderer.vue`

- [ ] **步骤 1：优化 `DiffRenderer.vue` 的滚动与渐变羽化效果**
  限制最大高度为 `200px`，自定义滚动条并设置其宽度为 `4px`，无背景滑轨。利用 `box-shadow` 在滚动到顶部/底部时动态进行渐变羽化：
  ```css
  .diff-body {
    max-height: 200px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }
  .dark .diff-body {
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }
  ```

- [ ] **步骤 2：调整 `TerminalRenderer.vue` 最大高度**
  将终端控制台最大高度统一设定在 `160px`，并在亮色和暗色模式下，全部使用深黑色（`#0e111a`）作为背景色，文字大小限制为 `11px`，对标 VS Code Terminal：
  ```css
  .yuan-terminal-renderer {
    background-color: #0e111a !important; /* 统一深色 */
    max-height: 200px;
  }
  ```

- [ ] **步骤 3：验证语法与基础渲染**
  运行：`npm run test`
  预期：测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTrace/renderers/DiffRenderer.vue src/components/AgentTrace/renderers/TerminalRenderer.vue
  git commit -m "style: add height limits, inline scrollbars and styled Terminal for Diff and Terminal Renderers"
  ```

---

### 任务 5：编写与丰富单元测试

**文件：**
- 修改：`src/components/AgentTrace/__tests__/AgentTrace.test.ts` (如有)

- [ ] **步骤 1：增加计时器递增与流式渲染的测试断言**
  确保能够测出 `isStreaming` 切换时，`currentDuration` 从 0 启动且大于 0：
  ```typescript
  import { mount } from '@vue/test-utils'
  import AgentTrace from '../AgentTrace.vue'
  import { vi, describe, it, expect } from 'vitest'
  // 编写测试挂载并触发 stream 状态
  ```

- [ ] **步骤 2：运行全部单元测试**
  运行：`npm run test`
  预期：所有 trace 组件的单元测试测试全部通过 (PASS)。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/components/AgentTrace/__tests__/
  git commit -m "test: add unit tests for dynamic stream timer on AgentTrace"
  ```
