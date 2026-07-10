export function splitIntoLogicalBlocks(text: string): string[] {
  if (!text) return [];

  const blocks: string[] = [];
  const lines = text.split('\n');
  let currentBlock: string[] = [];
  let inCodeBlock = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock && (trimmed.startsWith('<df-') || trimmed.startsWith('</df-'))) {
      // 1. 如果之前已经有累积的内容，先将之前的内容打包为一个 block
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      // 2. 将当前组件声明行单独打包为一个 block
      blocks.push(line);
    } else {
      currentBlock.push(line);

      // 3. 如果在代码块之外且遇到空行，将当前累积段落封包
      if (!inCodeBlock && trimmed === '') {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
      }
    }
  });

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  return blocks.map(b => b.trim()).filter(b => b !== '');
}
