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

export interface AsThoughtChainBaseNode {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text' | 'group'
  title: string
  status: TraceStatus
  startedAt: number
  endedAt?: number
  duration?: number
  parentId?: string // 父节点/组的 id，用于层级归属
}

export interface ReasoningTraceNode extends AsThoughtChainBaseNode {
  kind: 'reasoning'
  summary: string
  visibility: AgentTraceVisibility
}

export interface ToolTraceNode extends AsThoughtChainBaseNode {
  kind: 'tool'
  toolName: string
  state: ToolTraceState
  input?: unknown
  output?: unknown
  errorText?: string
  metadata?: Record<string, unknown>
}

export interface ArtifactTraceNode extends AsThoughtChainBaseNode {
  kind: 'artifact'
  artifactType: 'image' | 'file' | 'link'
  url?: string
  caption?: string
}

export interface TextTraceNode extends AsThoughtChainBaseNode {
  kind: 'text'
  content: string
}

export interface GroupTraceNode extends AsThoughtChainBaseNode {
  kind: 'group'
  isCollapsed: boolean // 控制在 UI 上的展开折叠状态
}

export type AsThoughtChainNode =
  | ReasoningTraceNode
  | ToolTraceNode
  | ArtifactTraceNode
  | TextTraceNode
  | GroupTraceNode

export type AsThoughtChainEvent =
  | { type: 'reasoning-delta'; id?: string; delta: string; title?: string; parentId?: string }
  | { type: 'tool-input-start'; id: string; toolName: string; input?: unknown; title?: string; parentId?: string }
  | { type: 'tool-input-delta'; id: string; inputDelta: unknown }
  | { type: 'tool-approval-request'; id: string }
  | { type: 'tool-approval-response'; id: string; approved: boolean; reason?: string }
  | { type: 'tool-output'; id: string; output?: unknown; errorText?: string }
  | { type: 'artifact'; id?: string; artifactType: 'image' | 'file' | 'link'; title: string; url?: string; caption?: string; parentId?: string }
  | { type: 'text-delta'; id?: string; delta: string; title?: string }
  | { type: 'group-start'; id: string; title: string; parentId?: string }
  | { type: 'group-end'; id: string }
  | { type: 'toggle-collapse'; id: string; isCollapsed?: boolean }
  | { type: 'finish' }
  | { type: 'reset' }
  | { type: 'collapse-all-groups' }
