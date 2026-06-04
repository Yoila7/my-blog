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

	// 初始化数据库
	database.Init(cfg.DBPath)

	// 自动迁移表
	database.DB.AutoMigrate(&models.User{}, &models.Comment{})

	// 设置 Gin 模式
	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	// CORS 配置（允许 Next.js 前端跨域访问）
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 路由
	api := r.Group("/api")
	{
		// 文章
		api.GET("/articles", handlers.GetArticles)
		api.GET("/articles/:id", handlers.GetArticle)

		// 认证
		api.GET("/articles/:id/comments", handlers.GetComments)

		// 认证
		api.GET("/auth/login-url", handlers.GetLoginURL)
		api.GET("/auth/callback", handlers.GithubCallback)

		// 用户（需登录）
		auth := api.Group("").Use(middleware.AuthRequired())
		{
			auth.GET("/auth/me", handlers.GetCurrentUser)
			auth.POST("/comments", handlers.CreateComment)
			auth.DELETE("/comments/:id", handlers.DeleteComment)
		}

		// 管理员
		admin := api.Group("").Use(middleware.AuthRequired(), middleware.AdminRequired())
		{
			admin.POST("/admin/grant", handlers.GrantAdmin)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}