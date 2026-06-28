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

export type AgentTraceEvent =
  | { type: 'reasoning-delta'; id?: string; delta: string; title?: string }
  | { type: 'tool-input-start'; id: string; toolName: string; input?: unknown; title?: string }
  | { type: 'tool-input-delta'; id: string; inputDelta: unknown }
  | { type: 'tool-output'; id: string; output?: unknown; errorText?: string }
  | { type: 'artifact'; id?: string; artifactType: 'image' | 'file' | 'link'; title: string; url?: string; caption?: string }
  | { type: 'text-delta'; id?: string; delta: string; title?: string }
  | { type: 'finish' }
  | { type: 'reset' }
