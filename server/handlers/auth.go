package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/Yoila7/myGoProject/database"
	"github.com/Yoila7/myGoProject/middleware"
	"github.com/Yoila7/myGoProject/models"
)

// GetLoginURL 返回 GitHub OAuth 登录链接
func GetLoginURL(c *gin.Context) {
	clientID := os.Getenv("GITHUB_CLIENT_ID")
	redirectURI := os.Getenv("GITHUB_CALLBACK_URL")
	url := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=read:user",
		clientID, redirectURI,
	)
	c.JSON(http.StatusOK, gin.H{"url": url})
}

// GithubCallback 处理 GitHub OAuth 回调
func GithubCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 code 参数"})
		return
	}

	// 用 code 换取 access token
	accessToken, err := exchangeCodeForToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "换取 token 失败"})
		return
	}

	// 获取 GitHub 用户信息
	ghUser, err := fetchGitHubUser(accessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败"})
		return
	}

	// 查找或创建用户
	var user models.User
	if err := database.DB.Where("github_id = ?", ghUser.ID).First(&user).Error; err != nil {
		// 新用户：检查是否为预设管理员
		adminUsers := strings.Split(os.Getenv("ADMIN_GITHUB_USERNAMES"), ",")
		isAdmin := false
		for _, name := range adminUsers {
			if strings.TrimSpace(name) == ghUser.Login {
				isAdmin = true
				break
			}
		}
		user = models.User{
			GitHubID:  ghUser.ID,
			Username:  ghUser.Login,
			AvatarURL: ghUser.AvatarURL,
			IsAdmin:   isAdmin,
		}
		database.DB.Create(&user)
	}

	// 生成 JWT
	jwtToken, err := generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成 token 失败"})
		return
	}

	// 重定向到前端
	frontendURL := os.Getenv("FRONTEND_URL")
	c.Redirect(http.StatusFound, fmt.Sprintf("%s?token=%s", frontendURL, jwtToken))
}

// GetCurrentUser 获取当前登录用户信息
func GetCurrentUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// GrantAdmin 授予管理员权限（仅管理员可用）
func GrantAdmin(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供用户名"})
		return
	}

	if err := database.DB.Model(&models.User{}).Where("username = ?", req.Username).Update("is_admin", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("已授予 %s 管理员权限", req.Username)})
}

// --- helpers ---

type githubUser struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
}

type githubTokenResp struct {
	AccessToken string `json:"access_token"`
}

func httpClient() *http.Client {
	proxyURL := os.Getenv("HTTPS_PROXY")
	if proxyURL == "" {
		proxyURL = os.Getenv("HTTP_PROXY")
	}
	if proxyURL != "" {
		proxy, _ := url.Parse(proxyURL)
		return &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxy)}}
	}
	return http.DefaultClient
}

func exchangeCodeForToken(code string) (string, error) {
	clientID := os.Getenv("GITHUB_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_CLIENT_SECRET")

	body := fmt.Sprintf(
		"client_id=%s&client_secret=%s&code=%s",
		clientID, clientSecret, code,
	)
	req, _ := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(body))
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := httpClient().Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result githubTokenResp
	json.NewDecoder(resp.Body).Decode(&result)
	return result.AccessToken, nil
}

func fetchGitHubUser(token string) (*githubUser, error) {
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "my-blog")
	resp, err := httpClient().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var user githubUser
	json.NewDecoder(resp.Body).Decode(&user)
	return &user, nil
}

func generateJWT(user models.User) (string, error) {
	claims := middleware.Claims{
		UserID:   user.ID,
		Username: user.Username,
		IsAdmin:  user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
