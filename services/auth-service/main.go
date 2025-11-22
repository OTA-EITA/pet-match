package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/petmatch/app/services/auth-service/docs"
	"github.com/petmatch/app/services/auth-service/handlers"
	"github.com/petmatch/app/services/auth-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/logger"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
	customValidator "github.com/petmatch/app/shared/validator"
)

// @title           PetMatch Auth Service API
// @version         1.0
// @description     認証・認可サービスAPI。ユーザー登録、ログイン、トークン管理を提供します。
// @description
// @description     **APIバージョニング**:
// @description     - 推奨: `/api/v1/auth/*` (新規実装はこちらを使用)
// @description     - レガシー: `/auth/*` (2025年6月1日に廃止予定)
// @description
// @description     すべてのレスポンスヘッダーに `X-API-Version: v1` が含まれます。
// @termsOfService  http://swagger.io/terms/

// @contact.name   PetMatch API Support
// @contact.email  support@petmatch.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /api/v1

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize structured logger
	logLevel := logger.InfoLevel
	if cfg.Env == "development" {
		logLevel = logger.DebugLevel
	}

	if err := logger.Initialize(logger.Config{
		Level:      logLevel,
		JSONFormat: cfg.Env == "production",
		Service:    "auth-service",
	}); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Close()

	logger.Info("Auth service starting", logger.String("env", cfg.Env), logger.String("port", cfg.Port))

	// Register custom validators
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := customValidator.RegisterCustomValidators(v); err != nil {
			logger.Fatal("Failed to register custom validators", logger.Err(err))
		}
		logger.Info("Custom validators registered successfully")
	}

	// Initialize Redis connection
	redisClient := utils.NewRedisClient(cfg)
	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Printf("Failed to close redis client: %v", err)
		}
	}()

	// Initialize services
	userService := services.NewUserService(redisClient, cfg)
	authService := services.NewAuthService(userService, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, cfg)

	// Setup router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.RequestIDMiddleware())
	router.Use(middleware.ErrorHandlerMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.StructuredLoggingMiddleware())

	// Middleware to add API version header
	router.Use(func(c *gin.Context) {
		c.Header("X-API-Version", "v1")
		c.Next()
	})

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check (no versioning for health endpoints)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "auth-service", "version": "v1"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "service": "auth-service", "version": "v1"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.RefreshToken)
			authGroup.POST("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)
			authGroup.GET("/profile", middleware.AuthMiddleware(cfg), authHandler.GetProfile)
			authGroup.PUT("/profile", middleware.AuthMiddleware(cfg), authHandler.UpdateProfile)
			authGroup.PUT("/password", middleware.AuthMiddleware(cfg), authHandler.UpdatePassword)
			authGroup.GET("/verify", middleware.AuthMiddleware(cfg), authHandler.VerifyToken)
		}
	}

	// Legacy routes (backward compatibility) - will be deprecated
	legacyAuth := router.Group("/auth")
	{
		legacyAuth.Use(func(c *gin.Context) {
			c.Header("Deprecation", "true")
			c.Header("Sunset", "Sun, 01 Jun 2025 00:00:00 GMT")
			c.Next()
		})
		legacyAuth.POST("/register", authHandler.Register)
		legacyAuth.POST("/login", authHandler.Login)
		legacyAuth.POST("/refresh", authHandler.RefreshToken)
		legacyAuth.POST("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)
		legacyAuth.GET("/profile", middleware.AuthMiddleware(cfg), authHandler.GetProfile)
		legacyAuth.GET("/verify", middleware.AuthMiddleware(cfg), authHandler.VerifyToken)
	}

	// 404 handler
	router.NoRoute(middleware.NotFoundHandler())

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8081"
	}

	log.Printf("Auth service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
