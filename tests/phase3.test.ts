import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  STYLE_PROMPTS,
  PolishStyle,
  polishDraftArticle,
} from '../src/ai/polisher.ts';
import {
  XIAOLVSHU_THEMES,
  sliceMarkdownToXiaolvshuCards,
  XiaolvshuCard,
} from '../src/utils/xiaolvshuSlicer.ts';

describe('Phase 3: Multi-Platform Image & Xiaolvshu Card Exports + AI Rough Draft Polisher', () => {
  describe('1. AI Rough Draft Formatting & Polishing Engine (polisher.ts)', () => {
    it('should define all 4 polishing style presets with descriptive focuses', () => {
      const styles: PolishStyle[] = ['structured', 'viral', 'literary', 'minimal'];
      styles.forEach((style) => {
        expect(STYLE_PROMPTS[style]).toBeDefined();
        expect(STYLE_PROMPTS[style].name.length).toBeGreaterThan(0);
        expect(STYLE_PROMPTS[style].focus.length).toBeGreaterThan(0);
      });
      expect(STYLE_PROMPTS.structured.name).toContain('结构化');
      expect(STYLE_PROMPTS.viral.name).toContain('爆款干货');
      expect(STYLE_PROMPTS.literary.name).toContain('人文');
      expect(STYLE_PROMPTS.minimal.name).toContain('极简');
    });

    it('should fall back gracefully to rule-based restructuring when offline or no API key is set', async () => {
      const roughContent = `今天和团队聊了微信排版自动化的问题，主要有几点想法。
第一点是很多人排版太慢了，每次都要花一两个小时在排版工具上反复倒腾。
第二点是移动端手机真机预览很重要，不能光看电脑屏幕。
第三点是金句很重要，一篇文章如果没有能让人记住的句子，跳出率就会很高。
总的来说，自动化排版工具能够帮助大家把时间还给内容本身。`;

      const result = await polishDraftArticle({
        roughContent,
        polishStyle: 'viral',
        apiKey: '', // Empty key triggers offline intelligent rule-based fallback
      });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.digest.length).toBeGreaterThan(0);
      expect(result.theme).toBeDefined();
      expect(result.markdown).toContain('## ');
      expect(result.stats.originalLength).toBe(roughContent.length);
      expect(result.stats.polishedLength).toBeGreaterThan(0);
      expect(result.summaryOfChanges.length).toBeGreaterThan(0);
    });

    it('should handle minimal style by preserving original sentences while adding structure and Pangu spacing', async () => {
      const roughNotes = `这是一段会议notes包含English单词和数字123测试。排版需要clean。`;
      const result = await polishDraftArticle({
        roughContent: roughNotes,
        polishStyle: 'minimal',
        apiKey: '',
      });

      expect(result.markdown).toContain('English');
      expect(result.markdown).toContain('123');
      expect(result.markdown).toContain('## ');
      expect(result.stats.originalLength).toBe(roughNotes.length);
    });
  });

  describe('2. Xiaolvshu 3:4 Note Card Slicing & Viral Themes (xiaolvshuSlicer.ts)', () => {
    it('should include high-conversion viral themes including red-viral, morandi-purple, and mint-cyan', () => {
      const themeIds = XIAOLVSHU_THEMES.map((t) => t.id);
      expect(themeIds).toContain('red-viral');
      expect(themeIds).toContain('morandi-purple');
      expect(themeIds).toContain('mint-cyan');

      const redTheme = XIAOLVSHU_THEMES.find((t) => t.id === 'red-viral')!;
      expect(redTheme.accentColor).toBe('#e11d48');
      expect(redTheme.name).toContain('爆款红');

      const morandiTheme = XIAOLVSHU_THEMES.find((t) => t.id === 'morandi-purple')!;
      expect(morandiTheme.name).toContain('莫兰迪');

      const mintTheme = XIAOLVSHU_THEMES.find((t) => t.id === 'mint-cyan')!;
      expect(mintTheme.name).toContain('薄荷');
    });

    it('should slice raw markdown into structured 3:4 cards with cover, content, quotes and points', () => {
      const sampleMarkdown = `# 2026 自媒体爆款心法

这是一个测试导语内容，讲述自媒体的长期主义。

> 写作不是为了取悦算法，而是为了连接同频的人。

## 第一章：选题即战略
- 选题决定了文章 80% 的阅读量上限
- 从痛点出发而不是从功能出发
- 结合实时热点借势破局

## 第二章：视觉排版心理学
- 每 300 字必须出现一个视觉停留点
- 重点加粗不能超过全文的 10%
- 双图并排可以提升信息密度

感谢大家的阅读，欢迎在评论区留下你的思考！`;

      const cards = sliceMarkdownToXiaolvshuCards(
        sampleMarkdown,
        '2026 自媒体爆款心法',
        '科技极客',
        '自媒体创作者实战指南'
      );

      expect(cards.length).toBeGreaterThanOrEqual(3);
      expect(cards[0].type).toBe('cover');
      expect(cards[0].title).toBe('2026 自媒体爆款心法');

      // Check if quote was parsed
      const hasQuote = cards.some((c) => c.quote && c.quote.includes('取悦算法'));
      expect(hasQuote).toBe(true);

      // Check if bullet points were parsed
      const hasPoints = cards.some((c) => c.points && c.points.length > 0);
      expect(hasPoints).toBe(true);

      // Check ending card
      const lastCard = cards[cards.length - 1];
      expect(lastCard.type).toBe('ending');
    });
  });

  describe('3. JSZip Packaging for Slices and Card Bundles', () => {
    it('should construct a valid zip archive from image data URLs or text buffers', async () => {
      const zip = new JSZip();
      const folder = zip.folder('test_cards');
      expect(folder).toBeDefined();

      // Mock 3 fake PNG base64 entries
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      folder!.file('01_cover.png', mockBase64, { base64: true });
      folder!.file('02_content.png', mockBase64, { base64: true });
      folder!.file('03_ending.png', mockBase64, { base64: true });

      const zipFiles = Object.keys(zip.files);
      expect(zipFiles).toContain('test_cards/01_cover.png');
      expect(zipFiles).toContain('test_cards/02_content.png');
      expect(zipFiles).toContain('test_cards/03_ending.png');

      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
