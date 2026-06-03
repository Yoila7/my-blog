package models

import "time"

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ArticleID string    `gorm:"index;size:20;not null" json:"article_id"`
	Username  string    `gorm:"size:100;not null" json:"username"`
	AvatarURL string    `gorm:"size:500" json:"avatar_url"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
