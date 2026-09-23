#!/usr/bin/env bash
set -e

# ==============================================================================
# WeChat Draft Publisher - Wails v2 Desktop Build Script
# Supports: Windows (x64), macOS (Apple Silicon / Intel / Universal), Linux (x64)
# ==============================================================================

echo "=========================================================="
echo "  WeChat Draft Publisher - Wails v2 桌面端构建打包工具"
echo "=========================================================="

# 1. Check Go
if ! command -v go &> /dev/null; then
    echo "❌ 未检测到 Go 环境。请先安装 Go 1.20+ (https://go.dev/dl/)"
    exit 1
fi
echo "✅ Go 环境: $(go version)"

# 2. Check Wails CLI
if ! command -v wails &> /dev/null; then
    echo "⚠️ 未检测到 Wails CLI，正在自动安装最新版 Wails v2..."
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    export PATH="$PATH:$(go env GOPATH)/bin"
fi
echo "✅ Wails CLI: $(wails version 2>/dev/null || echo 'v2.x')"

# 3. Build Web Frontend
echo "📦 正在执行前端构建 (Vite)..."
npm run build

# 4. Target platform
PLATFORM="${1:-native}"
echo "🚀 开始编译 Wails 桌面端应用 (平台目标: $PLATFORM)..."

case "$PLATFORM" in
    "windows")
        wails build -platform windows/amd64 -nsis
        ;;
    "darwin"|"mac")
        wails build -platform darwin/universal
        ;;
    "linux")
        wails build -platform linux/amd64
        ;;
    "native")
        wails build
        ;;
    *)
        echo "未知平台: $PLATFORM，使用默认本地架构编译"
        wails build
        ;;
esac

echo "=========================================================="
echo "🎉 桌面端应用打包完成！生成的可执行文件位于: build/bin/"
echo "=========================================================="
