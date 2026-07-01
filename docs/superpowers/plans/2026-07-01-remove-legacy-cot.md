# 移除旧版 CoT (兼容) 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 App.vue 中移除 “旧版 CoT (兼容)” Tab 页签、对应的页面逻辑与模拟数据。

**架构：** 清理 App.vue 的 script 模块中对 ChainOfThought 相关解析器、滚动监听、模拟数据的引用，精简 template 模块中的 Tab 按钮及条件渲染块，直接默认使用 trace 相关的流式轨迹。

**技术栈：** Vue 3, TypeScript

---

## 变更文件列表

- **修改**：[App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue) - 移除旧版 CoT tab 按钮、演示组件、滚动监听、模拟数据和 staticSnippets 中的 `legacy` 演示代码。

---

### 任务 1：移除 App.vue 中的旧版 CoT 逻辑与渲染

**文件：**
- 修改：`src/App.vue`

- [ ] **步骤 1：修改 App.vue 脚本导入与状态变量**
  
  移除以下对 `./components/ChainOfThought` 的引入以及 `legacyParser` / `legacyOpen` 的定义，并简化 `activeTab` 变量的类型。

  修改 `src/App.vue` 的导入部分和变量部分：
  ```diff
  -import {
  -  ChainOfThought,
  -  ChainOfThoughtHeader,
  -  ChainOfThoughtContent,
  -  ChainOfThoughtRenderer,
  -  useAgentStreamParser
  -} from './components/ChainOfThought'
   import {
     AgentTrace,
     AgentTraceTrigger,
     AgentTraceContent,
     AgentTraceList,
     useAgentTraceStream
   } from './components/AgentTrace'
   import { AgentTraceDAG } from './components/AgentTraceV2'
  -import { Play, RotateCcw, Activity, ShieldCheck } from '@lucide/vue'
  +import { Play, RotateCcw, Activity, ShieldCheck } from '@lucide/vue'
  
  -const activeTab = ref<'trace' | 'traceV2' | 'legacy'>('trace')
  +const activeTab = ref<'trace' | 'traceV2'>('trace')
   const currentScenario = ref<'basic' | 'intermediate' | 'advanced'>('advanced')
   const isStreaming = ref(false)
   
  -// 1. 初始化旧版 CoT 解析器
  -const legacyParser = useAgentStreamParser()
  ```

- [ ] **步骤 2：删除滚动监听 watch 以及旧版模拟数据 `mockLegacyFlow`**

  在 `src/App.vue` 脚本中删除：
  ```typescript
  // 监听内容与节点的变化进行滚动
  watch(() => legacyParser.content.value, () => scrollToBottom())
  watch(() => legacyParser.nodes.value.length, () => scrollToBottom())
  watch(() => legacyParser.nodes.value[legacyParser.nodes.value.length - 1]?.content, () => scrollToBottom())
  watch(() => legacyParser.nodes.value[legacyParser.nodes.value.length - 1]?.toolCall?.output, () => scrollToBottom())
  ```
  以及：
  ```typescript
  const mockLegacyFlow = [...] // 全部的 mockLegacyFlow 数组定义
  ```

- [ ] **步骤 3：重构模拟触发函数 `startSimulation` & `handleReset`**

  移除 `startSimulation` 中 `legacy` 模拟执行的分支，只保留并扁平化新版思维链模拟逻辑：
  ```typescript
  async function startSimulation() {
    if (isStreaming.value) return
    isStreaming.value = true
    pendingApproval.value = null

    traceParser.reset()
    
    // 根据渐进式场景选择对应的数据流
    let targetFlow = mockAdvancedFlow
    if (currentScenario.value === 'basic') {
      targetFlow = mockBasicFlow
    } else if (currentScenario.value === 'intermediate') {
      targetFlow = mockIntermediateFlow
    }

    for (let i = 0; i < targetFlow.length; i++) {
      if (!isStreaming.value) break // 支持中途打断
      
      const chunk = targetFlow[i]
      
      if (chunk.type === 'tool-approval-request') {
        traceParser.handleTraceEvent(chunk)
        
        // 阻塞循环：等待用户审批
        const approved = await new Promise<boolean>((resolve) => {
          pendingApproval.value = { resolve, id: chunk.id }
        })
        
        if (!approved) {
          // 如果被用户拒绝：我们跳过下一个 chunk (代表工具执行成功的输出)，模拟拒绝分支
          i++
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      
      traceParser.handleTraceEvent(chunk)
      
      // 模拟流式事件输出延迟
      if (chunk.type === 'reasoning-delta' || chunk.type === 'text-delta') {
        await new Promise(resolve => setTimeout(resolve, 15))
      } else if (chunk.type === 'tool-input-start' || chunk.type === 'group-start') {
        await new Promise(resolve => setTimeout(resolve, 600))
      } else if (chunk.type === 'tool-output' || chunk.type === 'group-end') {
        await new Promise(resolve => setTimeout(resolve, 800))
      } else if (chunk.type === 'artifact') {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    isStreaming.value = false
  }
  ```
  在 `handleReset` 移除 `legacyParser.reset()`：
  ```typescript
  function handleReset() {
    isStreaming.value = false
    pendingApproval.value = null
    traceParser.reset()
  }
  ```
  并移除 `const legacyOpen = ref(true)` 声明。

- [ ] **步骤 4：清理 staticSnippets 演示代码与 computed 属性**

  删除 `staticSnippets.legacy` 块。
  修改 `activeFileName` 与 `activeCode`：
  ```typescript
  const activeFileName = computed(() => {
    return staticSnippets[currentScenario.value].fileName
  })

  const activeCode = computed(() => {
    const rawCode = staticSnippets[currentScenario.value].code
    return rawCode
      .replace(/\\{\\{/g, '{{')
      .replace(/\\}\\}/g, '}}')
  })
  ```

- [ ] **步骤 5：修改模板 HTML 结构，去除 Tab 和 ChainOfThought 节点**

  - 删除按钮：
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
  - 删除 `<ChainOfThought>` 整个预览区域模板。
  - 简化正文输出结果部分为：
    ```html
    <!-- 4. Markdown 正文结果 -->
    <div v-if="traceParser.content.value" class="answer-content">
      <div class="markdown-body">{{ traceParser.content.value }}</div>
    </div>
    ```

- [ ] **步骤 6：本地打包与构建验证**

  运行项目打包命令确保项目能正确编译且无报错：
  运行：`npm run build`
  预期：打包成功

- [ ] **步骤 7：Git Commit**

  运行：
  ```bash
  git add src/App.vue docs/superpowers/specs/2026-07-01-remove-legacy-cot-design.md docs/superpowers/plans/2026-07-01-remove-legacy-cot.md
  git commit -m "refactor: remove legacy CoT tab and logic from App.vue"
  ```
