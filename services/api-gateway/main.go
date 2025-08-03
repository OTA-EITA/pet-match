package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type ServiceConfig struct {
	PetServiceURL  string
	UserServiceURL string
	AuthServiceURL string
	ChatServiceURL string
}

var services ServiceConfig

func init() {
	services = ServiceConfig{
		PetServiceURL:  getEnv("PET_SERVICE_URL", "http://localhost:8083"),
		UserServiceURL: getEnv("USER_SERVICE_URL", "http://localhost:8082"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		ChatServiceURL: getEnv("CHAT_SERVICE_URL", "http://localhost:8085"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	r := gin.Default()

	// CORS設定 - 開発用に全て許可
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// ヘルスチェック
	r.GET("/health", healthHandler)
	r.GET("/ready", readyHandler)

	// API routes
	api := r.Group("/api/v1")
	{
		// Pet Service routes (パブリック)
		api.GET("/pets", proxyToPetService)
		api.GET("/pets/:id", proxyToPetService)

		// Pet Service routes (認証が必要)
		authenticated := api.Group("")
		authenticated.Use(authMiddleware())
		{
			authenticated.POST("/pets", proxyToPetService)
			authenticated.PUT("/pets/:id", proxyToPetService)
			authenticated.DELETE("/pets/:id", proxyToPetService)
			authenticated.POST("/pets/migrate", proxyToPetService)
		}

		// 今後追加予定のルート
		// api.POST("/auth/login", proxyToAuthService)
		// api.POST("/auth/register", proxyToAuthService)
		// api.GET("/users/profile", authMiddleware(), proxyToUserService)
	}

	// 直接Pet Serviceへのアクセス（開発時用）
	r.Any("/pets", proxyToPetService)
	r.Any("/pets/*path", proxyToPetService)

	port := getEnv("PORT", "8080")
	log.Printf("API Gateway starting on port %s", port)
	log.Printf("Pet Service URL: %s", services.PetServiceURL)
	
	r.Run(":" + port)
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "api-gateway",
		"timestamp": time.Now().Unix(),
		"version":   "1.0.0",
	})
}

func readyHandler(c *gin.Context) {
	// Pet Serviceのヘルスチェック
	petServiceHealth := checkServiceHealth(services.PetServiceURL + "/health")
	
	if petServiceHealth {
		c.JSON(http.StatusOK, gin.H{
			"status": "ready",
			"services": gin.H{
				"pet-service": "healthy",
			},
		})
	} else {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"services": gin.H{
				"pet-service": "unhealthy",
			},
		})
	}
}

func checkServiceHealth(healthURL string) bool {
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(healthURL)
	if err != nil {
		log.Printf("Health check failed for %s: %v", healthURL, err)
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

func proxyToPetService(c *gin.Context) {
	proxyToService(c, services.PetServiceURL, "/pets")
}

func proxyToService(c *gin.Context, serviceURL, pathPrefix string) {
	target, err := url.Parse(serviceURL)
	if err != nil {
		log.Printf("Failed to parse service URL %s: %v", serviceURL, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Service unavailable"})
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	
	// リクエストの修正
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		
		// パスの修正
		if pathPrefix != "" && strings.HasPrefix(c.Request.URL.Path, "/api/v1") {
			// /api/v1/pets → /pets
			req.URL.Path = strings.Replace(c.Request.URL.Path, "/api/v1", "", 1)
		}
		
		req.Host = target.Host
		req.Header.Set("X-Forwarded-For", c.ClientIP())
		req.Header.Set("X-Forwarded-Proto", "http")
		req.Header.Set("X-Gateway", "petmatch-api-gateway")
		
		log.Printf("Proxying %s %s -> %s%s", req.Method, c.Request.URL.Path, target.String(), req.URL.Path)
	}

	// レスポンス修正: CORS ヘッダーの重複を防ぐ
	proxy.ModifyResponse = func(resp *http.Response) error {
		// プロキシ先からのCORSヘッダーを削除（Gateway側で処理済み）
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		return nil
	}

	// エラーハンドリング
	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		log.Printf("Proxy error: %v", err)
		rw.WriteHeader(http.StatusBadGateway)
		rw.Write([]byte(`{"error": "Service temporarily unavailable"}`))
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 基本的な認証チェック（開発時用）
		authHeader := c.GetHeader("Authorization")
		
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Bearer tokenの検証（実装は後で追加）
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		// 開発時はDEV_TOKENを許可
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "DEV_TOKEN" {
			c.Set("user_id", "dev-user")
			c.Next()
			return
		}

		// TODO: JWT検証の実装
		log.Printf("Token validation not implemented yet: %s", token)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token validation not implemented"})
		c.Abort()
	}
}
