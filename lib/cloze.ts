// lib/cloze.ts

// 句読点の前にスペースを入れないためのルール
const noSpaceBefore = new Set([
    ".", ",", "!", "?", ":", ";",
    ")", "]", "}", "”", "\"", "’", "'",
    "…", "...",
  ]);
  
  // 開き括弧・引用符の後にスペースを入れないためのルール
  const noSpaceAfter = new Set([
    "(", "[", "{", "“", "\"",
  ]);
  
  function joinTokensPretty(tokens: string[]): string {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const prev = i > 0 ? tokens[i - 1] : "";
  
      const needSpace =
        i > 0 &&
        !noSpaceBefore.has(t) &&
        !noSpaceAfter.has(prev);
  
      out += (needSpace ? " " : "") + t;
    }
    return out;
  }
  
  // blankIndexes に指定された token index を ____1 ____2 ... に置換
  export function buildClozePreview(
    tokens: string[],
    blankIndexes: number[]
  ): string {
    const sorted = [...blankIndexes].sort((a, b) => a - b);
    const blanks = new Map<number, number>(); // idx -> blankNo(1..n)
    sorted.forEach((idx, k) => blanks.set(idx, k + 1));
  
    const rendered = tokens.map((t, i) => {
      const n = blanks.get(i);
      if (!n) return t;
      return `____${n}`;
    });
  
    return joinTokensPretty(rendered);
  }
  