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
	defer redisClient.Close()

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

	// User routes (protected)
	userGroup := router.Group("/users", middleware.AuthMiddleware(cfg))
	{
		userGroup.GET("/profile", userHandler.GetProfile)
		userGroup.PUT("/profile", userHandler.UpdateProfile)
		userGroup.GET("/", userHandler.ListUsers)
		userGroup.GET("/:id", userHandler.GetUser)
		userGroup.DELETE("/:id", userHandler.DeleteUser)
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
