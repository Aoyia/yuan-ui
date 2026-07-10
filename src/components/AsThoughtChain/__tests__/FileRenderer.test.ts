// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import FileRenderer from '../renderers/FileRenderer.vue'

describe('FileRenderer Component', () => {
  beforeAll(() => {
    // 模拟 HTMLElement.prototype.scrollHeight 属性
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 500
      }
    })
  })

  it('should compile and export a valid Vue 3 component', () => {
    expect(FileRenderer).toBeDefined()
    expect(FileRenderer.__name).toBe('FileRenderer')
  })

  it('should behave correctly with empty content', () => {
    const wrapper = mount(FileRenderer, {
      props: {
        filePath: 'empty.txt',
        content: ''
      }
    })

    expect(wrapper.find('.file-path').text()).toBe('empty.txt')
    expect(wrapper.find('.file-content-preview').exists()).toBe(false)
  })

  it('should behave correctly with short content', () => {
    const shortContent = 'line1\nline2\nline3'
    const wrapper = mount(FileRenderer, {
      props: {
        filePath: 'short.txt',
        content: shortContent
      }
    })

    expect(wrapper.find('.file-path').text()).toBe('short.txt')
    expect(wrapper.find('.file-content-preview').exists()).toBe(true)
    expect(wrapper.find('pre code').text()).toBe(shortContent)
    
    // 不应该展示折叠渐变蒙层和展开按钮
    expect(wrapper.find('.fade-mask').exists()).toBe(false)
    expect(wrapper.find('.expand-btn').exists()).toBe(false)
  })

  it('should behave correctly with long content (>12 lines)', async () => {
    const longContent = Array.from({ length: 15 }, (_, i) => `line${i + 1}`).join('\n')
    const wrapper = mount(FileRenderer, {
      props: {
        filePath: 'long.txt',
        content: longContent
      }
    })

    expect(wrapper.find('.file-path').text()).toBe('long.txt')
    expect(wrapper.find('.file-content-preview').exists()).toBe(true)
    expect(wrapper.find('pre code').text()).toBe(longContent)

    // 应展示折叠渐变蒙层和展开按钮
    expect(wrapper.find('.fade-mask').exists()).toBe(true)
    
    const expandBtn = wrapper.find('.expand-btn')
    expect(expandBtn.exists()).toBe(true)
    expect(expandBtn.text()).toContain('展开全文')
    expect(expandBtn.text()).toContain('15')

    // 默认是 collapsed 状态，应用了 max-height: 160px
    const contentWrapper = wrapper.find('.content-wrapper')
    expect(contentWrapper.classes()).toContain('collapsed')
    expect(contentWrapper.classes()).toContain('collapsible')
    expect(contentWrapper.attributes('style')).toContain('max-height: 160px')

    // 点击展开按钮
    await expandBtn.trigger('click')

    // 点击后，应该移除 fade-mask，并且 classes 更新为非 collapsed 状态
    expect(wrapper.find('.fade-mask').exists()).toBe(false)
    expect(contentWrapper.classes()).not.toContain('collapsed')

    // 并且 inline style 应被动态设置为我们模拟的 scrollHeight px 值
    expect(contentWrapper.attributes('style')).toContain('max-height: 500px')

    // 模拟 transitionend 事件，触发后应重置 max-height 为 none
    await contentWrapper.trigger('transitionend', { propertyName: 'max-height' })
    expect(contentWrapper.attributes('style')).toContain('max-height: none')
  })
})
