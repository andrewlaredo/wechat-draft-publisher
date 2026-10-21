import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Wifi,
  Globe,
  QrCode,
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  Share2,
  ChevronLeft,
  MoreHorizontal,
  Heart,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Type,
} from 'lucide-react';
import QRCode from 'qrcode';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface LiveMobileTunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  digest: string;
  cover?: string;
  markdown: string;
  inlinedHtml: string;
  theme?: string;
  showToast?: (msg: string) => void;
}

export const LiveMobileTunnelModal: React.FC<LiveMobileTunnelModalProps> = ({
  isOpen,
  onClose,
  title,
  author,
  digest,
  cover = '',
  markdown,
  inlinedHtml,
  theme,
  showToast,
}) => {
  const [lanIps, setLanIps] = useState<string[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [connectedClients, setConnectedClients] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'mirror' | 'iframe'>('mirror');
  const [isMobileDarkMode, setIsMobileDarkMode] = useState<boolean>(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'base' | 'lg'>('base');
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(0);

  // Fetch LAN IPs from server
  useEffect(() => {
    if (!isOpen) return;
    const fetchIps = async () => {
      try {
        const res = await safeFetchJson('/api/live-mobile/network-ips');
        if (res.ok && res.data?.ips) {
          setLanIps(res.data.ips);
          if (res.data.ips.length > 0 && !selectedIp) {
            setSelectedIp(res.data.ips[0]);
          }
        }
      } catch {
        // Fallback to origin
      }
    };
    fetchIps();
  }, [isOpen]);

  // Compute live review URL
  const activeReviewUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/?preview=live';

    // If a LAN IP is selected, use it with port
    if (selectedIp) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `http://${selectedIp}${port}/?preview=live`;
    }

    // When using current system domain / host proxy, use ?preview=live
    // This completely avoids host 404 ("This page doesn't exist") on static SPA deployments and Cloud Run!
    const cleanPath = window.location.pathname.replace(/\/preview\/live$/, '').replace(/\/$/, '');
    return `${window.location.origin}${cleanPath}/?preview=live`;
  }, [selectedIp]);

  // Generate QR code data URL whenever URL changes
  useEffect(() => {
    if (!isOpen || !activeReviewUrl) return;

    QRCode.toDataURL(activeReviewUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code error:', err));
  }, [isOpen, activeReviewUrl]);

  // Synchronize article content to server
  const pushContentToServer = async () => {
    setIsSyncing(true);
    try {
      const res = await safeFetchJson('/api/live-mobile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || '未命名推文',
          author: author || '创作者',
          digest,
          cover,
          html: inlinedHtml,
          markdown,
          theme,
        }),
      });

      if (res.ok) {
        setLastSyncTime(new Date().toLocaleTimeString());
        if (res.data?.clientCount !== undefined) {
          setConnectedClients(res.data.clientCount);
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsSyncing(false);
    }
  };

  // Push on open or when content changes
  useEffect(() => {
    if (isOpen) {
      pushContentToServer();
    }
  }, [isOpen, title, author, inlinedHtml, theme]);

  // Periodically check connected clients status
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(async () => {
      try {
        const res = await safeFetchJson('/api/live-mobile/status');
        if (res.ok && res.data?.connectedDevices !== undefined) {
          setConnectedClients(res.data.connectedDevices);
        }
      } catch {
        // Ignored
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeReviewUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast?.('📋 已成功复制局域网手机真机审稿链接！');
  };

  const handleRefreshPreview = () => {
    pushContentToServer();
    setIframeRefreshKey((prev) => prev + 1);
    showToast?.('🔄 已重载手机视口实时镜像数据');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-600 text-white shadow-md">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">局域网手机真机实时同步审稿 (Live Mobile Tunnel)</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-medium">
                  零延迟热更
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                手机微信扫一扫，直接在真机屏幕逐字核验排版字体、间距与微信原生 SVG 动效，电脑端编辑手机秒级热更新。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden text-xs">
          {/* Left Column: QR Code & Connection Settings */}
          <div className="w-full lg:w-1/2 p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-neutral-800 space-y-4">
            {/* Live Status Pill */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="font-semibold text-neutral-200 text-xs">
                    实时同步隧道已建立 (SSE Active)
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    已连通手机端设备: <span className="text-emerald-400 font-bold">{connectedClients}</span> 台 · 上次同步: {lastSyncTime || '刚刚'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshPreview}
                disabled={isSyncing}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium transition flex items-center gap-1"
                title="手动立即触发全量重同步"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>立即同步</span>
              </button>
            </div>

            {/* QR Code Presentation */}
            <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-neutral-750">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="真机审稿二维码"
                    className="w-48 h-48 block"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-neutral-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <div className="font-bold text-neutral-200 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>手机微信「扫一扫」即刻审阅</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  确保手机与当前电脑连接在同一局域网 Wi-Fi，无需扫码授权与关注即可免登看稿
                </p>
              </div>
            </div>

            {/* Network IP & URL Switcher */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                  <span>局域网访问网卡地址选择：</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Port: 3000</span>
              </label>

              <div className="space-y-1.5">
                {lanIps.map((ip) => (
                  <label
                    key={ip}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      selectedIp === ip
                        ? 'bg-blue-950/60 border-blue-600 text-blue-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="lan_ip"
                        checked={selectedIp === ip}
                        onChange={() => setSelectedIp(ip)}
                        className="text-blue-600 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-semibold">{ip}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">局域网 IPv4</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                      推荐同 Wi-Fi 手机使用
                    </span>
                  </label>
                ))}

                <label
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedIp === ''
                      ? 'bg-blue-950/60 border-blue-600 text-blue-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="lan_ip"
                      checked={selectedIp === ''}
                      onChange={() => setSelectedIp('')}
                      className="text-blue-600 cursor-pointer"
                    />
                    <span className="font-mono text-xs">当前系统域名 / 本机代理</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">本地或云端容器</span>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-750 font-medium transition flex items-center justify-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '已复制链接' : '复制手机直连链接'}</span>
              </button>

              <a
                href={activeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>浏览器新标签打开</span>
              </a>
            </div>
          </div>

          {/* Right Column: Live Phone Mockup Simulator */}
          <div className="w-full lg:w-1/2 p-4 bg-neutral-950 flex flex-col items-center justify-center min-h-[440px] overflow-hidden">
            {/* Control Bar above phone */}
            <div className="w-full max-w-sm flex items-center justify-between pb-2.5 text-[11px] text-neutral-400">
              <div className="flex items-center space-x-2">
                <span className="font-medium flex items-center gap-1 text-neutral-200">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>手机视口实时镜像</span>
                </span>
                <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  实时渲染
                </span>
              </div>

              {/* Mode & Dark Mode switchers */}
              <div className="flex items-center space-x-1.5">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mirror')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      previewMode === 'mirror'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title="无缝本地直连极速渲染当前排版"
                  >
                    实时镜像
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('iframe')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      previewMode === 'iframe'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title="加载独立网页预览环境"
                  >
                    独立网页
                  </button>
                </div>

                {previewMode === 'mirror' && (
                  <button
                    type="button"
                    onClick={() => setIsMobileDarkMode(!isMobileDarkMode)}
                    className={`p-1 rounded-lg border text-[11px] transition ${
                      isMobileDarkMode
                        ? 'bg-neutral-800 border-neutral-700 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                    title={isMobileDarkMode ? '切换回微信明亮日间模式' : '切换至微信暗黑夜间模式'}
                  >
                    {isMobileDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* iPhone Frame */}
            <div className="w-full max-w-xs h-[520px] bg-neutral-900 rounded-[38px] p-3 shadow-2xl border-4 border-neutral-700/80 flex flex-col relative overflow-hidden select-text">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end pr-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-neutral-800 inline-block"></span>
              </div>

              {/* Mobile Viewport Screen */}
              <div className={`flex-1 w-full h-full rounded-[26px] overflow-hidden flex flex-col transition-colors ${
                isMobileDarkMode ? 'bg-[#111111] text-[#dfdfdf]' : 'bg-white text-[#333333]'
              }`}>
                {previewMode === 'mirror' ? (
                  <>
                    {/* Simulated iOS Status Bar */}
                    <div className={`h-8 pt-1.5 px-5 flex items-center justify-between text-[11px] font-semibold flex-shrink-0 z-20 ${
                      isMobileDarkMode ? 'text-neutral-300' : 'text-neutral-800'
                    }`}>
                      <span>09:41</span>
                      <div className="flex items-center space-x-1">
                        <span className="w-3.5 h-2 border border-current rounded-xs inline-block relative after:content-[''] after:absolute after:right-[-2px] after:top-[2px] after:bottom-[2px] after:w-[1px] after:bg-current"></span>
                      </div>
                    </div>

                    {/* WeChat Navigation Top Bar */}
                    <div className={`h-9 px-3 flex items-center justify-between border-b flex-shrink-0 text-xs ${
                      isMobileDarkMode
                        ? 'border-neutral-800 bg-[#191919] text-neutral-300'
                        : 'border-neutral-100 bg-[#ededed] text-neutral-800'
                    }`}>
                      <div className="flex items-center space-x-1 font-medium">
                        <ChevronLeft className="w-4 h-4 -ml-1 text-neutral-600" />
                        <span className="text-[11px]">微信</span>
                      </div>
                      <span className="text-[11px] font-bold truncate max-w-[130px]">
                        {title || '微信图文'}
                      </span>
                      <div className="flex items-center space-x-2 text-neutral-500">
                        <button
                          type="button"
                          onClick={() => setIsMobileDarkMode(!isMobileDarkMode)}
                          title="切换暗黑模式"
                          className="hover:text-neutral-300"
                        >
                          {isMobileDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
                        </button>
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Scrollable Article Body */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3.5 text-left select-text">
                      {/* Article Title */}
                      <h1 className={`text-lg font-bold leading-snug break-words ${
                        isMobileDarkMode ? 'text-[#efefef]' : 'text-[#222222]'
                      }`}>
                        {title || '无标题微信推文'}
                      </h1>

                      {/* Article Meta */}
                      <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-neutral-400">
                        <span className="text-[#576b95] font-medium">微信公众号</span>
                        <span className={isMobileDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>
                          {author || '创作者'}
                        </span>
                        <span className={`px-1 py-0.2 rounded text-[10px] ${
                          isMobileDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          原创
                        </span>
                        <span>今天</span>
                      </div>

                      {/* Optional Cover Banner */}
                      {cover && (
                        <div className="rounded-lg overflow-hidden border border-neutral-200/50 my-2">
                          <img
                            src={cover}
                            alt="Cover"
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* ACTUAL ARTICLE CONTENT (inlinedHtml) */}
                      <div
                        className={`wechat-preview-body max-w-full overflow-x-hidden break-words text-[14px] sm:text-[15px] leading-[1.75] ${
                          isMobileDarkMode ? 'text-[#d5d5d5]' : 'text-neutral-800'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: inlinedHtml || '<p style="color:#888888; text-align:center; padding: 40px 10px;">📱 正在等待电脑端输入内容，此视口将实时同步呈现排版效果...</p>',
                        }}
                      />

                      {/* WeChat Standard Footer */}
                      <div className={`mt-8 pt-4 border-t text-[11px] space-y-3 ${
                        isMobileDarkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[#576b95] cursor-pointer">阅读原文</span>
                          <span>阅读 1.6万</span>
                        </div>
                        <div className="flex items-center justify-end space-x-3.5 text-neutral-500 pt-1">
                          <span className="flex items-center gap-1 cursor-pointer">
                            <Heart className="w-3.5 h-3.5" /> 520
                          </span>
                          <span className="flex items-center gap-1 cursor-pointer">
                            <Sparkles className="w-3.5 h-3.5" /> 188
                          </span>
                          <span className="flex items-center gap-1 cursor-pointer">
                            <MessageSquare className="w-3.5 h-3.5" /> 36
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Standalone iframe view */
                  <div className="w-full h-full relative">
                    <iframe
                      key={iframeRefreshKey}
                      src={activeReviewUrl}
                      title="Mobile Live Preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                )}
              </div>

              {/* Home Indicator */}
              <div className="w-24 h-1 bg-neutral-600 rounded-full mx-auto mt-2 pointer-events-none"></div>
            </div>

            <div className="text-[10px] text-neutral-400 mt-2 text-center flex items-center justify-center gap-2">
              <span>手机与镜像双通道毫秒级同步</span>
              <span>·</span>
              <span>支持微信暗黑模式实时比对</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>基于 Server-Sent Events (SSE) 局域网加密推流，数据仅在本地网络流转</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-750 text-xs font-semibold transition"
          >
            完成审稿
          </button>
        </div>
      </div>
    </div>
  );
};
