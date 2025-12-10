package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupMatchRoutes sets up the routes for match service
func SetupMatchRoutes(r *gin.Engine, matchProxy *handlers.MatchProxy, authMiddleware *middleware.AuthMiddleware) {
	api := r.Group("/api")

	// Public match endpoints (no auth required)
	publicMatchGroup := api.Group("/matches")
	{
		// Favorites count endpoints (public for sorting)
		publicMatchGroup.GET("/favorites/count/:pet_id", matchProxy.GetFavoritesCount)
		publicMatchGroup.POST("/favorites/counts", matchProxy.GetFavoritesCounts)
		// Similar pets recommendation (public)
		publicMatchGroup.GET("/recommendations/similar/:pet_id", matchProxy.GetSimilarPets)
	}

	matchGroup := api.Group("/matches")
	{
		// All match endpoints require authentication
		matchGroup.Use(authMiddleware.RequireAuth())

		// Matching endpoints
		matchGroup.POST("/", matchProxy.FindMatches)
		matchGroup.GET("/recommendations", matchProxy.GetPersonalizedRecommendations)
		matchGroup.GET("/history", matchProxy.GetMatchHistory)

		// Favorites endpoints
		matchGroup.POST("/favorites", matchProxy.AddFavorite)
		matchGroup.GET("/favorites", matchProxy.GetFavorites)
		matchGroup.DELETE("/favorites/:pet_id", matchProxy.RemoveFavorite)

		// Preferences endpoints
		matchGroup.POST("/preferences", matchProxy.SetPreferences)
		matchGroup.GET("/preferences", matchProxy.GetPreferences)
		matchGroup.PUT("/preferences", matchProxy.UpdatePreferences)
	}
}
