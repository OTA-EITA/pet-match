package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"github.com/petmatch/app/services/inquiry-service/handlers"
	"github.com/petmatch/app/services/inquiry-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/logger"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
	customValidator "github.com/petmatch/app/shared/validator"
)

func main() {
	cfg := config.Load()

	logLevel := logger.InfoLevel
	if cfg.Env == "development" {
		logLevel = logger.DebugLevel
	}

	if err := logger.Initialize(logger.Config{
		Level:      logLevel,
		JSONFormat: cfg.Env == "production",
		Service:    "inquiry-service",
	}); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Close()

	logger.Info("Inquiry service starting", logger.String("env", cfg.Env), logger.String("port", cfg.Port))

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := customValidator.RegisterCustomValidators(v); err != nil {
			logger.Fatal("Failed to register custom validators", logger.Err(err))
		}
		logger.Info("Custom validators registered successfully")
	}

	redisClient := utils.NewRedisClient(cfg)
	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Printf("Failed to close redis client: %v", err)
		}
	}()

	inquiryService := services.NewInquiryService(redisClient, cfg)
	inquiryHandler := handlers.NewInquiryHandler(inquiryService, cfg)

	router := gin.Default()
	router.Use(middleware.RequestIDMiddleware())
	router.Use(middleware.ErrorHandlerMiddleware())
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.StructuredLoggingMiddleware())

	router.Use(func(c *gin.Context) {
		c.Header("X-API-Version", "v1")
		c.Next()
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "inquiry-service", "version": "v1"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "service": "inquiry-service", "version": "v1"})
	})

	v1 := router.Group("/api/v1")
	{
		inquiryGroup := v1.Group("/inquiries")
		inquiryGroup.Use(middleware.AuthMiddleware(cfg))
		{
			// All authenticated users
			inquiryGroup.POST("", inquiryHandler.CreateInquiry)
			inquiryGroup.GET("", inquiryHandler.GetUserInquiries)
			inquiryGroup.GET("/:id", inquiryHandler.GetInquiry)

			// Pet owners (shelter/individual) - received inquiries
			inquiryGroup.GET("/received", inquiryHandler.GetReceivedInquiries)
			inquiryGroup.PUT("/:id/status", inquiryHandler.UpdateInquiryStatus)
			inquiryGroup.POST("/:id/reply", inquiryHandler.ReplyToInquiry)
		}
	}

	router.NoRoute(middleware.NotFoundHandler())

	port := cfg.Port
	if port == "" {
		port = "8083"
	}

	log.Printf("Inquiry service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
