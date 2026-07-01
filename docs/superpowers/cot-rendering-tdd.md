# 智能体思维链 (CoT) 拓扑渲染 ── 技术设计文档 (TDD)

本设计文档详细定义了下一代 **AgentTraceV2 拓扑渲染系统** 的底层技术实现。这套系统以无外部庞大图表依赖（如 G6、D3 或 GoJS）为原则，仅基于 Vue 3 核心生态、原生 SVG 渲染与 Vanilla CSS 动力学设计。

---

## 1. 拓扑分层布局系统 (BFS Layering Layout)

图布局最大的挑战是气泡的高度自适应与防重叠。本系统放弃了完全基于绝对坐标的碰撞布局，采用 **Column-based Flex Grid 结合 SVG 连接器** 的混合布局设计。

### 1.1 节点层级拓扑排序算法 (BFS Layering Algorithm)
输入的节点数组是扁平的：
```typescript
interface DAGNode {
  id: string
  parentId?: string
  parentIds?: string[]
  status: 'pending' | 'active' | 'complete' | 'error' | 'cancelled' | 'pruned'
}
```

我们的算法逻辑如下：
1. **建立依赖映射**：遍历扁平节点数组，分别建立 `childMap: Map<string, string[]>`（邻接表）和 `inDegreeMap: Map<string, number>`（入度表）。
2. **确定起始根集合**：找出所有入度为 0（没有父节点）的节点，将其层级 `level` 设为 0，并推入 BFS 队列。
3. **队列扩散分层**：
   - 从队列中弹出一个节点 `u`，获取其邻接子节点列表。
   - 对于每个子节点 `v`，更新其层级 `level[v] = Math.max(level[v], level[u] + 1)`。
   - 为了应对可能由用户多次干预或并发推理造成的“多亲子树”状况，子节点的最终层级应当是**其所有父节点中最大层级值加一**，即：
     $$L_{target}(v) = \max_{u \in Parents(v)} (L(u) + 1)$$
   - 若子节点尚未进入队列，将其加入队列以继续向后扩散。
4. **分列组织**：计算完所有节点的 level 后，按 level 的值分发至多列数组 `columns: Array<{ level: number, nodes: DAGNode[] }>`。每一列渲染为一个垂直的 Flexbox。

---

## 2. SVG 连接器数学坐标模型 (Bezier Connectors)

由于节点被自然安放在 CSS Flexbox 多列容器中，节点的位置完全由浏览器自动排版决定。我们在容器底层叠加一个全覆盖的 `absolute` 定位 SVG 画布，并在渲染后动态获取气泡坐标绘制曲线。

```
       [Parent Node]                               [Child Node]
    +-----------------+                         +-----------------+
    |                 | (x1, y1)       (x2, y2) |                 |
    |                 |-----> (x1+dx, y1)       |                 |
    |                 |        \                |                 |
    |                 |         \----->         |                 |
    +-----------------+        (x2-dx, y2)----->+-----------------+
```

### 2.1 曲线方程精算
对于任意边 $E(u, v)$，我们需要计算其在 SVG 相对空间下的起点 $P_0(x_1, y_1)$ 与终点 $P_3(x_2, y_2)$：

1. **容器基准相对化**：
   设容器的边界距视口（Viewport）的距离为 $R_{container} = (Left_{c}, Top_{c})$。
   父节点的 DOM 边界为 $R_{parent} = (Left_{p}, Top_{p}, Width_{p}, Height_{p})$。
   子节点的 DOM 边界为 $R_{child} = (Left_{d}, Top_{d}, Width_{d}, Height_{d})$。

2. **起点与终点推导**：
   - 起点处于父节点右侧中心：
     $$x_1 = Left_{p} - Left_{c} + Width_{p}$$
     $$y_1 = Top_{p} - Top_{c} + \frac{Height_{p}}{2}$$
   - 终点处于子节点左侧中心：
     $$x_2 = Left_{d} - Left_{c}$$
     $$y_2 = Top_{d} - Top_{c} + \frac{Height_{d}}{2}$$

3. **三次贝塞尔曲线控制点设计**：
   为了绘制出最平滑柔和的横向 S 形曲线，我们将水平控制偏置 $dx$ 设为横向距离的 $0.5$ 倍：
   $$dx = \max(16, |x_2 - x_1| \times 0.5)$$
   两个控制点分别为 $P_1(x_1 + dx, y_1)$ 与 $P_2(x_2 - dx, y_2)$。
   对应的 SVG Path 生成指令为：
   ```typescript
   const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
   ```

---

## 3. 脉冲流光动效 (Kinetic Glow Effect)

在 `active` 状态的连线上实现动态流光以象征心流数据传输：

### 3.1 SVG 定义与 CSS 组合机制
1. **背景发光下衬层 (Glow Underlay)**：
   渲染一条宽度为 `6px`，带 `2px` 高斯模糊滤镜的半透明连线作为光晕。
   ```html
   <path d="..." class="link-glow-underlay" />
   ```
2. **渐变流光上衬层 (Flow Overlay)**：
   渲染一条配合 `linearGradient` 与 `stroke-dasharray` 偏移动画的流光线。
   ```html
   <path d="..." class="link-flow-overlay" />
   ```

### 3.2 虚线偏移公式与动画
使用 CSS 的 `@keyframes` 在时间轴上移动偏移量 `stroke-dashoffset`。
```css
.link-flow-overlay {
  stroke: url(#glow-gradient);
  stroke-dasharray: 15 35; /* 实线 15px，间隔 35px */
  animation: flow-dash 1.8s infinite linear;
}

@keyframes flow-dash {
  to {
    stroke-dashoffset: -50; /* 向前推移虚线间隔的倍数 */
  }
}
```

---

## 4. 时空分叉决策剪枝逻辑 (Time-travel Fork & Prune)

当用户在特定的节点 $N_{fork}$ 触发 Fork 干预时，系统在 Reducer 层面的数据流控制如下：

1. **寻找子孙节点（BFS Downward Reachability）**：
   以 $N_{fork}$ 为起点进行向下拓扑遍历，找出所有能到达的子孙节点集合 $S_{descendants}$。
2. **状态覆写与持久化**：
   将集合中所有节点的状态属性 `status` 原地更新为 `'pruned'`。这会自动触发 Vue 3 渲染系统的 CSS 变化：
   - 气泡卡片透明度调低为 `0.4`，且取消内部 `active` 态呼吸灯。
   - 所指向子孙节点的 SVG 曲线改为 `stroke-dasharray: 4` 的虚灰线。
3. **派发平行分支**：
   插入一个全新的 Reasoning 节点 $N_{new}$，设置其 `parentId` 指向 $N_{fork}$，它的 `status` 设为 `'active'`，向大模型发射干预提示词包，启动全新的平行思考。

---

## 5. 极速流式高吞吐优化 (High-performance Optimization)

大模型在高并发流式输出时，坐标可能频繁发生极其微小的变化。如果不加控制，会造成严重的 DOM 计算开销（Reflow / Layout Thrashing）。

1. **Resize 监听防抖 (Throttle ResizeObserver)**：
   我们使用 `ResizeObserver` 监听主容器的宽度与高度变化。通过 `requestAnimationFrame`（rAF）对更新坐标的方法 `updateLinks` 进行防抖包裹，限制在下一帧空闲时再执行重绘，使得重绘上限锁定为 60FPS。
2. **只读状态缓存 (Read-only Boundary)**：
   当一个节点的状态流转到 `complete`（完成）之后，它的 DOM 尺寸与高度就不再会发生任何变化。系统在 `updateLinks` 时，对起点和终点都在 `complete` 节点内的 SVG 路径，将其坐标缓存到内存的 `coordsCache` 哈希表，仅对活跃的 `active` 节点进行实时的 `getBoundingClientRect` 测算，降低 80% 的 DOM 测读开销！
