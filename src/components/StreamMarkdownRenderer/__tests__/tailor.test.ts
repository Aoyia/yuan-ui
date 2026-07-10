import { describe, it, expect } from 'vitest';
import { tailorStreamText } from '../utils/tailor';

describe('tailorStreamText', () => {
  it('should return original text when not streaming', () => {
    const input = 'This is a list\n- ';
    expect(tailorStreamText(input, false)).toBe(input);
  });

  it('should trim incomplete HTML tags', () => {
    const input1 = 'Here is a chart: <dxf-bar-chart dataset="123"';
    expect(tailorStreamText(input1, true)).toBe('Here is a chart: ');

    const input2 = 'Here is a chart: <dxf-bar-chart dataset="123">';
    expect(tailorStreamText(input2, true)).toBe(input2);
  });

  it('should trim trailing single quote block identifier', () => {
    const input1 = 'Ref:\n>';
    expect(tailorStreamText(input1, true)).toBe('Ref:\n');

    const input2 = 'Ref:\n> ';
    expect(tailorStreamText(input2, true)).toBe('Ref:\n');
  });

  it('should trim trailing list indicators', () => {
    const input1 = 'List:\n-';
    expect(tailorStreamText(input1, true)).toBe('List:\n');

    const input2 = 'List:\n*';
    expect(tailorStreamText(input2, true)).toBe('List:\n');

    const input3 = 'List:\n- ';
    expect(tailorStreamText(input3, true)).toBe('List:\n');
  });

  it('should trim trailing backticks for incomplete code blocks', () => {
    const input1 = 'Code:\n`';
    expect(tailorStreamText(input1, true)).toBe('Code:\n');

    const input2 = 'Code:\n``';
    expect(tailorStreamText(input2, true)).toBe('Code:\n');

    const input3 = 'Code:\n```'; // 已完整开启的代码块不应裁剪
    expect(tailorStreamText(input3, true)).toBe(input3);
  });
});
