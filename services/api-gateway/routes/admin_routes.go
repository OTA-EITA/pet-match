package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupAdminRoutes sets up admin-related routes
func SetupAdminRoutes(r *gin.Engine, proxy *handlers.AdminProxy, authMiddleware *middleware.AuthMiddleware) {
	admin := r.Group("/api/v1/admin")
	{
		// All admin routes require authentication and admin role
		admin.Use(authMiddleware.RequireAuth())
		admin.Use(authMiddleware.RequireRole("admin"))

		// Dashboard statistics
		admin.GET("/stats", proxy.GetStats)

		// User management
		admin.GET("/users", proxy.ListUsers)
		admin.PUT("/users/:id/status", proxy.UpdateUserStatus)

		// Pet management
		admin.GET("/pets", proxy.ListPets)
		admin.DELETE("/pets/:id", proxy.DeletePet)

		// Inquiry management
		admin.GET("/inquiries", proxy.ListInquiries)

		// Review management
		admin.DELETE("/reviews/:id", proxy.DeleteReview)
	}
}
