package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupReviewRoutes sets up review-related routes
func SetupReviewRoutes(r *gin.Engine, proxy *handlers.ReviewProxy, authMiddleware *middleware.AuthMiddleware) {
	// Review routes
	reviews := r.Group("/api/v1/reviews")
	{
		// Create review (authenticated)
		reviews.POST("", authMiddleware.RequireAuth(), proxy.Create)

		// Get my reviews (authenticated)
		reviews.GET("/my", authMiddleware.RequireAuth(), proxy.ListMyReviews)

		// Get review by ID (public)
		reviews.GET("/:id", proxy.GetByID)

		// Update review (authenticated)
		reviews.PUT("/:id", authMiddleware.RequireAuth(), proxy.Update)

		// Delete review (authenticated)
		reviews.DELETE("/:id", authMiddleware.RequireAuth(), proxy.Delete)

		// Add response to review (authenticated)
		reviews.POST("/:id/response", authMiddleware.RequireAuth(), proxy.AddResponse)
	}

	// Reviews for a specific target (public)
	shelterReviews := r.Group("/api/v1/shelters")
	{
		shelterReviews.GET("/:target_id/reviews", proxy.ListByTarget)
		shelterReviews.GET("/:target_id/reviews/summary", proxy.GetSummary)
	}
}
