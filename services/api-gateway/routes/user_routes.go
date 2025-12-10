package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
)

// SetupUserRoutes sets up user-related routes
func SetupUserRoutes(r *gin.Engine, userProxy *handlers.UserProxy, petServiceURL string) {
	// Public user routes (no authentication required)
	users := r.Group("/api/users")
	{
		// Public profile for shelters/individuals
		users.GET("/:id/profile", userProxy.GetPublicProfile)
		// Get pets by owner
		users.GET("/:id/pets", userProxy.GetUserPets(petServiceURL))
	}

	// Shelters routes
	r.GET("/api/shelters", userProxy.ListShelters)
}
