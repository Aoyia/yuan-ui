# Loading 组件重构为纯 Vue 3 SFC 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将遗留的 React/JSX 版本的 Loading 组件彻底重构为纯 Vue 3 单文件组件 (SFC) 并配置打包入口与物理清理。

**架构：** 在 `src/components/Loading` 目录下创建 `Loading.vue` SFC 和新的 `index.ts`。物理删除旧的 `Loading.jsx`、`Loading.d.ts` 和 `index.js`，最终通过修改 `src/index.ts` 导出新组件并运行构建验证。

**技术栈：** Vue 3, TypeScript, Vitest, Vite

---

## 计划涉及文件清单
* 创建：`src/components/Loading/Loading.vue` (Vue 组件)
* 创建：`src/components/Loading/index.ts` (组件统一导出)
* 创建：`src/components/Loading/__tests__/Loading.test.ts` (基础组件编译与导入测试)
* 修改：`src/index.ts` (项目总导出)
* 删除：`src/components/Loading/Loading.jsx`
* 删除：`src/components/Loading/Loading.d.ts`
* 删除：`src/components/Loading/index.js`

---

## 详细实施步骤

### 任务 1：创建并实现 Vue 3 Loading 组件

**文件：**
* 创建：`src/components/Loading/Loading.vue`

- [ ] **步骤 1：创建 Loading.vue 并实现 Vue 3 组件逻辑**
  
  写入以下代码到 `src/components/Loading/Loading.vue`：
  
  ```vue
  <script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    fullScreen?: boolean
    text?: string | null
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

- [ ] **步骤 2：Commit 任务 1 变更**
  
  ```bash
  git add src/components/Loading/Loading.vue
  git commit -m "feat: add Vue 3 SFC Loading component"
  ```

---

### 任务 2：创建组件导出入口 index.ts 并配置单元测试

**文件：**
* 创建：`src/components/Loading/index.ts`
* 创建：`src/components/Loading/__tests__/Loading.test.ts`

- [ ] **步骤 1：创建 index.ts 导出 Loading.vue**
  
  写入以下代码到 `src/components/Loading/index.ts`：
  
  ```typescript
  export { default as Loading } from './Loading.vue'
  ```

- [ ] **步骤 2：创建 Loading 的基础导入单元测试**
  
  写入以下代码到 `src/components/Loading/__tests__/Loading.test.ts`：
  
  ```typescript
  import { describe, it, expect } from 'vitest'
  import Loading from '../Loading.vue'

  describe('Loading Component', () => {
    it('should compile and export a valid Vue 3 component', () => {
      expect(Loading).toBeDefined()
      expect(Loading.__name).toBe('Loading')
    })
  })
  ```

- [ ] **步骤 3：运行 Vitest 测试以验证 Vue 3 组件可成功解析**
  
  运行：`npx vitest run src/components/Loading`
  预期：测试通过，没有任何编译或路径解析错误。

- [ ] **步骤 4：Commit 任务 2 变更**
  
  ```bash
  git add src/components/Loading/index.ts src/components/Loading/__tests__/Loading.test.ts
  git commit -m "feat: add component export entry and vitest check"
  ```

---

### 任务 3：物理删除 React 遗留文件

**文件：**
* 删除：`src/components/Loading/Loading.jsx`
* 删除：`src/components/Loading/Loading.d.ts`
* 删除：`src/components/Loading/index.js`

- [ ] **步骤 1：物理删除遗留文件**
  
  ```bash
  rm src/components/Loading/Loading.jsx
  rm src/components/Loading/Loading.d.ts
  rm src/components/Loading/index.js
  ```

- [ ] **步骤 2：Commit 任务 3 变更**
  
  ```bash
  git add src/components/Loading/
  git commit -m "refactor: remove legacy React files for Loading component"
  ```

---

### 任务 4：更新顶层打包入口

**文件：**
* 修改：`src/index.ts`

- [ ] **步骤 1：将 Loading 组件导出添加至总入口**
  
  在 `src/index.ts` 结尾处追加：
  
  ```typescript
  export * from './components/Loading'
  ```

- [ ] **步骤 2：Commit 任务 4 变更**
  
  ```bash
  git add src/index.ts
  git commit -m "refactor: export Loading component in global index"
  ```

---

### 任务 5：运行构建与整体测试验证

**运行环境/依赖：**
* 项目根目录

- [ ] **步骤 1：运行所有单元测试**
  
  运行：`npm run test`
  预期：所有测试全部通过（包含 `Loading.test.ts` 以及现有的 `reducer.test.ts`）。

- [ ] **步骤 2：运行打包构建**
  
  运行：`npm run build`
  预期：打包成功，`dist/` 目录下生成产物，且没有 TypeScript 编译报错。

- [ ] **步骤 3：Commit 变更**
  
  ```bash
  git commit --allow-empty -m "build: verify final Vue 3 build succeeds"
  ```
