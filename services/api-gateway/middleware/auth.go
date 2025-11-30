package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	secretKey []byte
}

// JWT Header structure
type JWTHeader struct {
	Typ string `json:"typ"`
	Alg string `json:"alg"`
}

// JWT Claims structure
type JWTClaims struct {
	UserID   string `json:"user_id"`
	UserType string `json:"user_type"`
	Email    string `json:"email"`
	Exp      int64  `json:"exp"`
	Iat      int64  `json:"iat"`
}

func NewAuthMiddleware(secretKey string) *AuthMiddleware {
	return &AuthMiddleware{
		secretKey: []byte(secretKey),
	}
}

// RequireAuth - JWT認証が必要なエンドポイント用
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "authorization_required",
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token_format",
				"message": "Bearer token required",
			})
			c.Abort()
			return
		}

		// 開発環境でのDEV_TOKEN許可
		if os.Getenv("APP_ENV") == "development" && tokenString == "DEV_TOKEN" {
			c.Set("user_id", "dev-user-123")
			c.Set("user_type", "shelter")
			c.Set("user_email", "dev@petmatch.local")
			c.Next()
			return
		}

		// JWT検証
		claims, err := m.validateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// トークン有効期限確認
		if claims.Exp < time.Now().Unix() {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "token_expired",
				"message": "Token has expired",
			})
			c.Abort()
			return
		}

		// コンテキストに設定
		c.Set("user_id", claims.UserID)
		c.Set("user_type", claims.UserType)
		c.Set("user_email", claims.Email)
		c.Set("token_exp", claims.Exp)

		c.Next()
	}
}

// RequireRole - 特定のロールが必要なエンドポイント用
func (m *AuthMiddleware) RequireRole(requiredType string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "user_type_missing",
				"message": "User type not found in context",
			})
			c.Abort()
			return
		}

		userTypeStr, ok := userType.(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_user_type",
				"message": "User type is invalid",
			})
			c.Abort()
			return
		}

		if userTypeStr != requiredType {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "insufficient_permissions",
				"message": fmt.Sprintf("Required role: %s, current role: %s", requiredType, userTypeStr),
			})
			c.Abort()
			return
		}

		c.Next()
	})
}

// RequireRoles - 複数のロールのいずれかが必要なエンドポイント用
func (m *AuthMiddleware) RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "user_type_missing",
				"message": "User type not found in context",
			})
			c.Abort()
			return
		}

		userTypeStr, ok := userType.(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_user_type",
				"message": "User type is invalid",
			})
			c.Abort()
			return
		}

		for _, allowedRole := range allowedRoles {
			if userTypeStr == allowedRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": fmt.Sprintf("Required roles: %v, current role: %s", allowedRoles, userTypeStr),
		})
		c.Abort()
	})
}

// OptionalAuth - 認証があれば情報を設定するが、なくても通す
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.Next()
			return
		}

		// 開発環境でのDEV_TOKEN許可
		if os.Getenv("APP_ENV") == "development" && tokenString == "DEV_TOKEN" {
			c.Set("user_id", "dev-user-123")
			c.Set("user_type", "shelter")
			c.Set("user_email", "dev@petmatch.local")
			c.Next()
			return
		}

		// JWT検証（エラーがあっても処理を続行）
		claims, err := m.validateJWT(tokenString)
		if err == nil && claims.Exp >= time.Now().Unix() {
			c.Set("user_id", claims.UserID)
			c.Set("user_type", claims.UserType)
			c.Set("user_email", claims.Email)
		}

		c.Next()
	}
}

// validateJWT - JWT検証（標準ライブラリのみ使用）
func (m *AuthMiddleware) validateJWT(tokenString string) (*JWTClaims, error) {
	// JWT形式確認 (header.payload.signature)
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT format")
	}

	// Header解析
	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid header encoding")
	}

	var header JWTHeader
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, fmt.Errorf("invalid header JSON")
	}

	if header.Alg != "HS256" {
		return nil, fmt.Errorf("unsupported algorithm: %s", header.Alg)
	}

	// Payload解析
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid payload encoding")
	}

	var claims JWTClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid payload JSON")
	}

	// 署名検証
	expectedSignature := m.generateSignature(parts[0] + "." + parts[1])
	actualSignature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, fmt.Errorf("invalid signature encoding")
	}

	if !hmac.Equal(expectedSignature, actualSignature) {
		return nil, fmt.Errorf("invalid signature")
	}

	return &claims, nil
}

// generateSignature - HMAC-SHA256署名生成
func (m *AuthMiddleware) generateSignature(data string) []byte {
	h := hmac.New(sha256.New, m.secretKey)
	h.Write([]byte(data))
	return h.Sum(nil)
}

// GetCurrentUser - 現在のユーザー情報を取得するヘルパー
func GetCurrentUser(c *gin.Context) (string, string, string, bool) {
	userID, userIDExists := c.Get("user_id")
	userType, userTypeExists := c.Get("user_type")
	email, emailExists := c.Get("user_email")

	if !userIDExists || !userTypeExists || !emailExists {
		return "", "", "", false
	}

	userIDStr, _ := userID.(string)
	userTypeStr, _ := userType.(string)
	emailStr, _ := email.(string)

	return userIDStr, userTypeStr, emailStr, true
}
