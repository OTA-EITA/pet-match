package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/review-service/handlers"
	"github.com/petmatch/app/services/review-service/repository"
	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
)

func main() {
	// Initialize PostgreSQL
	if err := database.InitPostgreSQL(); err != nil {
		log.Fatalf("Failed to initialize PostgreSQL: %v", err)
	}

	// Auto-migrate Review model
	if err := database.DB.AutoMigrate(&models.Review{}); err != nil {
		log.Fatalf("Failed to migrate Review model: %v", err)
	}

	// Initialize repository and handler
	repo := repository.NewReviewRepository()
	handler := handlers.NewReviewHandler(repo)

	// Setup Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "review-service"})
	})

	// API routes
	api := r.Group("/api/v1")
	{
		reviews := api.Group("/reviews")
		{
			// Create review (authenticated)
			reviews.POST("", handler.Create)

			// Get my reviews (authenticated)
			reviews.GET("/my", handler.ListMyReviews)

			// Get review by ID (public)
			reviews.GET("/:id", handler.GetByID)

			// Update review (authenticated, owner only)
			reviews.PUT("/:id", handler.Update)

			// Delete review (authenticated, owner only)
			reviews.DELETE("/:id", handler.Delete)

			// Add response to review (authenticated, target owner only)
			reviews.POST("/:id/response", handler.AddResponse)
		}

		// Reviews for a specific target (public)
		targets := api.Group("/shelters")
		{
			targets.GET("/:target_id/reviews", handler.ListByTarget)
			targets.GET("/:target_id/reviews/summary", handler.GetSummary)
		}
	}

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	log.Printf("⭐ Review Service starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
