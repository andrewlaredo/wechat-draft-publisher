package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct represents the Wails desktop application backend
type App struct {
	ctx context.Context
}

// FileResult represents a picked or read file with path, name and optional content
type FileResult struct {
	Path     string `json:"path"`
	Name     string `json:"name"`
	Content  string `json:"content"`
	DataURI  string `json:"dataUri,omitempty"`
	Size     int64  `json:"size"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Clean up any desktop resources
}

// SelectMarkdownFile opens a native OS dialog to select a Markdown file
func (a *App) SelectMarkdownFile() (*FileResult, error) {
	selection, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "选择本地 Markdown 文件",
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "Markdown 文章 (*.md;*.markdown;*.txt)",
				Pattern:     "*.md;*.markdown;*.txt",
			},
			{
				DisplayName: "所有文件 (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return nil, err
	}
	if selection == "" {
		return nil, nil // User cancelled
	}

	bytes, err := os.ReadFile(selection)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	info, err := os.Stat(selection)
	var size int64 = 0
	if err == nil {
		size = info.Size()
	}

	return &FileResult{
		Path:    selection,
		Name:    filepath.Base(selection),
		Content: string(bytes),
		Size:    size,
	}, nil
}

// SaveMarkdownFile opens a native OS dialog to save content as a Markdown file
func (a *App) SaveMarkdownFile(defaultName string, content string) (string, error) {
	if defaultName == "" {
		defaultName = "article.md"
	}
	if !strings.HasSuffix(defaultName, ".md") {
		defaultName += ".md"
	}

	savePath, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "导出保存为 Markdown 文件",
		DefaultFilename: defaultName,
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "Markdown 文档 (*.md)",
				Pattern:     "*.md",
			},
		},
	})

	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", nil // User cancelled
	}

	err = os.WriteFile(savePath, []byte(content), 0644)
	if err != nil {
		return "", fmt.Errorf("写入文件失败: %w", err)
	}

	return savePath, nil
}

// SelectImageFile opens a native OS dialog to select an image file and returns base64 DataURI
func (a *App) SelectImageFile() (*FileResult, error) {
	selection, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "选择封面或插入图片",
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "图片文件 (*.png;*.jpg;*.jpeg;*.webp;*.svg;*.gif)",
				Pattern:     "*.png;*.jpg;*.jpeg;*.webp;*.svg;*.gif",
			},
		},
	})

	if err != nil {
		return nil, err
	}
	if selection == "" {
		return nil, nil // User cancelled
	}

	bytes, err := os.ReadFile(selection)
	if err != nil {
		return nil, fmt.Errorf("读取图片失败: %w", err)
	}

	mimeType := http.DetectContentType(bytes)
	ext := strings.ToLower(filepath.Ext(selection))
	if ext == ".svg" {
		mimeType = "image/svg+xml"
	}

	dataURI := fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(bytes))

	return &FileResult{
		Path:    selection,
		Name:    filepath.Base(selection),
		DataURI: dataURI,
		Size:    int64(len(bytes)),
	}, nil
}

// ReadLocalFile reads arbitrary text from a local path
func (a *App) ReadLocalFile(filePath string) (string, error) {
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// WriteLocalFile writes text to a local path
func (a *App) WriteLocalFile(filePath string, content string) error {
	return os.WriteFile(filePath, []byte(content), 0644)
}

// OpenInBrowser opens a URL in user's default desktop browser
func (a *App) OpenInBrowser(targetUrl string) {
	wailsRuntime.BrowserOpenURL(a.ctx, targetUrl)
}

// ShowMessage displays a native modal message dialog
func (a *App) ShowMessage(title string, message string) {
	wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:    wailsRuntime.InfoDialog,
		Title:   title,
		Message: message,
	})
}

// ShowError displays a native modal error dialog
func (a *App) ShowError(title string, message string) {
	wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:    wailsRuntime.ErrorDialog,
		Title:   title,
		Message: message,
	})
}

// GetDesktopInfo returns runtime information about the desktop environment
func (a *App) GetDesktopInfo() map[string]interface{} {
	return map[string]interface{}{
		"isDesktop": true,
		"platform":  runtime.GOOS,
		"arch":      runtime.GOARCH,
		"version":   "1.0.0",
		"wails":     "v2",
	}
}
