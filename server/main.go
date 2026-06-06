package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/Yoila7/myGoProject/config"
	"github.com/Yoila7/myGoProject/database"
	"github.com/Yoila7/myGoProject/handlers"
	"github.com/Yoila7/myGoProject/middleware"
	"github.com/Yoila7/myGoProject/models"
)

func main() {
	cfg := config.Load()

	// 初始化数据库并自动迁移
	database.Init(cfg.DBPath)
	database.DB.AutoMigrate(&models.Article{}, &models.User{}, &models.Comment{}, &models.CommentLike{})

	// 设置 Gin 模式
	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	// CORS 配置（来源由 config 自动推导）
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 路由
	api := r.Group("/api")
	{
		// 文章（公开）
		api.GET("/articles", handlers.GetArticles)
		api.GET("/articles/:id", handlers.GetArticle)

		// 评论（公开）
		api.GET("/articles/:id/comments", handlers.GetComments)

		// OAuth 认证（公开）
		api.GET("/auth/login-url", handlers.GetLoginURL)
		api.GET("/auth/callback", handlers.GithubCallback)

		// 用户接口（需登录）
		auth := api.Group("").Use(middleware.AuthRequired())
		{
			auth.GET("/auth/me", handlers.GetCurrentUser)
			auth.GET("/auth/likes", handlers.GetMyLikes)
			auth.POST("/comments", handlers.CreateComment)
			auth.DELETE("/comments/:id", handlers.DeleteComment)
			auth.POST("/comments/:id/like", handlers.ToggleLike)
		}

		// 管理接口（需管理员权限）
		admin := api.Group("").Use(middleware.AuthRequired(), middleware.AdminRequired())
		{
			admin.POST("/admin/grant", handlers.GrantAdmin)
			admin.GET("/admin/articles", handlers.AdminGetArticles)
			admin.PUT("/admin/articles/:id", handlers.AdminUpdateArticle)
			admin.DELETE("/admin/articles/:id", handlers.AdminDeleteArticle)
			admin.GET("/admin/users", handlers.AdminGetUsers)
			admin.PUT("/admin/users/:id", handlers.AdminUpdateUser)
				admin.DELETE("/admin/users/:id", handlers.AdminDeleteUser)
			admin.GET("/admin/comments", handlers.AdminGetComments)
			admin.DELETE("/admin/comments/:id", handlers.AdminDeleteComment)
			admin.PUT("/admin/comments/:id", handlers.AdminUpdateComment)
				admin.GET("/admin/comments/:id/likes", handlers.AdminGetCommentLikes)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
