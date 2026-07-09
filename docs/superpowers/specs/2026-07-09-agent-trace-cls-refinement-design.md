# AgentTrace 折叠展开 CLS 抖动优化设计规范

本文档定义了解决 `AgentTrace` 组件在折叠或展开状态切换时产生的 CLS（累积布局偏移）和滚动条震颤跳闪的设计规范。

## 1. 第一性原理与剃刀原理背景

- **第一性原理**：浏览器的原生滚动锚定（Scroll Anchoring）是解决页面上游高度变化引起下游文字闪烁的最佳手段。然而，手动高频写入 `scrollTop`（如 `requestAnimationFrame` 每帧写入）会打破这一机制，造成严重的双向拉扯与抖动。回归本质，我们需要给浏览器原生锚定腾出空间，避免 JS 暴力的强制干预。
- **剃刀原理**：精简滚动条操作逻辑，删除 `App.vue` 内部极其繁琐且存在副作用的 `requestAnimationFrame` 滚动跟随器；将流式滚动的触发策略收敛为“仅在滚动条本就在底部时自动追加，否则原样保留”，从而以最少、最干净的代码行数解决 CLS。

---

## 2. 详细设计方案

### 2.1 移除 JS 暴力锁死滚动条行为
彻底删除 `App.vue` 中在 `traceOpen` 为 `false` 时的逐帧 `requestAnimationFrame` 滚动锁死跟随器。该逻辑本意是为了防闪，实则在动画过渡的 `350ms` 周期内强行将视口往下拉，与高度骤缩引发的原生向上锚定发生激烈冲突。

### 2.2 智能滚动锚底策略
重构 `App.vue` 内部的 `scrollToBottom` 方法。判断当前滚动条是否本就在底部（定义容差值为 `15px`）：
- 如果本就在底部，或者智能体正处于流式生成（`isStreaming === true`）的极早期，则将 `scrollTop` 设为 `scrollHeight` 保持滚动跟随。
- 如果用户已经向上翻阅或正在阅读正文中部，则**不进行任何干预**，允许浏览器原生的 `scroll-anchoring` 发挥作用，保证文字在屏幕视口中不发生任何位移。

```typescript
function scrollToBottom() {
  nextTick(() => {
    const el = documentViewportRef.value
    if (!el) return
    
    // 判定用户是否在底部（允许 15px 的微小偏差）
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 15
    
    if (isAtBottom || isStreaming.value) {
      el.scrollTop = el.scrollHeight
    }
  })
}
```

### 2.3 CSS 滚动容器声明保护
在页面主内容滚动容器上明确添加：
```css
.preview-panel {
  scroll-anchoring: auto; /* 保证底层防抖开启 */
}
```

---

## 3. 验证计划

- **模拟运行验证**：打开 `http://localhost:5174/`，在模拟运行生成较长的正文结果后，向上滚动页面并点击展开/折叠思考链，确认下方的正文文本在视口中绝对静止，滚动条没有任何高频跳闪。
- **单元测试验证**：运行 `npm run test`，确保原有的级联渲染及折叠测试 100% 通过。
