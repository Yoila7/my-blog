package config

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	DBPath string
}

func Load() *Config {
	// 从二进制所在目录加载 .env，不依赖 CWD
	exe, err := os.Executable()
	if err == nil {
		_ = godotenv.Load(filepath.Join(filepath.Dir(exe), ".env"))
	} else {
		_ = godotenv.Load()
	}

	cfg := &Config{
		Port:   getEnv("PORT", "8080"),
		DBPath: getEnv("DB_PATH", defaultDBPath()),
	}
	return cfg
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