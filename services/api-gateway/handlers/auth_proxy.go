package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthProxy struct {
	authServiceURL string
	client         *http.Client
}

func NewAuthProxy(authServiceURL string) *AuthProxy {
	return &AuthProxy{
		authServiceURL: authServiceURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ProxyRequest - Auth Serviceへのリクエストプロキシ
func (p *AuthProxy) ProxyRequest(endpoint string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// リクエストボディを読み取り
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			log.Printf("Failed to read request body: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_request_body",
				"message": "Failed to read request body",
			})
			return
		}

		// Auth Serviceへのリクエストを作成
		url := fmt.Sprintf("%s%s", p.authServiceURL, endpoint)
		req, err := http.NewRequest(c.Request.Method, url, bytes.NewBuffer(body))
		if err != nil {
			log.Printf("Failed to create request to %s: %v", url, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "internal_error",
				"message": "Failed to create request",
			})
			return
		}

		// ヘッダーをコピー（重要なもののみ）
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "PetMatch-API-Gateway/1.0")
		req.Header.Set("X-Forwarded-For", c.ClientIP())
		req.Header.Set("X-Real-IP", c.ClientIP())

		// Authorization ヘッダーがあれば転送
		if authHeader := c.GetHeader("Authorization"); authHeader != "" {
			req.Header.Set("Authorization", authHeader)
		}

		// リクエスト実行
		log.Printf("Proxying %s %s to %s", req.Method, c.Request.URL.Path, url)
		resp, err := p.client.Do(req)
		if err != nil {
			log.Printf("Auth service request failed: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "service_unavailable",
				"message": "Authentication service is temporarily unavailable",
			})
			return
		}
		defer resp.Body.Close()

		// レスポンスボディを読み取り
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("Failed to read auth service response: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "internal_error",
				"message": "Failed to read response from auth service",
			})
			return
		}

		// Content-Type ヘッダーを設定
		if contentType := resp.Header.Get("Content-Type"); contentType != "" {
			c.Header("Content-Type", contentType)
		} else {
			c.Header("Content-Type", "application/json")
		}

		// レスポンスを返す
		c.Data(resp.StatusCode, "application/json", respBody)
	}
}

// Register - ユーザー登録プロキシ
func (p *AuthProxy) Register(c *gin.Context) {
	p.ProxyRequest("/auth/register")(c)
}

// Login - ログインプロキシ
func (p *AuthProxy) Login(c *gin.Context) {
	p.ProxyRequest("/auth/login")(c)
}

// RefreshToken - トークンリフレッシュプロキシ
func (p *AuthProxy) RefreshToken(c *gin.Context) {
	p.ProxyRequest("/auth/refresh")(c)
}

// Logout - ログアウトプロキシ
func (p *AuthProxy) Logout(c *gin.Context) {
	p.ProxyRequest("/auth/logout")(c)
}

// VerifyToken - トークン検証プロキシ
func (p *AuthProxy) VerifyToken(c *gin.Context) {
	p.ProxyRequest("/auth/verify")(c)
}

// GetProfile - プロフィール取得プロキシ
func (p *AuthProxy) GetProfile(c *gin.Context) {
	p.ProxyRequest("/auth/profile")(c)
}

// HealthCheck - Auth Service のヘルスチェック
func (p *AuthProxy) HealthCheck() bool {
	url := fmt.Sprintf("%s/health", p.authServiceURL)
	resp, err := p.client.Get(url)
	if err != nil {
		log.Printf("Auth service health check failed: %v", err)
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// ValidateToken - トークン検証エンドポイント（内部使用）
func (p *AuthProxy) ValidateToken(token string) (*TokenClaims, error) {
	reqBody := map[string]string{"token": token}
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	url := fmt.Sprintf("%s/auth/validate", p.authServiceURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("validation request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token validation failed: status %d", resp.StatusCode)
	}

	var result struct {
		Valid  bool         `json:"valid"`
		Claims *TokenClaims `json:"claims"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	if !result.Valid {
		return nil, fmt.Errorf("token is invalid")
	}

	return result.Claims, nil
}

// TokenClaims - JWTクレーム構造体
type TokenClaims struct {
	UserID    string `json:"user_id"`
	UserType  string `json:"user_type"`
	Email     string `json:"email"`
	ExpiresAt int64  `json:"exp"`
}
