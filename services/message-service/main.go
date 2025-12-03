package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/message-service/handlers"
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
	// Initialize database
	if err := database.InitPostgreSQL(); err != nil {
		log.Printf("Warning: Failed to initialize database: %v", err)
	}

	// Auto migrate messages table
	if err := database.DB.AutoMigrate(&models.Message{}); err != nil {
		log.Printf("Warning: Failed to migrate messages table: %v", err)
	}

	// Initialize handlers
	messageHandler := handlers.NewMessageHandler()

	// Setup router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "message-service"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "service": "message-service"})
	})

	// API v1 routes (all require X-User-ID header from API gateway)
	v1 := router.Group("/api/v1", internalAuthMiddleware())
	{
		messages := v1.Group("/messages")
		{
			messages.GET("/conversations", messageHandler.GetConversations)
			messages.GET("/unread-count", messageHandler.GetUnreadCount)
			messages.GET("/:inquiry_id", messageHandler.GetMessages)
			messages.POST("/:inquiry_id", messageHandler.SendMessage)
			messages.PUT("/:inquiry_id/read", messageHandler.MarkAsRead)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8088"
	}

	log.Printf("Message service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
