package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"github.com/petmatch/app/services/auth-service/handlers"
	"github.com/petmatch/app/services/auth-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/logger"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
	customValidator "github.com/petmatch/app/shared/validator"
)

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
