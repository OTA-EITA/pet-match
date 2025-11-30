package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/handlers"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

// SetupPetRoutes sets up all pet-related routes
func SetupPetRoutes(
	r *gin.Engine,
	petProxy *handlers.PetProxy,
	authMiddleware *middleware.AuthMiddleware,
) {
	// API group for pets
	api := r.Group("/api")
	{
		pets := api.Group("/pets")
		{
			// Public routes
			pets.GET("", petProxy.GetPets)                    // GET /api/pets
			pets.GET("/:id", petProxy.GetPet)                 // GET /api/pets/:id
			pets.GET("/search", petProxy.SearchPets)          // GET /api/pets/search

			// Image routes
			images := pets.Group("/:id/images")
			{
				// Public image viewing
				images.GET("", petProxy.GetPetImages)             // GET /api/pets/:id/images
				images.GET("/health", petProxy.GetImageHealth)    // GET /api/pets/:id/images/health (MinIO health check)

				// Image upload/delete (temporarily public for development)
				images.POST("", petProxy.UploadPetImage)          // POST /api/pets/:id/images
				images.DELETE("/:image_id", petProxy.DeletePetImage) // DELETE /api/pets/:id/images/:image_id
			}

			// Protected routes (require authentication)
			protected := pets.Group("")
			protected.Use(authMiddleware.RequireAuth())
			{
				// Pet CRUD operations (Shelter or Individual)
				protected.POST("",
					authMiddleware.RequireRoles("shelter", "individual"),
					petProxy.CreatePet)                       // POST /api/pets

				protected.PUT("/:id",
					authMiddleware.RequireRoles("shelter", "individual"),
					petProxy.UpdatePet)                       // PUT /api/pets/:id

				protected.DELETE("/:id",
					authMiddleware.RequireRoles("shelter", "individual"),
					petProxy.DeletePet)                       // DELETE /api/pets/:id

				protected.POST("/migrate",
					authMiddleware.RequireRoles("shelter", "individual"),
					petProxy.MigratePets)                     // POST /api/pets/migrate

				// Favorites (all authenticated users)
				protected.POST("/:id/favorite", petProxy.AddToFavorites)     // POST /api/pets/:id/favorite
				protected.DELETE("/:id/favorite", petProxy.RemoveFromFavorites) // DELETE /api/pets/:id/favorite
				protected.GET("/favorites", petProxy.GetFavorites)           // GET /api/pets/favorites

				// Applications (all authenticated users can create, shelters/individual can view/update)
				protected.POST("/:id/application", petProxy.CreateApplication)     // POST /api/pets/:id/application

				// Pet owner application management (Shelter or Individual)
				ownerOnly := protected.Group("")
				ownerOnly.Use(authMiddleware.RequireRoles("shelter", "individual"))
				{
					ownerOnly.GET("/:id/applications", petProxy.GetPetApplications)      // GET /api/pets/:id/applications
					ownerOnly.PUT("/:id/applications/:app_id", petProxy.UpdateApplication) // PUT /api/pets/:id/applications/:app_id
				}
			}
		}
	}
}
