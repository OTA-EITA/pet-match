package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/config"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
	"github.com/petmatch/app/services/api-gateway/routes"
)

func main() {
	// 設定の読み込み
	cfg := config.LoadConfig()

	// Gin モードの設定
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// Gin エンジンの初期化
	r := gin.Default()

	// CORS ミドルウェアの設定（最初に設定）
	r.Use(corsMiddleware(cfg))

	// リカバリーミドルウェア
	r.Use(gin.Recovery())

	// リクエストログミドルウェア
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	}))

	// サービスプロキシの初期化
	authProxy := handlers.NewAuthProxy(cfg.AuthServiceURL)
	petProxy := handlers.NewPetProxy(cfg.PetServiceURL)

	// 認証ミドルウェアの初期化
	authMiddleware := middleware.NewAuthMiddleware(cfg.JWTSecret)

	// ルートの設定
	setupRoutes(r, cfg, authProxy, petProxy, authMiddleware)

	// サーバー起動
	log.Printf("🚀 API Gateway starting on port %s", cfg.Port)
	log.Printf("📊 Environment: %s", cfg.AppEnv)
	log.Printf("🔗 Auth Service: %s", cfg.AuthServiceURL)
	log.Printf("🐾 Pet Service: %s", cfg.PetServiceURL)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRoutes(
	r *gin.Engine,
	cfg *config.Config,
	authProxy *handlers.AuthProxy,
	petProxy *handlers.PetProxy,
	authMiddleware *middleware.AuthMiddleware,
) {
	// ヘルスチェックルート
	routes.SetupHealthRoutes(r, authProxy)

	// 認証ルート
	routes.SetupAuthRoutes(r, authProxy, authMiddleware)

	// Pet Service ルート
	routes.SetupPetRoutes(r, petProxy, authMiddleware)

	// 開発環境でのテストエンドポイント
	if cfg.IsDevelopment() {
		setupDevelopmentRoutes(r, authMiddleware)
	}

	// 404 ハンドリング
	r.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"error":   "not_found",
			"message": "The requested endpoint does not exist",
			"path":    c.Request.URL.Path,
		})
	})
}

func setupDevelopmentRoutes(r *gin.Engine, authMiddleware *middleware.AuthMiddleware) {
	dev := r.Group("/dev")
	{
		// 開発用認証テスト
		dev.GET("/auth/test", authMiddleware.RequireAuth(), func(c *gin.Context) {
			userID, userType, email, _ := middleware.GetCurrentUser(c)
			c.JSON(200, gin.H{
				"message":   "Authentication successful",
				"user_id":   userID,
				"user_type": userType,
				"email":     email,
			})
		})

		// 開発用Shelter権限テスト
		dev.GET("/auth/shelter-test",
			authMiddleware.RequireAuth(),
			authMiddleware.RequireRole("shelter"),
			func(c *gin.Context) {
				c.JSON(200, gin.H{
					"message": "Shelter role access successful",
				})
			},
		)

		// トークン情報表示
		dev.GET("/token/info", authMiddleware.OptionalAuth(), func(c *gin.Context) {
			userID, userType, email, authenticated := middleware.GetCurrentUser(c)
			c.JSON(200, gin.H{
				"authenticated": authenticated,
				"user_id":       userID,
				"user_type":     userType,
				"email":         email,
			})
		})
	}

	log.Println("🔧 Development routes enabled at /dev/*")
}

func corsMiddleware(cfg *config.Config) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// 開発環境では常に全てのOriginを許可
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// デバッグログ
		if cfg.IsDevelopment() {
			log.Printf("CORS: %s %s from %s", c.Request.Method, c.Request.URL.Path, c.Request.Header.Get("Origin"))
		}

		// プリフライトリクエストの処理
		if c.Request.Method == "OPTIONS" {
			if cfg.IsDevelopment() {
				log.Printf("CORS Preflight: %s", c.Request.URL.Path)
			}
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
}
