# 更新 App.vue 组件引用实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `src/App.vue` 中清理对 `AgentTraceV2` 的任何字面量残留（如变量状态 `'traceV2'`），更新为 `'traceDAG'`，并进行测试和构建。

**架构：** 在 `src/App.vue` 中，将 tab 标识符变量 `activeTab` 的类型以及相关联 of tab 切换、状态判断和模板条件渲染中的字面量 `'traceV2'` 全部修改为 `'traceDAG'`。修改后执行单元测试与构建校验。

**技术栈：** Vue 3, TypeScript, Vitest, Vite

---

### 任务 1：修改 `src/App.vue` 中的 V2 状态字面量

**文件：**
- 修改：`src/App.vue:13, 614-615, 717`

- [ ] **步骤 1：修改 activeTab 的 TypeScript 类型定义**

修改 `src/App.vue` 第 13 行，将 `'traceV2'` 变变成 `'traceDAG'`：
```typescript
// 修改前
const activeTab = ref<'trace' | 'traceV2'>('trace')

// 修改后
const activeTab = ref<'trace' | 'traceDAG'>('trace')
```

- [ ] **步骤 2：更新模板中的 Tab 切换激活样式和点击事件**

修改 `src/App.vue` 第 614-615 行：
```html
<!-- 修改前 -->
          :class="{ active: activeTab === 'traceV2' }"
          @click="activeTab = 'traceV2'"

<!-- 修改后 -->
          :class="{ active: activeTab === 'traceDAG' }"
          @click="activeTab = 'traceDAG'"
```

- [ ] **步骤 3：更新模板中的条件渲染判断**

修改 `src/App.vue` 第 717 行：
```html
<!-- 修改前 -->
          <template v-else-if="activeTab === 'traceV2' && (traceParser.nodes.value.length > 0 || traceParser.isStreaming.value)">

<!-- 修改后 -->
          <template v-else-if="activeTab === 'traceDAG' && (traceParser.nodes.value.length > 0 || traceParser.isStreaming.value)">
```

---

### 任务 2：运行测试与构建验证

**文件：**
- 无需修改文件，运行命令验证

- [ ] **步骤 1：运行单元测试**

运行命令：
```bash
npm run test
```
预期输出：所有测试用例（尤其是 App.vue 相关的测试，若有）全部通过，没有报错。

- [ ] **步骤 2：运行库打包构建**

运行命令：
```bash
npm run build
```
预期输出：构建成功完成，无 TypeScript 编译或 rollup 打包报错，并产出打包后文件。
