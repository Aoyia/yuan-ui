import { describe, it, expect } from 'vitest';
import { splitIntoLogicalBlocks } from '../utils/block-parser';

describe('splitIntoLogicalBlocks', () => {
  it('should split simple paragraphs by empty lines', () => {
    const input = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
    const result = splitIntoLogicalBlocks(input);
    expect(result).toEqual(['Paragraph 1', 'Paragraph 2', 'Paragraph 3']);
  });

  it('should not split lines inside code blocks', () => {
    const input = 'Paragraph 1\n\n```javascript\nconst a = 1;\n\nconst b = 2;\n```\n\nParagraph 2';
    const result = splitIntoLogicalBlocks(input);
    expect(result).toEqual([
      'Paragraph 1',
      '```javascript\nconst a = 1;\n\nconst b = 2;\n```',
      'Paragraph 2'
    ]);
  });

  it('should split dxf- components into individual blocks', () => {
    const input = 'Here is chart:\n<dxf-bar-chart dataset="1"></dxf-bar-chart>\nAnd this is text';
    const result = splitIntoLogicalBlocks(input);
    expect(result).toEqual([
      'Here is chart:',
      '<dxf-bar-chart dataset="1"></dxf-bar-chart>',
      'And this is text'
    ]);
  });

  it('should handle empty input', () => {
    expect(splitIntoLogicalBlocks('')).toEqual([]);
    expect(splitIntoLogicalBlocks('   \n  ')).toEqual([]);
  });
});
