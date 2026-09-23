import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger.ts';

export type AiProvider =
  | 'deepseek'
  | 'openai'
  | 'qwen'
  | 'moonshot'
  | 'zhipu'
  | 'gemini'
  | 'custom';

export interface ProviderPreset {
  id: AiProvider;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  keyPlaceholder: string;
  keyHelp: string;
}

export const PROVIDER_PRESETS: Record<AiProvider, ProviderPreset> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-xxxxxxxx',
    keyHelp: 'https://platform.deepseek.com 获取 API Key',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT-4o)',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-proj-xxxxxxxx',
    keyHelp: 'https://platform.openai.com 获取 API Key',
  },
  qwen: {
    id: 'qwen',
    name: '通义千问 (阿里 DashScope)',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    keyPlaceholder: 'sk-xxxxxxxx',
    keyHelp: 'https://dashscope.console.aliyun.com 获取 API Key',
  },
  moonshot: {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    keyPlaceholder: 'sk-xxxxxxxx',
    keyHelp: 'https://platform.moonshot.cn 获取 API Key',
  },
  zhipu: {
    id: 'zhipu',
    name: '智谱 GLM (BigModel)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    keyPlaceholder: 'xxxxxxxx.xxxxxxxx',
    keyHelp: 'https://open.bigmodel.cn 获取 API Key',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-3.8-flash',
    keyPlaceholder: 'AIzaSyxxxxxxxx (留空可默认使用服务器环境 Key)',
    keyHelp: 'https://aistudio.google.com 获取 API Key',
  },
  custom: {
    id: 'custom',
    name: '通用 OpenAI 兼容 (Ollama/中转/vLLM)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    keyPlaceholder: 'sk-... (本地无密码可填任意字符)',
    keyHelp: '支持任何符合 OpenAI /chat/completions 格式的接口',
  },
};

export interface KnowledgeDoc {
  name: string;
  content: string;
  size?: number;
}

export interface GenerateArticleOptions {
  provider?: AiProvider | string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  topic: string;
  tone?: string;
  targetWordCount?: number;
  articleType?: 'news' | 'newspic';
  audience?: string;
  keywords?: string[];
  reference?: string;
  knowledgeDocs?: KnowledgeDoc[];
}

export interface GeneratedArticleResult {
  title: string;
  author: string;
  digest: string;
  theme: string;
  articleType: 'news' | 'newspic';
  cover: string;
  images: string[];
  markdown: string;
  stats: {
    wordCount: number;
    sectionsCount: number;
  };
  providerUsed: string;
  modelUsed: string;
}

// Curated high quality Unsplash photos categorized by themes
const CURATED_IMAGE_POOLS: Record<string, string[]> = {
  tech: [
    'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  ],
  workspace: [
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
  ],
  minimal: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80',
  ],
  business: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
  ],
};

function pickCuratedImages(category = 'tech', count = 3, seed = ''): { cover: string; images: string[] } {
  const pool = CURATED_IMAGE_POOLS[category] || CURATED_IMAGE_POOLS.tech;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const startIndex = Math.abs(hash) % pool.length;
  const cover = pool[startIndex];
  const images: string[] = [];
  for (let i = 1; i <= count; i++) {
    images.push(pool[(startIndex + i) % pool.length]);
  }
  return { cover, images };
}

/**
 * Robust JSON extractor from text response (handles Markdown code blocks, raw JSON, trailing commas)
 */
function extractJsonFromText(rawText: string): any {
  const cleaned = rawText.trim();

  // 1. Try markdown code blocks ```json ... ```
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1]);
    } catch {
      // Continue to next attempts
    }
  }

  // 2. Try direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue
  }

  // 3. Find outer braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Attempt to remove trailing commas before closing braces/brackets
      const relaxed = candidate.replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(relaxed);
      } catch (e: any) {
        throw new Error(`无法从模型输出中提取有效 JSON: ${e.message}`);
      }
    }
  }

  throw new Error(`模型响应未能输出有效的 JSON 对象：${cleaned.slice(0, 150)}...`);
}

/**
 * Universal Connectivity Test for any provider (Gemini or OpenAI-compatible)
 */
export async function testAiConnectivity(params: {
  provider?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}): Promise<{ valid: boolean; message: string }> {
  const provider = (params.provider as AiProvider) || 'gemini';
  const preset = PROVIDER_PRESETS[provider as AiProvider] || PROVIDER_PRESETS.custom;

  // 1. Gemini native test
  if (provider === 'gemini') {
    const keyToUse = params.apiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      return {
        valid: false,
        message: '未提供 Gemini API Key，且服务器环境变量中也未配置 GEMINI_API_KEY',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const modelName = params.model?.trim() || preset.defaultModel;
      const res = await ai.models.generateContent({
        model: modelName,
        contents: 'Ping: Please respond with "ok".',
      });
      if (res && res.text) {
        return { valid: true, message: `Google Gemini (${modelName}) 连接成功！` };
      }
      return { valid: false, message: 'Gemini 未返回文本，请检查密钥与模型权限' };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('invalid')) {
        return { valid: false, message: '无效的 Gemini API Key，请检查输入' };
      }
      return { valid: false, message: `Gemini 连接失败: ${errorMsg}` };
    }
  }

  // 2. OpenAI-compatible test (DeepSeek, OpenAI, Qwen, Moonshot, Zhipu, Custom, Ollama)
  const baseUrl = (params.baseUrl?.trim() || preset.defaultBaseUrl).replace(/\/+$/, '');
  const apiKey = params.apiKey?.trim() || '';
  const model = params.model?.trim() || preset.defaultModel;

  if (!apiKey && provider !== 'custom') {
    return {
      valid: false,
      message: `请填写 ${preset.name} 的 API Key`,
    };
  }

  try {
    const targetUrl = `${baseUrl}/chat/completions`;
    const response = await axios.post(
      targetUrl,
      {
        model,
        messages: [{ role: 'user', content: 'Ping: Reply with "ok".' }],
        max_tokens: 10,
        temperature: 0.1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        timeout: 15000,
      }
    );

    if (response.status === 200 && response.data?.choices?.[0]?.message) {
      return {
        valid: true,
        message: `${preset.name} [模型: ${model}] 连通性测试通过！`,
      };
    }
    return { valid: false, message: `模型返回了非预期响应: ${JSON.stringify(response.data)}` };
  } catch (err: any) {
    if (err.response) {
      const status = err.response.status;
      const errData = err.response.data;
      const msg = errData?.error?.message || errData?.message || JSON.stringify(errData);
      if (status === 401) {
        return { valid: false, message: `[401 认证失败] API Key 无效或未授权: ${msg}` };
      }
      if (status === 404) {
        return { valid: false, message: `[404 路径不存在] 请检查 Base URL 是否正确 (当前: ${baseUrl})` };
      }
      if (status === 429) {
        return { valid: false, message: `[429 请求超限] API 额度不足或频次超限: ${msg}` };
      }
      return { valid: false, message: `[HTTP ${status}] 接口报错: ${msg}` };
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return { valid: false, message: `连接超时，无法访问 ${baseUrl}，请检查网络或代理` };
    }
    return { valid: false, message: `连接异常: ${err.message}` };
  }
}

/**
 * Universal Article Generator supporting Gemini + OpenAI-compatible providers
 */
export async function generateArticle(options: GenerateArticleOptions): Promise<GeneratedArticleResult> {
  const provider = (options.provider as AiProvider) || 'gemini';
  const preset = PROVIDER_PRESETS[provider as AiProvider] || PROVIDER_PRESETS.custom;

  const isNewspic = options.articleType === 'newspic';
  const targetWords = options.targetWordCount || (isNewspic ? 400 : 1600);

  const toneMap: Record<string, string> = {
    tech_sspai: '数字极客风格（注重数字生活、效率工具体验、深度结构化、排版考究、客观克制）',
    practical_guide: '实战干货指南（步骤详尽、代码/步骤清晰、避坑提醒、直接可操作）',
    storytelling: '故事叙事杂文（情感充沛、场景代入感强、金句频出、引发共鸣）',
    business_insight: '商业与技术洞察（逻辑严密、行业视野、趋势剖析、深度研判）',
    newspic_lifestyle: '清新生活贴图风（短小精悍、清新治愈、分点罗列、重点突出、包含精选话题标签）',
  };

  const selectedTone = toneMap[options.tone || 'tech_sspai'] || options.tone || '数字极客客观深度排版风格';

  const systemInstruction = `
你是一位资深微信公众号爆款创作者与数字排版专家。
你的任务是根据用户给出的主题，生成一篇完全符合微信公众号生态、可直接推送的高质量文章。

【微信排版与内容规范】：
1. 标题（title）：富有吸引力且拒绝低俗标题党，严格控制在 15~28 个汉字（微信绝对上限 64 字）。
2. 作者（author）：专业且贴合主题的笔名（限 20 字以内）。
3. 摘要（digest）：极其精炼地概括文章主旨与阅读价值，必须严格控制在 70~110 个汉字以内（微信草稿箱硬限制最多 120 字，超出会报错！）。
4. 视觉主题（theme）：从以下主题 ID 中挑选最贴切的一个：
   - 'pie' (极客红，适合数码探索、效率生活、工具推荐)
   - 'tech-blue' (极客湛蓝，适合编程架构、技术方案)
   - 'orangeheart' (暖心橙，适合教程、温润干货)
   - 'phycat' (薄荷绿，适合清新自然、健康生活)
   - 'lapis' (青金石，适合严肃学术、深度思考)
   - 'medium' (素雅黑白，适合人文、深度思考)
   - 'sakura' (浅绛绯红，适合文艺、生活感悟)
   - 'warm-paper' (暖纸人文，适合纸书随笔)
   - 'default' (经典微信绿)
5. 结构规范：
   - 包含引人入胜的引言。
   - 包含 3~5 个小节（使用 ## 二级标题，### 三级标题），层次清晰。
   - 适当使用加粗重点、无序列表、引用金句（> 引言）。
   - 如果是技术文章，请包含语法规范的代码块（例如 \`\`\`typescript 或 \`\`\`bash）。
   - 结尾包含总结与思考交流，鼓励读者点赞、分享、在看。
${isNewspic ? '6. 图片消息（贴图）特殊规则：这是小绿书图文模式，重点是短文本、分点清单、治愈或种草文风，并在末尾加上 4~6 个紧扣主题的 #话题标签（例如 #桌面美学 #极简主义）。' : ''}

【必须输出的 JSON 结构】：
你必须且仅能输出一个合法的 JSON 对象，不要包含多余的闲聊文字。JSON 必须包含以下字段：
{
  "title": "文章标题 (<=64字)",
  "author": "作者署名 (<=20字)",
  "digest": "文章摘要 (70-110字，绝对<=120字)",
  "theme": "pie | tech-blue | orangeheart | phycat | lapis | medium | sakura | warm-paper | default",
  "imageCategory": "tech | workspace | minimal | business",
  "contentMarkdown": "文章正文 Markdown（不包含顶部的 --- Front Matter，纯正文，包含二级三级标题、段落、列表、代码块、引用等）",
  "hashtags": ["#标签1", "#标签2"]
}
`;

  let cumulativeKnowledgeChars = 0;
  const MAX_KNOWLEDGE_DOCS = 8;
  const MAX_TOTAL_KNOWLEDGE_CHARS = 16000;

  const validKnowledgeDocs = (options.knowledgeDocs || [])
    .slice(0, MAX_KNOWLEDGE_DOCS)
    .filter((doc) => {
      if (cumulativeKnowledgeChars >= MAX_TOTAL_KNOWLEDGE_CHARS) return false;
      const remainingQuota = MAX_TOTAL_KNOWLEDGE_CHARS - cumulativeKnowledgeChars;
      const truncated = (doc.content || '').slice(0, Math.min(4000, remainingQuota));
      cumulativeKnowledgeChars += truncated.length;
      return truncated.trim().length > 0;
    });

  const knowledgeContext =
    validKnowledgeDocs.length > 0
      ? `\n【外部知识库与本地参考资料 (RAG 核心资料上下文)】：
请优先研读并吸收以下用户提供的真实资料与知识库要点，将核心事实、案例与数据深度融合进文章中，避免泛泛空谈：
${validKnowledgeDocs
  .map(
    (doc, idx) =>
      `[资料文档 ${idx + 1}: ${doc.name}]\n${doc.content.slice(0, 4000)}`
  )
  .join('\n\n')}\n`
      : '';

  const prompt = `
请围绕以下要求为我创作一篇高质量微信公众号文章：
- 核心主题：${options.topic}
- 文章类型：${isNewspic ? '图片消息 / 贴图 (newspic)' : '经典图文长文 (news)'}
- 期望字数：约 ${targetWords} 字
- 写作风格：${selectedTone}
${options.audience ? `- 目标读者：${options.audience}` : ''}
${options.keywords && options.keywords.length > 0 ? `- 重点关键词：${options.keywords.join(', ')}` : ''}
${options.reference ? `- 参考资料要点：${options.reference}` : ''}
${knowledgeContext}

请务必按指定的 JSON 结构输出！
`;

  let rawJsonText = '';
  const modelToUse = options.model?.trim() || preset.defaultModel;

  // ==========================================
  // Provider 1: Gemini Native SDK
  // ==========================================
  if (provider === 'gemini') {
    const keyToUse = options.apiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      throw new Error('缺少 Gemini API Key。请在界面输入您的 Key 或在系统设置中配置 GEMINI_API_KEY。');
    }

    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const responseSchema = {
      type: 'object',
      properties: {
        title: { type: 'string', description: '文章标题，严格不超过 64 字' },
        author: { type: 'string', description: '作者署名，限 20 字以内' },
        digest: { type: 'string', description: '文章摘要，严格在 70~110 字以内，切勿超过 120 字' },
        theme: { type: 'string', description: '推荐主题 ID：pie, tech-blue, orangeheart, phycat, lapis, medium, sakura, warm-paper, default' },
        imageCategory: { type: 'string', description: '配图类别偏好：tech, workspace, minimal, business' },
        contentMarkdown: { type: 'string', description: '文章纯正文 Markdown（不含顶部的 Front Matter）' },
        hashtags: { type: 'array', items: { type: 'string' }, description: '话题标签列表' },
      },
      required: ['title', 'author', 'digest', 'theme', 'contentMarkdown'],
    };

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.7,
      },
    });

    rawJsonText = response.text?.trim() || '{}';
  } else {
    // ==========================================
    // Provider 2: Universal OpenAI-Compatible
    // (DeepSeek / OpenAI / Qwen / Moonshot / Zhipu / Ollama / Custom)
    // ==========================================
    const baseUrl = (options.baseUrl?.trim() || preset.defaultBaseUrl).replace(/\/+$/, '');
    const apiKey = options.apiKey?.trim() || '';

    if (!apiKey && provider !== 'custom') {
      throw new Error(`缺少 ${preset.name} 的 API Key，请在弹窗设置中填入`);
    }

    const targetUrl = `${baseUrl}/chat/completions`;

    try {
      const response = await axios.post(
        targetUrl,
        {
          model: modelToUse,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          // Suggest json_object mode if supported by provider
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          timeout: 60000,
        }
      );

      rawJsonText = response.data?.choices?.[0]?.message?.content || '';
    } catch (apiErr: any) {
      const status = apiErr.response?.status;
      const errData = apiErr.response?.data;
      const errMsg = (errData?.error?.message || apiErr.message || '').toLowerCase();
      const isFormatIssue = errMsg.includes('response_format') || errMsg.includes('json_object') || errMsg.includes('unsupported parameter');

      // Relax fallback condition (N10): If 400/422 or format error on first attempt, retry without response_format
      if (status === 400 || status === 422 || isFormatIssue) {
        logger.info(`[${preset.name}] 首次调用遇到格式约束 (status: ${status || '未知'})，正在自动降级移除 response_format 重试...`);
        const retryRes = await axios.post(
          targetUrl,
          {
            model: modelToUse,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            timeout: 60000,
          }
        );
        rawJsonText = retryRes.data?.choices?.[0]?.message?.content || '';
      } else {
        const msg = apiErr.response?.data?.error?.message || apiErr.message;
        throw new Error(`[${preset.name} 调用失败] ${msg}`);
      }
    }
  }

  // Parse structured output safely
  const parsed = extractJsonFromText(rawJsonText);

  // Content Quality Gate & Sanitization
  let title = (parsed.title || options.topic).trim();
  if (title.length > 64) {
    title = title.slice(0, 60) + '...';
  }

  let author = (parsed.author || '科技探索者').trim();
  if (author.length > 20) {
    author = author.slice(0, 20);
  }

  let digest = (parsed.digest || '').trim();
  if (digest.length > 120) {
    digest = digest.slice(0, 116) + '...';
  } else if (!digest) {
    digest = title;
  }

  const validThemes = ['pie', 'orangeheart', 'lapis', 'phycat', 'tech-blue', 'medium', 'sakura', 'warm-paper', 'default'];
  const theme = validThemes.includes(parsed.theme) ? parsed.theme : (isNewspic ? 'pie' : 'tech-blue');

  const { cover, images } = pickCuratedImages(parsed.imageCategory || 'tech', isNewspic ? 4 : 2, options.topic);

  let bodyMarkdown = (parsed.contentMarkdown || '').trim();

  // If newspic, ensure hashtags are appended if not already present
  if (isNewspic && parsed.hashtags && Array.isArray(parsed.hashtags)) {
    const tagsLine = parsed.hashtags
      .map((t: string) => (t.startsWith('#') ? t : `#${t}`))
      .join(' ');
    if (!bodyMarkdown.includes('#')) {
      bodyMarkdown += `\n\n${tagsLine}`;
    }
  }

  // Construct complete Markdown with Front Matter
  const frontMatterLines = [
    '---',
    `title: ${title}`,
    `author: ${author}`,
    isNewspic ? 'type: newspic' : null,
    `digest: ${digest}`,
    `cover: ${cover}`,
    isNewspic && images.length > 0 ? `images:\n${images.map((img) => `  - ${img}`).join('\n')}` : null,
    'comment: true',
    !isNewspic ? `theme: ${theme}` : null,
    'code_theme: github',
    '---',
  ].filter(Boolean);

  const fullMarkdown = `${frontMatterLines.join('\n')}\n\n${bodyMarkdown}\n`;

  // Estimate stats
  const chineseChars = (bodyMarkdown.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (bodyMarkdown.match(/[a-zA-Z0-9_-]+/g) || []).length;
  const wordCount = chineseChars + englishWords;
  const sectionsCount = (bodyMarkdown.match(/^##\s+/gm) || []).length;

  return {
    title,
    author,
    digest,
    theme,
    articleType: isNewspic ? 'newspic' : 'news',
    cover,
    images,
    markdown: fullMarkdown,
    stats: {
      wordCount,
      sectionsCount,
    },
    providerUsed: preset.name,
    modelUsed: modelToUse,
  };
}
