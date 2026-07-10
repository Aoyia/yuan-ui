import { describe, it, expect } from 'vitest';
import { completeMarkdownSyntax } from '../utils/autocomplete';

describe('completeMarkdownSyntax', () => {
  it('should complete simple styles like bold and italic', () => {
    expect(completeMarkdownSyntax('**bold text')).toBe('**bold text**');
    expect(completeMarkdownSyntax('**bold *italic text')).toBe('**bold *italic text***');
    expect(completeMarkdownSyntax('__bold _italic text')).toBe('__bold _italic text___');
  });

  it('should not complete when there is no text content after the tag', () => {
    expect(completeMarkdownSyntax('normal text **')).toBe('normal text **');
    expect(completeMarkdownSyntax('normal text ** ')).toBe('normal text ** ');
    expect(completeMarkdownSyntax('normal text `')).toBe('normal text `');
  });

  it('should complete inline code and math formulas', () => {
    expect(completeMarkdownSyntax('`const a = 1')).toBe('`const a = 1`');
    expect(completeMarkdownSyntax('$x + y = z')).toBe('$x + y = z$');
    expect(completeMarkdownSyntax('$$E = mc^2')).toBe('$$E = mc^2$$');
  });

  it('should complete multi-line code blocks and insert a newline if missing', () => {
    expect(completeMarkdownSyntax('```javascript\nconst a = 1;')).toBe('```javascript\nconst a = 1;\n```');
    expect(completeMarkdownSyntax('```javascript\nconst a = 1;\n')).toBe('```javascript\nconst a = 1;\n```');
  });

  it('should ignore formatting tags inside code blocks and inline code', () => {
    expect(completeMarkdownSyntax('```javascript\nconst **a** = 1;')).toBe('```javascript\nconst **a** = 1;\n```');
    expect(completeMarkdownSyntax('`const **a** = 1')).toBe('`const **a** = 1`');
  });
});
