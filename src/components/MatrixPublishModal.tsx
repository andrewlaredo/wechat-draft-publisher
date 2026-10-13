import React, { useState, useMemo, useEffect } from 'react';
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
  Download,
  ListChecks,
  CheckSquare,
  Square,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';

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

export type PlatformType =
  | 'wechat'
  | 'zhihu'
  | 'juejin'
  | 'csdn'
  | 'xiaohongshu'
  | 'toutiao'
  | 'jianshu'
  | 'cnblogs'
  | 'weibo';

export type PublishStatus = 'pending' | 'draft' | 'published';

interface PlatformConfig {
  id: PlatformType;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  category: 'social' | 'tech' | 'news' | 'community';
  description: string;
  creatorUrl: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'wechat',
    name: '微信公众号',
    badge: '图文/贴图',
    badgeColor: 'bg-emerald-950/70 border-emerald-800 text-emerald-300',
    icon: '🟢',
    category: 'social',
    description: '通过官方草稿箱 API 一键直推，支持经典图文 Juice 100% 深度内联与小绿书图片消息。',
    creatorUrl: 'https://mp.weixin.qq.com',
  },
  {
    id: 'zhihu',
    name: '知乎专栏',
    badge: '深度长文',
    badgeColor: 'bg-blue-950/70 border-blue-800 text-blue-300',
    icon: '🔵',
    category: 'community',
    description: '适配知乎编辑器排版规范，自动优化标题层级、专栏摘要块及首发版权说明。',
    creatorUrl: 'https://zhuanlan.zhihu.com/write',
  },
  {
    id: 'juejin',
    name: '稀土掘金',
    badge: '技术专栏',
    badgeColor: 'bg-sky-950/70 border-sky-800 text-sky-300',
    icon: '🔷',
    category: 'tech',
    description: '规范化掘金 Front-Matter (theme/highlight) 头配置，无缝匹配技术社区高亮规范。',
    creatorUrl: 'https://juejin.cn/editor/drafts/new',
  },
  {
    id: 'csdn',
    name: 'CSDN 博客',
    badge: '技术教程',
    badgeColor: 'bg-amber-950/70 border-amber-800 text-amber-300',
    icon: '🔴',
    category: 'tech',
    description: '追加 @[TOC](文章目录) 导航标记与原创版权声明，代码块高保真格式化。',
    creatorUrl: 'https://mp.csdn.net/mp_blog/creation/editor',
  },
  {
    id: 'xiaohongshu',
    name: '小红书贴图',
    badge: '九宫格卡片',
    badgeColor: 'bg-rose-950/70 border-rose-800 text-rose-300',
    icon: '📕',
    category: 'social',
    description: '提纯干货要点文案，搭配 Emoji 视效排版与热门 #话题标签，适配卡片流阅读。',
    creatorUrl: 'https://creator.xiaohongshu.com',
  },
  {
    id: 'toutiao',
    name: '今日头条',
    badge: '微头条/资讯',
    badgeColor: 'bg-red-950/70 border-red-800 text-red-300',
    icon: '📰',
    category: 'news',
    description: '自动提炼引人入胜的导语，智能过滤站外链接防止平台限流，结尾追加读者互动议题。',
    creatorUrl: 'https://mp.toutiao.com',
  },
  {
    id: 'jianshu',
    name: '简书',
    badge: '文艺随笔',
    badgeColor: 'bg-orange-950/70 border-orange-800 text-orange-300',
    icon: '📙',
    category: 'community',
    description: '标准纯净 Markdown 排版，移除复杂样式污染，保留优雅引用与文末作者专栏互动。',
    creatorUrl: 'https://www.jianshu.com/writer',
  },
  {
    id: 'cnblogs',
    name: '博客园',
    badge: '极客技术',
    badgeColor: 'bg-slate-950/70 border-slate-700 text-slate-300',
    icon: '💻',
    category: 'tech',
    description: '经典的博客园 Markdown 语法兼容，保留清晰的代码引用与技术分类标签。',
    creatorUrl: 'https://i.cnblogs.com/posts/edit',
  },
  {
    id: 'weibo',
    name: '微博长文',
    badge: '社交动态',
    badgeColor: 'bg-yellow-950/70 border-yellow-800 text-yellow-300',
    icon: '🟡',
    category: 'social',
    description: '精炼观点浓缩至适读字数，带 #话题# 标签与引流短链，适合快节奏社交传播。',
    creatorUrl: 'https://weibo.com',
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
  const [activeTab, setActiveTab] = useState<'content' | 'checklist' | 'assets'>('content');
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Platform specific tuning options
  const [juejinTheme, setJuejinTheme] = useState('channing-cyan');
  const [csdnIncludeToc, setCsdnIncludeToc] = useState(true);
  const [zhihuIncludeFooter, setZhihuIncludeFooter] = useState(true);
  const [xhsIncludeEmojis, setXhsIncludeEmojis] = useState(true);
  const [toutiaoFilterExternalLinks, setToutiaoFilterExternalLinks] = useState(true);
  const [customTags, setCustomTags] = useState<string>('自媒体, 前端开发, 效率神器, 写作技巧');

  // Checklist state stored per article title hash
  const articleKey = useMemo(() => {
    return `matrix_status_${(metadata.title || 'untitled').slice(0, 20)}`;
  }, [metadata.title]);

  const [platformStatus, setPlatformStatus] = useState<Record<PlatformType, PublishStatus>>(() => {
    try {
      const saved = localStorage.getItem(articleKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      wechat: 'pending',
      zhihu: 'pending',
      juejin: 'pending',
      csdn: 'pending',
      xiaohongshu: 'pending',
      toutiao: 'pending',
      jianshu: 'pending',
      cnblogs: 'pending',
      weibo: 'pending',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(articleKey, JSON.stringify(platformStatus));
    } catch {}
  }, [articleKey, platformStatus]);

  const updateStatus = (platform: PlatformType, status: PublishStatus) => {
    setPlatformStatus((prev) => ({ ...prev, [platform]: status }));
  };

  // Clean pure markdown without Front-matter
  const pureMarkdown = useMemo(() => {
    return (markdown || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
  }, [markdown]);

  // Adapted content generators for all 9 platforms
  const adaptedContent = useMemo(() => {
    const title = metadata?.title || '未命名文章';
    const author = metadata?.author || '创作者';
    const digest = metadata?.digest || '精彩内容分享';

    // 1. Zhihu version
    const zhihuHeader = `# ${title}\n\n> 作者：${author}\n> 摘要：${digest}\n\n`;
    const zhihuFooter = zhihuIncludeFooter
      ? `\n\n---\n*本文首发于微信公众号与知乎专栏，未经允许禁止非法转载。*`
      : '';
    const zhihuMd = `${zhihuHeader}${pureMarkdown}${zhihuFooter}`;

    // 2. Juejin version
    const juejinFm = [
      '---',
      `title: ${title}`,
      `theme: ${juejinTheme}`,
      'highlight: github',
      '---',
      '',
      `> 导读：${digest}`,
      '',
    ].join('\n');
    const juejinMd = `${juejinFm}\n${pureMarkdown}`;

    // 3. CSDN version
    const csdnToc = csdnIncludeToc ? `@[TOC](文章目录)\n\n---\n\n` : '';
    const csdnFooter = `\n\n---\n### 版权声明\n- 本文作者：${author}\n- 原创文章，转载请注明出处与作者信息。`;
    const csdnMd = `# ${title}\n\n${csdnToc}${pureMarkdown}${csdnFooter}`;

    // 4. Xiaohongshu text & tags
    const emojiMap: Record<number, string> = { 0: '✨', 1: '💡', 2: '🚀', 3: '📌', 4: '🔥', 5: '🎯', 6: '🌟', 7: '📝' };
    const paragraphs = pureMarkdown
      .replace(/^#+\s+.*$/gm, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const xhsBody = paragraphs
      .slice(0, 8)
      .map((p, i) => (xhsIncludeEmojis ? `${emojiMap[i % 8] || '👉'} ${p}` : p))
      .join('\n\n');

    const tagsArray = customTags
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const xhsFinalText = [
      `🌟 ${title}`,
      '',
      xhsBody,
      '',
      '💬 欢迎在评论区交流讨论～别忘了双击点赞收藏防走丢！',
      '',
      tagsArray.join(' '),
    ].join('\n');

    // 5. Toutiao version
    let toutiaoBody = pureMarkdown;
    if (toutiaoFilterExternalLinks) {
      toutiaoBody = toutiaoBody.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');
    }
    const toutiaoMd = [
      `# ${title}`,
      '',
      `> 💡【编者导语】：${digest}`,
      '',
      toutiaoBody,
      '',
      '---',
      `📌 你对此有哪些独到看法？欢迎在评论区发表你的观点！`,
      '',
      tagsArray.map((t) => `#${t.replace(/^#/, '')}#`).join(' '),
    ].join('\n');

    // 6. Jianshu version
    const jianshuMd = [
      `# ${title}`,
      '',
      `*文 / ${author}*`,
      '',
      pureMarkdown,
      '',
      '---',
      `*如果你觉得有收获，欢迎关注作者专栏，点赞鼓励支持！*`,
    ].join('\n');

    // 7. Cnblogs version
    const cnblogsMd = [
      `# ${title}`,
      '',
      `**摘要：** ${digest}`,
      '',
      pureMarkdown,
      '',
      '---',
      `*Posted by ${author} | 欢迎交流探讨*`,
    ].join('\n');

    // 8. Weibo dynamic text
    const weiboText = [
      `【${title}】`,
      '',
      paragraphs.slice(0, 3).join('\n\n'),
      '',
      `💡 核心摘要：${digest}`,
      '',
      `👉 完整深度图文长文已同步发布，欢迎交流！`,
      '',
      tagsArray.map((t) => `#${t.replace(/^#/, '')}#`).join(' '),
    ].join('\n');

    return {
      wechat: inlinedHtml,
      zhihu: zhihuMd,
      juejin: juejinMd,
      csdn: csdnMd,
      xiaohongshu: xhsFinalText,
      toutiao: toutiaoMd,
      jianshu: jianshuMd,
      cnblogs: cnblogsMd,
      weibo: weiboText,
    };
  }, [
    pureMarkdown,
    inlinedHtml,
    metadata,
    juejinTheme,
    csdnIncludeToc,
    zhihuIncludeFooter,
    xhsIncludeEmojis,
    toutiaoFilterExternalLinks,
    customTags,
  ]);

  const handleCopyPlatform = (platform: PlatformType, isHtml = false) => {
    if (platform === 'wechat' && isHtml) {
      onCopyWeChatHtml();
    } else {
      navigator.clipboard.writeText(adaptedContent[platform]);
    }
    setCopiedMap((prev) => ({ ...prev, [platform]: true }));
    updateStatus(platform, 'draft');
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [platform]: false }));
    }, 2500);
  };

  // Download single platform markdown
  const handleDownloadPlatformMarkdown = (platform: PlatformType) => {
    const content = adaptedContent[platform];
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title || 'article'}-${platform}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy full matrix distribution checklist
  const handleCopyMatrixChecklist = () => {
    const list = PLATFORMS.map((p) => {
      const statusText =
        platformStatus[p.id] === 'published'
          ? '【已正式发布】'
          : platformStatus[p.id] === 'draft'
          ? '【已存草稿】'
          : '【待分发】';
      return `- ${p.icon} ${p.name} (${p.badge}): ${statusText}\n  后台地址: ${p.creatorUrl}`;
    }).join('\n');

    const summary = [
      `📋 全网多平台矩阵分发运营清单`,
      `文章标题: 《${metadata.title || '未命名'}》`,
      `发布时间: ${new Date().toLocaleDateString()}`,
      `作者署名: ${metadata.author || '未署名'}`,
      '',
      list,
    ].join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedMap((prev) => ({ ...prev, checklist: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, checklist: false }));
    }, 2500);
  };

  // Calculated progress
  const publishedCount = Object.values(platformStatus).filter((s) => s === 'published').length;
  const draftCount = Object.values(platformStatus).filter((s) => s === 'draft').length;
  const totalPlatforms = PLATFORMS.length;

  const currentPlatformInfo = PLATFORMS.find((p) => p.id === selectedPlatform)!;

  // Extracted images list
  const articleImages = useMemo(() => {
    const urls: string[] = [];
    if (metadata.cover) urls.push(metadata.cover);
    if (metadata.images && Array.isArray(metadata.images)) {
      urls.push(...metadata.images);
    }
    const mdMatches = markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);
    for (const m of mdMatches) {
      if (m[2] && !urls.includes(m[2])) urls.push(m[2]);
    }
    return Array.from(new Set(urls));
  }, [markdown, metadata]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">多平台内容矩阵分发中心</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-amber-950 to-rose-950 border border-amber-800/80 text-amber-300 font-medium">
                  {totalPlatforms} 大核心渠道矩阵
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                一次编写，智能自适应公众号、知乎、掘金、CSDN、小红书、头条、简书、博客园与微博
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Top Mode Tabs */}
            <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs mr-2">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  activeTab === 'content'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                平台适配文案
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'checklist'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 text-amber-400" />
                分发打卡追踪 ({publishedCount + draftCount}/{totalPlatforms})
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'assets'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                配图物料包 ({articleImages.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Content Adaptation Mode */}
        {activeTab === 'content' && (
          <>
            {/* Platform Selector Grid */}
            <div className="p-3 bg-neutral-950/80 border-b border-neutral-800 flex-shrink-0">
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                {PLATFORMS.map((p) => {
                  const isSelected = selectedPlatform === p.id;
                  const currentSt = platformStatus[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`p-2 rounded-xl border text-left transition flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-neutral-850 border-amber-500/80 ring-1 ring-amber-500/40 text-neutral-100 shadow-sm'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-base">{p.icon}</span>
                        {currentSt === 'published' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="已正式发布" />
                        )}
                        {currentSt === 'draft' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="已存草稿" />
                        )}
                      </div>
                      <div className="font-semibold text-xs leading-tight truncate">{p.name}</div>
                      <span className={`text-[9px] mt-1 px-1 py-0.2 rounded border font-medium truncate ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
              {/* Left Column: Platform Specific Tuning & Actions (5 cols) */}
              <div className="lg:col-span-5 p-4 space-y-4 overflow-y-auto">
                <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span className="text-base">{currentPlatformInfo.icon}</span>
                      {currentPlatformInfo.name} 专属特性
                    </div>
                    <a
                      href={currentPlatformInfo.creatorUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                    >
                      进入创作者后台 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {currentPlatformInfo.description}
                  </p>
                </div>

                {/* Status Toggle for Selected Platform */}
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">当前渠道分发进度:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateStatus(selectedPlatform, 'pending')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                        platformStatus[selectedPlatform] === 'pending'
                          ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                          : 'text-neutral-500 hover:text-neutral-400'
                      }`}
                    >
                      未分发
                    </button>
                    <button
                      onClick={() => updateStatus(selectedPlatform, 'draft')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                        platformStatus[selectedPlatform] === 'draft'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'text-neutral-500 hover:text-neutral-400'
                      }`}
                    >
                      已存草稿
                    </button>
                    <button
                      onClick={() => updateStatus(selectedPlatform, 'published')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                        platformStatus[selectedPlatform] === 'published'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'text-neutral-500 hover:text-neutral-400'
                      }`}
                    >
                      已发布
                    </button>
                  </div>
                </div>

                {/* Platform Tuning Options */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    定制格式优化选项
                  </div>

                  {/* WeChat Specific Tuning */}
                  {selectedPlatform === 'wechat' && (
                    <div className="space-y-2.5 text-xs text-neutral-300 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">推送通道:</span>
                        <span className="text-emerald-400 font-medium font-mono">官方草稿箱 API (draft/add)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">排版引擎:</span>
                        <span className="text-neutral-200">Juice 深度内联 (带 CSS 压缩)</span>
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={() => handleCopyPlatform('wechat', true)}
                          className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                        >
                          {copiedMap.wechat ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          复制微信排版富文本 (直接粘贴至公众号后台)
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
                        <span>在文章末尾附加首发与原创版权说明</span>
                      </label>
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

                  {/* Toutiao Specific Tuning */}
                  {selectedPlatform === 'toutiao' && (
                    <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                      <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={toutiaoFilterExternalLinks}
                          onChange={(e) => setToutiaoFilterExternalLinks(e.target.checked)}
                          className="rounded accent-red-500"
                        />
                        <span>自动过滤外链为纯文本 (防止头条号限流与违规)</span>
                      </label>
                      <button
                        onClick={() => handleCopyPlatform('toutiao')}
                        className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                      >
                        {copiedMap.toutiao ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        一键复制今日头条适配 Markdown
                      </button>
                    </div>
                  )}

                  {/* Jianshu Tuning */}
                  {selectedPlatform === 'jianshu' && (
                    <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                      <p className="text-[11px] text-neutral-400">
                        简书支持标准 Markdown 语法，复制后可在简书创作后台直接粘贴发布。
                      </p>
                      <button
                        onClick={() => handleCopyPlatform('jianshu')}
                        className="w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                      >
                        {copiedMap.jianshu ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        一键复制简书标准 Markdown
                      </button>
                    </div>
                  )}

                  {/* Cnblogs Tuning */}
                  {selectedPlatform === 'cnblogs' && (
                    <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                      <p className="text-[11px] text-neutral-400">
                        博客园 Markdown 模式支持代码高亮与摘要提示，适配技术分享。
                      </p>
                      <button
                        onClick={() => handleCopyPlatform('cnblogs')}
                        className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                      >
                        {copiedMap.cnblogs ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        一键复制博客园 Markdown
                      </button>
                    </div>
                  )}

                  {/* Weibo Tuning */}
                  {selectedPlatform === 'weibo' && (
                    <div className="space-y-3 text-xs bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                      <p className="text-[11px] text-neutral-400">
                        浓缩文章前3段与核心摘要，带 #话题# 标签，适合微博信息流阅读。
                      </p>
                      <button
                        onClick={() => handleCopyPlatform('weibo')}
                        className="w-full py-2 px-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                      >
                        {copiedMap.weibo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        一键复制微博精简动态文案
                      </button>
                    </div>
                  )}

                  {/* Quick Action: Download this platform file */}
                  <button
                    onClick={() => handleDownloadPlatformMarkdown(selectedPlatform)}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700 flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
                    下载此平台适配文件 ({selectedPlatform}.md)
                  </button>
                </div>
              </div>

              {/* Right Column: Platform Real-Time Adaptation Preview (7 cols) */}
              <div className="lg:col-span-7 p-4 bg-neutral-950 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    {currentPlatformInfo.name} 专属效果预览
                  </div>
                  <button
                    onClick={() => handleCopyPlatform(selectedPlatform, selectedPlatform === 'wechat')}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition font-medium"
                  >
                    {copiedMap[selectedPlatform] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedMap[selectedPlatform] ? '已复制' : '复制当前平台内容'}
                  </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-neutral-900/90 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
                  {adaptedContent[selectedPlatform]}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Checklist & Progress Track Mode */}
        {activeTab === 'checklist' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-950">
            {/* Progress Banner */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <span>全网分发矩阵完成度</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
                    {Math.round(((publishedCount + draftCount) / totalPlatforms) * 100)}% 就绪
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  已发布: {publishedCount} 个渠道 | 已存草稿: {draftCount} 个渠道 | 待分发: {totalPlatforms - publishedCount - draftCount} 个渠道
                </p>
              </div>

              <button
                onClick={handleCopyMatrixChecklist}
                className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-2 transition shadow-sm"
              >
                {copiedMap.checklist ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                一键复制全网分发排期清单 (飞书 / Notion / 运营打卡)
              </button>
            </div>

            {/* Checklist Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PLATFORMS.map((p) => {
                const status = platformStatus[p.id];
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{p.icon}</span>
                        <div>
                          <div className="font-semibold text-xs text-neutral-200">{p.name}</div>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>
                      </div>

                      <a
                        href={p.creatorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                      >
                        后台 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Status Pill Switcher */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                      <span className="text-[11px] text-neutral-500">分发状态:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(p.id, 'pending')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                            status === 'pending'
                              ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                              : 'text-neutral-500 hover:text-neutral-400'
                          }`}
                        >
                          未分发
                        </button>
                        <button
                          onClick={() => updateStatus(p.id, 'draft')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                            status === 'draft'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'text-neutral-500 hover:text-neutral-400'
                          }`}
                        >
                          已存草稿
                        </button>
                        <button
                          onClick={() => updateStatus(p.id, 'published')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                            status === 'published'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'text-neutral-500 hover:text-neutral-400'
                          }`}
                        >
                          已发布
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleCopyPlatform(p.id, p.id === 'wechat')}
                        className="flex-1 py-1 px-2 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedMap[p.id] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedMap[p.id] ? '已复制' : '复制文案'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Media Asset Center */}
        {activeTab === 'assets' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-neutral-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  当前文章配图资产库 ({articleImages.length} 张配图)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  方便跨平台发布时直接取用封面图与九宫格插图
                </p>
              </div>
            </div>

            {articleImages.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
                当前文章未插入任何图片或封面。
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {articleImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between group space-y-2"
                  >
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-neutral-950 flex items-center justify-center relative">
                      <img
                        src={imgUrl}
                        alt={`配图 ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] rounded bg-black/70 text-white font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 truncate font-mono">
                      {imgUrl.split('/').pop()?.slice(0, 25) || `配图-${idx + 1}`}
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(imgUrl);
                          setCopiedMap((prev) => ({ ...prev, [imgUrl]: true }));
                          setTimeout(() => {
                            setCopiedMap((prev) => ({ ...prev, [imgUrl]: false }));
                          }, 2000);
                        }}
                        className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                      >
                        {copiedMap[imgUrl] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedMap[imgUrl] ? '已复制' : '复制链接'}
                      </button>
                      <a
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                        title="在新标签页打开原图"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-neutral-400">
            支持 9 大平台一键智能排版转换与状态追踪，彻底打通全域自媒体分发闭环。
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
