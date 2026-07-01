# DAGTraceNode 重构设计说明书 (2026-07-01)

## 1. 概述与设计意图
将 `DAGTraceNode.vue` 物理重构为极简微缩卡片。
移除所有 Terminal、Diff、JSON 折叠和 Markdown 详情渲染逻辑，使其成为高度和宽度固定的卡片。

## 2. 界面与功能定义
- **尺寸固定**：宽度恒定为 `200px`，高度恒定为 `42px`。
- **元素排布**（从左至右，水平居中对齐）：
  1. **图标栏**：根据 `kind` 渲染对应的图标。如果 `kind === 'reasoning'` 且 `status === 'active'` 时，图标 `Loader2` 会应用旋转加载动画（`spin`）。
  2. **标题栏**：显示 `props.title`。字体大小 `12px`，单行超出截断显示省略号。
  3. **时长栏**：在标题栏后显示执行时长 `duration`，格式如 `1.2s`，灰色小字。
  4. **状态圆点指示灯**：在最右侧显示一个小圆点，颜色代表节点的状态。
- **高亮属性 (isSelected)**：
  - 新增 `isSelected` 布尔值 Props（默认 `false`）。
  - 当 `isSelected` 为 `true` 时，卡片将呈现深蓝色发光边框（`#3b82f6`）、淡蓝色渐变背景以及轻微的外部阴影发光（Shadow Glow）。
- **Fork干预与展开功能移除**：
  - 物理删除模板中的 Fork 按钮及展开详情按钮，不再进行折叠和展开的逻辑控制。

## 3. 组件 Props 与 Emit API 定义
```typescript
interface Props {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text'
  title: string
  status?: DAGTraceStatus
  duration?: number
  isSelected?: boolean
  
  // 保留下列可选属性定义，防止父组件 v-bind 传入时在 DOM 上落入不合规的 attributes
  summary?: string
  visibility?: AgentTraceVisibility
  toolName?: string
  state?: ToolTraceState
  input?: unknown
  output?: unknown
  errorText?: string
  artifactType?: 'image' | 'file' | 'link'
  url?: string
  caption?: string
  content?: string
  maxOutputLength?: number
}

// 默认值
const props = withDefaults(defineProps<Props>(), {
  status: 'pending',
  visibility: 'details',
  maxOutputLength: 600,
  isSelected: false,
})

// 事件
const emit = defineEmits<{
  (e: 'click', id: string): void
  (e: 'fork', id: string): void // 物理移除，但保留类型避免外部编译错误
}>()
```

## 4. 样式细则 (CSS)
- **卡片基本框** (`.yuan-dag-node-wrapper`)：
  - 玻璃拟态设计（Glassmorphism）：亮色模式下使用 `rgba(255, 255, 255, 0.72)` 背景与毛玻璃滤镜，暗色模式下使用 `rgba(30, 30, 35, 0.75)`。
  - `border-radius: 8px;`
  - `border: 1px solid rgba(0, 0, 0, 0.08);`（暗色模式：`rgba(255, 255, 255, 0.08)`）
  - 选中高亮 `is-selected` 样式：
    - `border-color: #3b82f6;`
    - `background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%);`
    - `box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15), 0 4px 12px -2px rgba(59, 130, 246, 0.15);`
- **状态指示圆点** (`.status-dot-indicator`)：
  - 默认圆点大小为 `6px * 6px`。
  - 不同状态颜色：
    - `complete`: `#10b981` (绿色)
    - `active`: `#3b82f6` (蓝色) 并拥有 `scale-breath` 脉冲呼吸动画
    - `error`: `#ef4444` (红色)
    - `pending`: `#94a3b8` (灰色)
    - `cancelled`/`pruned`: `#64748b` (灰色)
- **Pruned 状态**：
  - `status-pruned` 状态的卡片将带有 `opacity: 0.5;` 以虚化不可见分支。
