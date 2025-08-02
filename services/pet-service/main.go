package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/middleware"
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
	r.Use(middleware.LoggingMiddleware())
	r.Use(middleware.ErrorHandlingMiddleware())
	r.Use(middleware.CORSMiddleware())
}

func setupRoutes(r *gin.Engine, cfg *config.Config) {
	// Health check
	r.GET("/health", healthCheckHandler)

	// Pet routes
	setupPetRoutes(r, cfg)
}

func setupPetRoutes(r *gin.Engine, cfg *config.Config) {
	petRoutes := r.Group("/pets")
	{
		petRoutes.GET("", getPets)
		petRoutes.GET("/:id", getPet)

		// Protected routes
		protected := petRoutes.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.POST("", createPet)
			protected.PUT("/:id", updatePet)
			protected.DELETE("/:id", deletePet)
			protected.POST("/:id/images", uploadPetImage)
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
	})
}
