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

	// Initialize handlers
	handler := handlers.NewAdminHandler()
	articleHandler := handlers.NewArticleHandler()

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

		// Report management
		api.GET("/reports", handler.ListReports)
		api.PUT("/reports/:id/status", handler.UpdateReportStatus)
	}

	// User-facing reports API (needs auth middleware in api-gateway)
	reports := r.Group("/api/v1/reports")
	{
		reports.POST("", handler.CreateReport)
	}

	// Article management (admin)
	articles := api.Group("/articles")
	{
		articles.GET("", articleHandler.ListArticles)
		articles.POST("", articleHandler.CreateArticle)
		articles.GET("/:id", articleHandler.GetArticle)
		articles.PUT("/:id", articleHandler.UpdateArticle)
		articles.DELETE("/:id", articleHandler.DeleteArticle)
	}

	// Public articles API
	publicArticles := r.Group("/api/v1/articles")
	{
		publicArticles.GET("", articleHandler.ListPublicArticles)
		publicArticles.GET("/:id", articleHandler.GetPublicArticle)
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
