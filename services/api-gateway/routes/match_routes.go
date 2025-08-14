package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupMatchRoutes sets up the routes for match service
func SetupMatchRoutes(r *gin.Engine, matchProxy *handlers.MatchProxy, authMiddleware *middleware.AuthMiddleware) {
	api := r.Group("/api")
	
	matchGroup := api.Group("/matches")
	{
		// All match endpoints require authentication
		matchGroup.Use(authMiddleware.RequireAuth())
		
		// Matching endpoints
		matchGroup.POST("/", matchProxy.FindMatches)
		matchGroup.GET("/recommendations", matchProxy.GetRecommendations)
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
