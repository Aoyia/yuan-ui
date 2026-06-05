import { CSSProperties } from 'react';

export interface LoadingProps {
  /**
   * 是否为全屏遮罩模式
   * @default false
   */
  fullScreen?: boolean;

  /**
   * 提示文本内容，传 `null` 或空字符串可隐藏文本
   * @default 'Loading'
   */
  text?: string | null;

  /**
   * 尺寸档位
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 自定义流光颜色（覆盖 CSS 变量 --yuan-accent）
   */
  color?: string;

  /**
   * 附加 CSS 类名
   */
  className?: string;

  /**
   * 附加行内样式
   */
  style?: CSSProperties;
}

/**
 * Loading 加载组件 — Apple 风格 ♾️ 伯努利双纽线动画
 *
 * 一个精致的无限符号 (∞) 流光动画加载指示器，
 * 运用余弦波简谐运动控制光束长度周期变化。
 */
export declare function Loading(props: LoadingProps): JSX.Element;
