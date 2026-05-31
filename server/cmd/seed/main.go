package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/Yoila7/myGoProject/models"
)

type ArticleJSON struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Date  string `json:"date"`
}

func main() {
	db, err := gorm.Open(sqlite.Open("blog.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	if err := db.AutoMigrate(&models.Article{}); err != nil {
		log.Fatalf("Failed to migrate: %v", err)
	}

	// 读取 articles.json
	jsonPath := filepath.Join("data", "articles.json")
	data, err := os.ReadFile(jsonPath)
	if err != nil {
		log.Fatalf("Failed to read articles.json: %v", err)
	}

	var articles []ArticleJSON
	if err := json.Unmarshal(data, &articles); err != nil {
		log.Fatalf("Failed to parse articles.json: %v", err)
	}

	htmlDir := filepath.Join("data", "articles")
	count := 0
	for _, a := range articles {
		htmlPath := filepath.Join(htmlDir, a.ID+".html")
		content, err := os.ReadFile(htmlPath)
		if err != nil {
			log.Printf("Warning: no HTML file for %s, skipping content", a.ID)
			content = []byte("")
		}

		article := models.Article{
			ID:      a.ID,
			Title:   a.Title,
			Content: string(content),
			Date:    a.Date,
		}

		if err := db.Save(&article).Error; err != nil {
			log.Printf("Failed to save article %s: %v", a.ID, err)
			continue
		}
		count++
	}

	log.Printf("Seeded %d articles successfully", count)
}