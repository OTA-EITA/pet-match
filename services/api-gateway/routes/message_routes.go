package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupMessageRoutes sets up message-related routes
func SetupMessageRoutes(r *gin.Engine, messageProxy *handlers.MessageProxy, authMiddleware *middleware.AuthMiddleware) {
	// All message routes require authentication
	messages := r.Group("/api/v1/messages", authMiddleware.RequireAuth())
	{
		messages.GET("/conversations", messageProxy.GetConversations)
		messages.GET("/unread-count", messageProxy.GetUnreadCount)
		messages.GET("/:inquiry_id", messageProxy.GetMessages)
		messages.POST("/:inquiry_id", messageProxy.SendMessage)
		messages.PUT("/:inquiry_id/read", messageProxy.MarkAsRead)
	}
}
