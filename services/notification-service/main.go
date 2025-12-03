package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/notification-service/handlers"
	"github.com/petmatch/app/services/notification-service/repository"
	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/models"
)

// internalAuthMiddleware reads X-User-ID header set by API gateway
// This is used for service-to-service communication where the API gateway
// has already validated the JWT and forwards user info in headers
func internalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		c.Set("user_id", userID)
		c.Next()
	}
}

func main() {
	// Initialize PostgreSQL
	if err := database.InitPostgreSQL(); err != nil {
		log.Fatalf("Failed to initialize PostgreSQL: %v", err)
	}

	// Auto-migrate Notification model
	if err := database.DB.AutoMigrate(&models.Notification{}); err != nil {
		log.Fatalf("Failed to migrate Notification model: %v", err)
	}

	// Initialize repository and handler
	repo := repository.NewNotificationRepository()
	handler := handlers.NewNotificationHandler(repo)

	// Setup Gin
	r := gin.Default()

	// Add CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "notification-service"})
	})

	// API routes
	api := r.Group("/api/v1")
	{
		notifications := api.Group("/notifications")
		{
			// Internal: Create notification (called by other services) - no auth required
			notifications.POST("", handler.Create)

			// User endpoints - require X-User-ID header from API gateway
			authGroup := notifications.Group("")
			authGroup.Use(internalAuthMiddleware())
			{
				// User: List notifications
				authGroup.GET("", handler.List)

				// User: Get unread count
				authGroup.GET("/unread-count", handler.GetUnreadCount)

				// User: Mark all as read
				authGroup.PUT("/mark-all-read", handler.MarkAllAsRead)

				// User: Mark single notification as read
				authGroup.PUT("/:id/read", handler.MarkAsRead)

				// User: Delete notification
				authGroup.DELETE("/:id", handler.Delete)
			}
		}
	}

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8086"
	}

	log.Printf("🔔 Notification Service starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
