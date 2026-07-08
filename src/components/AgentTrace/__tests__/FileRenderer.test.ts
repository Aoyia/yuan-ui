import { describe, it, expect } from 'vitest'
import FileRenderer from '../renderers/FileRenderer.vue'

describe('FileRenderer Component', () => {
  it('should compile and export a valid Vue 3 component', () => {
    expect(FileRenderer).toBeDefined()
    expect(FileRenderer.__name).toBe('FileRenderer')
  })
})
