package models

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GitHubID  int64     `gorm:"uniqueIndex;column:github_id" json:"github_id"`
	Username  string    `gorm:"size:100" json:"username"`
	AvatarURL string    `gorm:"size:500" json:"avatar_url"`
	IsAdmin   bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
