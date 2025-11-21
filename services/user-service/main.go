package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/user-service/handlers"
	"github.com/petmatch/app/services/user-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Redis connection
	redisClient := utils.NewRedisClient(cfg)
	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Printf("Failed to close redis client: %v", err)
		}
	}()

	// Initialize services
	userService := services.NewUserService(redisClient, cfg)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService, cfg)

	// Setup router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "user-service"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "service": "user-service"})
	})

	// Add API version header
	router.Use(func(c *gin.Context) {
		c.Header("X-API-Version", "v1")
		c.Next()
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		userGroup := v1.Group("/users", middleware.AuthMiddleware(cfg))
		{
			userGroup.GET("/profile", userHandler.GetProfile)
			userGroup.PUT("/profile", userHandler.UpdateProfile)
			userGroup.GET("/", userHandler.ListUsers)
			userGroup.GET("/:id", userHandler.GetUser)
			userGroup.DELETE("/:id", userHandler.DeleteUser)
		}
	}

	// Legacy routes (backward compatibility)
	legacy := router.Group("")
	legacy.Use(func(c *gin.Context) {
		c.Header("Deprecation", "true")
		c.Header("Sunset", "Sun, 01 Jun 2025 00:00:00 GMT")
		c.Next()
	})
	{
		userGroup := legacy.Group("/users", middleware.AuthMiddleware(cfg))
		{
			userGroup.GET("/profile", userHandler.GetProfile)
			userGroup.PUT("/profile", userHandler.UpdateProfile)
			userGroup.GET("/", userHandler.ListUsers)
			userGroup.GET("/:id", userHandler.GetUser)
			userGroup.DELETE("/:id", userHandler.DeleteUser)
		}
	}

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8082"
	}

	log.Printf("User service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
