package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupAuthRoutes - 認証関連ルートの設定
func SetupAuthRoutes(
	router *gin.Engine,
	authProxy *handlers.AuthProxy,
	authMiddleware *middleware.AuthMiddleware,
) {
	// 認証関連エンドポイント（認証不要）
	auth := router.Group("/api/auth")
	{
		auth.POST("/register", authProxy.Register)
		auth.POST("/login", authProxy.Login)
		auth.POST("/refresh", authProxy.RefreshToken)
	}

	// 認証が必要なエンドポイント
	protected := router.Group("/api/auth")
	protected.Use(authMiddleware.RequireAuth())
	{
		protected.POST("/logout", authProxy.Logout)
		protected.GET("/profile", authProxy.GetProfile)
		protected.GET("/verify", authProxy.VerifyToken)  // トークン検証エンドポイントを追加
	}
}

// SetupHealthRoutes - ヘルスチェック関連ルート
func SetupHealthRoutes(router *gin.Engine, authProxy *handlers.AuthProxy) {
	health := router.Group("/")
	{
		health.GET("/health", func(c *gin.Context) {
			// Auth Service のヘルスチェック
			authHealthy := authProxy.HealthCheck()

			status := "healthy"
			statusCode := 200

			if !authHealthy {
				status = "degraded"
				statusCode = 503
			}

			c.JSON(statusCode, gin.H{
				"status":    status,
				"service":   "api-gateway",
				"timestamp": gin.H{},
				"version":   "1.0.0",
				"services": gin.H{
					"auth-service": map[string]bool{"healthy": authHealthy},
				},
			})
		})

		health.GET("/ready", func(c *gin.Context) {
			// すべてのサービスの準備状態をチェック
			authReady := authProxy.HealthCheck()

			if authReady {
				c.JSON(200, gin.H{
					"status": "ready",
					"services": gin.H{
						"auth-service": "ready",
					},
				})
			} else {
				c.JSON(503, gin.H{
					"status": "not ready",
					"services": gin.H{
						"auth-service": "not ready",
					},
				})
			}
		})
	}
}
