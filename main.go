package main

import (
	"embed"
	"net/http"
	"net/http/httputil"
	"net/url"
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
		if strings.HasPrefix(r.URL.Path, "/api/") {
			// If local Node server is running on port 3000, forward to it
			if isLocalServerAlive("http://127.0.0.1:3000") {
				proxy.ServeHTTP(w, r)
				return
			}
			// Standalone Desktop mode: handle natively in Go
			HandleNativeAPI(w, r)
			return
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
