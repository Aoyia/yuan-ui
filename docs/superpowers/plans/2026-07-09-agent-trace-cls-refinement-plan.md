# AgentTrace CLS 抖动优化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 优化 `AgentTrace` 组件折叠展开时的 CLS 抖动问题。通过精简与优化 JS 的 `scrollTop` 写入逻辑，保护浏览器的原生滚动锚定机制。

**架构：**
1. 重塑 `App.vue` 的智能滚动判定：仅在处于底部容差范围内时自动随内容追加向下滚动，避免打断原生滚动锚定。
2. 彻底删除 `App.vue` 中 `traceOpen` 的 `requestAnimationFrame` 逐帧滚动锁死。

**技术栈：** Vue 3 (Composition API), Git, Vitest

---

## 拟修改与新增文件

- [MODIFY] [App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/src/App.vue)

---

## 详细任务步骤

### 任务 1：重构 App.vue 智能滚动逻辑

**文件：**
- 修改：`src/App.vue`

- [ ] **步骤 1：重写 `scrollToBottom` 函数**
  引入底部容差判定，确保在非底部且非初期流式追加时不强行更改 `scrollTop`：
  ```typescript
  function scrollToBottom() {
    nextTick(() => {
      const el = documentViewportRef.value
      if (!el) return
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 15
      if (isAtBottom || isStreaming.value) {
        el.scrollTop = el.scrollHeight
      }
    })
  }
  ```

- [ ] **步骤 2：删除高频滚动锁死跟随器**
  彻底删除 `watch(traceOpen, ...)` 中 `else` 分支内 350ms 的 `requestAnimationFrame` 跟随循环逻辑，保留基本的展开/折叠状态分发。

- [ ] **步骤 3：跑通自动化测试**
  运行：`npm run test`
  预期：全部 18 个测试通过。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/App.vue
  git commit -m "feat: refactor App.vue scroll logic to eliminate CLS layout jitter"
  ```
