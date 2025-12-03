package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupNotificationRoutes sets up notification-related routes
func SetupNotificationRoutes(r *gin.Engine, proxy *handlers.NotificationProxy, authMiddleware *middleware.AuthMiddleware) {
	notifications := r.Group("/api/v1/notifications")
	{
		// All notification routes require authentication
		notifications.Use(authMiddleware.RequireAuth())

		// List notifications
		notifications.GET("", proxy.List)

		// Get unread count
		notifications.GET("/unread-count", proxy.GetUnreadCount)

		// Mark all as read
		notifications.PUT("/mark-all-read", proxy.MarkAllAsRead)

		// Mark single notification as read
		notifications.PUT("/:id/read", proxy.MarkAsRead)

		// Delete notification
		notifications.DELETE("/:id", proxy.Delete)
	}
}
