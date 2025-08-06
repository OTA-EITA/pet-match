package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/auth-service/handlers"
	"github.com/petmatch/app/services/auth-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Redis connection
	redisClient := utils.NewRedisClient(cfg)
	defer redisClient.Close()

	// Initialize services
	userService := services.NewUserService(redisClient, cfg)
	authService := services.NewAuthService(userService, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, cfg)

	// Setup router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

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
	}

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
