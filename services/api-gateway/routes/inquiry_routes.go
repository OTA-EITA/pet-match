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
		// All authenticated users can create and view their sent inquiries
		v1.POST("", inquiryProxy.CreateInquiry)        // Create inquiry (with pet owner lookup)
		v1.GET("", inquiryProxy.ProxyRequest)          // Get sent inquiries
		v1.GET("/:id", inquiryProxy.ProxyRequest)      // Get inquiry details

		// Shelter/Individual can view received inquiries and update status
		ownerRoutes := v1.Group("")
		ownerRoutes.Use(authMiddleware.RequireRoles("shelter", "individual"))
		{
			ownerRoutes.GET("/received", inquiryProxy.ProxyRequest)           // Get received inquiries
			ownerRoutes.PUT("/:id/status", inquiryProxy.ProxyRequest)         // Update inquiry status
			ownerRoutes.POST("/:id/reply", inquiryProxy.ProxyRequest)         // Reply to inquiry
		}
	}

	// Legacy routes (without v1)
	legacy := r.Group("/api/inquiries")
	legacy.Use(authMiddleware.RequireAuth())
	{
		legacy.POST("", inquiryProxy.CreateInquiry)
		legacy.GET("", inquiryProxy.ProxyRequest)
		legacy.GET("/:id", inquiryProxy.ProxyRequest)

		ownerLegacy := legacy.Group("")
		ownerLegacy.Use(authMiddleware.RequireRoles("shelter", "individual"))
		{
			ownerLegacy.GET("/received", inquiryProxy.ProxyRequest)
			ownerLegacy.PUT("/:id/status", inquiryProxy.ProxyRequest)
			ownerLegacy.POST("/:id/reply", inquiryProxy.ProxyRequest)
		}
	}
}
