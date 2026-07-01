# Yuan UI 代码结构第一性原理重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 对 Yuan UI 代码结构进行重构，废弃冗余的 ChainOfThought 组件及其遗留适配，将 Loading 组件完全 Vue SFC 化，并将 AgentTraceV2 语义化重命名为 AgentTraceDAG。

**架构：**
1. 物理删除所有 `ChainOfThought` 代码及 legacy.ts。
2. 移植 `Loading.jsx` 为标准的 `Loading.vue` 单文件组件，消除 React/CSSProperties 依赖。
3. 迁移并重命名 `AgentTraceV2` 目录为 `AgentTraceDAG`，相应地在 `src/index.ts` 调整对外导出，并更新开发页 `App.vue`。
4. 全程使用 `npm run test` 与 `npm run build` 对打包产物和类型进行严格校验。

**技术栈：** Vue 3, Vite, TypeScript, Vitest, CSS

---

## 文件修改列表与职责关系
| 文件 | 变更类型 | 职责描述 |
| --- | --- | --- |
| `src/components/ChainOfThought/*` | **[DELETE]** | 废弃旧版思维链组件的十余个文件 |
| `src/components/AgentTrace/legacy.ts` | **[DELETE]** | 废弃旧版格式与 AgentTrace 格式转换适配器 |
| `src/components/Loading/Loading.jsx` | **[DELETE]** | 废弃 React TSX/JSX 编写的 Loading |
| `src/components/Loading/Loading.d.ts` | **[DELETE]** | 废弃手写 React 类型定义 |
| `src/components/Loading/index.js` | **[DELETE]** | 废弃旧 JS 导出文件 |
| `src/components/Loading/Loading.vue` | **[NEW]** | 新建纯正的 Vue 3 Loading SFC 组件 |
| `src/components/Loading/index.ts` | **[NEW]** | 新建 Loading 的 TS 导出入口 |
| `src/components/AgentTraceDAG/` | **[NEW]** | 重命名 AgentTraceV2 后新建的 DAG 组件目录 |
| `src/components/AgentTraceV2/` | **[DELETE]** | 废弃原 AgentTraceV2 命名目录 |
| `src/index.ts` | **[MODIFY]** | 全局打包入口，更新导出路由 |
| `src/App.vue` | **[MODIFY]** | 本地演示及开发页，更新引入组件路径 |

---

### 任务 1：彻底清理废弃的 ChainOfThought 组件及适配逻辑

**文件：**
- 删除：`src/components/ChainOfThought` (整个目录)
- 删除：`src/components/AgentTrace/legacy.ts`
- 修改：`src/index.ts`
- 修改：`src/components/AgentTrace/index.ts`

- [ ] **步骤 1：物理删除 ChainOfThought 文件夹和 legacy.ts**
  物理删除项目路径下的 `src/components/ChainOfThought` 整个目录以及 `src/components/AgentTrace/legacy.ts`。

- [ ] **步骤 2：修改打包入口以移除对 ChainOfThought 的导出**
  修改 `src/index.ts`，删除第 4 行的 export 语句。
  目标代码段（`src/index.ts`）：
  ```typescript
  // 移除第 4 行
  export * from './components/ChainOfThought'
  ```

- [ ] **步骤 3：修改 AgentTrace 内部入口以移除 legacy 导出**
  修改 `src/components/AgentTrace/index.ts`，移除对 `legacy` 的导出：
  ```typescript
  // 移除这一行
  export { mapLegacyAgentStepNode } from './legacy'
  ```

- [ ] **步骤 4：运行测试与打包命令校验**
  运行：`npm run test` 以及 `npm run build`
  预期：测试通过，无编译/打包报错。

- [ ] **步骤 5：Commit**
  ```bash
  git add src/components/AgentTrace/index.ts src/index.ts
  git commit -m "refactor: remove legacy ChainOfThought component and legacy adapter"
  ```

---

### 任务 2：将 Loading 组件重构为纯 Vue 3 SFC

**文件：**
- 新建：`src/components/Loading/Loading.vue`
- 新建：`src/components/Loading/index.ts`
- 删除：`src/components/Loading/Loading.jsx`
- 删除：`src/components/Loading/Loading.d.ts`
- 删除：`src/components/Loading/index.js`
- 修改：`src/index.ts`

- [ ] **步骤 1：新建 Vue 版 Loading 组件**
  创建 `src/components/Loading/Loading.vue`，实现 Apple ♾️ 双纽线流光动画。
  内容：
  ```vue
  <script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    fullScreen?: boolean
    text?: string
    size?: 'sm' | 'md' | 'lg'
    color?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    fullScreen: false,
    text: 'Loading',
    size: 'md',
  })

  const SIZE_MAP = {
    sm: { width: 64, height: 38, gap: 14, fontSize: 11 },
    md: { width: 96, height: 58, gap: 22, fontSize: 13 },
    lg: { width: 128, height: 78, gap: 28, fontSize: 15 },
  }

  const sizeConfig = computed(() => SIZE_MAP[props.size] || SIZE_MAP.md)

  const modeClass = computed(() => props.fullScreen ? 'yuan-loading--fullscreen' : 'yuan-loading--inline')

  const rootStyle = computed(() => {
    return props.color ? { '--yuan-accent': props.color } : {}
  })
  </script>

  <template>
    <div class="yuan-loading" :class="[modeClass]" :style="rootStyle">
      <div class="yuan-loading__content" :style="{ gap: `${sizeConfig.gap}px` }">
        <svg
          class="yuan-loading__spinner"
          viewBox="0 0 100 60"
          xmlns="http://www.w3.org/2000/svg"
          :style="{ width: `${sizeConfig.width}px`, height: `${sizeConfig.height}px` }"
        >
          <defs>
            <path
              id="yuan-infinity-path"
              d="M 80.000 30.000 L 79.877 31.564 L 79.513 33.085 L 78.923 34.525 L 78.129 35.848 L 77.159 37.029 L 76.045 38.048 L 74.820 38.895 L 73.516 39.565 L 72.162 40.062 L 70.785 40.392 L 69.404 40.568 L 68.038 40.603 L 66.700 40.510 L 65.399 40.304 L 64.142 40.000 L 62.932 39.610 L 61.771 39.148 L 60.658 38.622 L 59.592 38.045 L 58.571 37.423 L 57.592 36.765 L 56.651 36.076 L 55.744 35.363 L 54.868 34.629 L 54.017 33.880 L 53.188 33.118 L 52.376 32.346 L 51.577 31.568 L 50.786 30.785 L 50.000 30.000 L 49.214 29.215 L 48.423 28.432 L 47.624 27.654 L 46.812 26.882 L 45.983 26.120 L 45.132 25.371 L 44.256 24.637 L 43.349 23.924 L 42.408 23.235 L 41.429 22.577 L 40.408 21.955 L 39.342 21.378 L 38.229 20.852 L 37.068 20.390 L 35.858 20.000 L 34.601 19.696 L 33.300 19.490 L 31.962 19.397 L 30.596 19.432 L 29.215 19.608 L 27.838 19.938 L 26.484 20.435 L 25.180 21.105 L 23.955 21.952 L 22.841 22.971 L 21.871 24.152 L 21.077 25.475 L 20.487 26.915 L 20.123 28.436 L 20.000 30.000 L 20.123 31.564 L 20.487 33.085 L 21.077 34.525 L 21.871 35.848 L 22.841 37.029 L 23.955 38.048 L 25.180 38.895 L 26.484 39.565 L 27.838 40.062 L 29.215 40.392 L 30.596 40.568 L 31.962 40.603 L 33.300 40.510 L 34.601 40.304 L 35.858 40.000 L 37.068 39.610 L 38.229 39.148 L 39.342 38.622 L 40.408 38.045 L 41.429 37.423 L 42.408 36.765 L 43.349 36.076 L 44.256 35.363 L 45.132 34.629 L 45.983 33.880 L 46.812 33.118 L 47.624 32.346 L 48.423 31.568 L 49.214 30.785 L 50.000 30.000 L 50.786 29.215 L 51.577 28.432 L 52.376 27.654 L 53.188 26.882 L 54.017 26.120 L 54.868 25.371 L 55.744 24.637 L 56.651 23.924 L 57.592 23.235 L 58.571 22.577 L 59.592 21.955 L 60.658 21.378 L 61.771 20.852 L 62.932 20.390 L 64.142 20.000 L 65.399 19.696 L 66.700 19.490 L 68.038 19.397 L 69.404 19.432 L 70.785 19.608 L 72.162 19.938 L 73.516 20.435 L 74.820 21.105 L 76.045 21.952 L 77.159 22.971 L 78.129 24.152 L 78.923 25.475 L 79.513 26.915 L 79.877 28.436 L 80.000 30.000 Z"
              fill="none"
              pathLength="200"
            />
          </defs>
          <use href="#yuan-infinity-path" class="yuan-loading__track" fill="none" />
          <use href="#yuan-infinity-path" class="yuan-loading__path" fill="none" />
        </svg>
        <p
          v-if="text"
          class="yuan-loading__text"
          :style="{ fontSize: `${sizeConfig.fontSize}px` }"
        >
          {{ text }}
        </p>
      </div>
    </div>
  </template>

  <style scoped>
  @import './Loading.css';
  </style>
  ```

- [ ] **步骤 2：创建 Loading 的 TS 导出入口**
  创建 `src/components/Loading/index.ts`，导出 Vue SFC：
  ```typescript
  export { default as Loading } from './Loading.vue'
  ```

- [ ] **步骤 3：清理 React 遗留的旧文件**
  删除 `src/components/Loading/Loading.jsx`、`src/components/Loading/Loading.d.ts` 以及 `src/components/Loading/index.js`。

- [ ] **步骤 4：在全局打包入口中关联新 Loading 组件**
  修改 `src/index.ts`，新增一行：
  ```typescript
  export * from './components/Loading'
  ```

- [ ] **步骤 5：运行测试与类型校验**
  运行：`npm run build`
  预期：构建成功，生成正确的 `.d.ts` 文件且没有任何 React 的类型残留。

- [ ] **步骤 6：Commit**
  ```bash
  git add src/components/Loading src/index.ts
  git commit -m "feat: rewrite Loading component to standard Vue SFC"
  ```

---

### 任务 3：重命名 AgentTraceV2 为 AgentTraceDAG

**文件：**
- 目录移动：将 `src/components/AgentTraceV2` 移动并重命名为 `src/components/AgentTraceDAG`
- 修改：`src/components/AgentTraceDAG/AgentTraceDAG.vue`
- 修改：`src/components/AgentTraceDAG/DAGTraceNode.vue`
- 修改：`src/components/AgentTraceDAG/index.ts`
- 修改：`src/index.ts`

- [ ] **步骤 1：执行目录移动与更名**
  使用命令或终端移动重命名目录。

- [ ] **步骤 2：更新 AgentTraceDAG.vue 内部所有的 V2 标识**
  将 `src/components/AgentTraceDAG/AgentTraceDAG.vue` 内部所有的 `AgentTraceV2` 及 `V2` 相关命名替换为 `AgentTraceDAG` 或 `DAG`，确保风格和类名一致。同时更新组件导出的命名。

- [ ] **步骤 3：更新入口文件的导出映射**
  修改 `src/components/AgentTraceDAG/index.ts`：
  ```typescript
  export { default as AgentTraceDAG } from './AgentTraceDAG.vue'
  export { default as DAGTraceNode } from './DAGTraceNode.vue'
  export * from './types'
  ```

- [ ] **步骤 4：修改顶层打包导出入口**
  修改 `src/index.ts`，移除原 V2 导出，变更为新 DAG 组件的导出：
  ```typescript
  // 移除：export * from './components/AgentTraceV2'
  // 新增：
  export * from './components/AgentTraceDAG'
  ```

- [ ] **步骤 5：运行构建打包验证**
  运行：`npm run build`
  预期：打包构建成功。

- [ ] **步骤 6：Commit**
  ```bash
  git add src/components/AgentTraceDAG src/index.ts
  git commit -m "refactor: rename AgentTraceV2 to AgentTraceDAG for semantic clarity"
  ```

---

### 任务 4：更新 App.vue 对组件的引用并验证效果

**文件：**
- 修改：`src/App.vue`

- [ ] **步骤 1：更新 App.vue 的组件导入路径**
  打开 `src/App.vue`：
  将第 10 行的 `import { AgentTraceDAG } from './components/AgentTraceV2'` 替换为从重构后的新路径引入：
  ```typescript
  import { AgentTraceDAG } from './components/AgentTraceDAG'
  ```

- [ ] **步骤 2：运行单元测试**
  运行：`npm run test`
  预期：全套单元测试通过。

- [ ] **步骤 3：执行最终打包构建**
  运行：`npm run build`
  预期：编译构建正常，无任何 warning。

- [ ] **步骤 4：Commit**
  ```bash
  git add src/App.vue
  git commit -m "refactor: update App.vue imports to match new components structure"
  ```
