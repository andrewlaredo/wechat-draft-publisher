/**
 * polisher.ts
 * AI 粗稿一键排版润色引擎 (AI Rough Draft One-Click Formatting & Polishing Engine)
 * 
 * 功能：
 * 1. 结构重塑：将未经排版的口语笔记、会议纪要、粗糙原稿自动升级为具备二级/三级标题、核心导读的微信爆款排版。
 * 2. 视觉物料智能植入：自动提炼金句并包裹引用框、智能提炼步骤清单、添加话题标签与文末互动。
 * 3. 语言润色与标点纠错：修正错别字、病句，优化段落节奏，自动符合中英文排版盘古规范。
 * 4. 多风格模式支持：
 *    - 'structured': 极客硬核·结构化精编 (逻辑严密、多级大纲、代码表格规范)
 *    - 'viral': 爆款干货·金句提炼 (重点加粗、金句微光卡、促评互动)
 *    - 'literary': 优雅深度·人文纸书 (叙事流畅、温润语调、雅致分割)
 *    - 'minimal': 极简轻量·排版微修 (保留原句原意，仅补充层级大纲与排版规整)
 */

import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { AiProvider, PROVIDER_PRESETS } from './generator.ts';
import { formatChineseEnglishSpacing } from '../utils/textBeautifier.ts';

export type PolishStyle = 'structured' | 'viral' | 'literary' | 'minimal';

export interface PolishDraftOptions {
  provider?: AiProvider | string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  roughContent: string;
  polishStyle?: PolishStyle;
  customInstruction?: string;
  targetTone?: string;
}

export interface PolishedDraftResult {
  title: string;
  author: string;
  digest: string;
  theme: string;
  markdown: string;
  summaryOfChanges: string[];
  stats: {
    originalLength: number;
    polishedLength: number;
    sectionsAdded: number;
    quotesExtracted: number;
  };
  providerUsed: string;
  modelUsed: string;
}

export const STYLE_PROMPTS: Record<PolishStyle, { name: string; focus: string }> = {
  structured: {
    name: '极客硬核·结构化精编',
    focus: '逻辑严密分层、提炼核心大纲 (## 和 ###)、代码与数据表格规范、增加「核心导读」与「总结思考」',
  },
  viral: {
    name: '爆款干货·金句提炼',
    focus: '强化视觉焦点、重点句子适当加粗、提炼 2~3 条高光金句 (使用 > 引用块)、开头抓住注意力、末尾强化读者互动',
  },
  literary: {
    name: '优雅深度·人文纸书',
    focus: '语调温润内敛、文字富有节奏与呼吸感、段落长短相间、融入雅致的人文思考与哲学提炼',
  },
  minimal: {
    name: '极简轻量·排版微修',
    focus: '严格尊重原作者每一句核心原意，不凭空捏造事实，仅做标点规范、语法语病微调、分段与标题层次划分',
  },
};

/**
 * 智能规则级离线排版润色器 (用于无 API Key、网络离线或自动化单元测试兜底)
 */
export function generateRuleBasedPolish(
  roughText: string,
  style: PolishStyle = 'structured'
): PolishedDraftResult {
  const paragraphs = roughText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const firstLine = (roughText.split('\n').map((l) => l.trim()).filter(Boolean)[0] || '微信公众号深度思考与实战复盘')
    .replace(/^#+\s*/, '')
    .slice(0, 36);

  const title =
    style === 'viral'
      ? `🔥 ${firstLine}：3 个必须避开的核心痛点与破局法`
      : style === 'literary'
      ? `关于《${firstLine}》的人文散记`
      : `${firstLine}实战指南`;

  const digest = (
    paragraphs[0] ||
    '本文对关键要点进行了系统梳理与结构重塑，提炼行动路径与高频避坑建议。'
  ).slice(0, 110);

  const sections: string[] = [];
  sections.push(`> 导读：${digest}\n`);

  let quoteAdded = 0;
  const contentParas = paragraphs.length > 1 ? paragraphs.slice(1) : paragraphs;

  contentParas.forEach((p, idx) => {
    if (idx % 2 === 0) {
      const headingTitle = p.slice(0, 20).replace(/[，。！？]/g, '');
      sections.push(`## ${style === 'minimal' ? '章节' : '核心重点'} 0${Math.floor(idx / 2) + 1}：${headingTitle}`);
    }
    const { formatted } = formatChineseEnglishSpacing(p);
    sections.push(formatted);

    if (style === 'viral' && quoteAdded < 2 && p.length > 15) {
      sections.push(`> 💡 高光金句：${p.slice(0, 50)}`);
      quoteAdded++;
    }
  });

  if (style === 'viral') {
    sections.push('## 读者互动思考');
    sections.push('你在日常实际写作中遇到过最繁琐的环节是什么？欢迎在评论区留言交流！');
  }

  const bodyMarkdown = sections.join('\n\n');
  const targetTheme = style === 'viral' ? 'orangeheart' : style === 'literary' ? 'warm-paper' : 'tech-blue';

  const frontMatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    'author: "创作者"',
    `digest: "${digest.replace(/"/g, '\\"')}"`,
    `theme: "${targetTheme}"`,
    'comment: true',
    '---',
    '',
  ].join('\n');

  const fullMarkdown = `${frontMatter}\n${bodyMarkdown}\n`;

  return {
    title,
    author: '创作者',
    digest,
    theme: targetTheme,
    markdown: fullMarkdown,
    summaryOfChanges: [
      '梳理出清晰的二级大纲与层次结构',
      '提炼核心导语与高光金句引用框',
      '自动对齐中英文盘古空格与标点排版规范',
    ],
    stats: {
      originalLength: roughText.length,
      polishedLength: bodyMarkdown.length,
      sectionsAdded: Math.max(1, (bodyMarkdown.match(/^##\s+/gm) || []).length),
      quotesExtracted: Math.max(1, (bodyMarkdown.match(/^>\s+/gm) || []).length),
    },
    providerUsed: 'rule-based-polisher',
    modelUsed: 'flowdraft-syntax-polisher',
  };
}

/**
 * 核心：调用大模型执行一键粗稿排版与润色
 */
export async function polishDraftArticle(options: PolishDraftOptions): Promise<PolishedDraftResult> {
  const roughText = (options.roughContent || '').trim();
  if (!roughText) {
    throw new Error('请提供需要润色排版的粗稿内容');
  }

  const provider = (options.provider || 'gemini') as AiProvider;
  const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.gemini;
  const style = options.polishStyle || 'structured';
  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.structured;
  const modelToUse = options.model?.trim() || preset.defaultModel;

  // If mock/offline or explicitly empty apiKey provided for test/offline
  if (provider === ('offline' as any) || provider === ('mock' as any) || options.apiKey === '') {
    return generateRuleBasedPolish(roughText, style);
  }

  const systemInstruction = `你是一位拥有千万级阅读量操盘经验的顶尖微信公众号主编兼排版视觉架构师。
你的任务是将用户提供的「粗稿文本/会议速记/零散笔记/未排版原稿」一键重塑为高质量、符合微信移动端阅读体验的高水准排版文章。

【核心润色排版原则】：
1. 风格定位：【${styleConfig.name}】（重点：${styleConfig.focus}）
2. 结构重构：
   - 提炼一个极具点击欲且严谨不俗套的爆款主标题（严格 <= 64字）
   - 提炼 70~110 字的导读摘要（严格 <= 120字），提纲挈领
   - 使用规范的 Markdown 标题层级（## 二级大纲，### 三级分点），段落适宜手机屏幕翻阅（单段不超过 3~4 行）
   - 适当对重要金句使用 > 引用块，适当在正文关键结论使用 **加粗**
   - 适当使用列表（- 分点项）提升阅读清爽度
3. 忠于核心：
   - 深度吸收原稿的事实、逻辑和主要观点，切勿凭空捏造虚假信息或偏离主题
4. 语言文字规范：
   - 严格修正语病、错别字，中英文与数字自然协调

【必须输出的 JSON 结构】：
你必须且仅能输出一个合法的 JSON 对象，不要包含其他说明文字：
{
  "title": "提炼的精彩文章标题 (<=64字)",
  "author": "作者署名 (<=20字)",
  "digest": "文章摘要导读 (70-110字)",
  "theme": "pie | tech-blue | orangeheart | phycat | lapis | medium | warm-paper",
  "contentMarkdown": "排版润色后的纯正文 Markdown（不含顶部的 --- Front Matter，包含二级三级标题、加粗、引用、列表等）",
  "summaryOfChanges": [
    "优化项 1 (例如：梳理出 3 大核心架构小节)",
    "优化项 2 (例如：提炼了 2 条高光金句并加注引用框)",
    "优化项 3 (例如：规范化中英标点与专业术语)"
  ]
}
`;

  const userPrompt = `
【待润色排版的原始粗稿】：
${roughText.slice(0, 20000)}

${options.customInstruction ? `【用户特别要求】：\n${options.customInstruction}\n` : ''}

请立刻依据指定的【${styleConfig.name}】风格，输出重构排版后的 JSON 对象！
`;

  let rawJsonText = '';

  // 1. Google Gemini Native SDK
  if (provider === 'gemini') {
    const keyToUse = options.apiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      throw new Error('缺少 Gemini API Key。请在界面设置中输入或在环境变量中配置 GEMINI_API_KEY。');
    }

    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const responseSchema = {
      type: 'object',
      properties: {
        title: { type: 'string', description: '提炼的文章标题 (<=64字)' },
        author: { type: 'string', description: '作者署名 (<=20字)' },
        digest: { type: 'string', description: '导读摘要 (70-110字，<=120字)' },
        theme: { type: 'string', description: '推荐排版主题 ID' },
        contentMarkdown: { type: 'string', description: '润色排版后的纯正文 Markdown' },
        summaryOfChanges: {
          type: 'array',
          items: { type: 'string' },
          description: '优化润色改动摘要列表',
        },
      },
      required: ['title', 'author', 'digest', 'theme', 'contentMarkdown', 'summaryOfChanges'],
    };

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.6,
      },
    });

    rawJsonText = response.text?.trim() || '{}';
  } else {
    // 2. OpenAI-compatible providers (DeepSeek, Qwen, Moonshot, Zhipu, etc.)
    const baseUrl = (options.baseUrl?.trim() || preset.defaultBaseUrl).replace(/\/+$/, '');
    const apiKey = options.apiKey?.trim() || '';

    const res = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: modelToUse,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        timeout: 60000,
      }
    );

    rawJsonText = res.data?.choices?.[0]?.message?.content || '{}';
  }

  // Parse JSON output
  const parsed = extractJson(rawJsonText);

  let title = (parsed.title || '精编微信图文草稿').trim();
  if (title.length > 64) title = title.slice(0, 60) + '...';

  let author = (parsed.author || '责任编辑').trim();
  if (author.length > 20) author = author.slice(0, 20);

  let digest = (parsed.digest || title).trim();
  if (digest.length > 120) digest = digest.slice(0, 116) + '...';

  const validThemes = ['pie', 'tech-blue', 'orangeheart', 'phycat', 'lapis', 'medium', 'warm-paper'];
  const theme = validThemes.includes(parsed.theme) ? parsed.theme : (style === 'literary' ? 'warm-paper' : 'tech-blue');

  let bodyMarkdown = (parsed.contentMarkdown || '').trim();

  // Apply Pangu spacing & Chinese typography normalization
  const formatted = formatChineseEnglishSpacing(bodyMarkdown);
  bodyMarkdown = formatted.formatted;

  // Build complete Markdown with Front Matter
  const frontMatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `author: "${author.replace(/"/g, '\\"')}"`,
    `digest: "${digest.replace(/"/g, '\\"')}"`,
    `theme: "${theme}"`,
    'comment: true',
    '---',
    '',
  ].join('\n');

  const fullMarkdown = `${frontMatter}\n${bodyMarkdown}\n`;

  const sectionsAdded = (bodyMarkdown.match(/^##\s+/gm) || []).length;
  const quotesExtracted = (bodyMarkdown.match(/^>\s+/gm) || []).length;

  return {
    title,
    author,
    digest,
    theme,
    markdown: fullMarkdown,
    summaryOfChanges: Array.isArray(parsed.summaryOfChanges) && parsed.summaryOfChanges.length > 0
      ? parsed.summaryOfChanges
      : ['重塑文章层级结构与标题大纲', '提炼核心要点并优化移动端断句', '规范标点符号与中英文排版空隙'],
    stats: {
      originalLength: roughText.length,
      polishedLength: bodyMarkdown.length,
      sectionsAdded,
      quotesExtracted,
    },
    providerUsed: preset.name,
    modelUsed: modelToUse,
  };
}

function extractJson(text: string): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    // Try markdown code block extraction
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
    return {};
  }
}
