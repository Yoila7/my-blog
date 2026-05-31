package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Yoila7/myGoProject/database"
	"github.com/Yoila7/myGoProject/models"
)

// GetArticles 返回所有文章元数据（不含 content）
func GetArticles(c *gin.Context) {
	var articles []models.Article
	if err := database.DB.Order("id").Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	meta := make([]models.ArticleMeta, len(articles))
	for i, a := range articles {
		meta[i] = models.ArticleMeta{
			ID:    a.ID,
			Title: a.Title,
			Date:  a.Date,
		}
	}
	c.JSON(http.StatusOK, meta)
}

// GetArticle 返回单篇文章（含 content）
func GetArticle(c *gin.Context) {
	id := c.Param("id")
	var article models.Article
	if err := database.DB.First(&article, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	c.JSON(http.StatusOK, article)
}