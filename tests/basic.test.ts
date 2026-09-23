import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { parseMarkdownFile } from '../src/markdown/parser.ts';
import { createMarkdownRenderer, sanitizeWechatHtml } from '../src/markdown/renderer.ts';
import { inlineWechatStyles } from '../src/markdown/style.ts';
import { computeArticleHash } from '../src/utils/hash.ts';
import { wechatHtmlToMarkdown, isHtmlContent } from '../src/markdown/html2md.ts';
import { runPublishPipeline, validateArticlePreflight } from '../src/pipeline.ts';
import { DEFAULT_CONFIG } from '../src/config.ts';

describe('WeChat Draft Publisher Test Suite', () => {
  const fixturePath = path.resolve('tests/fixtures/article.md');
  const fixtureContent = fs.readFileSync(fixturePath, 'utf8');

  it('1. 应能准确解析 Front Matter 与正文提取', () => {
    const parsed = parseMarkdownFile(fixtureContent, fixturePath);
    expect(parsed.metadata.title).toBe('微信公众号草稿自动化发布实战指南');
    expect(parsed.metadata.author).toBe('科技探索者');
    expect(parsed.metadata.cover).toBe('./images/cover.png');
    expect(parsed.metadata.theme).toBe('tech-blue');
    expect(parsed.metadata.comment).toBe(true);
    expect(parsed.content).toContain('## 为什么需要自动化草稿发布？');
  });

  it('2. 摘要超长时应自动截断至 120 字符以内', () => {
    const longDigestMd = `---
title: 测试标题
digest: ${'长'.repeat(150)}
---
正文内容`;
    const parsed = parseMarkdownFile(longDigestMd);
    expect(parsed.metadata.digest.length).toBeLessThanOrEqual(120);
    expect(parsed.metadata.digest.endsWith('...')).toBe(true);
  });

  it('3. 应能正确渲染 Markdown 并在代码块中附带 macOS 控件', () => {
    const renderer = createMarkdownRenderer({ macStyle: true });
    const html = renderer.render('```typescript\nconst a: number = 1;\n```');
    expect(html).toContain('code-mac-header');
    expect(html).toContain('mac-dot red');
    expect(html).toContain('language-typescript');
  });

  it('4. 应使用 juice 将主题 CSS 全量转换为元素内联样式 (style 属性)', () => {
    const rawHtml = '<h2>一级段落标题</h2><p>这是一段测试文本</p>';
    const inlined = inlineWechatStyles(rawHtml, 'tech-blue');

    expect(inlined).toContain('style=');
    expect(inlined).toContain('font-family');
    // WeChat strict requirement: No <style> tag allowed
    expect(inlined).not.toContain('<style');
    // No scripts or iframes
    expect(inlined).not.toContain('<script');
  });

  it('5. 应能过滤恶意或不兼容标签 (sanitizeWechatHtml)', () => {
    const maliciousHtml = `<p>安全段落</p><script>alert(1)</script><iframe src="evil.com"></iframe><div onclick="doBad()">点我</div>`;
    const sanitized = sanitizeWechatHtml(maliciousHtml);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('安全段落');
  });

  it('6. 计算文章指纹应具有确定性 (SHA-256)', () => {
    const hash1 = computeArticleHash('标题A', '<p>内容</p>', 'media123');
    const hash2 = computeArticleHash('标题A', '<p>内容</p>', 'media123');
    const hash3 = computeArticleHash('标题B', '<p>内容</p>', 'media123');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('7. Dry-Run 模式下应顺利完成全流程并输出模拟 media_id', async () => {
    const result = await runPublishPipeline({
      filePath: fixturePath,
      config: DEFAULT_CONFIG,
      dryRun: true,
      force: true,
    });

    expect(result.dry_run).toBe(true);
    expect(result.media_id).toBeDefined();
    expect(result.media_id).toMatch(/^mock_draft_media_/);
    expect(result.content_html).toContain('wechat-article-container');
    expect(result.title).toBe('微信公众号草稿自动化发布实战指南');
  });

  it('8. 发布前置校验应正确拦截空标题与超限内容', () => {
    // 标题为空
    expect(() => {
      validateArticlePreflight({
        title: '',
        articleType: 'news',
        contentHtml: '<p>正文</p>',
      });
    }).toThrow(/标题.*不能为空/);

    // 标题超长
    expect(() => {
      validateArticlePreflight({
        title: '超'.repeat(65),
        articleType: 'news',
        contentHtml: '<p>正文</p>',
      });
    }).toThrow(/64/);

    // 正文超长 (超过 20,000 字符)
    expect(() => {
      validateArticlePreflight({
        title: '合法标题',
        articleType: 'news',
        contentHtml: '<p>' + '字'.repeat(20001) + '</p>',
        coverPath: './cover.png',
      });
    }).toThrow(/20,000/);

    // 正确通过
    expect(() => {
      validateArticlePreflight({
        title: '合法标题',
        author: '作者',
        digest: '摘要',
        articleType: 'news',
        contentHtml: '<p>标准合法正文</p>',
        coverPath: './cover.png',
      });
    }).not.toThrow();
  });

  it('9. 支持在关闭主题内联排版时输出纯净原生 HTML', () => {
    const rawHtml = '<h2>原生标题</h2><p>原生段落文本</p>';
    const rawOutput = inlineWechatStyles(rawHtml, 'pie', false);
    // 当 themeEnabled 为 false 时，不应用特定主题的修饰性颜色
    expect(rawOutput).toContain('原生标题');
    expect(rawOutput).toContain('原生段落文本');
  });

  it('10. 纯化HTML时，如果内容已是纯 Markdown，应原样保持并防止格式破坏', () => {
    const pureMd = `# 一级标题

正文包含 **粗体**、*斜体* 以及 \`inline_code\`。

- 列表项 A
- 列表项 B

\`\`\`typescript
const my_var: string = "hello";
\`\`\`
`;
    expect(isHtmlContent(pureMd)).toBe(false);
    const result = wechatHtmlToMarkdown(pureMd);
    expect(result).toBe(pureMd);
  });

  it('11. 纯化HTML时，当输入包含微信富文本标签，应正确转换为纯净 Markdown', () => {
    const wechatHtml = `<section style="font-size: 16px;"><p style="line-height: 1.6;">微信段落文本</p></section>`;
    expect(isHtmlContent(wechatHtml)).toBe(true);
    const result = wechatHtmlToMarkdown(wechatHtml);
    expect(result).toContain('微信段落文本');
    expect(result).not.toContain('<section');
    expect(result).not.toContain('style=');
  });
});
