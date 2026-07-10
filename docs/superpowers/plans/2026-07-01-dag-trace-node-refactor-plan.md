# DAGTraceNode 极致精简重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `DAGTraceNode.vue` 大幅重构为高度和宽度固定的极简微缩卡片，移除全部详情渲染与折叠逻辑，并添加 `isSelected` 高亮属性。

**架构：**
- 修改 `DAGTraceNode.vue` 的模板，物理移除详情面板、Terminal 等节点，采用全新的 Flex 水平排版（图标、标题、执行时长、状态点）。
- 更新 Props 属性，增加 `isSelected?: boolean` 并设置为默认 `false`。
- 修改 CSS，使容器固定尺寸为 `height: 42px; width: 200px;` 并提供相应的选中发光与状态呼吸边框效果。

**技术栈：** Vue 3 Setup (SFC), TypeScript, Vanilla CSS, Lucide Icons, Vitest.

---

### 任务 1：重构 `DAGTraceNode.vue` 模板与脚本逻辑

**文件：**
- 修改：`src/components/AgentTraceDAG/DAGTraceNode.vue`

- [ ] **步骤 1：重构 Script 部分**
  在 `src/components/AgentTraceDAG/DAGTraceNode.vue` 中：
  - 新增 `isSelected?: boolean` Props，并在 `withDefaults` 中配置其默认值为 `false`。
  - 清理不再需要的 computed 变量（例如 `isTerminal`、`commandText`、`formattedInput`、`formattedOutput` 等）。
  - 清理模板展开和 Fork 相关的处理函数（物理删除 `toggleExpand` 和 `handleFork`，但可选保留 emits 中的类型声明以防外部引用报错）。

- [ ] **步骤 2：重构 Template 部分**
  - 物理删除全部展开、终端/Diff/Markdown 逻辑。
  - 仅保留以下基本骨架结构：
    ```html
    <template>
      <div 
        class="yuan-dag-node-wrapper"
        :class="[
          statusClass, 
          `kind-${props.kind}`, 
          { 'is-selected': props.isSelected }
        ]"
        @click="handleNodeClick"
      >
        <div class="node-content">
          <div class="node-icon-wrapper">
            <component 
              :is="nodeIcon" 
              class="node-icon"
              :class="{ 'spin': props.status === 'active' && props.kind === 'reasoning' }"
            />
          </div>
          <span class="node-title" :title="props.title">{{ props.title }}</span>
          <span v-if="props.duration !== undefined" class="node-duration">
            {{ props.duration }}s
          </span>
          <div class="status-dot-indicator">
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </template>
    ```

- [ ] **步骤 3：重构 CSS 样式**
  - 清理旧的展开面板、代码块、大尺寸气泡等所有无用 CSS。
  - 将 `.yuan-dag-node-wrapper` 的大小固定为 `height: 42px; width: 200px;`。
  - 实现选中态样式（`is-selected`）：
    ```css
    .yuan-dag-node-wrapper.is-selected {
      border-color: #3b82f6;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15), 0 4px 12px -2px rgba(59, 130, 246, 0.15);
    }
    .dark .yuan-dag-node-wrapper.is-selected {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%);
    }
    ```
  - 实现右侧状态指示圆点样式 (`status-dot-indicator`)。
  - 调整 `.node-content` 布局，使其在 `42px` 高度内垂直居中排布，间距紧凑精致。

---

### 任务 2：增加针对 `isSelected` 属性的编译与测试校验

**文件：**
- 修改/创建：`src/components/AgentTraceDAG/__tests__/AgentTraceDAG.test.ts` 或是新建 `DAGTraceNode.test.ts` 检验组件定义。

- [ ] **步骤 1：运行现有测试**
  确保在做任何修改后测试通过：`npm run test`。

- [ ] **步骤 2：打包校验**
  运行：`npm run build`。
  预期：编译成功，生成 dist 目录，且没有 TypeScript 或 Vue 模板错误。
