# AgentTraceDAG 架构与类型优化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标**：重构 AgentTraceDAG 的类型定义为辨识联合类型，废弃外部 edges Props，并在组件内部对 parentId/parentIds 进行规范化解耦，纯净化图布局算法。

---

### 任务 1：使用辨识联合类型重构 `types.ts`

**文件**：
- 修改：`src/components/AgentTraceDAG/types.ts`

- [ ] **步骤 1：重写 types.ts 中的类型定义**
  将胖接口 `DAGNode` 拆分为 `DAGReasoningNode`、`DAGToolNode`、`DAGArtifactNode` 和 `DAGTextNode`，并用类型别名 `DAGNode` 导出它们。
  具体代码内容：
  ```typescript
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
  ```

- [ ] **步骤 2：运行类型及测试校验**
  运行：`npm run test`
  （此时由于组件尚未更新，可能会有一些解构字段的类型报错，我们通过此步骤核对报错，并在 Task 2 解决）。

- [ ] **步骤 3：Commit**
  ```bash
  git add src/components/AgentTraceDAG/types.ts
  git commit -m "refactor: define strict discriminated union for DAGNode types"
  ```

---

### 任务 2：重构 AgentTraceDAG.vue 的 Props 接口与内部图算法

**文件**：
- 修改：`src/components/AgentTraceDAG/AgentTraceDAG.vue`

- [ ] **步骤 1：移除 edges Props，仅保留 nodes 与 maxOutputLength**
  修改 `AgentTraceDAG.vue` 中的 Props 定义：
  ```typescript
  interface Props {
    nodes: DAGNode[]
    maxOutputLength?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    maxOutputLength: 600,
  })
  ```

- [ ] **步骤 2：新增 `normalizedNodes` 并重写 `computedEdges`**
  在 `AgentTraceDAG.vue` 中添加 `normalizedNodes` 的 computed，同时基于它自推导边集，彻底舍弃单亲 `parentId` 的处理：
  ```typescript
  // 1. 规范化节点：统一转换为 parentIds 数组以解耦
  const normalizedNodes = computed(() => {
    return props.nodes.map(node => ({
      ...node,
      parentIds: node.parentIds || (node.parentId ? [node.parentId] : [])
    }))
  })

  // 2. 基于规范化节点自动推导边关系
  const computedEdges = computed<DAGEdge[]>(() => {
    const result: DAGEdge[] = []
    normalizedNodes.value.forEach(node => {
      if (node.parentIds && node.parentIds.length > 0) {
        node.parentIds.forEach(pId => {
          result.push({
            source: pId,
            target: node.id,
            status: node.status
          })
        })
      }
    })
    return result
  })
  ```

- [ ] **步骤 3：重写 BFS 拓扑排版算法以使用 `normalizedNodes`**
  更新 `columns` 计算属性，使用 `normalizedNodes` 的数据结构，剔除冗余的 `node.parentId` 分支：
  ```typescript
  const columns = computed(() => {
    if (normalizedNodes.value.length === 0) return []

    const nodeMap = new Map<string, typeof normalizedNodes.value[0]>()
    const childMap = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    
    // 初始化
    normalizedNodes.value.forEach(node => {
      nodeMap.set(node.id, node)
      childMap.set(node.id, [])
      inDegree.set(node.id, 0)
    })

    // 构建邻接表和入度
    computedEdges.value.forEach(edge => {
      const parentIds = childMap.get(edge.source) || []
      parentIds.push(edge.target)
      childMap.set(edge.source, parentIds)

      const deg = inDegree.get(edge.target) || 0
      inDegree.set(edge.target, deg + 1)
    })

    // BFS 计算层级
    const nodeLevels = new Map<string, number>()
    const queue: string[] = []

    // 入度为 0 的作为 Level 0
    normalizedNodes.value.forEach(node => {
      const deg = inDegree.get(node.id) || 0
      if (deg === 0 || (!node.parentIds || node.parentIds.length === 0)) {
        nodeLevels.set(node.id, 0)
        queue.push(node.id)
      }
    })

    // 队列扩散
    while (queue.length > 0) {
      const currId = queue.shift()!
      const currLevel = nodeLevels.get(currId) || 0
      const children = childMap.get(currId) || []

      children.forEach(childId => {
        const childLevel = nodeLevels.get(childId) || 0
        const targetLevel = Math.max(childLevel, currLevel + 1)
        nodeLevels.set(childId, targetLevel)
        
        if (!queue.includes(childId)) {
          queue.push(childId)
        }
      })
    }

    // 组织多列
    const maxLevel = Math.max(0, ...Array.from(nodeLevels.values()))
    const resultCols: Array<{ level: number; nodes: DAGNode[] }> = []

    for (let i = 0; i <= maxLevel; i++) {
      resultCols.push({ level: i, nodes: [] })
    }

    // 将原始 props.nodes 按计算出的 level 归位以保持原始节点类型不丢失
    props.nodes.forEach(node => {
      const level = nodeLevels.get(node.id) ?? 0
      if (level < resultCols.length) {
        resultCols[level].nodes.push(node)
      } else {
        resultCols[0].nodes.push(node)
      }
    })

    return resultCols.filter(col => col.nodes.length > 0)
  })
  ```

- [ ] **步骤 4：运行打包验证类型**
  运行：`npm run build`
  预期：编译成功通过。

- [ ] **步骤 5：Commit**
  ```bash
  git add src/components/AgentTraceDAG/AgentTraceDAG.vue
  git commit -m "refactor: simplify Graph layout logic and remove external edges Prop"
  ```

---

### 任务 3：同步修改 DAGTraceNode.vue 并回归验证

**文件**：
- 修改：`src/components/AgentTraceDAG/DAGTraceNode.vue`
- 修改：`src/App.vue`

- [ ] **步骤 1：检查并适配 DAGTraceNode.vue 中的类型定义**
  确保 `DAGTraceNode.vue` 内部接收属性及渲染没有类型冲突。
  
- [ ] **步骤 2：更新 App.vue 的 props 调用**
  由于 `App.vue` 没有显式传过 `:edges`，此次重构完全无痛兼容。

- [ ] **步骤 3：运行最终测试及打包**
  运行：`npm run test` 与 `npm run build`
  预期：所有用例通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/components/AgentTraceDAG/DAGTraceNode.vue src/App.vue
  git commit -m "refactor: align DAG node component properties and verify build"
  ```
