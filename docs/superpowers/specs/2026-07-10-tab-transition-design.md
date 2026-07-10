# 智能体工作台 Tab 切换渐进式渲染设计方案

本文档描述了如何优化 Yuan UI 智能体工作台在切换 Tab 时的视觉体验。我们将移除原本突兀且产生闪屏的 Loading 遮罩层，改用平滑的 Cross-fade（渐隐渐现）过渡动画，让内容以更加丝滑的方式呈现。

## 1. 目标与背景

当前智能体工作台在切换 Tab（“新版 AgentTrace”与“流式 VNode 渲染”）时，存在一个硬编码的 `150ms` 延迟，且会弹出一个高模糊度的 Loading 遮罩层。由于这两个组件都已被打包且使用 `<KeepAlive>` 进行缓存，组件的实例化与渲染极快。Loading 遮罩的短暂闪烁反倒成了主要的视觉干扰源。

我们希望：
- **去掉 Loading 遮罩层**，避免产生短时间内的“闪屏”和“打断感”。
- **即时响应切换**，点击 Tab 时页面立即开始过渡，没有任何人工等待时延。
- **使用 Cross-fade 渐变**，在切换时，旧内容平滑淡出，新内容平滑淡入。

---

## 2. 技术设计

由于 `TraceDemo` 与 `RendererDemo` 组件都是 Vue 3 的多根节点（Fragment）组件，直接对它们使用 `<Transition>` 会导致动画失效。因此，我们需要在切换组件外围包装一层统一的 `.tab-view-container` 根节点。

为确保切换瞬间两个组件在 DOM 中重叠而不发生上下布局抖动，我们采用**绝对定位重叠方案**：
- 容器 `.workspace` 原本就拥有 `position: relative` 和固定高度。
- 包装容器 `.tab-view-container` 采用 `position: absolute; width: 100%; height: 100%;`，让两个视图在过渡期完美重合。
- 通过 CSS `opacity` 属性控制淡入淡出，并使用 `pointer-events: none` 确保正在淡出的旧视图不会阻挡用户立刻对新视图进行操作。

---

## 3. 具体变更说明

### 3.1 逻辑与模板变更

#### [MODIFY] [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)

- 移除 `isSwitching` 状态及 `setTimeout` 延迟逻辑。
- 移除 `<Loading>` 组件的引入和 `workspace-loading-overlay` 模板结构。
- 将 Tab 按钮上的禁用状态 (`:disabled="isSwitching"`) 移除。
- 在 `<KeepAlive>` 外层使用 `<Transition name="tab-fade">`，并用 `<div class="tab-view-container">` 包裹两个 Demo 组件。

### 3.2 样式变更

#### [MODIFY] [style.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/style.css)

- 移除 `.workspace-loading-overlay` 相关样式以清理代码。
- 新增 `.tab-view-container` 的绝对定位排版样式。
- 新增 `.tab-fade-enter-active` 等 Vue 过渡动画类样式。

---

## 4. 验证计划

1. **功能验证**：
   - 启动本地开发服务：`npm run dev`。
   - 频繁点击顶部的 Tab 按钮，验证视图能否无缝切换，原本的 Loading 遮罩不再出现。
2. **视觉与交互验证**：
   - 观察切换瞬间，旧内容是否逐渐淡出，新内容是否平滑淡入，中间是否无任何留白与闪屏。
   - 观察两个视图的左右和上下位置，确认没有因为绝对定位产生任何像素级的偏移与布局抖动。
   - 切换的瞬间，在新视图上点击或交互，确保操作即时响应（无 `pointer-events` 阻挡问题）。
