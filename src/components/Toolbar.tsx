import React from 'react';
import { Smartphone, Monitor, Code, Sparkles, BookOpen, AlertTriangle, Newspaper, Images } from 'lucide-react';
import { SAMPLE_ARTICLES } from '../data/samples.ts';

interface ToolbarProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  themeEnabled: boolean;
  onToggleThemeEnabled: () => void;
  articleType: 'news' | 'newspic';
  onArticleTypeChange: (type: 'news' | 'newspic') => void;
  macStyle: boolean;
  onToggleMacStyle: () => void;
  viewMode: 'mobile' | 'desktop' | 'html';
  onViewModeChange: (mode: 'mobile' | 'desktop' | 'html') => void;
  onSelectSample: (sampleId: string) => void;
  currentSampleId?: string;
  charCount: number;
  htmlLength?: number;
  digestLength: number;
  lastSaved?: string | null;
}

export const THEME_OPTIONS = [
  { id: 'pie', name: '极客红·探索', color: '#da282a', tag: '推荐·数码' },
  { id: 'orangeheart', name: '暖心橙', color: '#ef7060', tag: '经典·温润' },
  { id: 'lapis', name: '青金石', color: '#4870ac', tag: '学术·静谧' },
  { id: 'phycat', name: '薄荷绿', color: '#10a37f', tag: '护眼·清新' },
  { id: 'tech-blue', name: '极客湛蓝', color: '#1e80ff', tag: '技术·代码' },
  { id: 'medium', name: '素雅黑白', color: '#111827', tag: '现代·质感' },
  { id: 'sakura', name: '浅绛绯红', color: '#e11d48', tag: '文艺·生活' },
  { id: 'warm-paper', name: '暖纸人文', color: '#92400e', tag: '纸书·深度' },
  { id: 'default', name: '清新竹绿', color: '#07c160', tag: '微信官方绿' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTheme,
  onThemeChange,
  themeEnabled,
  onToggleThemeEnabled,
  articleType,
  onArticleTypeChange,
  macStyle,
  onToggleMacStyle,
  viewMode,
  onViewModeChange,
  onSelectSample,
  currentSampleId,
  charCount,
  htmlLength,
  digestLength,
  lastSaved,
}) => {
  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Message Type, Template Picker, Theme Master Switch, & Theme Options */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Message Type Toggle (图文 vs 图片消息/贴图) */}
        <div className="flex items-center bg-neutral-800/90 p-0.5 rounded-lg border border-neutral-700/80 shadow-xs">
          <button
            id="btn-article-type-news"
            type="button"
            onClick={() => onArticleTypeChange('news')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition duration-150 ${
              articleType === 'news'
                ? 'bg-neutral-700 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="微信传统图文消息 (支持富文本排版、代码高亮、内联样式)"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>图文长文</span>
          </button>
          <button
            id="btn-article-type-newspic"
            type="button"
            onClick={() => onArticleTypeChange('newspic')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition duration-150 ${
              articleType === 'newspic'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="微信公众号图片消息 (贴图/小绿书模式：以高清多图轮播为主，辅以简短文案及话题标签)"
          >
            <Images className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">图片消息 (贴图)</span>
            <span className="sm:hidden">图片贴图</span>
          </button>
        </div>

        {/* Sample Articles Picker */}
        <div className="flex items-center space-x-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700/60">
          <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-400">模板:</span>
          <select
            id="select-sample-article"
            onChange={(e) => {
              if (e.target.value) {
                onSelectSample(e.target.value);
              }
            }}
            className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer pr-1"
            value={currentSampleId || ''}
          >
            <option value="" disabled className="bg-neutral-800 text-neutral-400">
              -- 切换预设模板 --
            </option>
            {SAMPLE_ARTICLES.map((s) => (
              <option key={s.id} value={s.id} className="bg-neutral-800 text-neutral-200">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {articleType === 'newspic' ? (
          <div className="flex items-center space-x-2 bg-rose-950/40 text-rose-300 border border-rose-800/50 px-3 py-1 rounded-lg">
            <Images className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px]">小绿书/贴图模式：微信原生多图轮播与纯文字文案，免 HTML 排版</span>
          </div>
        ) : (
          <>
            {/* Theme Switch & Selector Group ("主题需要支持开关：开了在应用") */}
            <div className="flex items-center space-x-1.5 bg-neutral-800/80 p-1 rounded-lg border border-neutral-700/60">
              {/* Master Switch Button */}
              <button
                id="btn-toggle-theme-switch"
                onClick={onToggleThemeEnabled}
                className={`flex items-center space-x-2 px-2.5 py-1 rounded-md transition font-medium ${
                  themeEnabled
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 shadow-sm'
                    : 'bg-neutral-800/90 text-neutral-400 border border-neutral-700/60 hover:text-neutral-200'
                }`}
                title={
                  themeEnabled
                    ? '主题排版已开启 (点击关闭切换为原生极简排版)'
                    : '主题排版已关闭 (点击开启应用精选排版主题)'
                }
              >
                {/* Visual Switch Pill */}
                <span
                  className={`w-6 h-3.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                    themeEnabled ? 'bg-emerald-500' : 'bg-neutral-600'
                  }`}
                >
                  <span
                    className={`bg-white w-2.5 h-2.5 rounded-full shadow-md transform transition-transform duration-200 ${
                      themeEnabled ? 'translate-x-2.5' : 'translate-x-0'
                    }`}
                  />
                </span>
                <span className="text-[11px] whitespace-nowrap">
                  {themeEnabled ? '主题排版: 开' : '主题排版: 关'}
                </span>
              </button>

              {/* Theme Selector (Active only when themeEnabled is true) */}
              {themeEnabled ? (
                <div className="flex items-center space-x-1 pl-1">
                  <span className="text-neutral-400 text-[11px] hidden sm:inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </span>
                  <select
                    id="select-wechat-theme"
                    value={currentTheme}
                    onChange={(e) => onThemeChange(e.target.value)}
                    className="bg-neutral-900 text-neutral-100 border border-neutral-700 rounded-md px-2 py-0.5 text-xs focus:outline-none focus:border-neutral-500 cursor-pointer"
                    title="选择微信文章排版主题 (参考 @wenyan-md/core 规范)"
                  >
                    {THEME_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id} className="bg-neutral-800 text-neutral-200">
                        {t.name} ({t.tag})
                      </option>
                    ))}
                  </select>

                  {/* Quick Theme Badge Indicators */}
                  <div className="hidden xl:flex items-center space-x-1 pl-1">
                    {THEME_OPTIONS.slice(0, 5).map((t) => {
                      const isActive = currentTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => onThemeChange(t.id)}
                          className={`px-1.5 py-0.5 rounded text-[11px] transition flex items-center gap-1 ${
                            isActive
                              ? 'bg-neutral-700 text-white font-medium shadow-xs'
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-750'
                          }`}
                          title={`${t.name} - ${t.tag}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          <span>{t.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 text-neutral-500 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <span>原生极简黑白 (开关已关闭)</span>
                </div>
              )}
            </div>

            {/* Mac Code Header Toggle */}
            <button
              onClick={onToggleMacStyle}
              id="btn-toggle-mac-style"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition ${
                macStyle
                  ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
              title="代码块顶部显示 macOS 红黄绿控制圆点"
            >
              <span className="flex space-x-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              </span>
              <span className="hidden sm:inline">Mac 风格代码</span>
              <span className="sm:hidden">Mac</span>
            </button>
          </>
        )}
      </div>

      {/* Right: Counters & View Mode */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
        {/* Auto-save status badge */}
        {lastSaved && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 text-[11px]"
            title="草稿已实时自动保存在本地，刷新不丢失"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">已保存 {lastSaved}</span>
            <span className="sm:hidden">{lastSaved}</span>
          </div>
        )}

        {/* Word count */}
        <div className="text-neutral-400 px-2 py-0.5 rounded bg-neutral-800/60 border border-neutral-800 text-[11px] sm:text-xs">
          <span className="hidden sm:inline">正文字数: </span>
          <span className="sm:hidden">字数: </span>
          <strong className="text-neutral-200 font-semibold">{charCount}</strong>
        </div>

        {/* WeChat HTML 20k limit guard */}
        {typeof htmlLength === 'number' && htmlLength > 0 && articleType !== 'newspic' && (
          <div
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] sm:text-xs ${
              htmlLength > 20000
                ? 'bg-red-950/60 text-red-300 border-red-800'
                : htmlLength > 16000
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-neutral-800/60 text-neutral-400 border-neutral-800'
            }`}
            title="微信公众平台正文内联 HTML 上限为 20,000 字符。超过可能导致发布失败。"
          >
            {htmlLength > 20000 && <AlertTriangle className="w-3 h-3 text-red-400" />}
            <span>HTML: </span>
            <strong className={htmlLength > 20000 ? 'text-red-300' : 'text-neutral-200'}>
              {htmlLength > 1000 ? `${(htmlLength / 1000).toFixed(1)}k` : htmlLength}/20k
            </strong>
          </div>
        )}

        {/* Digest limit warning indicator */}
        <div
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] sm:text-xs ${
            digestLength > 120
              ? 'bg-red-950/60 text-red-300 border-red-800'
              : digestLength > 100
              ? 'bg-amber-950/60 text-amber-300 border-amber-800'
              : 'bg-neutral-800/60 text-neutral-400 border-neutral-800'
          }`}
          title="微信官方草稿箱规定摘要最多 120 字符"
        >
          {digestLength > 120 && <AlertTriangle className="w-3 h-3 text-red-400" />}
          <span className="hidden sm:inline">摘要字数: </span>
          <span className="sm:hidden">摘要: </span>
          <strong className={digestLength > 120 ? 'text-red-300' : 'text-neutral-200'}>
            {digestLength}/120
          </strong>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700/60">
          <button
            onClick={() => onViewModeChange('mobile')}
            id="btn-view-mobile"
            className={`p-1.5 rounded-md transition ${
              viewMode === 'mobile'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="微信手机端效果模拟"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('desktop')}
            id="btn-view-desktop"
            className={`p-1.5 rounded-md transition ${
              viewMode === 'desktop'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="电脑端/宽屏效果预览"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('html')}
            id="btn-view-html"
            className={`p-1.5 rounded-md transition ${
              viewMode === 'html'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="查看全量内联 HTML 源码"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
