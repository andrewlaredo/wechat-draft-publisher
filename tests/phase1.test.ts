import { describe, it, expect } from 'vitest';
import { formatChineseEnglishSpacing } from '../src/utils/textBeautifier.ts';
import { convertLinksToFootnotes, scanExternalLinks } from '../src/utils/footnoteConverter.ts';
import { INTERACTIVE_COMPONENTS, INTERACTIVE_CATEGORIES } from '../src/markdown/interactiveComponents.ts';
import { renderMarkdownLocally } from '../src/markdown/clientRender.ts';

describe('Phase 1: Typography, Micro-layouts & Footnotes', () => {
  describe('1. Pangu.js & Chinese Typography Normalization', () => {
    it('should insert spaces between Chinese and English/Numbers', () => {
      const input = '使用React和TypeScript开发微信公众号编辑器，版本2.0。';
      const result = formatChineseEnglishSpacing(input);
      expect(result.changed).toBe(true);
      expect(result.spacesAdded).toBeGreaterThan(0);
      expect(result.formatted).toContain('使用 React 和 TypeScript 开发');
    });

    it('should protect code blocks, inline code, and math formulas from being altered', () => {
      const input = [
        '这是一段正文，包含代码块：',
        '```typescript',
        'const a=1+2;',
        '```',
        '以及行内代码 `console.log("hello")` 和数学公式 $$E=mc^2$$。',
      ].join('\n');

      const result = formatChineseEnglishSpacing(input);
      expect(result.formatted).toContain('```typescript\nconst a=1+2;\n```');
      expect(result.formatted).toContain('`console.log("hello")`');
      expect(result.formatted).toContain('$$E=mc^2$$');
    });

    it('should normalize Chinese punctuation and deduplicate punctuation', () => {
      const input = '你好,朋友;这是重点!太棒了！！！真的吗？？？';
      const result = formatChineseEnglishSpacing(input);
      expect(result.formatted).toContain('你好，朋友；');
      expect(result.formatted).toContain('太棒了！');
      expect(result.formatted).toContain('真的吗？');
    });

    it('should fold excessive empty lines to clean spacing', () => {
      const input = '第一段\n\n\n\n\n第二段';
      const result = formatChineseEnglishSpacing(input);
      expect(result.emptyLinesFolded).toBeGreaterThan(0);
      expect(result.formatted).not.toContain('\n\n\n\n');
    });
  });

  describe('2. WeChat External Link to Footnotes Converter', () => {
    it('should scan external links while ignoring image tags and code blocks', () => {
      const md = [
        '![图片封面](https://example.com/cover.jpg)',
        '阅读 [Vite 官方文档](https://vitejs.dev) 了解更多。',
        '同时参考 [微信公众号平台](https://mp.weixin.qq.com/s/sample)。',
        '```markdown',
        '[忽略的代码内链接](https://ignore.com)',
        '```',
      ].join('\n');

      const links = scanExternalLinks(md);
      expect(links.length).toBe(2);
      expect(links[0].text).toBe('Vite 官方文档');
      expect(links[0].isWeChatInternal).toBe(false);
      expect(links[1].text).toBe('微信公众号平台');
      expect(links[1].isWeChatInternal).toBe(true);
    });

    it('should convert external links into footnotes with reference section', () => {
      const md = '欢迎查阅 [GitHub 仓库](https://github.com/my-repo) 获取最新源码。';
      const { convertedMarkdown, linkCount, convertedLinks } = convertLinksToFootnotes(md);
      expect(linkCount).toBe(1);
      expect(convertedLinks[0].text).toBe('GitHub 仓库');
      expect(convertedMarkdown).toContain('GitHub 仓库 ^[1]');
      expect(convertedMarkdown).toContain('📚 参考资料与延伸阅读');
      expect(convertedMarkdown).toContain('https://github.com/my-repo');
      expect(convertedMarkdown).toContain('wechat-footnotes');
    });

    it('should preserve WeChat internal links when includeWeChatLinks is false', () => {
      const md = '欢迎阅读公众号历史文章 [点击阅读](https://mp.weixin.qq.com/s/xyz)。';
      const { linkCount, convertedMarkdown } = convertLinksToFootnotes(md, { includeWeChatLinks: false });
      expect(linkCount).toBe(0);
      expect(convertedMarkdown).toBe(md);
    });
  });

  describe('3. Micro-layout Material Library', () => {
    it('should have all expected categories including divider and quote', () => {
      const catIds = INTERACTIVE_CATEGORIES.map((c) => c.id);
      expect(catIds).toContain('quote');
      expect(catIds).toContain('step');
      expect(catIds).toContain('card');
      expect(catIds).toContain('divider');
      expect(catIds).toContain('guide');
    });

    it('should contain newly added micro-layout components', () => {
      const compIds = INTERACTIVE_COMPONENTS.map((c) => c.id);
      expect(compIds).toContain('center-giant-quote');
      expect(compIds).toContain('numbered-steps-pills');
      expect(compIds).toContain('header-follow-banner');
      expect(compIds).toContain('key-takeaways-card');
      expect(compIds).toContain('author-signature-footer');
      expect(compIds).toContain('divider-scissor');
      expect(compIds).toContain('divider-gradient');
      expect(compIds).toContain('divider-diamonds');
      expect(compIds).toContain('tip-success-card');
    });

    it('all component templates should contain inline CSS styles', () => {
      for (const comp of INTERACTIVE_COMPONENTS) {
        expect(comp.template).toContain('style=');
        expect(comp.name).toBeTruthy();
        expect(comp.previewHtml).toBeTruthy();
      }
    });
  });

  describe('4. Universal Renderer with Link Footnotes Option', () => {
    it('should automatically inline footnotes when convertLinksToFootnotes is enabled', () => {
      const md = '详情请参考 [React 官方](https://react.dev) 说明。';
      const rendered = renderMarkdownLocally(md, {
        convertLinksToFootnotes: true,
        theme: 'pie',
      });

      expect(rendered.inlinedHtml).toContain('React 官方');
      expect(rendered.inlinedHtml).toContain('📚 参考资料与延伸阅读');
      expect(rendered.inlinedHtml).toContain('https://react.dev');
    });
  });
});
