package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
)

type FavoritesHandler struct {
	matchService *services.MatchService
	cfg          *config.Config
}

func NewFavoritesHandler(matchService *services.MatchService, cfg *config.Config) *FavoritesHandler {
	return &FavoritesHandler{
		matchService: matchService,
		cfg:          cfg,
	}
}

// AddFavorite handles POST /matches/favorites
// @Summary Add pet to favorites
// @Description Add a pet to user's favorites list
// @Tags Favorites
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.FavoriteRequest true "Favorite request"
// @Success 201 {object} map[string]interface{} "Favorite added successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /matches/favorites [post]
func (h *FavoritesHandler) AddFavorite(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.FavoriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	favorite, err := h.matchService.AddFavorite(c.Request.Context(), userID.(string), req.PetID, req.Note)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add favorite", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Favorite added successfully",
		"favorite": favorite,
	})
}

// GetFavorites handles GET /matches/favorites
func (h *FavoritesHandler) GetFavorites(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	response, err := h.matchService.GetFavorites(c.Request.Context(), userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get favorites", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RemoveFavorite handles DELETE /matches/favorites/:pet_id
func (h *FavoritesHandler) RemoveFavorite(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	petID := c.Param("pet_id")
	if petID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pet ID is required"})
		return
	}

	err := h.matchService.RemoveFavorite(c.Request.Context(), userID.(string), petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove favorite", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Favorite removed successfully",
	})
}

// GetFavoritesCount handles GET /matches/favorites/count/:pet_id (public)
func (h *FavoritesHandler) GetFavoritesCount(c *gin.Context) {
	petID := c.Param("pet_id")
	if petID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pet ID is required"})
		return
	}

	count, err := h.matchService.GetPetFavoritesCount(c.Request.Context(), petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get favorites count", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pet_id": petID,
		"count":  count,
	})
}

// GetFavoritesCounts handles POST /matches/favorites/counts (public)
func (h *FavoritesHandler) GetFavoritesCounts(c *gin.Context) {
	var req struct {
		PetIDs []string `json:"pet_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	counts, err := h.matchService.GetPetsFavoritesCounts(c.Request.Context(), req.PetIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get favorites counts", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"counts": counts,
	})
}

// GetSimilarPets handles GET /matches/recommendations/similar/:pet_id (public)
func (h *FavoritesHandler) GetSimilarPets(c *gin.Context) {
	petID := c.Param("pet_id")
	if petID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pet ID is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "6")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 6
	}
	if limit > 20 {
		limit = 20
	}

	pets, err := h.matchService.GetSimilarPets(c.Request.Context(), petID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get similar pets", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pets":  pets,
		"count": len(pets),
	})
}

// GetRecommendedPets handles GET /matches/recommendations (requires auth)
func (h *FavoritesHandler) GetRecommendedPets(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	pets, err := h.matchService.GetRecommendedPets(c.Request.Context(), userID.(string), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pets":  pets,
		"count": len(pets),
	})
}
