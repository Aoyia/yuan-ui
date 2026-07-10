# Tab 切换渐进式渲染实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 移除 workbench 页面 Tab 切换的 loading 遮罩层，代以平滑的 Cross-fade 绝对定位重合淡入淡出。

**架构：** 在 `App.vue` 中同步更新 `activeTab`，移除 `isSwitching` 和定时器，使用 `<Transition>` 包裹组件。针对 Vue 3 的多根节点（Fragment）组件使用 `<div class="tab-view-container">` 进行包裹。在 `style.css` 中利用绝对定位实现新旧组件的原地重合与 opacity 过渡，并在淡出时移除 `pointer-events`。

**技术栈：** Vue 3, CSS

---

### 任务 1：修改 App.vue 移除 Loading 并添加包装与过渡

**文件：**
- 修改：[playground/App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)

- [ ] **步骤 1：修改 App.vue**

编辑 [playground/App.vue](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/App.vue)。
1. 移除 `import { Loading }`
2. 移除 `isSwitching` 变量，简化 `handleTabChange` 方法
3. 移除 Tab 按钮上的 `:disabled="isSwitching"` 属性
4. 移除 `<div v-if="isSwitching" class="workspace-loading-overlay">` 的 Loading 结构
5. 将 `<KeepAlive>` 块外包裹 `<Transition name="tab-fade">` 并在其内部为两个状态添加 `<div class="tab-view-container">` 包装容器

预期修改后部分代码：
```html
<script setup lang="ts">
import { ref } from 'vue'
import { ShieldCheck, Terminal } from '@lucide/vue'
import TraceDemo from './components/TraceDemo.vue'
import RendererDemo from './components/RendererDemo.vue'

const activeTab = ref<'trace' | 'streamRenderer'>('trace')

function handleTabChange(tab: 'trace' | 'streamRenderer') {
  activeTab.value = tab
}
</script>

<template>
  <div class="demo-workbench">
    <!-- Header 省略 -->
    ...
    <!-- 主工作区 Workspace -->
    <div class="workspace">
      <!-- 动态视图切换，带渐隐渐现过渡 -->
      <Transition name="tab-fade">
        <KeepAlive>
          <div v-if="activeTab === 'trace'" class="tab-view-container" key="trace">
            <TraceDemo />
          </div>
          <div v-else class="tab-view-container" key="streamRenderer">
            <RendererDemo />
          </div>
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>
```

- [ ] **步骤 2：Commit 变更**

运行：
```bash
git add playground/App.vue
git commit -m "feat: 移除 App.vue 的 loading 遮罩层并用 Transition 包裹 Tab"
```

---

### 任务 2：修改 style.css 新增过渡与定位样式

**文件：**
- 修改：[playground/style.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/style.css)

- [ ] **步骤 1：编辑 style.css 写入样式并清理 Loading**

编辑 [playground/style.css](file:///Users/neoyuan/Desktop/aoyi/yuan-ui/playground/style.css)，移除原 `.workspace-loading-overlay` 样式（约在第 821-839 行），并在文件最末尾添加：
```css
/* Tab 视图包装器：绝对定位重叠，实现无缝渐变 */
.tab-view-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
}

/* Tab 渐隐渐现 (Fade) 动画效果 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

/* 优化：当旧 Tab 正在淡出时，禁用其指针事件，确保用户可以立刻点击和操作新 Tab */
.tab-fade-leave-active {
  pointer-events: none;
}
```

- [ ] **步骤 2：Commit 变更**

运行：
```bash
git add playground/style.css
git commit -m "style: 增加 tab 渐变重合样式，并清理无用 loading css"
```

---

### 任务 3：本地回归测试与手动验证

- [ ] **步骤 1：运行回归测试**

运行：
```bash
npm run test
```
确认已有的 50 个单元测试通过，没有任何受到影响的副作用。

- [ ] **步骤 2：运行本地开发服务器手动视觉检查**

运行：
```bash
npm run dev
```
进入控制台给出的本地 URL，点击切换 Tab 按钮，验证：
1. 切换逻辑是否为即时同步，不再出现 Loading 字样与模糊毛玻璃；
2. 新旧组件渐隐渐现是否丝滑无抖动，排版是否对齐。
