import type { TraceStatus, ToolTraceState, AgentTraceVisibility } from '../AgentTrace/types'

export type { ToolTraceState, AgentTraceVisibility }

export type DAGTraceStatus = TraceStatus | 'pruned'

export interface DAGBaseNode {
  id: string
  kind: 'reasoning' | 'tool' | 'artifact' | 'text'
  title: string
  status: DAGTraceStatus
  parentId?: string
  parentIds?: string[] // 支持多亲节点
  startedAt?: number
  endedAt?: number
  duration?: number
}

export interface DAGReasoningNode extends DAGBaseNode {
  kind: 'reasoning'
  summary: string
  visibility: AgentTraceVisibility
}

export interface DAGToolNode extends DAGBaseNode {
  kind: 'tool'
  toolName: string
  state: ToolTraceState
  input?: unknown
  output?: unknown
  errorText?: string
}

export interface DAGArtifactNode extends DAGBaseNode {
  kind: 'artifact'
  artifactType: 'image' | 'file' | 'link'
  url?: string
  caption?: string
}

export interface DAGTextNode extends DAGBaseNode {
  kind: 'text'
  content: string
}

export type DAGNode =
  | DAGReasoningNode
  | DAGToolNode
  | DAGArtifactNode
  | DAGTextNode

export interface DAGEdge {
  source: string; // parent id
  target: string; // child id
  status?: DAGTraceStatus;
}
