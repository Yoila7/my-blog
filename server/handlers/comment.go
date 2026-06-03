package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Yoila7/myGoProject/database"
	"github.com/Yoila7/myGoProject/models"
)

type CreateCommentReq struct {
	ArticleID string `json:"article_id" binding:"required"`
	Content   string `json:"content" binding:"required"`
}

// GetComments 获取某篇文章的评论
func GetComments(c *gin.Context) {
	articleID := c.Param("id")
	var comments []models.Comment
	database.DB.Where("article_id = ?", articleID).Order("created_at ASC").Find(&comments)
	c.JSON(http.StatusOK, comments)
}

// CreateComment 发表评论（需登录）
func CreateComment(c *gin.Context) {
	var req CreateCommentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供文章ID和评论内容"})
		return
	}

	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")

	// 优先用 JWT 中的 avatar_url，否则从数据库查
	avatarURL := ""
	if av, ok := c.Get("avatar_url"); ok {
		if s, ok2 := av.(string); ok2 && s != "" {
			avatarURL = s
		}
	}
	if avatarURL == "" {
		var user models.User
		if err := database.DB.First(&user, userID).Error; err == nil {
			avatarURL = user.AvatarURL
		}
	}

	comment := models.Comment{
		ArticleID: req.ArticleID,
		Username:  username.(string),
		AvatarURL: avatarURL,
		Content:   req.Content,
		CreatedAt: time.Now(),
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发表评论失败"})
		return
	}

	c.JSON(http.StatusOK, comment)
}

// DeleteComment 删除评论（仅作者本人可删）
func DeleteComment(c *gin.Context) {
	id := c.Param("id")
	username, _ := c.Get("username")

	var comment models.Comment
	if err := database.DB.First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}
	if comment.Username != username.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "只能删除自己的评论"})
		return
	}

	database.DB.Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "已删除"})
}
