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
	matchService := services.NewMatchService(redisClient, cfg)
	algorithmService := services.NewAlgorithmService(cfg)
	scoringService := services.NewScoringService(cfg)

	// Initialize handlers
	matchHandler := handlers.NewMatchHandler(matchService, algorithmService, scoringService, cfg)
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

	// Test service directly without auth
	router.GET("/test/match", func(c *gin.Context) {
		// Create test match request
		testReq := &models.MatchRequest{
			UserID: "test-user",
			Species: "dog",
			Limit: 5,
		}
		
		// Call match service directly
		response, err := matchService.FindMatches(c.Request.Context(), testReq)
		if err != nil {
			c.JSON(500, gin.H{"error": "Match failed", "details": err.Error()})
			return
		}
		
		c.JSON(200, response)
	})

	// Match routes
	matchGroup := router.Group("/matches")
	{
		// All match endpoints require authentication
		matchGroup.Use(middleware.AuthMiddleware(cfg))
		
		// Matching endpoints
		matchGroup.POST("/", matchHandler.FindMatches)
		matchGroup.GET("/recommendations", matchHandler.GetRecommendations)
		matchGroup.GET("/history", matchHandler.GetMatchHistory)
		matchGroup.PUT("/:match_id/status", matchHandler.UpdateMatchStatus)
		
		// Favorites endpoints
		matchGroup.POST("/favorites", favoritesHandler.AddFavorite)
		matchGroup.GET("/favorites", favoritesHandler.GetFavorites)
		matchGroup.DELETE("/favorites/:pet_id", favoritesHandler.RemoveFavorite)
		
		// Preferences endpoints
		matchGroup.POST("/preferences", preferencesHandler.SetPreferences)
		matchGroup.GET("/preferences", preferencesHandler.GetPreferences)
		matchGroup.PUT("/preferences", preferencesHandler.UpdatePreferences)
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
