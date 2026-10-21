/**
 * trendToDraftPipeline.ts
 * 一键热点生文全自动流水线引擎 (Trend-to-Draft Automation Pipeline)
 * 
 * 全自动六维流水线：
 * 1. 选题情报与立意解析 (Topic Intelligence)
 * 2. 爆款结构化正文合成 (Full Content Synthesis)
 * 3. 视觉资产与商用配图智能匹配 (Smart Asset Enrichment)
 * 4. 微信排版物料与金句自动注入 (Component Sandbox Inlining)
 * 5. 微信主题色彩方案与盘古空格规范化 (Pangu Spacing & Theme)
 * 6. 合规安全预检 (Preflight Safety Audit)
 */

import { TrendingItem, TrendingAngle } from '../data/trendingTopics.ts';
import { STOCK_PHOTOS, StockPhoto } from '../data/stockPhotos.ts';
import { wrapWechatComponent } from './cursorManager.ts';
import { formatChineseEnglishSpacing } from './textBeautifier.ts';
import { performSafetyAudit } from './safetyAudit.ts';

export interface TrendToDraftOptions {
  trend: TrendingItem;
  angle?: TrendingAngle;
  toneStyle: 'tech_depth' | 'business_insight' | 'guide_tutorial' | 'quick_brief';
  targetLength: 'short' | 'medium' | 'long';
  authorName?: string;
  themePreference?: string;
  onStepProgress?: (step: number, total: number, stepName: string, detail: string) => void;
}

export interface TrendToDraftResult {
  title: string;
  author: string;
  digest: string;
  cover: string;
  theme: string;
  markdown: string;
  stats: {
    words: number;
    chars: number;
    readingMinutes: number;
    sectionsCount: number;
  };
  safetyScore: number;
  safetyPassed: boolean;
  matchedPhotosCount: number;
}

/**
 * 智能根据热点关键词从 STOCK_PHOTOS 中匹配最契合的高清商用配图
 */
export function matchStockPhotosForTrend(trend: TrendingItem, count: number = 2): StockPhoto[] {
  const query = `${trend.title} ${trend.tag} ${trend.summary}`.toLowerCase();

  const scored = STOCK_PHOTOS.map((p) => {
    let score = 0;
    if (query.includes(p.category)) score += 5;
    p.keywords.forEach((k) => {
      if (query.includes(k.toLowerCase())) score += 3;
    });
    return { photo: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const result = scored.slice(0, count).map((item) => item.photo);
  return result.length > 0 ? result : STOCK_PHOTOS.slice(0, count);
}

/**
 * 运行一键热点生文全自动流水线
 */
export async function executeTrendToDraftPipeline(
  options: TrendToDraftOptions
): Promise<TrendToDraftResult> {
  const {
    trend,
    angle = trend.angles[0],
    toneStyle = 'tech_depth',
    targetLength = 'medium',
    authorName = '新媒体洞察',
    themePreference,
    onStepProgress,
  } = options;

  const totalSteps = 6;

  // Step 1: 选题情报与立意解析
  onStepProgress?.(1, totalSteps, '选题立意剖析', `正在提取【${trend.title}】核心冲突与受众共鸣点...`);
  await new Promise((r) => setTimeout(r, 200));

  const chosenTitle = angle.title;
  const hook = angle.hook;
  const outline = angle.outline;

  // Step 2: 视觉资产与商用配图智能匹配
  onStepProgress?.(2, totalSteps, '视觉资产匹配', '正在商用免版权图库中智能检索高契合度封面与正文插图...');
  await new Promise((r) => setTimeout(r, 250));

  const matchedPhotos = matchStockPhotosForTrend(trend, 2);
  const coverPhoto = matchedPhotos[0] || STOCK_PHOTOS[0];
  const inlinePhoto = matchedPhotos[1] || STOCK_PHOTOS[1];

  // Step 3: 爆款结构化正文深度合成
  onStepProgress?.(3, totalSteps, '正文结构合成', '正在生成黄金 3 秒开篇痛点、论据递进与落地指南...');
  await new Promise((r) => setTimeout(r, 300));

  // Determine theme
  let recommendedTheme = themePreference || 'tech-blue';
  if (!themePreference) {
    if (trend.source === 'github' || trend.tag.includes('技术') || trend.tag.includes('AI')) {
      recommendedTheme = 'tech-blue';
    } else if (trend.source === 'tech36kr' || trend.tag.includes('商业') || trend.tag.includes('创投')) {
      recommendedTheme = 'pie';
    } else if (trend.tag.includes('生活') || trend.tag.includes('心理')) {
      recommendedTheme = 'orangeheart';
    } else {
      recommendedTheme = 'phycat';
    }
  }

  // Step 4: 微信排版物料与金句自动注入
  onStepProgress?.(4, totalSteps, '排版物料沙盒化', '正在注入金句框、对话气泡与步骤流程组件...');
  await new Promise((r) => setTimeout(r, 250));

  // Build Material Components
  const goldenQuoteHtml = `<section style="margin: 20px 0; padding: 18px 20px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px 10px 10px 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
  <div style="font-size: 11px; font-weight: 700; color: #2563eb; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase;">核心认知 · CORE INSIGHT</div>
  <p style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; line-height: 1.6;">${trend.coreControversy}</p>
</section>`;
  const goldenQuoteBlock = wrapWechatComponent(goldenQuoteHtml, {
    name: '核心认知卡片',
    type: 'material',
  });

  const inlinePhotoHtml = `<section style="margin: 24px 0; text-align: center;">
  <img src="${inlinePhoto.url}" alt="${inlinePhoto.title}" style="max-width: 100%; height: auto; border-radius: 8px; display: inline-block; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05);" />
  <div style="text-align: center; font-size: 11.5px; color: #888888; margin-top: 8px; line-height: 1.4;">图源：Unsplash · 摄影师 ${inlinePhoto.author}</div>
</section>`;
  const inlinePhotoBlock = wrapWechatComponent(inlinePhotoHtml, {
    name: `配图·${inlinePhoto.title}`,
    type: 'image',
  });

  const checklistHtml = `<section style="margin: 22px 0; padding: 18px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; border-radius: 12px;">
  <div style="display: flex; align-items: center; margin-bottom: 10px;">
    <span style="font-size: 14px; font-weight: bold; color: #15803d;">💡 落地执行速查清单 (Action Checklist)</span>
  </div>
  <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: #166534; line-height: 1.8;">
    <li><b>破除盲从：</b>不盲目跟风表层形式，聚焦底层目标受众真实痛点。</li>
    <li><b>建立杠杆：</b>利用标准化工作流与自动化排版工具，将产能提升 3~5 倍。</li>
    <li><b>敏捷复盘：</b>追踪微信看一看等公域算法推流反馈，每周迭代一次选题矩阵。</li>
  </ul>
</section>`;
  const checklistBlock = wrapWechatComponent(checklistHtml, {
    name: '落地执行清单',
    type: 'material',
  });

  // Synthesize Markdown Body with Outline Sections
  const sectionContents = outline.map((item, idx) => {
    const cleanHeading = item.replace(/^[一二三四五六七八九十0-9]+[、. ]*/, '');
    let bodyPara = '';

    if (idx === 0) {
      bodyPara = `在当前快节奏的内容消费场景下，${trend.summary} 面对这一现象，许多创作者常常陷入认知误区。其实核心在于：**用户真正需要的不是冗长晦涩的教条，而是能直接拿来解决当下焦虑的高确定性方案。**`;
    } else if (idx === 1) {
      bodyPara = `深入分析头部账号的操作打法，会发现他们无一例外地踩准了核心节拍。无论是选题策划的切入角度，还是视觉呈现的颗粒度把控，都在持续强化与目标读者的情绪共鸣。\n\n${inlinePhotoBlock}\n\n如上图所示，视觉留白与层次化引导对于阅读完成率具有决定性影响。`;
    } else if (idx === 2) {
      bodyPara = `我们结合大量实测数据拆解出一套行之有效的复用框架。通过将复杂环节模块化拆分，任何人都能在短时间内搭建起高产出的创作流水线。\n\n${checklistBlock}`;
    } else {
      bodyPara = `时代永远奖赏那些能够敏锐捕捉平台趋势并迅速付诸行动的操盘手。与其在原地犹豫观望，不如从今天发布的第一篇推文开始，全面验证属于你的爆款打法。`;
    }

    return `## ${item}\n\n${bodyPara}\n`;
  });

  const generatedDigest = `${hook} 本文深入拆解【${trend.title}】的底层逻辑与实战打法，带你把握核心先机。`;

  // Build Front Matter
  const rawMarkdown = `---
title: "${chosenTitle}"
author: "${authorName}"
digest: "${generatedDigest}"
cover: "${coverPhoto.url}"
theme: "${recommendedTheme}"
article_type: "news"
---

> ${hook}

${goldenQuoteBlock}

${sectionContents.join('\n')}

---

**欢迎在文末点赞、在看并分享给身边的同行朋友！** 点击右上角关注，持续获取第一线自媒体与科技深度商业内参。
`;

  // Step 5: 微信主题色彩方案与盘古空格规范化
  onStepProgress?.(5, totalSteps, '排版格式优化', '正在规范化中英文盘古空格与中文标点符号...');
  await new Promise((r) => setTimeout(r, 200));

  const { formatted: beautifiedMarkdown } = formatChineseEnglishSpacing(rawMarkdown);

  // Step 6: 合规安全预检
  onStepProgress?.(6, totalSteps, '合规安全审计', '正在执行新广告法极限词与微信诱导发布预检...');
  await new Promise((r) => setTimeout(r, 200));

  const auditReport = performSafetyAudit({
    title: chosenTitle,
    digest: generatedDigest,
    markdown: beautifiedMarkdown,
  });

  // Calculate statistics
  const wordCount = beautifiedMarkdown.length;
  const chineseCharsCount = (beautifiedMarkdown.match(/[\u4e00-\u9fa5]/g) || []).length;
  const readingMinutes = Math.max(1, Math.ceil(chineseCharsCount / 400));

  return {
    title: chosenTitle,
    author: authorName,
    digest: generatedDigest,
    cover: coverPhoto.url,
    theme: recommendedTheme,
    markdown: beautifiedMarkdown,
    stats: {
      words: wordCount,
      chars: chineseCharsCount,
      readingMinutes,
      sectionsCount: outline.length,
    },
    safetyScore: auditReport.score,
    safetyPassed: auditReport.passed,
    matchedPhotosCount: matchedPhotos.length,
  };
}
