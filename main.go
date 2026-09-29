package main

import (
	"embed"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:dist
var assets embed.FS

func isLocalServerAlive(target string) bool {
	client := http.Client{
		Timeout: 350 * time.Millisecond,
	}
	resp, err := client.Get(target + "/api/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// findLocalImageFile 统一解析打包应用同级目录或工作目录下 images/ 配图
func findLocalImageFile(rawPath string) (string, bool) {
	unescaped, err := url.PathUnescape(rawPath)
	if err != nil {
		unescaped = rawPath
	}
	cleanPath := strings.TrimPrefix(unescaped, "/")
	cleanPath = strings.TrimPrefix(cleanPath, "./")

	// 1. 获取当前二进制程序所在绝对路径 (应用同级目录)
	exePath, err := os.Executable()
	var exeDir string
	if err == nil {
		exeDir = filepath.Dir(exePath)
	}

	// 2. 获取当前运行工作目录
	cwd, _ := os.Getwd()

	candidates := []string{
		// 优先检索: 当前运行工作目录/cleanPath (如 images/01-mars-default.png)
		filepath.Join(cwd, cleanPath),
		// 检索: 当前运行工作目录/images/文件名
		filepath.Join(cwd, "images", filepath.Base(cleanPath)),
		// 检索: 可执行程序同级目录/cleanPath
		filepath.Join(exeDir, cleanPath),
		// 检索: 可执行程序同级目录/images/文件名
		filepath.Join(exeDir, "images", filepath.Base(cleanPath)),
	}

	// 针对 macOS .app 打包目录结构: /Applications/Publisher.app/Contents/MacOS/Publisher
	// 用户通常将 images 文件夹放置在 Publisher.app 的同级目录，或者 Resources 目录下
	if exeDir != "" {
		candidates = append(candidates,
			filepath.Join(exeDir, "../../..", cleanPath),
			filepath.Join(exeDir, "../../..", "images", filepath.Base(cleanPath)),
			filepath.Join(exeDir, "../Resources", cleanPath),
			filepath.Join(exeDir, "../Resources", "images", filepath.Base(cleanPath)),
		)
	}

	for _, cand := range candidates {
		if cand == "" {
			continue
		}
		cleanCand := filepath.Clean(cand)
		if fi, err := os.Stat(cleanCand); err == nil && !fi.IsDir() {
			return cleanCand, true
		}
	}
	return "", false
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Reverse proxy for /api/* requests to local server (default http://127.0.0.1:3000)
	backendURL, _ := url.Parse("http://127.0.0.1:3000")
	proxy := httputil.NewSingleHostReverseProxy(backendURL)

	// Safe fallback error handler: prevents empty 502 bodies and "Unexpected end of JSON" crashes
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		HandleNativeAPI(w, r)
	}

	apiHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqPath := r.URL.Path

		// 1. 拦截 /images/* 或包含 images/ 的本地配图与封面图请求
		if strings.HasPrefix(reqPath, "/images/") || strings.HasPrefix(reqPath, "images/") || strings.Contains(reqPath, "/images/") {
			if filePath, ok := findLocalImageFile(reqPath); ok {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Cache-Control", "public, max-age=3600")
				http.ServeFile(w, r, filePath)
				return
			}
		}

		// 2. 专用本地图片代理接口: /api/local-image?path=...
		if strings.HasPrefix(reqPath, "/api/local-image") {
			targetPath := r.URL.Query().Get("path")
			if targetPath == "" {
				targetPath = reqPath
			}
			if filePath, ok := findLocalImageFile(targetPath); ok {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Cache-Control", "public, max-age=3600")
				http.ServeFile(w, r, filePath)
				return
			}
			http.Error(w, "Image not found", http.StatusNotFound)
			return
		}

		// 3. API 请求处理: 若本地 Node 服务可用则反代，否则由 Go 原生原生接管
		if strings.HasPrefix(reqPath, "/api/") {
			if isLocalServerAlive("http://127.0.0.1:3000") {
				proxy.ServeHTTP(w, r)
				return
			}
			HandleNativeAPI(w, r)
			return
		}

		// 4. 图片文件后缀自动兜底匹配 (png, jpg, jpeg, webp, svg, gif)
		lowerPath := strings.ToLower(reqPath)
		if strings.HasSuffix(lowerPath, ".png") || strings.HasSuffix(lowerPath, ".jpg") ||
			strings.HasSuffix(lowerPath, ".jpeg") || strings.HasSuffix(lowerPath, ".webp") ||
			strings.HasSuffix(lowerPath, ".svg") || strings.HasSuffix(lowerPath, ".gif") {
			if filePath, ok := findLocalImageFile(reqPath); ok {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Cache-Control", "public, max-age=3600")
				http.ServeFile(w, r, filePath)
				return
			}
		}

		http.NotFound(w, r)
	})

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "WeChat Draft Publisher - 微信公众号草稿发布器",
		Width:     1360,
		Height:    900,
		MinWidth:  1024,
		MinHeight: 700,
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: apiHandler,
		},
		BackgroundColour: &options.RGBA{R: 23, G: 23, B: 23, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			About: &mac.AboutInfo{
				Title:   "WeChat Draft Publisher",
				Message: "微信公众号文章 Markdown 草稿同步排版发布工具\nhttps://github.com/andrewlaredo/wechat-draft-publisher",
			},
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
