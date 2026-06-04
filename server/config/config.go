package config

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DBPath      string
	ServerURL   string   // 后端对外地址，如 http://10.0.0.1:8080
	FrontendURL string   // 前端对外地址，如 http://10.0.0.1:3000
	CORSOrigins []string // 允许的 CORS 来源
}

func Load() *Config {
	// 从二进制所在目录加载 .env，不依赖 CWD
	exe, err := os.Executable()
	if err == nil {
		_ = godotenv.Load(filepath.Join(filepath.Dir(exe), ".env"))
	} else {
		_ = godotenv.Load()
	}

	port := getEnv("PORT", "8080")

	// SERVER_URL: 后端对外地址
	serverURL := getEnv("SERVER_URL", fmt.Sprintf("http://localhost:%s", port))

	// FRONTEND_URL: 前端地址。如果未显式设置，从 SERVER_URL 推导（替换端口为 3000）
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = deriveFrontendURL(serverURL)
	}

	// GITHUB_CALLBACK_URL: 如果未显式设置，自动推导
	if os.Getenv("GITHUB_CALLBACK_URL") == "" {
		os.Setenv("GITHUB_CALLBACK_URL", serverURL+"/api/auth/callback")
	}

	// FRONTEND_URL 写回环境变量，供 auth.go 使用
	os.Setenv("FRONTEND_URL", frontendURL)

	cfg := &Config{
		Port:        port,
		DBPath:      getEnv("DB_PATH", defaultDBPath()),
		ServerURL:   serverURL,
		FrontendURL: frontendURL,
		CORSOrigins: buildCORSOrigins(frontendURL),
	}
	return cfg
}

// deriveFrontendURL 从后端地址推导前端地址（端口改为3000）
func deriveFrontendURL(serverURL string) string {
	u, err := url.Parse(serverURL)
	if err != nil {
		return "http://localhost:3000"
	}
	// 只取 hostname，配上 3000 端口
	hostname := u.Hostname()
	return fmt.Sprintf("%s://%s:3000", u.Scheme, hostname)
}

// buildCORSOrigins 生成 CORS 白名单
// 始终包含 localhost/127.0.0.1 的 3000-3005 端口
// 外加 FRONTEND_URL 对应 host 的 3000-3005 端口
func buildCORSOrigins(frontendURL string) []string {
	u, err := url.Parse(frontendURL)
	if err != nil {
		return []string{"http://localhost:3000"}
	}

	origins := []string{
		"http://localhost:3000", "http://localhost:3001", "http://localhost:3002",
		"http://localhost:3003", "http://localhost:3004", "http://localhost:3005",
		"http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002",
		"http://127.0.0.1:3003", "http://127.0.0.1:3004", "http://127.0.0.1:3005",
	}

	hostname := u.Hostname()
	if hostname != "localhost" && hostname != "127.0.0.1" {
		scheme := u.Scheme
		if scheme == "" {
			scheme = "http"
		}
		for _, p := range []string{"3000", "3001", "3002", "3003", "3004", "3005"} {
			origins = append(origins, fmt.Sprintf("%s://%s:%s", scheme, hostname, p))
		}
		// 如果 frontendURL 不含端口（如 https://blog.example.com），也加上原始 URL
		if u.Port() == "" {
			origins = append(origins, frontendURL)
		}
	}

	return origins
}

// defaultDBPath 返回二进制所在目录下的 blog.db，不依赖 CWD
func defaultDBPath() string {
	exe, err := os.Executable()
	if err != nil {
		return "./blog.db"
	}
	return filepath.Join(filepath.Dir(exe), "blog.db")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
