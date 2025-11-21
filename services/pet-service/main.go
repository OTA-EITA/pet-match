package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/pet-service/handlers"
	"github.com/petmatch/app/services/pet-service/middleware"
	"github.com/petmatch/app/services/pet-service/storage"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/database"
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
	// Initialize PostgreSQL
	if err := database.InitPostgreSQL(); err != nil {
		return err
	}

	// Run database migrations
	if err := database.AutoMigrate(); err != nil {
		return err
	}

	// Initialize Redis (cache layer)
	if err := utils.InitRedis(cfg); err != nil {
		return err
	}

	// Setup Redis indexes
	if err := utils.SetupRedisIndexes(); err != nil {
		log.Printf("Warning: Failed to setup Redis indexes: %v", err)
	}

	// Initialize MinIO (optional for development)
	if err := initMinIO(); err != nil {
		log.Printf("Warning: MinIO not available, image upload will be disabled: %v", err)
	}

	return nil
}

func initMinIO() error {
	minioConfig := storage.MinioConfig{
		Endpoint:        getEnvOrDefault("MINIO_ENDPOINT", "localhost:9000"),
		AccessKeyID:     getEnvOrDefault("MINIO_ACCESS_KEY", "minioadmin"),
		SecretAccessKey: getEnvOrDefault("MINIO_SECRET_KEY", "minioadmin"),
		UseSSL:          getEnvOrDefault("MINIO_USE_SSL", "false") == "true",
	}

	if err := storage.InitMinio(minioConfig); err != nil {
		return err
	}

	log.Println("MinIO initialized successfully")
	return nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
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

	// Static file serving for uploaded images (legacy support)
	r.Static("/uploads", "./uploads")

	// Add API version header
	r.Use(func(c *gin.Context) {
		c.Header("X-API-Version", "v1")
		c.Next()
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		setupPetRoutes(v1, cfg)
	}

	// Legacy routes (backward compatibility)
	legacy := r.Group("")
	legacy.Use(func(c *gin.Context) {
		c.Header("Deprecation", "true")
		c.Header("Sunset", "Sun, 01 Jun 2025 00:00:00 GMT")
		c.Next()
	})
	{
		setupPetRoutes(legacy, cfg)
	}
}

func setupPetRoutes(r gin.IRouter, cfg *config.Config) {
	// Initialize handlers
	petHandler := handlers.NewPetHandler()
	imageHandler := handlers.NewImageHandler("./uploads") // uploadDir not used for MinIO

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
			imageRoutes.GET("/health", imageHandler.HealthCheck) // MinIO health check
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
	// Check PostgreSQL health
	if err := database.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	// Check Redis health
	if err := utils.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	// Check MinIO health (optional)
	minioHealthy := true
	if err := storage.HealthCheck(); err != nil {
		log.Printf("MinIO health check failed: %v", err)
		minioHealthy = false
	}

	response := gin.H{
		"status":  "healthy",
		"service": "pet-service",
		"version": "1.0.0",
		"features": []string{
			"pet-crud",
			"search-filter",
		},
		"storage": map[string]string{
			"database": "postgresql",
			"cache":    "redis",
		},
	}

	if minioHealthy {
		response["features"] = append(response["features"].([]string), "minio-image-upload")
		response["storage"].(map[string]string)["images"] = "minio"
	} else {
		response["storage"].(map[string]string)["images"] = "disabled"
	}

	c.JSON(http.StatusOK, response)
}
