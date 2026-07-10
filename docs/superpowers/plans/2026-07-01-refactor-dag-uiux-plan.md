# AgentTraceDAG UIUX 极简化与侧边检查器 (Inspector) 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标**：重构 `DAGTraceNode.vue` 为极简微缩卡片，并在 `AgentTraceDAG.vue` 右侧增加双栏详情 Inspector（直接复用已有的 Terminal/Diff/File/Search 渲染器），彻底废弃 Fork 相关弹窗和重型交互。

---

### 任务 1：极致精简重构 `DAGTraceNode.vue`

**文件**：
- 修改：`src/components/AgentTraceDAG/DAGTraceNode.vue`

- [ ] **步骤 1：大幅删减卡片渲染模块，仅保留核心微缩样式**
  打开 `DAGTraceNode.vue`，删除所有有关 `Terminal`、`Diff`、`Markdown`、`JSON` 以及展开/收起按钮的模板代码，只保留基本的基础信息栏。
  重写后的整个 `DAGTraceNode.vue` 示例如下：
  ```vue
  <script setup lang="ts">
  import { computed } from 'vue'
  import { 
    MessageSquare, Image, FileText, ExternalLink, Check, Loader2, 
    Circle, AlertCircle, Wrench, Terminal, FileCode, Globe, File
  } from '@lucide/vue'
  import type { DAGTraceStatus, ToolTraceState } from './types'

  interface Props {
    id: string
    kind: 'reasoning' | 'tool' | 'artifact' | 'text'
    title: string
    status?: DAGTraceStatus
    toolName?: string
    state?: ToolTraceState
    artifactType?: 'image' | 'file' | 'link'
    duration?: number
    isSelected?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    status: 'pending',
    isSelected: false,
  })

  const emit = defineEmits<{
    (e: 'click', id: string): void
  }>()

  const statusClass = computed(() => {
    return {
      'status-complete': props.status === 'complete',
      'status-active': props.status === 'active',
      'status-pending': props.status === 'pending',
      'status-error': props.status === 'error',
      'status-cancelled': props.status === 'cancelled',
      'status-pruned': props.status === 'pruned',
    }
  })

  // 根据不同类型计算图标
  const nodeIcon = computed(() => {
    if (props.kind === 'text') return MessageSquare
    if (props.kind === 'reasoning') {
      if (props.status === 'active') return Loader2
      if (props.status === 'complete') return Check
      if (props.status === 'error') return AlertCircle
      return Circle
    }
    if (props.kind === 'artifact') {
      if (props.artifactType === 'image') return Image
      if (props.artifactType === 'file') return FileText
      return ExternalLink
    }
    if (props.kind === 'tool') {
      const name = props.toolName || ''
      if (['execute_command', 'run_command'].includes(name)) return Terminal
      if (['write_file', 'replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes(name)) return FileCode
      if (['google_search', 'web_search'].includes(name)) return Globe
      if (['read_file', 'view_file'].includes(name)) return File
      return Wrench
    }
    return Circle
  })
  </script>

  <template>
    <div 
      class="yuan-dag-node-compact" 
      :class="[statusClass, { 'is-selected': isSelected }]"
      @click="emit('click', id)"
    >
      <div class="node-icon-box">
        <component :is="nodeIcon" class="node-icon" :class="{ 'spin-loader': status === 'active' && kind === 'reasoning' }" />
      </div>
      <div class="node-meta-box">
        <span class="node-title" :title="title">{{ title }}</span>
        <span v-if="duration !== undefined && duration > 0" class="node-duration">{{ duration }}s</span>
      </div>
      <div class="node-status-dot"></div>
    </div>
  </template>

  <style scoped>
  .yuan-dag-node-compact {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--yuan-border);
    background-color: var(--yuan-bg);
    width: 200px; /* 固定高宽，提供极度整齐的拓扑列排版 */
    height: 42px;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    position: relative;
  }

  .yuan-dag-node-compact:hover {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  /* 选中高亮状态 */
  .yuan-dag-node-compact.is-selected {
    border-color: var(--yuan-primary);
    box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.12), 0 2px 8px rgba(0, 113, 227, 0.06);
    background-color: var(--yuan-primary-light);
  }

  .node-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }

  .node-icon {
    width: 16px;
    height: 16px;
  }

  .spin-loader {
    animation: spin-anim 1s linear infinite;
  }

  .node-meta-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 0;
  }

  .node-title {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  .node-duration {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 1px;
    font-family: var(--yuan-font-mono);
  }

  .node-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #94a3b8;
  }

  /* 状态灯色彩设计 */
  .status-complete .node-status-dot { background-color: #10b981; }
  .status-active .node-status-dot { background-color: var(--yuan-primary); }
  .status-error .node-status-dot { background-color: var(--yuan-error); }
  .status-pruned .node-status-dot { background-color: #cbd5e1; }
  .status-complete { border-left: 3px solid #10b981; }
  .status-active { border-left: 3px solid var(--yuan-primary); }
  .status-error { border-left: 3px solid var(--yuan-error); }
  .status-pruned { opacity: 0.65; border-left: 3px solid #94a3b8; }

  @keyframes spin-anim {
    to { transform: rotate(360deg); }
  }
  </style>
  ```

- [ ] **步骤 2：校验并保存**
  保存文件，并确保无 TS 类型报错。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/components/AgentTraceDAG/DAGTraceNode.vue
  git commit -m "refactor: simplify DAGTraceNode to high-performance compact card (Task 1)"
  ```

---

### 任务 2：重构 `AgentTraceDAG.vue` 实现横向双栏与 Inspector 面板

**文件**：
- 修改：`src/components/AgentTraceDAG/AgentTraceDAG.vue`

- [ ] **步骤 1：移除所有 Fork 逻辑相关变量及弹窗元素**
  物理删除 `openForkModal`、`submitFork`、以及组件中的 `Transition` 弹窗元素。

- [ ] **步骤 2：新增 `selectedNodeId` 及 Inspector 板块设计**
  在 `AgentTraceDAG.vue` 中导入现成的 Renderer 模块：
  ```typescript
  import TerminalRenderer from '../AgentTrace/renderers/TerminalRenderer.vue'
  import DiffRenderer from '../AgentTrace/renderers/DiffRenderer.vue'
  import SearchRenderer from '../AgentTrace/renderers/SearchRenderer.vue'
  import FileRenderer from '../AgentTrace/renderers/FileRenderer.vue'
  import TextTraceNode from '../AgentTrace/renderers/TextTraceNode.vue'
  ```
  声明选中状态，并在节点点击时更新：
  ```typescript
  const selectedNodeId = ref<string | null>(null)

  const selectedNode = computed(() => {
    return props.nodes.find(n => n.id === selectedNodeId.value)
  })

  function handleNodeClick(id: string) {
    // 点击已选中节点则关闭，否则打开选中
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    } else {
      selectedNodeId.value = id
    }
    emit('node-click', id)
  }
  ```

- [ ] **步骤 3：更新模板结构为 Flex 双栏布局**
  更新模板。左侧包裹 `yuan-dag-canvas-container`，右侧放置 `dag-inspector` 抽屉面板：
  ```vue
  <template>
    <div class="yuan-dag-wrapper">
      <!-- 左侧画布栏 -->
      <div class="yuan-dag-container" ref="containerRef">
        <div class="dag-grid-bg"></div>
        
        <svg class="dag-svg-canvas" xmlns="http://www.w3.org/2000/svg">
          <g v-for="link in links" :key="link.id">
            <path 
              v-if="link.status === 'active'"
              :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
              class="link-glow-underlay"
            />
            <path 
              :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
              class="link-path"
              :class="getLinkClass(link.status)"
            />
            <path 
              v-if="link.status === 'active'"
              :d="getBezierPath(link.x1, link.y1, link.x2, link.y2)"
              class="link-flow-overlay"
            />
          </g>
        </svg>

        <div class="dag-columns-wrapper">
          <div v-for="col in columns" :key="col.level" class="dag-column">
            <div class="column-level-header">
              <span class="level-indicator">STEP {{ col.level + 1 }}</span>
            </div>
            <div class="column-nodes-list">
              <DAGTraceNode
                v-for="node in col.nodes"
                :key="node.id"
                :ref="(el) => registerNodeEl(node.id, el)"
                v-bind="node"
                :is-selected="selectedNodeId === node.id"
                @click="handleNodeClick"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧详情 Inspector 面板 -->
      <Transition name="slide">
        <div v-if="selectedNode" class="dag-inspector-panel">
          <div class="inspector-header">
            <span class="inspector-title">节点详情</span>
            <button class="close-btn" @click="selectedNodeId = null">×</button>
          </div>
          
          <div class="inspector-body">
            <!-- 1. Reasoning 节点详情 -->
            <div v-if="selectedNode.kind === 'reasoning'" class="inspector-content">
              <div class="detail-label">思考逻辑</div>
              <div class="markdown-body p-2 border rounded bg-slate-50 text-sm whitespace-pre-wrap">
                {{ (selectedNode as any).summary }}
              </div>
            </div>

            <!-- 2. Tool 节点详情 (分情况重用各 Renderer) -->
            <div v-else-if="selectedNode.kind === 'tool'" class="inspector-content">
              <div class="detail-label">工具调用 ({{ (selectedNode as any).toolName }})</div>
              
              <!-- 2.1 终端渲染 -->
              <TerminalRenderer
                v-if="['execute_command', 'run_command'].includes((selectedNode as any).toolName)"
                :title="selectedNode.title"
                :command="(selectedNode as any).input?.command || (selectedNode as any).input?.CommandLine || String((selectedNode as any).input || '')"
                :output="String((selectedNode as any).output || '')"
                :error-text="(selectedNode as any).errorText"
              />

              <!-- 2.2 Diff 对比渲染 -->
              <DiffRenderer
                v-else-if="['replace_file_content', 'multi_replace_file_content', 'apply_patch'].includes((selectedNode as any).toolName)"
                :title="selectedNode.title"
                :diff-text="String((selectedNode as any).output || '')"
              />

              <!-- 2.3 网页搜索渲染 -->
              <SearchRenderer
                v-else-if="['google_search', 'web_search'].includes((selectedNode as any).toolName)"
                :title="selectedNode.title"
                :results="(selectedNode as any).output || []"
              />

              <!-- 2.4 文件阅读渲染 -->
              <FileRenderer
                v-else-if="['read_file', 'view_file'].includes((selectedNode as any).toolName)"
                :title="selectedNode.title"
                :file-content="String((selectedNode as any).output || '')"
                :file-path="(selectedNode as any).input?.path || (selectedNode as any).input?.AbsolutePath || ''"
              />

              <!-- 2.5 其他常规工具 Fallback -->
              <div v-else class="fallback-json-box">
                <div class="json-header">输入参数:</div>
                <pre class="json-code">{{ JSON.stringify((selectedNode as any).input, null, 2) }}</pre>
                <div class="json-header mt-2">输出结果:</div>
                <pre class="json-code">{{ JSON.stringify((selectedNode as any).output || (selectedNode as any).errorText, null, 2) }}</pre>
              </div>
            </div>

            <!-- 3. Artifact 节点详情 -->
            <div v-else-if="selectedNode.kind === 'artifact'" class="inspector-content">
              <div class="detail-label">生成产物</div>
              <div class="artifact-card p-3 border rounded">
                <div class="artifact-type font-semibold text-xs text-slate-400 uppercase mb-1">{{ (selectedNode as any).artifactType }}</div>
                <div class="artifact-title font-semibold text-sm mb-2">{{ selectedNode.title }}</div>
                <img v-if="(selectedNode as any).artifactType === 'image'" :src="(selectedNode as any).url" :alt="selectedNode.title" class="max-w-full h-auto rounded" />
                <a v-else-if="(selectedNode as any).url" :href="(selectedNode as any).url" target="_blank" class="text-blue-500 underline text-sm">打开链接</a>
                <p v-if="(selectedNode as any).caption" class="text-xs text-slate-500 mt-2">{{ (selectedNode as any).caption }}</p>
              </div>
            </div>

            <!-- 4. Text 节点详情 -->
            <div v-else-if="selectedNode.kind === 'text'" class="inspector-content">
              <div class="detail-label">文本内容</div>
              <div class="markdown-body p-2 border rounded bg-slate-50 text-sm whitespace-pre-wrap">
                {{ (selectedNode as any).content }}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </template>
  ```

- [ ] **步骤 4：追加平滑的连线重绘 CSS 过渡效果**
  在 CSS 样式表中，为 `.link-path` 和各连线路径加上 `transition: d 0.3s cubic-bezier(0.25, 1, 0.5, 1), stroke 0.3s ease;`。

- [ ] **步骤 5：Commit**
  ```bash
  git add src/components/AgentTraceDAG/AgentTraceDAG.vue
  git commit -m "feat: implement slide-out Inspector panel and smooth SVG links transition (Task 2)"
  ```

---

### 任务 3：在 App.vue 中移除旧绑定并回归测试

**文件**：
- 修改：`src/App.vue`

- [ ] **步骤 1：移除 App.vue 模板上的 `@node-fork`**
  移除 `<AgentTraceDAG>` 标签上的 `@node-fork="handleNodeFork"` 绑定。

- [ ] **步骤 2：执行全套自动化回归测试**
  运行：`npm run test` 与 `npm run build`
  预期：全部绿灯。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/App.vue
  git commit -m "refactor: remove legacy Fork event listeners from App.vue and finalize build (Task 3)"
  ```
