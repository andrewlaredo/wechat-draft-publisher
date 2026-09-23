import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Newspaper,
  Images,
  ArrowRight,
  FileCheck,
  Zap,
  Globe,
  Cpu,
  Settings2,
  Paperclip,
  FileText,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { GeneratedArticleResult, PROVIDER_PRESETS, AiProvider } from '../ai/generator.ts';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface KnowledgeFileItem {
  id: string;
  name: string;
  content: string;
  size: number;
}

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyArticle: (article: GeneratedArticleResult) => void;
}

const TOPIC_PRESETS = [
  {
    type: 'news',
    label: 'DeepSeek 本地部署',
    topic: '2026年普通人如何在本地电脑轻量部署 DeepSeek 并搭建私有个人知识库实战指南',
    tone: 'practical_guide',
  },
  {
    type: 'news',
    label: '数字工作流搭建',
    topic: '极客思考：如何用结构化 Markdown 串联日常思考与跨平台内容高效分发',
    tone: 'tech_sspai',
  },
  {
    type: 'newspic',
    label: '周末桌面改造 (贴图)',
    topic: '周末给小书桌来了一次深度断舍离，分享几件提升幸福感的高颜值极简好物',
    tone: 'newspic_lifestyle',
  },
  {
    type: 'news',
    label: '独立开发者架构',
    topic: '2026年独立开发者的全栈极简技术选型：为什么我选择轻量 Serverless 与自动化发布',
    tone: 'business_insight',
  },
];

const TONE_OPTIONS = [
  { id: 'tech_sspai', label: '数字极客', desc: '注重细节、排版讲究、客观专业' },
  { id: 'practical_guide', label: '实战干货', desc: '步骤清晰、实操避坑、快速上手' },
  { id: 'newspic_lifestyle', label: '生活贴图', desc: '短小精悍、清新治愈、标签丰富' },
  { id: 'business_insight', label: '商业观察', desc: '逻辑严密、行业视野、宏观洞察' },
  { id: 'storytelling', label: '故事杂文', desc: '场景代入、情感共鸣、金句频出' },
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyArticle,
}) => {
  // Provider settings
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Connectivity test state
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Content inputs
  const [topic, setTopic] = useState('');
  const [articleType, setArticleType] = useState<'news' | 'newspic'>('news');
  const [tone, setTone] = useState('tech_sspai');
  const [targetWordCount, setTargetWordCount] = useState<number>(1500);
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [reference, setReference] = useState('');
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFileItem[]>([]);
  const [showRagUpload, setShowRagUpload] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        setKnowledgeFiles((prev) => [
          ...prev,
          {
            id: `doc_${Date.now()}_${i}`,
            name: file.name,
            content: text,
            size: file.size,
          },
        ]);
      } catch (err) {
        console.error('读取文档失败:', err);
      }
    }
  };

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load stored preferences per provider
  useEffect(() => {
    try {
      const storedProvider = localStorage.getItem('wechat_ai_provider') as AiProvider;
      if (storedProvider && PROVIDER_PRESETS[storedProvider]) {
        setSelectedProvider(storedProvider);
      }
      loadProviderSettings(storedProvider || 'deepseek');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const loadProviderSettings = (pId: AiProvider) => {
    try {
      const preset = PROVIDER_PRESETS[pId] || PROVIDER_PRESETS.deepseek;
      const storedKey = localStorage.getItem(`wechat_ai_key_${pId}`) || '';
      const storedBaseUrl = localStorage.getItem(`wechat_ai_base_${pId}`) || preset.defaultBaseUrl;
      const storedModel = localStorage.getItem(`wechat_ai_model_${pId}`) || preset.defaultModel;

      setApiKey(storedKey);
      setBaseUrl(storedBaseUrl);
      setModelName(storedModel);
      setKeyTestStatus(null);
    } catch {
      // Ignore
    }
  };

  const handleSelectProvider = (pId: AiProvider) => {
    setSelectedProvider(pId);
    try {
      localStorage.setItem('wechat_ai_provider', pId);
    } catch {
      // Ignore
    }
    loadProviderSettings(pId);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) {
        localStorage.setItem(`wechat_ai_key_${selectedProvider}`, key);
      } else {
        localStorage.removeItem(`wechat_ai_key_${selectedProvider}`);
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveBaseUrl = (url: string) => {
    setBaseUrl(url);
    try {
      localStorage.setItem(`wechat_ai_base_${selectedProvider}`, url);
    } catch {
      // Ignore
    }
  };

  const handleSaveModel = (model: string) => {
    setModelName(model);
    try {
      localStorage.setItem(`wechat_ai_model_${selectedProvider}`, model);
    } catch {
      // Ignore
    }
  };

  const handleTestConnectivity = async () => {
    setTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await safeFetchJson('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          baseUrl: baseUrl.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
          model: modelName.trim() || undefined,
        }),
      });
      if (res.ok && res.data?.success) {
        setKeyTestStatus({ success: true, message: res.data.message });
      } else {
        setKeyTestStatus({ success: false, message: res.data?.error || res.error || '连接验证失败' });
      }
    } catch (err: any) {
      setKeyTestStatus({ success: false, message: err.message || '网络通讯异常' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('请输入文章主题或创作要点');
      return;
    }

    const currentPreset = PROVIDER_PRESETS[selectedProvider] || PROVIDER_PRESETS.deepseek;
    if (!apiKey.trim() && selectedProvider !== 'gemini' && selectedProvider !== 'custom') {
      setError(`请先在上方填入 ${currentPreset.name} 的 API Key`);
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedArticle(null);
    setGenerationStep(`正在连接 ${currentPreset.name} 构建语义大纲...`);

    const stepTimer1 = setTimeout(() => {
      setGenerationStep(`${currentPreset.name} 正在深度撰写排版正文与多小节结构...`);
    }, 2000);
    const stepTimer2 = setTimeout(() => {
      setGenerationStep('正在执行微信 Front Matter 元数据校验与安全字数截断...');
    }, 5500);

    try {
      const kwList = keywords
        .split(/[,，、\s]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await safeFetchJson('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          baseUrl: baseUrl.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
          model: modelName.trim() || undefined,
          topic: topic.trim(),
          articleType,
          tone,
          targetWordCount,
          audience: audience.trim() || undefined,
          keywords: kwList.length > 0 ? kwList : undefined,
          reference: reference.trim() || undefined,
          knowledgeDocs:
            knowledgeFiles.length > 0
              ? knowledgeFiles.map((f) => ({
                  name: f.name,
                  content: f.content,
                  size: f.size,
                }))
              : undefined,
        }),
      });

      if (res.ok && res.data?.success && res.data.article) {
        setGeneratedArticle(res.data.article);
      } else {
        setError(res.data?.error || res.error || '生成失败，请检查 API Key 或重试');
      }
    } catch (err: any) {
      setError(err.message || '通讯异常，请检查网络或重试');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleApply = () => {
    if (generatedArticle) {
      onApplyArticle(generatedArticle);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentPreset = PROVIDER_PRESETS[selectedProvider] || PROVIDER_PRESETS.deepseek;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-900/30">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <span>通用 AI 文章创作引擎</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/60 font-mono">
                  Multi-LLM
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                支持通用大模型能力（DeepSeek / 通义千问 / Kimi / OpenAI / 智谱 / Gemini / Ollama），按微信规范一键生成
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. Multi-Provider Picker Tabs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>选择大模型提供商 (Provider)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                className="text-[11px] text-neutral-400 hover:text-violet-300 flex items-center space-x-1 transition"
              >
                <Settings2 className="w-3 h-3" />
                <span>{showAdvancedConfig ? '收起接口地址设置' : '自定义 Base URL / 模型名称'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
              {(Object.keys(PROVIDER_PRESETS) as AiProvider[]).map((pId) => {
                const p = PROVIDER_PRESETS[pId];
                const isSelected = selectedProvider === pId;
                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => handleSelectProvider(pId)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition text-center truncate ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                    title={p.name}
                  >
                    {pId === 'deepseek' && 'DeepSeek'}
                    {pId === 'qwen' && '通义千问'}
                    {pId === 'moonshot' && 'Kimi (月之暗面)'}
                    {pId === 'openai' && 'OpenAI'}
                    {pId === 'zhipu' && '智谱 GLM'}
                    {pId === 'gemini' && 'Gemini'}
                    {pId === 'custom' && '自定义 / 本地'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Provider Credentials & Endpoint */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-neutral-300 font-medium">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentPreset.name} API 密钥与连接配置</span>
              </div>
              <span className="text-[11px] text-neutral-500">
                本地安全保存
              </span>
            </div>

            {/* Key input */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  id="input-ai-key"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder={currentPreset.keyPlaceholder}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 pr-9 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-violet-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                id="btn-test-ai-key"
                onClick={handleTestConnectivity}
                disabled={testingKey}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 disabled:opacity-50 shrink-0"
              >
                {testingKey ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>测试连通性</span>
              </button>
            </div>

            {/* Advanced Base URL & Model Name */}
            {(showAdvancedConfig || selectedProvider === 'custom') && (
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-neutral-850">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>接口地址 (Base URL)</span>
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => handleSaveBaseUrl(e.target.value)}
                    placeholder={currentPreset.defaultBaseUrl}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    <span>模型名称 (Model)</span>
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => handleSaveModel(e.target.value)}
                    placeholder={currentPreset.defaultModel}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {keyTestStatus && (
              <div
                className={`text-[11px] flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md ${
                  keyTestStatus.success
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
                    : 'bg-red-950/50 text-red-300 border border-red-800/60'
                }`}
              >
                {keyTestStatus.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span>{keyTestStatus.message}</span>
              </div>
            )}
          </div>

          {/* 3. Message Type Picker */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">推送目标消息类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-type-select-news"
                onClick={() => {
                  setArticleType('news');
                  if (targetWordCount < 800) setTargetWordCount(1500);
                }}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition ${
                  articleType === 'news'
                    ? 'bg-violet-950/40 border-violet-600 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${articleType === 'news' ? 'bg-violet-600 text-white' : 'bg-neutral-800'}`}>
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-200">经典图文长文 (news)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    多小节深度长文、代码高亮、精美引用、9套排版主题
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="btn-type-select-newspic"
                onClick={() => {
                  setArticleType('newspic');
                  setTone('newspic_lifestyle');
                  setTargetWordCount(400);
                }}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition ${
                  articleType === 'newspic'
                    ? 'bg-pink-950/40 border-pink-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${articleType === 'newspic' ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white' : 'bg-neutral-800'}`}>
                  <Images className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-200">图片消息 / 贴图 (newspic)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    小绿书贴图轮播、清新干货分点清单、自动提取话题标签
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Topic & Quick presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium">文章主题 / 创作灵感 *</label>
              <span className="text-[11px] text-neutral-500">快速填入样例灵感：</span>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
              {TOPIC_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTopic(p.topic);
                    setArticleType(p.type as any);
                    setTone(p.tone);
                  }}
                  className="px-2 py-0.5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-[11px] transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              id="input-ai-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="例如：探讨 2026 年现代数字生产力工具的变迁，结合数字极客风格，分享如何用极简工作流摆脱信息过载..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* 5. Tone & Word count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium">文章文风</label>
              <select
                id="select-ai-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-violet-500"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-neutral-900">
                    {t.label} ({t.desc})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-neutral-300 font-medium">期望字数</label>
                <span className="text-[11px] text-violet-400 font-mono font-medium">
                  ~{targetWordCount} 字
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {[
                  { label: '精炼 (800)', val: 800 },
                  { label: '标准 (1500)', val: 1500 },
                  { label: '深度 (2200)', val: 2200 },
                  ...(articleType === 'newspic' ? [{ label: '贴图 (350)', val: 350 }] : []),
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTargetWordCount(item.val)}
                    className={`flex-1 py-1.5 rounded-lg border text-center text-[11px] transition ${
                      targetWordCount === item.val
                        ? 'bg-violet-950/60 border-violet-600 text-violet-300 font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Optional advanced inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px]">目标读者 (可选)</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="例如：自媒体创作者、数码爱好者、程序员"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px]">重点关键词 (可选，逗号分隔)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="例如：效率, 自动化, Markdown, 微信公众号"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* 7. RAG / Knowledge Base & Reference Materials */}
          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-200">
                <Paperclip className="w-4 h-4 text-violet-400" />
                <span>知识库与本地外部参考资料 (RAG 增强)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800">
                  资料导入
                </span>
              </div>
              <label className="cursor-pointer flex items-center space-x-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>导入本地文件 (.md / .txt / .json)</span>
                <input
                  type="file"
                  multiple
                  accept=".md,.txt,.json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              支持直接读取本地技术文档、产品方案、会议笔记或草稿作为 RAG 知识源。AI 将深度研读其中的真实数据与案例，严禁伪造。
            </p>

            {/* Knowledge file chips */}
            {knowledgeFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {knowledgeFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-750 text-xs text-neutral-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="font-medium max-w-[140px] truncate" title={f.name}>
                      {f.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ({(f.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setKnowledgeFiles(knowledgeFiles.filter((item) => item.id !== f.id))}
                      className="text-neutral-500 hover:text-rose-400 ml-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual reference input */}
            <div className="pt-1">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="或者直接输入/粘贴参考资料链接或要点提纲..."
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-xs">生成失败</div>
                <div className="text-[11px] text-red-300/90 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Generated Result Review (Human-in-the-loop Gate) */}
          {generatedArticle && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/70 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>文章已生成！核对关键元数据后注入工作台：</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-900/60 text-violet-300 font-mono">
                    {generatedArticle.providerUsed} · {generatedArticle.modelUsed}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                    {generatedArticle.stats.wordCount} 字 · {generatedArticle.stats.sectionsCount} 小节
                  </span>
                </div>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800/80 space-y-1.5 text-[11px]">
                <div className="flex">
                  <span className="text-neutral-500 w-16 shrink-0">标题:</span>
                  <span className="text-neutral-200 font-medium">{generatedArticle.title}</span>
                </div>
                <div className="flex">
                  <span className="text-neutral-500 w-16 shrink-0">摘要 (120字):</span>
                  <span className="text-neutral-300">{generatedArticle.digest}</span>
                </div>
                <div className="flex">
                  <span className="text-neutral-500 w-16 shrink-0">作者/主题:</span>
                  <span className="text-neutral-300">
                    {generatedArticle.author} · {generatedArticle.theme}
                  </span>
                </div>
                {generatedArticle.articleType === 'newspic' && (
                  <div className="flex">
                    <span className="text-neutral-500 w-16 shrink-0">贴图配图:</span>
                    <span className="text-rose-400 font-medium">
                      已匹配 {generatedArticle.images.length} 张高清精选贴图
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                id="btn-apply-generated-article"
                onClick={handleApply}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition"
              >
                <FileCheck className="w-4 h-4" />
                <span>注入编辑器并开启微信高拟真预览</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500">
            {isGenerating ? (
              <span className="text-violet-400 flex items-center space-x-1.5 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{generationStep || `${currentPreset.name} 正在创作中...`}</span>
              </span>
            ) : (
              <span>严格遵循微信公众平台规范 (标题 ≤64 字 · 摘要 ≤120 字)</span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              取消
            </button>

            <button
              type="button"
              id="btn-trigger-ai-generate"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-violet-950 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>开始生成文章</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
