package models

import "time"

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ArticleID string    `gorm:"index;size:20;not null" json:"article_id"`
	Username  string    `gorm:"size:100;not null" json:"username"`
	AvatarURL string    `gorm:"size:500" json:"avatar_url"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Likes     int       `gorm:"default:0" json:"likes"`
	CreatedAt time.Time `json:"created_at"`
}

// CommentLike 记录谁点赞了哪条评论
type CommentLike struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	CommentID uint   `gorm:"uniqueIndex:idx_comment_user;not null" json:"comment_id"`
	Username  string `gorm:"uniqueIndex:idx_comment_user;size:100;not null" json:"username"`
}
