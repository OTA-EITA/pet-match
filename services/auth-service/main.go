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
// @termsOfService  http://swagger.io/terms/

// @contact.name   PetMatch API Support
// @contact.email  support@petmatch.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /

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

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "auth-service"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "service": "auth-service"})
	})

	// Auth routes
	authGroup := router.Group("/auth")
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/refresh", authHandler.RefreshToken)
		authGroup.POST("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)
		authGroup.GET("/profile", middleware.AuthMiddleware(cfg), authHandler.GetProfile)
		authGroup.GET("/verify", middleware.AuthMiddleware(cfg), authHandler.VerifyToken) // トークン検証エンドポイントを追加
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
