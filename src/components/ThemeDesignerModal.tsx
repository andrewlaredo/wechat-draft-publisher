import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Palette,
  Type,
  Code2,
  Download,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Trash2,
  Copy,
  Layers,
  Eye,
} from 'lucide-react';
import {
  ThemeConfig,
  WECHAT_THEMES,
  getCustomThemes,
  saveCustomTheme,
  deleteCustomTheme,
  generateThemeCss,
} from '../markdown/style.ts';

interface ThemeDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onApplyTheme: (themeConfig: ThemeConfig) => void;
}

const DEFAULT_STARTER_THEME: ThemeConfig = {
  name: 'my-custom-theme',
  label: '我的专属定制主题',
  description: '个性化定制色彩与舒适排版',
  primaryColor: '#da282a',
  secondaryColor: '#fff2f0',
  accentColor: '#f27f79',
  textColor: '#2b2b2b',
  mutedTextColor: '#8c8c8c',
  bgColor: '#ffffff',
  cardBg: '#fafafa',
  borderColor: '#ffd8d6',
  codeBg: '#282c34',
  codeColor: '#abb2bf',
  headerStyle: 'pie',
  fontSize: 16,
  lineHeight: 1.8,
  letterSpacing: 0.5,
  paragraphSpacing: 16,
  customCss: '/* 可在此添加自定义 CSS 规则，将直接内联到微信文章元素中 */\nblockquote {\n  border-radius: 4px;\n}',
  isCustom: true,
};

export const ThemeDesignerModal: React.FC<ThemeDesignerModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onApplyTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'custom-css' | 'manage'>('colors');
  const [customThemesList, setCustomThemesList] = useState<Record<string, ThemeConfig>>({});
  const [editingTheme, setEditingTheme] = useState<ThemeConfig>(DEFAULT_STARTER_THEME);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load existing custom themes on mount/open
  useEffect(() => {
    if (isOpen) {
      const stored = getCustomThemes();
      setCustomThemesList(stored);

      // If current theme is a custom one, load it into editor
      if (stored[currentTheme]) {
        setEditingTheme({ ...stored[currentTheme] });
      } else if (WECHAT_THEMES[currentTheme]) {
        // Base upon current preset
        const base = WECHAT_THEMES[currentTheme];
        setEditingTheme({
          ...DEFAULT_STARTER_THEME,
          ...base,
          name: `custom-${base.name}`,
          label: `定制 · ${base.label}`,
          fontSize: base.fontSize || 16,
          lineHeight: base.lineHeight || 1.8,
          letterSpacing: base.letterSpacing || 0.5,
          paragraphSpacing: base.paragraphSpacing || 16,
          isCustom: true,
        });
      }
    }
  }, [isOpen, currentTheme]);

  // Load a preset template as a base for custom theme
  const handleLoadPresetBase = (presetKey: string) => {
    const base = WECHAT_THEMES[presetKey];
    if (!base) return;
    setEditingTheme((prev) => ({
      ...prev,
      ...base,
      name: prev.name || `custom-${base.name}`,
      label: prev.label || `定制 · ${base.label}`,
      fontSize: prev.fontSize || 16,
      lineHeight: prev.lineHeight || 1.8,
      letterSpacing: prev.letterSpacing || 0.5,
      paragraphSpacing: prev.paragraphSpacing || 16,
      isCustom: true,
    }));
  };

  // Save current editing theme
  const handleSave = () => {
    if (!editingTheme.name.trim()) {
      alert('请输入有效的主题标识名称 (英文/拼音)');
      return;
    }
    const cleanTheme: ThemeConfig = {
      ...editingTheme,
      name: editingTheme.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      label: editingTheme.label.trim() || '未命名自定义主题',
      isCustom: true,
    };

    saveCustomTheme(cleanTheme);
    const updated = getCustomThemes();
    setCustomThemesList(updated);
    onApplyTheme(cleanTheme);

    setSaveStatus('✅ 主题已保存并实时应用！');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Export current theme as JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(editingTheme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${editingTheme.name || 'custom-theme'}.theme.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import theme from JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.primaryColor && json.textColor) {
          const imported: ThemeConfig = {
            ...DEFAULT_STARTER_THEME,
            ...json,
            isCustom: true,
          };
          setEditingTheme(imported);
          setSaveStatus('📥 主题 JSON 导入成功！可继续调整后点击保存应用');
          setTimeout(() => setSaveStatus(null), 3000);
        } else {
          alert('导入失败：该 JSON 文件缺少主题必要字段');
        }
      } catch {
        alert('导入失败：非有效 JSON 格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Delete a custom theme
  const handleDeleteTheme = (name: string) => {
    if (confirm(`确定删除自定义主题「${customThemesList[name]?.label || name}」吗？`)) {
      deleteCustomTheme(name);
      setCustomThemesList(getCustomThemes());
    }
  };

  // Live CSS generation for the mini-preview
  const previewCss = useMemo(() => {
    return generateThemeCss(editingTheme.name, editingTheme);
  }, [editingTheme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">自定义 CSS / 主题设计器</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-950/70 border border-rose-800/80 text-rose-300">
                  视觉与排版定制
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                自由调整色彩体系、字号行高与段落间距，支持导出/导入 JSON 与实时内联到微信文章
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-neutral-800 bg-neutral-950/60 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
                activeTab === 'colors'
                  ? 'border-rose-500 text-rose-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              色彩体系
            </button>
            <button
              onClick={() => setActiveTab('typography')}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
                activeTab === 'typography'
                  ? 'border-rose-500 text-rose-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              版式与字间距
            </button>
            <button
              onClick={() => setActiveTab('custom-css')}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
                activeTab === 'custom-css'
                  ? 'border-rose-500 text-rose-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              高级 CSS 注入
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
                activeTab === 'manage'
                  ? 'border-rose-500 text-rose-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              我的主题库 ({Object.keys(customThemesList).length})
            </button>
          </div>

          {/* Quick preset selector for baseline */}
          <div className="flex items-center space-x-2 pb-2">
            <span className="text-[11px] text-neutral-400 hidden sm:inline">以预设为起点:</span>
            <select
              onChange={(e) => handleLoadPresetBase(e.target.value)}
              defaultValue=""
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="" disabled>选择预置主题基准...</option>
              {Object.entries(WECHAT_THEMES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body: Left Controls, Right Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 p-5 overflow-y-auto space-y-5">
            {/* Basic Info */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                主题基础信息
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">主题中文名称</label>
                  <input
                    type="text"
                    value={editingTheme.label}
                    onChange={(e) => setEditingTheme({ ...editingTheme, label: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                    placeholder="如：极简商务蓝"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">唯一标识 (name, 英文)</label>
                  <input
                    type="text"
                    value={editingTheme.name}
                    onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-rose-500 font-mono"
                    placeholder="如：business-blue"
                  />
                </div>
              </div>
            </div>

            {/* TAB 1: Colors */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-neutral-200">核心色彩体系</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Primary Color */}
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-200 font-medium">主色调 (Primary)</div>
                      <div className="text-[11px] text-neutral-400">大标题底线、强调边框</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTheme.primaryColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, primaryColor: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingTheme.primaryColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, primaryColor: e.target.value })}
                        className="w-20 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-center text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-200 font-medium">强调色 (Accent)</div>
                      <div className="text-[11px] text-neutral-400">二级小标题、重点文字</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTheme.accentColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, accentColor: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingTheme.accentColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, accentColor: e.target.value })}
                        className="w-20 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-center text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Secondary/Tint Color */}
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-200 font-medium">辅助浅底色 (Secondary)</div>
                      <div className="text-[11px] text-neutral-400">引用块背景、高亮浅底</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTheme.secondaryColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, secondaryColor: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingTheme.secondaryColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, secondaryColor: e.target.value })}
                        className="w-20 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-center text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-200 font-medium">正文文字颜色 (Text)</div>
                      <div className="text-[11px] text-neutral-400">段落主要字体颜色</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTheme.textColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, textColor: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingTheme.textColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, textColor: e.target.value })}
                        className="w-20 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-center text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-200 font-medium">页面背景色 (Background)</div>
                      <div className="text-[11px] text-neutral-400">文章总容器底色</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTheme.bgColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, bgColor: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingTheme.bgColor}
                        onChange={(e) => setEditingTheme({ ...editingTheme, bgColor: e.target.value })}
                        className="w-20 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-center text-neutral-200"
                      />
                    </div>
                  </div>

                  {/* Code Block Color */}
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-200 font-medium">代码块底色 (Code Bg)</div>
                      <div className="text-[11px] text-neutral-400">pre/code 容器背景</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTheme.codeBg}
                        onChange={(e) => setEditingTheme({ ...editingTheme, codeBg: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingTheme.codeBg}
                        onChange={(e) => setEditingTheme({ ...editingTheme, codeBg: e.target.value })}
                        className="w-20 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-center text-neutral-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Typography & Spacing */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-neutral-200">排版版式与阅读尺寸</div>

                {/* Header Style */}
                <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2">
                  <label className="text-xs font-medium text-neutral-200">标题装潢风格 (Header Archetype)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { id: 'pie', label: '极客虚线底' },
                      { id: 'border-left', label: '经典左色块' },
                      { id: 'orangeheart', label: '暖心实线底' },
                      { id: 'clean', label: '素雅极简' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setEditingTheme({ ...editingTheme, headerStyle: h.id as any })}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition ${
                          editingTheme.headerStyle === h.id
                            ? 'bg-rose-950/60 border-rose-600 text-rose-300 ring-1 ring-rose-500'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-200">正文字号 (Font Size)</span>
                    <span className="text-rose-400 font-mono font-bold">{editingTheme.fontSize || 16} px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="18"
                    step="0.5"
                    value={editingTheme.fontSize || 16}
                    onChange={(e) => setEditingTheme({ ...editingTheme, fontSize: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>14px (紧凑精简)</span>
                    <span>16px (微信官方黄金标准)</span>
                    <span>18px (大字舒爽)</span>
                  </div>
                </div>

                {/* Line Height */}
                <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-200">行高倍率 (Line Height)</span>
                    <span className="text-rose-400 font-mono font-bold">{editingTheme.lineHeight || 1.8}</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="2.2"
                    step="0.05"
                    value={editingTheme.lineHeight || 1.8}
                    onChange={(e) => setEditingTheme({ ...editingTheme, lineHeight: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>1.5 (紧凑)</span>
                    <span>1.8 (推荐阅读黄金比例)</span>
                    <span>2.2 (宽松呼吸感)</span>
                  </div>
                </div>

                {/* Letter Spacing */}
                <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-200">汉字字间距 (Letter Spacing)</span>
                    <span className="text-rose-400 font-mono font-bold">{editingTheme.letterSpacing ?? 0.5} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.25"
                    value={editingTheme.letterSpacing ?? 0.5}
                    onChange={(e) => setEditingTheme({ ...editingTheme, letterSpacing: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>0px (默认无扩展)</span>
                    <span>0.5px (精致微扩展)</span>
                    <span>2.0px (空灵文艺感)</span>
                  </div>
                </div>

                {/* Paragraph Spacing */}
                <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-200">段落间距 (Paragraph Spacing)</span>
                    <span className="text-rose-400 font-mono font-bold">{editingTheme.paragraphSpacing || 16} px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="28"
                    step="2"
                    value={editingTheme.paragraphSpacing || 16}
                    onChange={(e) => setEditingTheme({ ...editingTheme, paragraphSpacing: parseInt(e.target.value, 10) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>10px (密实)</span>
                    <span>16px (标准)</span>
                    <span>28px (大留白)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Custom Raw CSS */}
            {activeTab === 'custom-css' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-200">高级 CSS 代码注入</div>
                  <span className="text-[11px] text-neutral-400">将由 Juice 深度内联到对应 HTML 标签</span>
                </div>
                <textarea
                  value={editingTheme.customCss || ''}
                  onChange={(e) => setEditingTheme({ ...editingTheme, customCss: e.target.value })}
                  rows={10}
                  className="w-full p-3 bg-neutral-950 font-mono text-xs text-neutral-200 border border-neutral-700 rounded-xl focus:outline-none focus:border-rose-500 leading-relaxed"
                  placeholder="/* 自定义附加 CSS，例如：*/&#10;blockquote { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }&#10;strong { text-decoration: underline wavy; }"
                />
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  提示：支持编写标准的 CSS 选择器规则，如 <code>blockquote</code>、<code>strong</code>、<code>table</code>、<code>h2</code> 等，保存后会自动与微信内联引擎合并。
                </p>
              </div>
            )}

            {/* TAB 4: Manage My Custom Themes */}
            {activeTab === 'manage' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-200">已保存的自定义主题列表</div>
                {Object.keys(customThemesList).length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 bg-neutral-950/40 rounded-xl border border-dashed border-neutral-800">
                    暂无保存的自定义主题。请调整上方参数并点击「保存并应用主题」。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(customThemesList).map(([k, t]) => (
                      <div
                        key={k}
                        className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: t.primaryColor }}
                          />
                          <div>
                            <div className="text-xs font-medium text-neutral-200">{t.label}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">{t.name}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingTheme({ ...t });
                              setActiveTab('colors');
                            }}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition"
                          >
                            载入编辑
                          </button>
                          <button
                            onClick={() => onApplyTheme(t)}
                            className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs transition"
                          >
                            直接应用
                          </button>
                          <button
                            onClick={() => handleDeleteTheme(k)}
                            className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Real-time Live Mini-Preview (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-neutral-950 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                排版实时渲染预览
              </div>
              <span className="text-[10px] text-neutral-500">所见即所得</span>
            </div>

            {/* Embedded Preview Canvas */}
            <div
              className="flex-1 overflow-y-auto p-4 rounded-xl border border-neutral-800 shadow-inner"
              style={{ backgroundColor: editingTheme.bgColor }}
            >
              {/* Dynamic Styled Sample Elements */}
              <div style={{ color: editingTheme.textColor, fontSize: `${editingTheme.fontSize || 16}px`, lineHeight: editingTheme.lineHeight || 1.8, letterSpacing: `${editingTheme.letterSpacing ?? 0.5}px` }}>
                {/* H1 Title */}
                <h1
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#111827',
                    borderBottom: editingTheme.headerStyle === 'pie' ? `2px dashed ${editingTheme.primaryColor}` : `2px solid ${editingTheme.primaryColor}`,
                    paddingBottom: '6px',
                    marginBottom: '14px',
                  }}
                >
                  探索星际文明新纪元
                </h1>

                {/* Paragraph */}
                <p style={{ margin: `${editingTheme.paragraphSpacing || 16}px 0`, textAlign: 'justify' }}>
                  微信公众号的阅读体验始于排版的一呼一吸。借助微距字间距与黄金行高，文字在手机屏幕上呈现如纸本般的温润质感。
                </p>

                {/* H2 Title */}
                <h2
                  style={{
                    fontSize: '17px',
                    fontWeight: 'bold',
                    color: '#111827',
                    borderLeft: `4px solid ${editingTheme.primaryColor}`,
                    paddingLeft: '10px',
                    margin: '18px 0 10px',
                  }}
                >
                  第二代离子跃迁推进器
                </h2>

                {/* Blockquote with secondaryColor */}
                <blockquote
                  style={{
                    margin: '12px 0',
                    padding: '10px 14px',
                    backgroundColor: editingTheme.secondaryColor,
                    borderLeft: `4px solid ${editingTheme.primaryColor}`,
                    borderRadius: '0 6px 6px 0',
                    color: '#4b5563',
                    fontSize: '14px',
                  }}
                >
                  「向着未知的深空启航，这不仅是科技的跃迁，更是人类好奇心的无限延伸。」
                </blockquote>

                {/* Code Block */}
                <div
                  style={{
                    backgroundColor: editingTheme.codeBg,
                    color: editingTheme.codeColor,
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    margin: '14px 0',
                  }}
                >
                  <code>const publisher = new WeChatDraft({`{ theme: '${editingTheme.name}' }`});</code>
                </div>

                {/* Bullet List */}
                <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                  <li style={{ marginBottom: '4px' }}>
                    <strong>主色强调</strong>：采用 <span style={{ color: editingTheme.primaryColor, fontWeight: 'bold' }}>{editingTheme.primaryColor}</span> 作为品牌辨识符号；
                  </li>
                  <li>
                    <strong>极客高光</strong>：结合智能内联引擎，确保跨端无差别呈现。
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {/* Import JSON button */}
            <label className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer transition flex items-center gap-1.5 border border-neutral-700">
              <Upload className="w-3.5 h-3.5" />
              <span>导入 JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            {/* Export JSON button */}
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition flex items-center gap-1.5 border border-neutral-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 JSON</span>
            </button>

            {saveStatus && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse ml-2">
                {saveStatus}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              保存并应用主题
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
