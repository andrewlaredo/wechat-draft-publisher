/**
 * cursorManager.ts
 * 全局 Markdown 编辑器光标焦点记录与精准位置插入管理器
 * 
 * 解决痛点：
 * 1. 用户点击顶栏/工具栏弹窗（排版物料库、SVG 动效库、商用配图）时，编辑器失去焦点；
 * 2. 传统逻辑直接将内容追加至文档最末尾，导致用户必须手动剪切移动；
 * 3. 插入的 HTML 缺少标准空行隔离，导致 CommonMark 解析器把内部标签破坏为 <p> 或 <pre>。
 */

let lastSelectionStart = -1;
let lastSelectionEnd = -1;
let lastScrollTop = 0;

/**
 * 记录当前编辑器光标位置与滚动高度
 */
export function recordEditorCursor(textarea: HTMLTextAreaElement) {
  if (!textarea) return;
  lastSelectionStart = textarea.selectionStart;
  lastSelectionEnd = textarea.selectionEnd;
  lastScrollTop = textarea.scrollTop;
}

/**
 * 获取当前记录的光标位置
 */
export function getSavedCursorPosition(): { start: number; end: number; scrollTop: number } {
  return {
    start: lastSelectionStart,
    end: lastSelectionEnd,
    scrollTop: lastScrollTop,
  };
}

/**
 * 将组件代码包装为标准的防污染隔离块 (Safe WeChat Component Block)
 */
export function wrapWechatComponent(
  htmlContent: string,
  options: {
    id?: string;
    name?: string;
    type?: 'svg' | 'material' | 'image' | 'custom';
  } = {}
): string {
  const compId = options.id || 'component-' + Date.now().toString(36);
  const compName = options.name || '微信排版组件';
  const compType = options.type || 'material';

  // 清除内部首尾空白，并注入语义化组件标记
  const trimmed = htmlContent.trim();
  return `<!-- [WECHAT_COMPONENT id="${compId}" name="${compName}" type="${compType}"] -->\n${trimmed}\n<!-- [/WECHAT_COMPONENT] -->`;
}

/**
 * 在当前记录的光标处精准插入文本，并更新内容
 */
export function insertAtRecordedCursor(
  currentMarkdown: string,
  textToInsert: string,
  options: {
    ensureNewlines?: boolean;
    componentName?: string;
  } = {}
): {
  newMarkdown: string;
  newCursorPos: number;
} {
  const { ensureNewlines = true } = options;

  let start = lastSelectionStart;
  let end = lastSelectionEnd;

  // 若此前从未聚焦过，默认插入在文档末尾
  if (start < 0 || end < 0 || start > currentMarkdown.length) {
    start = currentMarkdown.length;
    end = currentMarkdown.length;
  }

  // 格式化前后空行，确保不破坏前后的 Markdown 段落与 Front Matter
  let prefix = '';
  let suffix = '';

  if (ensureNewlines) {
    const beforeText = currentMarkdown.substring(0, start);
    const afterText = currentMarkdown.substring(end);

    if (beforeText.length > 0 && !beforeText.endsWith('\n\n')) {
      prefix = beforeText.endsWith('\n') ? '\n' : '\n\n';
    }
    if (afterText.length > 0 && !afterText.startsWith('\n\n')) {
      suffix = afterText.startsWith('\n') ? '\n' : '\n\n';
    }
  }

  const payload = `${prefix}${textToInsert}${suffix}`;
  const newMarkdown = currentMarkdown.substring(0, start) + payload + currentMarkdown.substring(end);
  const newCursorPos = start + payload.length;

  // 更新记录
  lastSelectionStart = newCursorPos;
  lastSelectionEnd = newCursorPos;

  return {
    newMarkdown,
    newCursorPos,
  };
}

/**
 * 解析 Markdown 中包含的所有微信排版组件与 SVG 动效块元数据
 */
export interface DetectedComponentBlock {
  id: string;
  name: string;
  type: string;
  startIndex: number;
  endIndex: number;
  rawText: number;
  innerHtml: string;
  lineStart: number;
}

export function detectComponentBlocks(markdown: string): DetectedComponentBlock[] {
  const blocks: DetectedComponentBlock[] = [];
  const regex = /<!--\s*\[WECHAT_COMPONENT\s+id="([^"]+)"\s+name="([^"]+)"(?:\s+type="([^"]+)")?\]\s*-->([\s\S]*?)<!--\s*\[\/WECHAT_COMPONENT\]\s*-->/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const startIndex = match.index;
    const fullText = match[0];
    const endIndex = startIndex + fullText.length;
    const id = match[1];
    const name = match[2];
    const type = match[3] || 'material';
    const innerHtml = match[4].trim();

    // 计算起始行号
    const textBefore = markdown.substring(0, startIndex);
    const lineStart = textBefore.split('\n').length;

    blocks.push({
      id,
      name,
      type,
      startIndex,
      endIndex,
      rawText: fullText.length,
      innerHtml,
      lineStart,
    });
  }

  // 兼容直接写有 class="wechat-interactive-block" 或 <svg 但未加注释包裹的旧块
  if (blocks.length === 0) {
    const fallbackRegex = /<section\b[^>]*class="[^"]*(?:wechat-interactive-block|wechat-material-block)[^"]*"[^>]*>[\s\S]*?<\/section>/g;
    let fbMatch: RegExpExecArray | null;
    let count = 1;
    while ((fbMatch = fallbackRegex.exec(markdown)) !== null) {
      const startIndex = fbMatch.index;
      const fullText = fbMatch[0];
      const endIndex = startIndex + fullText.length;
      const textBefore = markdown.substring(0, startIndex);
      const lineStart = textBefore.split('\n').length;

      blocks.push({
        id: `legacy-${count}`,
        name: `微信物料组件 0${count}`,
        type: fullText.includes('<svg') ? 'svg' : 'material',
        startIndex,
        endIndex,
        rawText: fullText.length,
        innerHtml: fullText,
        lineStart,
      });
      count++;
    }
  }

  return blocks;
}
