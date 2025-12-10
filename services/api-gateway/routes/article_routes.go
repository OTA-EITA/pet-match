package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupArticleRoutes sets up article-related routes
func SetupArticleRoutes(r *gin.Engine, proxy *handlers.ArticleProxy, authMiddleware *middleware.AuthMiddleware) {
	// Public articles routes (no auth required)
	publicArticles := r.Group("/api/v1/articles")
	{
		publicArticles.GET("", proxy.ListPublicArticles)
		publicArticles.GET("/:id", proxy.GetPublicArticle)
	}

	// Admin articles routes (requires admin role)
	adminArticles := r.Group("/api/v1/admin/articles")
	{
		adminArticles.Use(authMiddleware.RequireAuth())
		adminArticles.Use(authMiddleware.RequireRole("admin"))

		adminArticles.GET("", proxy.ListAdminArticles)
		adminArticles.POST("", proxy.CreateArticle)
		adminArticles.GET("/:id", proxy.GetAdminArticle)
		adminArticles.PUT("/:id", proxy.UpdateArticle)
		adminArticles.DELETE("/:id", proxy.DeleteArticle)
	}
}
