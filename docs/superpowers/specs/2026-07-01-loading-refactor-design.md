# Loading 组件重构为纯 Vue 3 SFC 设计规格说明

## 1. 目的与背景
将原 React/JSX 风格下降的 Loading 组件重构为标准的 Vue 3 单文件组件（SFC），以完全移除遗留的 React 相关依赖，符合库的 Vue 3 组件化规范。

## 2. 物理文件变更设计

### 2.1 物理删除遗留文件
* `src/components/Loading/Loading.jsx`
* `src/components/Loading/Loading.d.ts`
* `src/components/Loading/index.js`

### 2.2 创建新文件
* `src/components/Loading/Loading.vue` (主组件)
* `src/components/Loading/index.ts` (组件内部导出入口)

### 2.3 修改全局导出文件
* `src/index.ts` (导出 Loading 组件)

---

## 3. 组件详细设计 (Loading.vue)

### 3.1 属性定义 (Props)
支持以下属性，并在 TypeScript 下显式声明：
* `fullScreen` (`boolean`，默认值: `false`)：是否为全屏遮罩模式。
* `text` (`string | null`，默认值: `'Loading'`)：提示文本内容，为 `null` 时不渲染文本。
* `size` (`'sm' | 'md' | 'lg'`，默认值: `'md'`)：组件大小档位。
* `color` (`string`，可选)：自定义流光颜色，覆盖 `--yuan-accent` 样式变量。

在 Vue 3 SFC 中：
```typescript
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
```

### 3.2 属性透传与样式绑定
* 外部传入的 `class` 和 `style` 不需要通过 `props` 接收，而是利用 Vue 3 的透传属性机制直接透传并合并到根 `div.yuan-loading` 元素上。
* `sizeConfig` 计算属性通过映射 `SIZE_MAP` 动态返回尺寸、间距及字号配置：
  * `sm`: `{ width: 64, height: 38, gap: 14, fontSize: 11 }`
  * `md`: `{ width: 96, height: 58, gap: 22, fontSize: 13 }`
  * `lg`: `{ width: 128, height: 78, gap: 28, fontSize: 15 }`
* 根样式由 `computed` 计算，包含流光颜色控制：
  ```typescript
  const rootStyle = computed(() => {
    return props.color ? { '--yuan-accent': props.color } : {}
  })
  ```

### 3.3 样式引入与作用域隔离
* 通过 `<style scoped>` 引入已有样式 `Loading.css`：
  ```vue
  <style scoped>
  @import './Loading.css';
  </style>
  ```

---

## 4. 打包与编译测试
在重构完毕并物理删除旧文件后，需要通过执行 `npm run build` 来验证构建是否能够正常通过。
