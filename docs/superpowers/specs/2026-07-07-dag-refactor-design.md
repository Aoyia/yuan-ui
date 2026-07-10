# 字节科技风 DAG 工作流重构设计文档

本文档定义了重构 `AgentTraceDAG` 组件的设计规范。该重构旨在优化拓扑工作流的可视化效果，采用字节跳动主题设计风格，使用户能够极其清晰、直观地了解 AI 的具体工作流和执行链路。

## 1. 重构目的与设计理念

当前 DAG 模式节点划分较少，缺乏“子智能体调用 (Subagent)”与“人工反馈 (Review)”这两种在复杂智能体工作流中极其核心的节点状态。此外，整体视觉质感较为单一，缺乏科技感与大厂界面的精密感。
本次重构将遵循**“剃刀原理”**与**“字节跳动设计语言 (如 Coze 扣子风格)”**：
- 节点卡片采用极细边框加毛玻璃背景（Glassmorphism），辅以弥散投影。
- 引入**左侧 3px 宽的纵向类型指示条 (Color Bar)**，通过颜色直观标记节点类型。
- 采用 **SVG 贝塞尔流光连线**，在活跃通路上动态流动，展示当前的执行通路。

---

## 2. 节点类型划分与数据结构

废弃原有的 `text` 节点类型，将所有工作流节点规范为以下 5 种核心类型：

| 节点类型 (kind) | 标识色 | 主题图标 | 描述说明与关键属性 |
| :--- | :--- | :--- | :--- |
| **Reasoning** | 火山蓝 (`#165dff`) | `brain` (大脑) | AI 思考、决策或规划的核心过程。 |
| **Tool** | 飞书绿 (`#00b42a`) | `wrench` / `search` 等 | 调用具体工具（如终端运行、代码修改、网页搜索等）。 |
| **Subagent** | 极客紫 (`#722ed1`) | `git-branch` (分支) | 调用并托管子智能体，执行特定的子流程。新增 `subagentName` 属性。 |
| **Review** | 暖橙色 (`#ff7d00`) | `shield-alert` (沙漏) | 人工交互节点，需要用户在详情面板审批。新增 `feedbackText` 属性。 |
| **Artifact** | 青绿色 (`#14c9c9`) | `file-code` / `image` | 生成的最终或阶段性文件、代码 Patch 等实物产物。 |

### 接口类型定义重构 (`types.ts`)

```typescript
export type DAGNodeKind = 'reasoning' | 'tool' | 'subagent' | 'review' | 'artifact';

export interface DAGBaseNode {
  id: string;
  kind: DAGNodeKind;
  title: string;
  status: DAGTraceStatus;
  parentId?: string;
  parentIds?: string[];
  startedAt?: number;
  endedAt?: number;
  duration?: number;
}

export interface DAGReasoningNode extends DAGBaseNode {
  kind: 'reasoning';
  summary: string;
  visibility: AgentTraceVisibility;
}

export interface DAGToolNode extends DAGBaseNode {
  kind: 'tool';
  toolName: string;
  state: ToolTraceState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

export interface DAGSubagentNode extends DAGBaseNode {
  kind: 'subagent';
  subagentName: string;
  subagentId?: string;
  input?: unknown;
  output?: unknown;
}

export interface DAGReviewNode extends DAGBaseNode {
  kind: 'review';
  reviewStatus: 'pending' | 'approved' | 'rejected';
  feedbackText?: string;
  requestDetail?: string;
}

export interface DAGArtifactNode extends DAGBaseNode {
  kind: 'artifact';
  artifactType: 'image' | 'file' | 'link';
  url?: string;
  caption?: string;
}

export type DAGNode =
  | DAGReasoningNode
  | DAGToolNode
  | DAGSubagentNode
  | DAGReviewNode
  | DAGArtifactNode;
```

---

## 3. UI 展现与交互规范

### 3.1 节点卡片样式
*   **主体背景**：`rgba(255, 255, 255, 0.82)`（暗色模式为 `rgba(30, 30, 35, 0.75)`），应用 `backdrop-filter: blur(12px)` 实现平滑毛玻璃感。
*   **状态点指示灯**：位于卡片最右侧。
    *   `complete` 为绿色静态点。
    *   `active` 为蓝色呼吸灯。
    *   `waiting`（仅 Review 节点在 pending 时）为橙色急促呼吸灯。
    *   `pending` 为淡灰色静态点。
*   **交互悬停**：`transform: translateY(-2px)` 并附加平滑弥散投影，边框线微高亮。

### 3.2 右侧详情抽屉 (Inspector) 审批交互
*   根据选中节点的 `kind` 自适应渲染不同详情。
*   对于 **Review 节点**：
    *   在面板内显示用户可输入的反馈框 `<textarea>` 以及 `批准` 和 `拒绝` 大按钮。
    *   当点击“批准”时，将该 Review 节点状态变更为 `complete`，并激活下游节点。
    *   当点击“拒绝”时，记录用户的反馈文本（Feedback），并将状态变更为已拒绝。

### 3.3 SVG 连线流光引擎
*   连线采用平滑贝塞尔曲线：`M x1 y1 C x1+offset y1, x2-offset y2, x2 y2`。
*   当且仅当连线的源节点状态为 `complete` 且目标节点状态为 `active` / `waiting` 时，代表当前正是活跃的数据或执行通道，此时连线额外绘制一层 **流光叠加层 (Path with LinearGradient & stroke-dashoffset animation)**，提供平滑流动的粒子动画效果。

---

## 4. 验证与单元测试规划
*   在 `src/components/AgentTraceDAG/__tests__/AgentTraceDAG.test.ts` 中补充单元测试：
    *   验证 5 类新节点的正确渲染与样式绑定。
    *   验证 SVG 连线计算在不同节点类型与状态下的类名（如 `link-active` 与流光路径的动态呈现）。
    *   验证节点点击能正确冒泡 `node-click` 事件并向父组件传输正确 ID。
