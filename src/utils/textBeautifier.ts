/**
 * Text Beautifier & Outline Utilities for Markdown Typesetting
 * - Pangu spacing (proper spacing between CJK and alphanumeric characters)
 * - Heading hierarchy shifter (promote / demote headings)
 * - Table of Contents (Outline) extractor
 */

export interface OutlineItem {
  id: string;
  level: number;
  text: string;
  line: number;
}

/**
 * Extracts Table of Contents from markdown headings (H1 - H4)
 */
export function extractOutline(markdown: string): OutlineItem[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const items: OutlineItem[] = [];

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim().replace(/[*_`]/g, '');
      items.push({
        id: `heading-${i}-${items.length}`,
        level,
        text: rawText,
        line: i + 1,
      });
    }
  }

  return items;
}

/**
 * Shifts headings hierarchy:
 * - 'promote': H2 -> H1, H3 -> H2 (minimum level 1)
 * - 'demote': H1 -> H2, H2 -> H3 (maximum level 5)
 */
export function shiftHeadings(markdown: string, direction: 'promote' | 'demote'): string {
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;

  const newLines = lines.map((line) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    const match = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
    if (!match) return line;

    const prefix = match[1];
    let level = match[2].length;
    const content = match[3];

    if (direction === 'promote') {
      level = Math.max(1, level - 1);
    } else {
      level = Math.min(5, level + 1);
    }

    return `${prefix}${'#'.repeat(level)} ${content}`;
  });

  return newLines.join('\n');
}

/**
 * Formats Chinese-English typography by inserting appropriate spacing
 * without touching code blocks, math formulas, links or markdown tags.
 */
export function formatChineseEnglishSpacing(text: string): { formatted: string; changed: boolean } {
  if (!text) return { formatted: '', changed: false };

  // Split into tokens: code blocks, inline code, formulas, URLs, and regular text
  const tokens: Array<{ type: 'raw' | 'text'; content: string }> = [];
  let remaining = text;

  // Regex to match code blocks, inline code, LaTeX math, and markdown links
  const pattern = /(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|!\[[^\]]*\]\([^)]+\)|\[[^\]]*\]\([^)]+\)|<[^>]+>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: remaining.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'raw', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    tokens.push({ type: 'text', content: remaining.slice(lastIndex) });
  }

  // CJK regex character range
  // \u4e00-\u9fa5 : CJK Unified Ideographs
  const CJK = '[\\u4e00-\\u9fa5\\u3400-\\u4dbf]';
  const ANS = '[a-zA-Z0-9]';

  const processedTokens = tokens.map((t) => {
    if (t.type === 'raw') return t.content;

    let s = t.content;
    // CJK followed by ANS -> insert space
    s = s.replace(new RegExp(`(${CJK})(${ANS})`, 'g'), '$1 $2');
    // ANS followed by CJK -> insert space
    s = s.replace(new RegExp(`(${ANS})(${CJK})`, 'g'), '$1 $2');
    // Normalize repetitive exclamation or question marks (e.g. ！！！ -> ！)
    s = s.replace(/！{2,}/g, '！').replace(/!{2,}/g, '!');
    s = s.replace(/？{2,}/g, '？').replace(/\?{2,}/g, '?');

    return s;
  });

  const formatted = processedTokens.join('');
  return {
    formatted,
    changed: formatted !== text,
  };
}
