export type RendererNodeType = 'text' | 'element' | 'component'

export interface RendererBaseNode {
  type: RendererNodeType
}

export interface RendererTextNode extends RendererBaseNode {
  type: 'text'
  content: string
}

export interface RendererElementNode extends RendererBaseNode {
  type: 'element'
  tag: string
  props?: Record<string, any>
  children: RendererNode[]
}

export interface RendererComponentNode extends RendererBaseNode {
  type: 'component'
  tag: string
  props: Record<string, any>
}

export type RendererNode = RendererTextNode | RendererElementNode | RendererComponentNode

export interface UseStreamRendererOptions {
  /** 是否启用流式输出修剪 */
  enableTailoring?: boolean
  /** 是否启用流式输出 Markdown 语法补全 */
  enableCompletion?: boolean
  /** 允许挂载的自定义组件白名单 */
  allowedComponents?: string[]
}
