import { describe, it, expect } from 'vitest';
import {
  buildWeChatImageGridHtml,
  parseImageGridContainers,
  GridImageItem,
} from '../src/utils/imageGridParser.ts';
import { renderMarkdownLocally } from '../src/markdown/clientRender.ts';
import {
  exportAllThemesJson,
  importAllThemesJson,
  WECHAT_THEMES,
} from '../src/markdown/style.ts';
import { CURATED_STARTER_PRESETS } from '../src/components/ThemeDesignerModal.tsx';
import {
  saveArticle,
  getAllArticles,
  getArticleById,
  deleteArticle,
  duplicateArticle,
  toggleArticleFavorite,
  exportAllArticlesJson,
  importArticlesFromJson,
  StoredArticle,
} from '../src/utils/indexedDBStorage.ts';

describe('Phase 2: Custom Theme Editor, Image Grids & High-Capacity Article Storage', () => {
  describe('1. Dual-Image & Multi-Image Grid Layout (imageGridParser)', () => {
    it('should generate zero-wrap WeChat layout table for 2 columns', () => {
      const items: GridImageItem[] = [
        { alt: '左图示意', src: 'https://example.com/img1.jpg' },
        { alt: '右图示意', src: 'https://example.com/img2.jpg' },
      ];

      const html = buildWeChatImageGridHtml(items, 2);
      expect(html).toContain('table');
      expect(html).toContain('table-layout: fixed');
      expect(html).toContain('width: 50%');
      expect(html).toContain('左图示意');
      expect(html).toContain('右图示意');
      expect(html).toContain('https://example.com/img1.jpg');
      expect(html).toContain('https://example.com/img2.jpg');
    });

    it('should generate 3 columns layout table with 33.333% width', () => {
      const items: GridImageItem[] = [
        { alt: '第一张', src: 'https://example.com/1.png' },
        { alt: '第二张', src: 'https://example.com/2.png' },
        { alt: '第三张', src: 'https://example.com/3.png' },
      ];

      const html = buildWeChatImageGridHtml(items, 3);
      expect(html).toContain('width: 33.333%');
      expect(html).toContain('第一张');
      expect(html).toContain('第二张');
      expect(html).toContain('第三张');
    });

    it('should parse ::: col-2 and ::: col-3 container syntax in markdown', () => {
      const md = [
        '# 正文标题',
        '',
        '::: col-2',
        '![方案A对比图](https://example.com/a.jpg)',
        '![方案B对比图](https://example.com/b.jpg)',
        ':::',
        '',
        '后续段落文字。',
      ].join('\n');

      const parsed = parseImageGridContainers(md);
      expect(parsed).toContain('<!-- [WECHAT_COMPONENT image-grid] -->');
      expect(parsed).toContain('方案A对比图');
      expect(parsed).toContain('方案B对比图');
      expect(parsed).toContain('width: 50%');
      expect(parsed).not.toContain('::: col-2');
    });

    it('should render markdown containing image grid seamlessly in clientRender', () => {
      const md = [
        '## 双图展示',
        '',
        '::: col-2',
        '![科技前沿](https://images.unsplash.com/photo-1.jpg)',
        '![成果落地](https://images.unsplash.com/photo-2.jpg)',
        ':::',
      ].join('\n');

      const result = renderMarkdownLocally(md, { theme: 'pie' });
      expect(result.inlinedHtml).toContain('table');
      expect(result.inlinedHtml).toContain('科技前沿');
      expect(result.inlinedHtml).toContain('成果落地');
      expect(result.inlinedHtml).toContain('https://images.unsplash.com/photo-1.jpg');
    });
  });

  describe('2. Custom CSS Theme Presets and Bulk Export/Import', () => {
    it('should provide 6 curated starter presets in ThemeDesignerModal', () => {
      expect(CURATED_STARTER_PRESETS.length).toBe(6);
      const labels = CURATED_STARTER_PRESETS.map((p) => p.label);
      expect(labels).toContain('科技极客·深邃蓝');
      expect(labels).toContain('纸书墨香·文艺灰');
      expect(labels).toContain('暖阳麦浪·秋日橘');
      expect(labels).toContain('新春朱砂·喜庆红');
      expect(labels).toContain('高雅香槟·轻奢金');
      expect(labels).toContain('清新薄荷·护眼绿');

      for (const preset of CURATED_STARTER_PRESETS) {
        expect(preset.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(preset.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(preset.isCustom).toBe(true);
      }
    });

    it('should export all themes to valid JSON and import them back', () => {
      const jsonString = exportAllThemesJson();
      expect(jsonString).toBeTruthy();
      const parsed = JSON.parse(jsonString);
      expect(parsed.version).toBe('1.0');
      expect(parsed.themes).toBeDefined();

      const testThemeBundle = JSON.stringify({
        version: '1.0',
        themes: {
          'test-custom-theme': {
            name: 'test-custom-theme',
            label: '自动化测试主题',
            primaryColor: '#ff0055',
            secondaryColor: '#fff0f5',
            accentColor: '#ff3377',
            textColor: '#111111',
            mutedTextColor: '#666666',
            bgColor: '#ffffff',
            cardBg: '#fafafa',
            borderColor: '#ffccd8',
            codeBg: '#222222',
            codeColor: '#ffffff',
          },
        },
      });

      const importResult = importAllThemesJson(testThemeBundle);
      expect(importResult.count).toBe(1);
    });
  });

  describe('3. Large-Capacity IndexedDB Article Manager', () => {
    it('should save, retrieve, and delete an article via fallback/db layer', async () => {
      const article: StoredArticle = {
        id: 'test_article_001',
        title: '深度解析微信排版架构',
        author: '测试架构师',
        digest: '这是测试摘要内容',
        cover: 'https://example.com/cover.jpg',
        markdown: '# 深度解析\n\n测试正文内容...',
        theme: 'pie',
        themeEnabled: true,
        articleType: 'news',
        wordCount: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      };

      await saveArticle(article);
      const retrieved = await getArticleById('test_article_001');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('深度解析微信排版架构');
      expect(retrieved?.author).toBe('测试架构师');

      const all = await getAllArticles();
      expect(all.some((a) => a.id === 'test_article_001')).toBe(true);

      // Test duplicate
      const copy = await duplicateArticle('test_article_001');
      expect(copy).not.toBeNull();
      expect(copy?.title).toBe('深度解析微信排版架构 (副本)');
      expect(copy?.id).not.toBe('test_article_001');

      // Test toggle favorite
      const isFav = await toggleArticleFavorite('test_article_001');
      expect(isFav).toBe(true);

      // Cleanup
      await deleteArticle('test_article_001');
      if (copy) {
        await deleteArticle(copy.id);
      }

      const afterDelete = await getArticleById('test_article_001');
      expect(afterDelete).toBeNull();
    });

    it('should export all articles and restore from backup JSON', async () => {
      const articleA: StoredArticle = {
        id: 'backup_art_1',
        title: '文章一号',
        author: '作者A',
        digest: '摘要A',
        cover: '',
        markdown: '正文A',
        theme: 'pie',
        wordCount: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveArticle(articleA);

      const exportedJson = await exportAllArticlesJson();
      expect(exportedJson).toBeTruthy();
      const parsed = JSON.parse(exportedJson);
      expect(parsed.appName).toBe('WeChat Markdown Publisher');
      expect(Array.isArray(parsed.articles)).toBe(true);

      // Clean up articleA
      await deleteArticle('backup_art_1');

      // Restore
      const restoreResult = await importArticlesFromJson(exportedJson);
      expect(restoreResult.count).toBeGreaterThan(0);

      // Final cleanup
      await deleteArticle('backup_art_1');
    });
  });
});
