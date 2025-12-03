package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/admin-service/handlers"
	"github.com/petmatch/app/shared/database"
)

func main() {
	// Initialize PostgreSQL
	if err := database.InitPostgreSQL(); err != nil {
		log.Fatalf("Failed to initialize PostgreSQL: %v", err)
	}

	// Initialize handler
	handler := handlers.NewAdminHandler()

	// Setup Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "admin-service"})
	})

	// API routes
	api := r.Group("/api/v1/admin")
	{
		// Dashboard statistics
		api.GET("/stats", handler.GetStats)

		// User management
		api.GET("/users", handler.ListUsers)
		api.PUT("/users/:id/status", handler.UpdateUserStatus)

		// Pet management
		api.GET("/pets", handler.ListPets)
		api.DELETE("/pets/:id", handler.DeletePet)

		// Inquiry management
		api.GET("/inquiries", handler.ListInquiries)

		// Review management
		api.DELETE("/reviews/:id", handler.DeleteReview)
	}

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8091"
	}

	log.Printf("🛡️ Admin Service starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
