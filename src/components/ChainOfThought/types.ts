export type AgentStepNodeType = 'thought' | 'tool_call' | 'image' | 'text'

export interface SearchResultItem {
  title: string
  url: string
}

export interface ToolCallPayload {
  name: string
  arguments: string
  status: 'active' | 'complete' | 'failed'
  results?: SearchResultItem[]
  filePath?: string
  command?: string
  output?: string
}

export interface AgentStepNode {
  id: string
  type: AgentStepNodeType
  label: string
  content: string
  status: 'complete' | 'active' | 'pending'
  startTime: number
  duration?: number
  toolCall?: ToolCallPayload
  imageUrl?: string
  imageCaption?: string
}
