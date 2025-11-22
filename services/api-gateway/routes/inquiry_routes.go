package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

func SetupInquiryRoutes(r *gin.Engine, inquiryProxy *handlers.InquiryProxy, authMiddleware *middleware.AuthMiddleware) {
	// API v1 inquiries routes
	v1 := r.Group("/api/v1/inquiries")
	v1.Use(authMiddleware.RequireAuth())
	{
		v1.POST("", inquiryProxy.ProxyRequest)
		v1.GET("", inquiryProxy.ProxyRequest)
	}
}
