# yuan-ui

一套精致的 React UI 组件库 — Apple 风格极简设计。

## 安装

```bash
npm install yuan-ui
```

## 使用

```jsx
import { Loading } from 'yuan-ui';
import 'yuan-ui/style.css';

function App() {
  return (
    <div>
      {/* 局部加载指示器 */}
      <Loading text="加载中" />

      {/* 全屏遮罩加载 */}
      <Loading fullScreen text="正在同步数据..." />

      {/* 自定义尺寸与流光色 */}
      <Loading size="sm" color="#00f2fe" />
      <Loading size="lg" color="#ff6b6b" text="请稍候" />
    </div>
  );
}
```

## 组件

### `<Loading />`

Apple 风格 ♾️ 伯努利双纽线动画加载指示器。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fullScreen` | `boolean` | `false` | 全屏遮罩模式 |
| `text` | `string \| null` | `'Loading'` | 提示文本，传空可隐藏 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸档位 |
| `color` | `string` | — | 自定义流光颜色 |
| `className` | `string` | — | 附加 CSS 类名 |
| `style` | `CSSProperties` | — | 附加行内样式 |

### CSS 变量 (Design Tokens)

可通过覆盖 CSS 变量实现全局主题定制：

```css
.yuan-loading {
  --yuan-accent: #00f2fe;       /* 流光色 */
  --yuan-text-color: #94a3b8;   /* 文本色 */
  --yuan-track-opacity: 0.06;   /* 轨迹线透明度 */
  --yuan-bg: #0f1117;           /* 全屏模式背景色 */
}
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## License

MIT
