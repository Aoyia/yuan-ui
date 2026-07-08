// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffRenderer from '../renderers/DiffRenderer.vue'

describe('DiffRenderer Component', () => {
  beforeAll(() => {
    // 模拟 HTMLElement.prototype.scrollHeight 属性
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 600
      }
    })
  })

  it('should compile and export a valid Vue 3 component', () => {
    expect(DiffRenderer).toBeDefined()
    expect(DiffRenderer.__name).toBe('DiffRenderer')
  })

  it('should behave correctly with empty diff', () => {
    const wrapper = mount(DiffRenderer, {
      props: {
        filePath: 'empty.diff',
        diff: ''
      }
    })

    expect(wrapper.find('.file-path').text()).toBe('empty.diff')
    expect(wrapper.find('.diff-line').exists()).toBe(false)
  })

  it('should behave correctly with short diff (<= 15 lines)', () => {
    const shortDiff = [
      '@@ -1,3 +1,3 @@',
      ' line1',
      '-line2',
      '+line3',
      ' line4'
    ].join('\n')

    const wrapper = mount(DiffRenderer, {
      props: {
        filePath: 'short.diff',
        diff: shortDiff
      }
    })

    expect(wrapper.find('.file-path').text()).toBe('short.diff')
    expect(wrapper.findAll('.diff-line')).toHaveLength(5)
    
    // 不应该展示折叠渐变蒙层和展开按钮
    expect(wrapper.find('.diff-fade-mask').exists()).toBe(false)
    expect(wrapper.find('.expand-btn').exists()).toBe(false)

    // 各行的类名校验
    const lines = wrapper.findAll('.diff-line')
    expect(lines[0].classes()).toContain('diff-info')
    expect(lines[1].classes()).toContain('diff-normal')
    expect(lines[2].classes()).toContain('diff-delete')
    expect(lines[3].classes()).toContain('diff-add')
  })

  it('should behave correctly with long diff (> 15 lines)', async () => {
    const longDiff = Array.from({ length: 20 }, (_, i) => `+line${i + 1}`).join('\n')
    const wrapper = mount(DiffRenderer, {
      props: {
        filePath: 'long.diff',
        diff: longDiff
      }
    })

    expect(wrapper.find('.file-path').text()).toBe('long.diff')
    expect(wrapper.findAll('.diff-line')).toHaveLength(20)

    // 应展示折叠渐变蒙层和展开按钮
    expect(wrapper.find('.diff-fade-mask').exists()).toBe(true)
    
    const expandBtn = wrapper.find('.expand-btn')
    expect(expandBtn.exists()).toBe(true)
    expect(expandBtn.text()).toContain('展开全部代码修改')
    expect(expandBtn.text()).toContain('20')

    // 默认是 collapsed 状态，应用了 max-height: 160px
    const contentWrapper = wrapper.find('.diff-body')
    expect(contentWrapper.classes()).toContain('collapsed')
    expect(contentWrapper.classes()).toContain('collapsible')
    expect(contentWrapper.attributes('style')).toContain('max-height: 160px')

    // 点击展开按钮
    await expandBtn.trigger('click')

    // 点击后，应该移除 diff-fade-mask，并且 classes 更新为非 collapsed 状态
    expect(wrapper.find('.diff-fade-mask').exists()).toBe(false)
    expect(contentWrapper.classes()).not.toContain('collapsed')

    // 并且 inline style 应被动态设置为我们模拟的 scrollHeight px 值 (在 nextTick 后)
    expect(contentWrapper.attributes('style')).toContain('max-height: 600px')

    // 模拟 transitionend 事件，触发后应重置 max-height 为 none
    await contentWrapper.trigger('transitionend', { propertyName: 'max-height' })
    expect(contentWrapper.attributes('style')).toContain('max-height: none')
  })
})
