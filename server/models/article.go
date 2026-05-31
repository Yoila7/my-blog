package models

import "time"

type Article struct {
	ID        string    `gorm:"primaryKey;size:20" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Content   string    `gorm:"type:text" json:"content"`
	Date      string    `gorm:"size:20" json:"date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ArticleMeta 不含 content，用于列表返回
type ArticleMeta struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Date  string `json:"date"`
}