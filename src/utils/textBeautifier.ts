import pangu from 'pangu';

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

export interface TypographyFormatResult {
  formatted: string;
  changed: boolean;
  spacesAdded: number;
  punctuationFixed: number;
  emptyLinesFolded: number;
}

/**
 * Formats Chinese-English typography by inserting appropriate pangu spacing
 * and normalizing Chinese punctuation without touching code blocks, math formulas,
 * URLs, image tags, or markdown structure.
 */
export function formatChineseEnglishSpacing(text: string): TypographyFormatResult {
  if (!text) {
    return {
      formatted: '',
      changed: false,
      spacesAdded: 0,
      punctuationFixed: 0,
      emptyLinesFolded: 0,
    };
  }

  let spacesAdded = 0;
  let punctuationFixed = 0;
  let emptyLinesFolded = 0;

  let current = text;

  // 1. Fold excessive empty lines (more than 3 consecutive newlines)
  const collapsed = current.replace(/\n{4,}/g, () => {
    emptyLinesFolded++;
    return '\n\n\n';
  });
  current = collapsed;

  // 2. Protect Front Matter at the start
  let frontMatter = '';
  let content = current;
  const fmMatch = current.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (fmMatch) {
    frontMatter = fmMatch[0];
    content = current.slice(frontMatter.length);
  }

  // 3. Tokenize content into protected blocks vs plain text
  const tokens: Array<{ type: 'raw' | 'text'; content: string }> = [];
  let remaining = content;

  // Regex matches:
  // - Code fences: ``` ... ```
  // - Inline code: ` ... `
  // - Block math: $$ ... $$
  // - Inline math: $ ... $
  // - Markdown images: ![ ... ]( ... )
  // - Markdown links: [ ... ]( ... )
  // - Footnote references: [^ ... ]
  // - HTML tags / comments: < ... >
  // - Raw URLs: https?://...
  const pattern = /(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|!\[[^\]]*\]\([^)]+\)|\[[^\]]*\]\([^)]+\)|\[\^[^\]]+\]|<[^>]+>|https?:\/\/[^\s\)\>]+)/g;

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

  // 4. Process plain text tokens with Pangu & Chinese copywriting punctuation rules
  const CJK = '[\\u4e00-\\u9fa5\\u3400-\\u4dbf]';
  const ANS = '[a-zA-Z0-9]';

  const processedTokens = tokens.map((t) => {
    if (t.type === 'raw') return t.content;

    let s = t.content;
    const initialText = s;

    // A. Apply Pangu.js spacing engine (supports spaceText in v10+ and spacing in v4-)
    try {
      const panguMethod = (pangu as any)?.spaceText || (pangu as any)?.spacing;
      const panguProcessed = typeof panguMethod === 'function' ? panguMethod.call(pangu, s) : s;
      if (panguProcessed !== s) {
        // Count added spaces
        const diff = (panguProcessed.match(/ /g) || []).length - (s.match(/ /g) || []).length;
        if (diff > 0) spacesAdded += diff;
        s = panguProcessed;
      }
    } catch {
      // Fallback regex if pangu encounters rare edge case
      const noSpaceRegex = new RegExp(`(${CJK})(${ANS})|(${ANS})(${CJK})`, 'g');
      const matches = s.match(noSpaceRegex);
      if (matches) spacesAdded += matches.length;
      s = s.replace(new RegExp(`(${CJK})(${ANS})`, 'g'), '$1 $2');
      s = s.replace(new RegExp(`(${ANS})(${CJK})`, 'g'), '$1 $2');
    }

    // B. Chinese typography punctuation normalization
    const beforePunct = s;

    // Convert halfwidth comma to fullwidth comma between CJK characters
    s = s.replace(new RegExp(`(${CJK}),\\s*(${CJK})`, 'g'), '$1，$2');
    // Convert halfwidth semicolon to fullwidth semicolon in CJK context
    s = s.replace(new RegExp(`(${CJK});\\s*(${CJK})`, 'g'), '$1；$2');
    // Convert colon in Chinese sentences (e.g. 提示: 或 说明: )
    s = s.replace(new RegExp(`(${CJK}):\\s+(${CJK})`, 'g'), '$1：$2');
    // Convert exclamation / question marks following Chinese
    s = s.replace(new RegExp(`(${CJK})!`, 'g'), '$1！');
    s = s.replace(new RegExp(`(${CJK})\\?`, 'g'), '$1？');

    // Deduplicate repetitive punctuation (e.g. ！！！ -> ！)
    s = s.replace(/！{2,}/g, '！').replace(/!{2,}/g, '!');
    s = s.replace(/？{2,}/g, '？').replace(/\?{2,}/g, '?');
    s = s.replace(/。{2,}/g, '。');

    if (s !== beforePunct) {
      punctuationFixed++;
    }

    return s;
  });

  const formattedContent = processedTokens.join('');
  const formatted = frontMatter + formattedContent;

  return {
    formatted,
    changed: formatted !== text,
    spacesAdded,
    punctuationFixed,
    emptyLinesFolded,
  };
}

