# 设计文档：移除 App.vue 中的旧版 CoT (兼容) 模块

本设计旨在在演示项目 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue) 中彻底移除“旧版 CoT (兼容)”相关的 Tab 页签及其对应的全部展示与模拟逻辑。

## 用户审查与确认

- **保留库级别组件**：由于本项目是一个公共组件库（Yuan UI），`ChainOfThought` 组件目前在 `src/index.ts` 中被全局导出，并且新版 `AgentTrace`（在 `legacy.ts` 里）对该目录的类型定义有依赖。经用户确认，**本次改动仅移除 App.vue 演示页中的旧版 Tab 和相关调用，不删除 `src/components/ChainOfThought` 目录下的组件源码**。

## 详细变更方案

### 1. 模板变更

在 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue) 的模板部分做如下精简：

- **移除 Tab 页签按钮**：
  删除 `nav-tabs` 下的以下 DOM 元素：
  ```html
  <button
    type="button"
    class="tab-btn"
    :class="{ active: activeTab === 'legacy' }"
    @click="activeTab = 'legacy'"
    :disabled="isStreaming"
  >
    <Activity class="tab-icon" />
    <span>旧版 CoT (兼容)</span>
  </button>
  ```

- **移除预览模板**：
  删除 `preview-panel` 下对应的 `else-if` 分支：
  ```html
  <!-- 2. 旧版 CoT 演示（移至右侧大视口上方） -->
  <template v-else-if="activeTab === 'legacy' && (legacyParser.nodes.value.length > 0 || legacyParser.isThinking.value)">
    <ChainOfThought 
      v-model:open="legacyOpen"
      :is-thinking="legacyParser.isThinking.value"
      :auto-close="true"
    >
      <ChainOfThoughtHeader>
        <span v-if="legacyParser.isThinking.value">正在深度调研并执行多轮工具...</span>
        <span v-else-if="legacyParser.totalDuration.value > 0">执行完毕 (用时 {{ legacyParser.totalDuration.value }}秒)</span>
        <span v-else>多轮执行状态 (CoT)</span>
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <ChainOfThoughtRenderer :nodes="legacyParser.nodes.value" />
      </ChainOfThoughtContent>
    </ChainOfThought>
  </template>
  ```

- **简化 Markdown 结果区域**：
  移除 legacy 的 Markdown 结果展示，简化 trace 结果展示逻辑为只根据 `traceParser.content.value` 是否有值进行判断。

### 2. 脚本逻辑变更

在 [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue) 的 script setup 块中进行如下精简：

- **移除无用的组件导入**：
  ```typescript
  import {
    ChainOfThought,
    ChainOfThoughtHeader,
    ChainOfThoughtContent,
    ChainOfThoughtRenderer,
    useAgentStreamParser
  } from './components/ChainOfThought'
  ```

- **简化 `activeTab` 变量的类型声明**：
  ```typescript
  const activeTab = ref<'trace' | 'traceV2'>('trace')
  ```

- **移除解析器变量与开关状态**：
  - 移除 `const legacyParser = useAgentStreamParser()`
  - 移除 `const legacyOpen = ref(true)`

- **删除相关的 watch 滚动监听器**：
  ```typescript
  watch(() => legacyParser.content.value, () => scrollToBottom())
  watch(() => legacyParser.nodes.value.length, () => scrollToBottom())
  watch(() => legacyParser.nodes.value[legacyParser.nodes.value.length - 1]?.content, () => scrollToBottom())
  watch(() => legacyParser.nodes.value[legacyParser.nodes.value.length - 1]?.toolCall?.output, () => scrollToBottom())
  ```

- **删除模拟事件流数据与逻辑**：
  - 移除 `const mockLegacyFlow = [...]`
  - 简化 `startSimulation()`，移除 `else` 分支中的旧版模拟逻辑，将 `if (activeTab.value === 'trace' || activeTab.value === 'traceV2')` 内部逻辑扁平化直接在函数内执行。
  - 移除 `handleReset` 里的 `legacyParser.reset()`。

- **清理 staticSnippets 演示代码**：
  - 移除 `staticSnippets.legacy` 整个对象属性。
  - 修改 `activeFileName`：
    ```typescript
    const activeFileName = computed(() => {
      return staticSnippets[currentScenario.value].fileName
    })
    ```
  - 修改 `activeCode`：
    ```typescript
    const activeCode = computed(() => {
      const rawCode = staticSnippets[currentScenario.value].code
      return rawCode
        .replace(/\\{\\{/g, '{{')
        .replace(/\\}\\}/g, '}}')
    })
    ```

## 验证方案

### 手动验证
1. 启动本地开发服务，运行演示页面。
2. 检查顶栏导航 Tab 中是否仅剩 “新版 AgentTrace (List)” 和 “新版 AgentTraceV2 (DAG拓扑)”，确认“旧版 CoT (兼容)” Tab 按钮已消失。
3. 点击“运行模拟”，观察新版 Tab 能否正常走完思维链和输出正文。
4. 观察左侧代码展示面板，确认显示的 Snippets 代码符合对应 Scenario 的文件名。
5. 检查重置按钮是否工作正常。

### 自动化验证
- 运行打包编译 `npm run build`，确保无任何 Typescript 编译和打包语法错误。
