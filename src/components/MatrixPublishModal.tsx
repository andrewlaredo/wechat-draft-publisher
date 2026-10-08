import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Laptop,
  Image as ImageIcon,
  Flame,
  Globe,
  Sliders,
  FileCode,
  Tag,
  Hash,
} from 'lucide-react';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface MatrixPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  inlinedHtml: string;
  metadata: {
    title: string;
    author: string;
    digest: string;
    cover?: string;
    images?: string[];
  };
  onPublishWeChat: (dryRun: boolean) => void;
  onCopyWeChatHtml: () => void;
}

type PlatformType = 'wechat' | 'zhihu' | 'juejin' | 'csdn' | 'xiaohongshu';

interface PlatformConfig {
  id: PlatformType;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  description: string;
  creatorUrl: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'wechat',
    name: '微信公众号',
    badge: '图文 / 贴图',
    badgeColor: 'bg-emerald-950/70 border-emerald-800 text-emerald-300',
    icon: '🟢',
    description: '通过官方草稿箱 API 一键直推，支持经典图文排版与小绿书图片消息。',
    creatorUrl: 'https://mp.weixin.qq.com',
  },
  {
    id: 'zhihu',
    name: '知乎专栏',
    badge: '深度长文',
    badgeColor: 'bg-blue-950/70 border-blue-800 text-blue-300',
    icon: '🔵',
    description: '适配知乎编辑器排版规范，自动优化标题层级、引用块及公式语法。',
    creatorUrl: 'https://zhuanlan.zhihu.com/write',
  },
  {
    id: 'juejin',
    name: '稀土掘金',
    badge: '技术专栏',
    badgeColor: 'bg-sky-950/70 border-sky-800 text-sky-300',
    icon: '🔷',
    description: '规范化掘金 Front-Matter (theme/highlight)，适配程序员与工程师技术社区。',
    creatorUrl: 'https://juejin.cn/editor/drafts/new',
  },
  {
    id: 'csdn',
    name: 'CSDN 博客',
    badge: '技术教程',
    badgeColor: 'bg-amber-950/70 border-amber-800 text-amber-300',
    icon: '🔴',
    description: '追加 @[TOC] 目录导航与开源版权申明，代码块高保真格式化。',
    creatorUrl: 'https://mp.csdn.net/mp_blog/creation/editor',
  },
  {
    id: 'xiaohongshu',
    name: '小红书贴图',
    badge: '九宫格卡片',
    badgeColor: 'bg-rose-950/70 border-rose-800 text-rose-300',
    icon: '📕',
    description: '提纯干货要点文案，搭配 Emoji 排版与热门 #话题标签，萃取 1~9 张配图卡片。',
    creatorUrl: 'https://creator.xiaohongshu.com',
  },
];

export const MatrixPublishModal: React.FC<MatrixPublishModalProps> = ({
  isOpen,
  onClose,
  markdown,
  inlinedHtml,
  metadata,
  onPublishWeChat,
  onCopyWeChatHtml,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('wechat');
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Platform specific options
  const [juejinTheme, setJuejinTheme] = useState('channing-cyan');
  const [csdnIncludeToc, setCsdnIncludeToc] = useState(true);
  const [zhihuIncludeFooter, setZhihuIncludeFooter] = useState(true);
  const [xhsIncludeEmojis, setXhsIncludeEmojis] = useState(true);
  const [customTags, setCustomTags] = useState<string>('自媒体, 前端开发, 效率神器, 写作技巧');

  // Clean pure content without Front-matter
  const pureMarkdown = useMemo(() => {
    return (markdown || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
  }, [markdown]);

  // Adapted content generators
  const adaptedContent = useMemo(() => {
    // 1. Zhihu version
    const zhihuHeader = `# ${metadata?.title || ''}\n\n> 作者：${metadata?.author || '专栏作家'}\n> 摘要：${metadata?.digest || '欢迎阅读深度专栏分享'}\n\n`;
    const zhihuFooter = zhihuIncludeFooter
      ? `\n\n---\n*本文首发于微信公众号与知乎专栏，未经允许禁止非法转载。*`
      : '';
    const zhihuMd = `${zhihuHeader}${pureMarkdown}${zhihuFooter}`;

    // 2. Juejin version (Standard Front-Matter)
    const juejinFm = [
      '---',
      `title: ${metadata?.title || ''}`,
      `theme: ${juejinTheme}`,
      'highlight: github',
      '---',
      '',
      `> 导读：${metadata?.digest || '本篇技术深度实战分享。'}`,
      '',
    ].join('\n');
    const juejinMd = `${juejinFm}\n${pureMarkdown}`;

    // 3. CSDN version
    const csdnToc = csdnIncludeToc ? `@[TOC](文章目录)\n\n---\n\n` : '';
    const csdnFooter = `\n\n---\n### 版权声明\n- 本文作者：${metadata?.author || '开发者'}\n- 原创文章，转载请注明出处。`;
    const csdnMd = `# ${metadata?.title || ''}\n\n${csdnToc}${pureMarkdown}${csdnFooter}`;

    // 4. Xiaohongshu text & tags
    const emojiMap: Record<number, string> = { 0: '✨', 1: '💡', 2: '🚀', 3: '📌', 4: '🔥', 5: '🎯' };
    const paragraphs = pureMarkdown
      .replace(/^#+\s+.*$/gm, '') // Remove Markdown headers for casual card reading
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const xhsBody = paragraphs
      .slice(0, 8)
      .map((p, i) => (xhsIncludeEmojis ? `${emojiMap[i % 6] || '👉'} ${p}` : p))
      .join('\n\n');

    const tagsArray = customTags
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const xhsFinalText = [
      `🌟 ${metadata?.title || ''}`,
      '',
      xhsBody,
      '',
      '💬 欢迎在评论区交流讨论～别忘了双击点赞收藏防走丢！',
      '',
      tagsArray.join(' '),
    ].join('\n');

    return {
      wechat: inlinedHtml,
      zhihu: zhihuMd,
      juejin: juejinMd,
      csdn: csdnMd,
      xiaohongshu: xhsFinalText,
    };
  }, [pureMarkdown, inlinedHtml, metadata, juejinTheme, csdnIncludeToc, zhihuIncludeFooter, xhsIncludeEmojis, customTags]);

  const handleCopyPlatform = (platform: PlatformType, isHtml = false) => {
    if (platform === 'wechat' && isHtml) {
      onCopyWeChatHtml();
    } else {
      navigator.clipboard.writeText(adaptedContent[platform]);
    }
    setCopiedMap((prev) => ({ ...prev, [platform]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [platform]: false }));
    }, 2500);
  };

  const currentPlatformInfo = PLATFORMS.find((p) => p.id === selectedPlatform)!;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">多平台一键分发矩阵</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-amber-950 to-rose-950 border border-amber-800/80 text-amber-300 font-medium">
                  5 大核心渠道适配
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                同一份 Markdown 智能适配微信公众号、知乎专栏、稀土掘金、CSDN 及小红书贴图
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Platform Selector Grid */}
        <div className="p-4 bg-neutral-950/70 border-b border-neutral-800 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {PLATFORMS.map((p) => {
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-850 border-amber-500/80 ring-1 ring-amber-500/40 text-neutral-100'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-base">{p.icon}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                  <div className="font-semibold text-xs mt-1">{p.name}</div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">{p.id}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          {/* Left Column: Platform Specific Tuning & Controls (5 cols) */}
          <div className="lg:col-span-5 p-5 space-y-4 overflow-y-auto">
            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span className="text-base">{currentPlatformInfo.icon}</span>
                  {currentPlatformInfo.name} 分发说明
                </div>
                <a
                  href={currentPlatformInfo.creatorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                >
                  打开创作者后台 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {currentPlatformInfo.description}
              </p>
            </div>

            {/* Platform Tuning Options */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                平台专属格式调优
              </div>

              {/* WeChat Specific Tuning */}
              {selectedPlatform === 'wechat' && (
                <div className="space-y-2.5 text-xs text-neutral-300 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">推送目标模式:</span>
                    <span className="text-emerald-400 font-medium font-mono">官方草稿箱 API (draft/add)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">样式内联模式:</span>
                    <span className="text-neutral-200">Juice 100% 深度内联 (带极限压缩)</span>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => handleCopyPlatform('wechat', true)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                    >
                      {copiedMap.wechat ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      一键复制微信排版富文本 (直接粘贴至微信公众号后台)
                    </button>
                    <button
                      onClick={() => onPublishWeChat(false)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      直连官方 API 推送草稿箱
                    </button>
                  </div>
                </div>
              )}

              {/* Zhihu Specific Tuning */}
              {selectedPlatform === 'zhihu' && (
                <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                  <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zhihuIncludeFooter}
                      onChange={(e) => setZhihuIncludeFooter(e.target.checked)}
                      className="rounded accent-blue-500"
                    />
                    <span>在文章末尾附加首发与版权说明</span>
                  </label>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    知乎专栏支持原生 Markdown 导入。复制后进入知乎创作中心，在编辑器菜单点击「导入 Markdown」或直接粘贴即可。
                  </p>
                  <button
                    onClick={() => handleCopyPlatform('zhihu')}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    {copiedMap.zhihu ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    一键复制知乎专栏适配版 Markdown
                  </button>
                </div>
              )}

              {/* Juejin Specific Tuning */}
              {selectedPlatform === 'juejin' && (
                <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                  <div>
                    <label className="block text-neutral-400 mb-1">掘金内置排版主题 (theme)</label>
                    <select
                      value={juejinTheme}
                      onChange={(e) => setJuejinTheme(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="channing-cyan">channing-cyan (青碧绿·推荐)</option>
                      <option value="juejin">juejin (掘金官方经典主题)</option>
                      <option value="condensed-night">condensed-night (暗夜极客)</option>
                      <option value="mk-cute">mk-cute (元气橙意)</option>
                      <option value="v-green">v-green (Vue 清新绿)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    掘金原生解析 Front-Matter 中的 <code>theme</code> 与 <code>highlight</code> 配置，粘贴至掘金编辑器后可自动套用相应高亮与排版。
                  </p>
                  <button
                    onClick={() => handleCopyPlatform('juejin')}
                    className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    {copiedMap.juejin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    一键复制掘金技术文章标准 Markdown
                  </button>
                </div>
              )}

              {/* CSDN Specific Tuning */}
              {selectedPlatform === 'csdn' && (
                <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                  <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={csdnIncludeToc}
                      onChange={(e) => setCsdnIncludeToc(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>在文首自动注入 @[TOC](文章目录)</span>
                  </label>
                  <button
                    onClick={() => handleCopyPlatform('csdn')}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    {copiedMap.csdn ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    一键复制 CSDN 博客标准 Markdown
                  </button>
                </div>
              )}

              {/* Xiaohongshu Specific Tuning */}
              {selectedPlatform === 'xiaohongshu' && (
                <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                  <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={xhsIncludeEmojis}
                      onChange={(e) => setXhsIncludeEmojis(e.target.checked)}
                      className="rounded accent-rose-500"
                    />
                    <span>添加小红书专属 Emoji 视觉小图标</span>
                  </label>

                  <div>
                    <label className="block text-neutral-400 mb-1">小红书热门 #话题标签</label>
                    <input
                      type="text"
                      value={customTags}
                      onChange={(e) => setCustomTags(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs focus:outline-none focus:border-rose-500"
                      placeholder="自媒体, 效率工具, 读书笔记"
                    />
                  </div>

                  <button
                    onClick={() => handleCopyPlatform('xiaohongshu')}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    {copiedMap.xiaohongshu ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    一键复制小红书文案与话题标签
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Platform Real-Time Adaptation Preview (7 cols) */}
          <div className="lg:col-span-7 p-5 bg-neutral-950 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                {currentPlatformInfo.name} 专属适配效果预览
              </div>
              <button
                onClick={() => handleCopyPlatform(selectedPlatform, selectedPlatform === 'wechat')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition font-medium"
              >
                {copiedMap[selectedPlatform] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedMap[selectedPlatform] ? '已复制' : '复制此平台内容'}
              </button>
            </div>

            {/* Preview Box */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-900/90 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
              {adaptedContent[selectedPlatform]}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-neutral-400">
            已就绪 5 款主流平台格式，无需重新排版，支持多渠道无缝同步分发。
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
