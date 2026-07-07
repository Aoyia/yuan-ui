# 全局组件瘦身与逻辑解耦重构设计规格说明书

本设计文档旨在对项目中的大文件和“上帝组件”——`App.vue` 以及 `AgentTraceDAG.vue` 进行深度重构，通过常量提取、算法剥离以及子组件拆分，实现高内聚、低耦合的模块化工程结构。

---

## 1. 目标与定位 (Goal & Position)

*   **重构痛点：**
    *   `src/App.vue` 累积了过长的流式演示 mock 数据及静态代码字符串片段（`staticSnippets`），导致主视图文件极度臃肿。
    *   `src/components/AgentTraceDAG/AgentTraceDAG.vue` 承担了过多职责，包括 BFS 图拓扑分层计算、SVG 连接线自适应几何计算、右侧 Inspector 信息格式化提取，以及各类子渲染器（Terminal、Diff、File、Search）的直接依赖。
*   **重构原则：**
    *   **职责单一 (Single Responsibility)：** 页面级组件只负责业务布局与状态流转；拓扑图组件只负责画布及连线绘制；Inspector 详情抽屉只负责节点详细数据回显解析。
    *   **算法与视图解耦：** 图布局算法与几何计算以纯函数或 Composition API 形式外包，使 Vue 组件结构保持精简和纯粹。
    *   **无感重构：** 在瘦身与结构调优的同时，确保功能、交互效果（如 SVG 流光动画、详情收缩）和测试完全不受负面影响。

---

## 2. 架构设计与重构方案

### 2.1. App.vue 瘦身与演示数据剥离

*   **新增常量与 Mock 文件：**
    *   [NEW] [src/mockData.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/mockData.ts)：存放 `mockBasicFlow`、`mockIntermediateFlow`、`mockAdvancedFlow` 演示数据。
    *   [NEW] [src/constants/snippets.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/constants/snippets.ts)：存放 `staticSnippets` 常量对象，内含各种示例 Vue 源码片段。
*   **App.vue 修改：**
    *   使用 `import { mockBasicFlow, ... }` 导入演示数据。
    *   使用 `import { staticSnippets }` 导入展示代码。
    *   删除原有的 inline 变量定义，将行数从 1170 行降低至 350 行左右。

### 2.2. DAG 拓扑布局与连线几何算法抽离

*   **新增算法模块：**
    *   [NEW] [src/components/AgentTraceDAG/layout.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/layout.ts)：
        *   导出 `computeBFSLayout(nodes: DAGNode[], edges: DAGEdge[])` 函数。它接收节点与边，通过拓扑排序和 BFS 计算各节点的列（column）和层级（level）。
        *   导出 `getBezierPath(x1, y1, x2, y2)` 函数，生成贝塞尔曲线路径字符串。
*   **新增 UI 逻辑 Hooks：**
    *   [NEW] [src/components/AgentTraceDAG/useDAGLayout.ts](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/useDAGLayout.ts)：
        *   管理 SVG 连线数据 `links` 响应式 state。
        *   实现 ResizeObserver 自适应逻辑，监听容器尺寸变化并自动调用 `updateLinks`。
        *   提供 `updateLinks(containerEl, nodeElements, edges, nodes)` 辅助方法，根据渲染完毕的 DOM 节点 BoundingRect 实时计算连线坐标。
*   **AgentTraceDAG.vue 修改：**
    *   移除 inline 复杂的 BFS 算法代码。
    *   导入 `computeBFSLayout` 计算分层 columns。
    *   导入并应用 `useDAGLayout` hook，将画布自适应及重绘逻辑移交给 hook，只保留 columns 分层节点列表与 SVG 曲线模板绑定。

### 2.3. Inspector 详情面板解耦为独立子组件

*   **新增子组件：**
    *   [NEW] [src/components/AgentTraceDAG/DAGInspector.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/components/AgentTraceDAG/DAGInspector.vue)：
        *   **Props**：
            *   `selectedNode`: `DAGNode | undefined`
            *   `maxOutputLength`: `number`
        *   **Emits**：
            *   `close`: 派发给父组件以清空当前选中节点。
        *   **逻辑与组件移交**：
            *   移入四大子渲染器（`TerminalRenderer`, `DiffRenderer`, `SearchRenderer`, `FileRenderer`）。
            *   移入特定工具数据解析的计算属性：`isTerminalTool`、`isDiffTool`、`isFileTool`、`isSearchTool`、`terminalCommand`、`fileInfo`、`diffInfo`、`formattedInput`、`formattedOutput`。
            *   移入二级展开折叠逻辑 `isInputCollapsed`、`isOutputCollapsed`。
*   **AgentTraceDAG.vue 修改：**
    *   移除与子渲染器依赖及特定工具属性提取有关的所有计算属性。
    *   以 `<DAGInspector :selected-node="selectedNode" @close="selectedNodeId = ''" />` 代替原有的 Inspector DOM 树。

---

## 3. 规格自检 (Spec Self-Check)

1.  **占位符扫描：** 无任何 TODO 或未明确字段。
2.  **内部一致性：** `DAGInspector` 需要引入 `TerminalRenderer` 等组件，它们位于 `../AgentTrace/renderers/` 目录，需保证相对路径引用无误。
3.  **范围检查：** 本次重构仅涉及逻辑、常量及子组件解耦，不引入新功能或改变交互特征。
4.  **模糊性消除：** BFS 图布局在节点 parentIds 不存在时默认从 Level 0 起始，此策略保持不变。

---

## 4. 验证与测试计划 (Verification Plan)

### 4.1. 自动化单元测试
*   运行 `npm run test`，确保现存的 DAG 和 App 测试通过，无编译错误。
*   为 `computeBFSLayout` 编写简单的测试，确保 BFS 算法能正确计算层级。

### 4.2. 手动验证
*   运行 `npm run dev` 打开本地工作台，切换“新版 AgentTraceDAG”页签，点击各个节点，确认右侧 Inspector 详情展示及折叠操作如常，SVG 曲线绘制及流光动画正常。
*   切换基本、中阶、高阶模拟，确认模拟功能未受影响。
