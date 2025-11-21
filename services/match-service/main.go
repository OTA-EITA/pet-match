package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/handlers"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/utils"
)

// @title PetMatch Match Service API
// @version 1.0
// @description Match Service for PetMatch - handles pet matching, recommendations, and user preferences
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.petmatch.com/support
// @contact.email support@petmatch.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8084
// @BasePath /
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Redis connection
	redisClient := utils.NewRedisClient(cfg)
	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Printf("Failed to close redis client: %v", err)
		}
	}()

	// Initialize services
	searchService := services.NewSearchService(redisClient, cfg)
	applicationService := services.NewApplicationService(redisClient, cfg)
	suggestionService := services.NewSuggestionService(redisClient, cfg)
	matchService := services.NewMatchService(redisClient, cfg) // For favorites and preferences

	// Initialize handlers
	searchHandler := handlers.NewSearchHandler(searchService, cfg)
	applicationHandler := handlers.NewApplicationHandler(applicationService, cfg)
	suggestionHandler := handlers.NewSuggestionHandler(suggestionService, cfg)
	favoritesHandler := handlers.NewFavoritesHandler(matchService, cfg)
	preferencesHandler := handlers.NewPreferencesHandler(matchService, cfg)

	// Setup router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.ErrorHandlingMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "match-service"})
	})

	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready", "service": "match-service"})
	})

	// API documentation endpoint (embedded swagger spec)
	router.GET("/docs/swagger.json", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		// Return embedded swagger spec
		swaggerSpec := `{
    "schemes": ["http", "https"],
    "swagger": "2.0",
    "info": {
        "description": "Match Service for PetMatch - handles pet matching, recommendations, and user preferences",
        "title": "PetMatch Match Service API",
        "termsOfService": "http://swagger.io/terms/",
        "contact": {
            "name": "API Support",
            "url": "http://www.petmatch.com/support",
            "email": "support@petmatch.com"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        },
        "version": "1.0"
    },
    "host": "localhost:8084",
    "basePath": "/",
    "paths": {
        "/matches": {
            "post": {
                "security": [{ "BearerAuth": [] }],
                "description": "Find pet matches based on user criteria and preferences",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["Matching"],
                "summary": "Find pet matches for user",
                "responses": {
                    "200": { "description": "Successful match response" },
                    "400": { "description": "Invalid request" },
                    "401": { "description": "Unauthorized" },
                    "500": { "description": "Internal server error" }
                }
            }
        },
        "/matches/recommendations": {
            "get": {
                "security": [{ "BearerAuth": [] }],
                "description": "Get personalized pet recommendations based on user preferences",
                "produces": ["application/json"],
                "tags": ["Matching"],
                "summary": "Get personalized pet recommendations",
                "responses": {
                    "200": { "description": "Successful recommendations response" },
                    "401": { "description": "Unauthorized" },
                    "500": { "description": "Internal server error" }
                }
            }
        },
        "/matches/history": {
            "get": {
                "security": [{ "BearerAuth": [] }],
                "description": "Get user's match history with pagination and optional status filtering",
                "produces": ["application/json"],
                "tags": ["Matching"],
                "summary": "Get user's match history",
                "responses": {
                    "200": { "description": "Successful history response" },
                    "401": { "description": "Unauthorized" },
                    "500": { "description": "Internal server error" }
                }
            }
        }
    },
    "securityDefinitions": {
        "BearerAuth": {
            "description": "Type 'Bearer' followed by a space and JWT token",
            "type": "apiKey",
            "name": "Authorization",
            "in": "header"
        }
    }
}`
		c.String(200, swaggerSpec)
	})

	// Test endpoint (no auth required)
	router.GET("/test/search", func(c *gin.Context) {
		// Test Redis search directly
		result, err := redisClient.Do(c.Request.Context(), "FT.SEARCH", "pet-index", "*", "LIMIT", "0", "10").Result()
		if err != nil {
			c.JSON(500, gin.H{"error": "Redis search failed", "details": err.Error()})
			return
		}
		c.JSON(200, gin.H{"result": result})
	})

	// Test Redis connection
	router.GET("/test/redis", func(c *gin.Context) {
		// Test basic Redis connection
		pong, err := redisClient.Ping(c.Request.Context()).Result()
		if err != nil {
			c.JSON(500, gin.H{"error": "Redis ping failed", "details": err.Error()})
			return
		}
		
		// Test get a specific pet
		petData, err := redisClient.Get(c.Request.Context(), "pet:sample1").Result()
		if err != nil {
			c.JSON(500, gin.H{"ping": pong, "error": "Pet get failed", "details": err.Error()})
			return
		}
		
		c.JSON(200, gin.H{"ping": pong, "pet_data": petData})
	})

	// Test search service directly without auth
	router.GET("/test/search-service", func(c *gin.Context) {
		// Create test search query
		testQuery := &models.SearchQuery{
			Species: "cat",
			Limit: 5,
		}

		// Call search service directly
		response, err := searchService.SearchCats(c.Request.Context(), testQuery)
		if err != nil {
			c.JSON(500, gin.H{"error": "Search failed", "details": err.Error()})
			return
		}

		c.JSON(200, response)
	})

	// Add API version header
	router.Use(func(c *gin.Context) {
		c.Header("X-API-Version", "v1")
		c.Next()
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		setupMatchRoutes(v1, cfg, searchHandler, suggestionHandler, applicationHandler, favoritesHandler, preferencesHandler)
	}

	// Legacy routes (backward compatibility)
	legacy := router.Group("")
	legacy.Use(func(c *gin.Context) {
		c.Header("Deprecation", "true")
		c.Header("Sunset", "Sun, 01 Jun 2025 00:00:00 GMT")
		c.Next()
	})
	{
		setupMatchRoutes(legacy, cfg, searchHandler, suggestionHandler, applicationHandler, favoritesHandler, preferencesHandler)
	}

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8084"
	}

	log.Printf("Match service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupMatchRoutes(r gin.IRouter, cfg *config.Config, searchHandler *handlers.SearchHandler, suggestionHandler *handlers.SuggestionHandler, applicationHandler *handlers.ApplicationHandler, favoritesHandler *handlers.FavoritesHandler, preferencesHandler *handlers.PreferencesHandler) {
	// Search routes (public)
	searchGroup := r.Group("/search")
	{
		searchGroup.GET("/cats", searchHandler.SearchCats)
		searchGroup.GET("/cats/:id", searchHandler.GetCatByID)
	}

	// Suggestion routes (public)
	suggestionsGroup := r.Group("/suggestions")
	{
		suggestionsGroup.GET("/similar/:cat_id", suggestionHandler.GetSimilarCats)
		suggestionsGroup.GET("/nearby", suggestionHandler.GetNearbyCats)
		suggestionsGroup.GET("/new", suggestionHandler.GetNewCats)
	}

	// Application routes (requires authentication)
	applicationsGroup := r.Group("/applications")
	applicationsGroup.Use(middleware.AuthMiddleware(cfg))
	{
		applicationsGroup.POST("", applicationHandler.CreateApplication)
		applicationsGroup.GET("", applicationHandler.GetUserApplications)
		applicationsGroup.GET("/stats", applicationHandler.GetApplicationStatusCounts)
		applicationsGroup.GET("/:id", applicationHandler.GetApplication)
		applicationsGroup.PUT("/:id/status", applicationHandler.UpdateApplicationStatus)
		applicationsGroup.DELETE("/:id", applicationHandler.CancelApplication)
	}

	// Favorites and Preferences routes (requires authentication)
	matchGroup := r.Group("/matches")
	matchGroup.Use(middleware.AuthMiddleware(cfg))
	{
		// Favorites endpoints
		matchGroup.POST("/favorites", favoritesHandler.AddFavorite)
		matchGroup.GET("/favorites", favoritesHandler.GetFavorites)
		matchGroup.DELETE("/favorites/:pet_id", favoritesHandler.RemoveFavorite)

		// Preferences endpoints
		matchGroup.POST("/preferences", preferencesHandler.SetPreferences)
		matchGroup.GET("/preferences", preferencesHandler.GetPreferences)
		matchGroup.PUT("/preferences", preferencesHandler.UpdatePreferences)
	}
}
