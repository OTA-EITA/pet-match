package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/pet-service/handlers"
	"github.com/petmatch/app/services/pet-service/middleware"
	"github.com/petmatch/app/shared/config"
	sharedMiddleware "github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize services
	if err := initializeServices(cfg); err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}

	// Setup Gin router
	router := setupRouter(cfg)

	// Start server
	log.Printf("Pet Service starting on port %s", cfg.Port)
	log.Fatal(router.Run(":" + cfg.Port))
}

func initializeServices(cfg *config.Config) error {
	// Initialize Redis
	if err := utils.InitRedis(cfg); err != nil {
		return err
	}

	// Setup Redis indexes
	if err := utils.SetupRedisIndexes(); err != nil {
		log.Printf("Warning: Failed to setup Redis indexes: %v", err)
	}

	return nil
}

func setupRouter(cfg *config.Config) *gin.Engine {
	// Initialize Gin
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Apply middleware
	applyMiddleware(r)

	// Setup routes
	setupRoutes(r, cfg)

	return r
}

func applyMiddleware(r *gin.Engine) {
	r.Use(sharedMiddleware.LoggingMiddleware())
	r.Use(sharedMiddleware.ErrorHandlingMiddleware())
	r.Use(sharedMiddleware.CORSMiddleware())
	r.Use(middleware.FileUploadMiddleware())
}

func setupRoutes(r *gin.Engine, cfg *config.Config) {
	// Health check
	r.GET("/health", healthCheckHandler)

	// Static file serving for uploaded images
	r.Static("/uploads", "./uploads")

	// Pet routes
	setupPetRoutes(r, cfg)
}

func setupPetRoutes(r *gin.Engine, cfg *config.Config) {
	// Initialize handlers
	petHandler := handlers.NewPetHandler()
	imageHandler := handlers.NewImageHandler("./uploads")

	petRoutes := r.Group("/pets")
	{
		// Public routes with optional auth (to support owner=me filtering)
		petRoutes.GET("", sharedMiddleware.OptionalAuthMiddleware(cfg), petHandler.GetPets)
		petRoutes.GET("/:id", petHandler.GetPet)
		petRoutes.GET("/:id/images", imageHandler.GetPetImages)
		
		// Image upload operations (temporarily public for development)
		imageRoutes := petRoutes.Group("/:id/images")
		imageRoutes.Use(middleware.ImageUploadMiddleware())
		{
			imageRoutes.POST("", imageHandler.UploadPetImage)
			imageRoutes.DELETE("/:image_id", imageHandler.DeletePetImage)
		}
		
		// Migration endpoint (for development/admin use)
		petRoutes.POST("/migrate", petHandler.MigrateAllPets)

		// Protected routes (require authentication)
		protected := petRoutes.Group("")
		protected.Use(sharedMiddleware.AuthMiddleware(cfg))
		{
			// Pet CRUD operations
			protected.POST("", petHandler.CreatePet)
			protected.PUT("/:id", petHandler.UpdatePet)
			protected.DELETE("/:id", petHandler.DeletePet)
		}
	}
}

func healthCheckHandler(c *gin.Context) {
	if err := utils.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "pet-service",
		"version": "1.0.0",
		"features": []string{
			"pet-crud",
			"image-upload",
			"search-filter",
		},
	})
}
