package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Yoila7/myGoProject/database"
	"github.com/Yoila7/myGoProject/models"
)

// AdminGetArticles 返回所有文章（含 content）
func AdminGetArticles(c *gin.Context) {
	var articles []models.Article
	database.DB.Order("id").Find(&articles)
	c.JSON(http.StatusOK, articles)
}

// AdminUpdateArticle 更新文章
func AdminUpdateArticle(c *gin.Context) {
	id := c.Param("id")
	var article models.Article
	if err := database.DB.First(&article, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}
	// 只允许修改 title / content / date
	updates := map[string]interface{}{}
	if v, ok := req["title"]; ok {
		updates["title"] = v
	}
	if v, ok := req["content"]; ok {
		updates["content"] = v
	}
	if v, ok := req["date"]; ok {
		updates["date"] = v
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有可更新的字段"})
		return
	}
	database.DB.Model(&article).Updates(updates)
	database.DB.First(&article, "id = ?", id) // 重新查询获取最新数据
	c.JSON(http.StatusOK, article)
}

// AdminDeleteArticle 删除文章
func AdminDeleteArticle(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Article{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "已删除"})
}

// AdminGetUsers 返回所有用户
func AdminGetUsers(c *gin.Context) {
	var users []models.User
	database.DB.Order("id").Find(&users)
	c.JSON(http.StatusOK, users)
}

// AdminDeleteUser 删除用户
func AdminDeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "已删除"})
}

// AdminGetComments 返回所有评论（管理员视图）
func AdminGetComments(c *gin.Context) {
	var comments []models.Comment
	database.DB.Order("created_at DESC").Find(&comments)
	c.JSON(http.StatusOK, comments)
}

// AdminDeleteComment 删除任意评论（管理员）
func AdminDeleteComment(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Comment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "已删除"})
}

// AdminUpdateComment 编辑任意评论（管理员）
func AdminUpdateComment(c *gin.Context) {
	id := c.Param("id")
	var comment models.Comment
	if err := database.DB.First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}
	updates := map[string]interface{}{}
	if v, ok := req["content"]; ok {
		updates["content"] = v
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有可更新的字段"})
		return
	}
	database.DB.Model(&comment).Updates(updates)
	database.DB.First(&comment, id) // 重新查询获取最新数据
	c.JSON(http.StatusOK, comment)
}
