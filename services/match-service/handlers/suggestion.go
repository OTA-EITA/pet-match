package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
)

type SuggestionHandler struct {
	suggestionService *services.SuggestionService
	cfg               *config.Config
}

func NewSuggestionHandler(suggestionService *services.SuggestionService, cfg *config.Config) *SuggestionHandler {
	return &SuggestionHandler{
		suggestionService: suggestionService,
		cfg:               cfg,
	}
}

// GetSimilarCats handles GET /suggestions/similar/:cat_id - get similar cats
// @Summary Get similar cats
// @Description Get cats similar to a specified cat based on breed, age, size, and personality
// @Tags Suggestions
// @Produce json
// @Param cat_id path string true "Cat ID"
// @Param limit query int false "Number of suggestions" default(10)
// @Success 200 {object} models.SuggestionResponse "Similar cats"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 404 {object} map[string]interface{} "Cat not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /suggestions/similar/{cat_id} [get]
func (h *SuggestionHandler) GetSimilarCats(c *gin.Context) {
	catID := c.Param("cat_id")
	if catID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cat ID is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}

	response, err := h.suggestionService.GetSimilarCats(c.Request.Context(), catID, limit)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Failed to get similar cats", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetNearbyCats handles GET /suggestions/nearby - get nearby cats
// @Summary Get nearby cats
// @Description Get cats near a specified location
// @Tags Suggestions
// @Produce json
// @Param latitude query float64 true "Latitude"
// @Param longitude query float64 true "Longitude"
// @Param limit query int false "Number of suggestions" default(10)
// @Success 200 {object} models.SuggestionResponse "Nearby cats"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /suggestions/nearby [get]
func (h *SuggestionHandler) GetNearbyCats(c *gin.Context) {
	latStr := c.Query("latitude")
	lngStr := c.Query("longitude")

	if latStr == "" || lngStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Latitude and longitude are required"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid latitude"})
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid longitude"})
		return
	}

	location := &models.Location{
		Latitude:  lat,
		Longitude: lng,
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}

	response, err := h.suggestionService.GetNearbyCats(c.Request.Context(), location, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get nearby cats", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetNewCats handles GET /suggestions/new - get newly added cats
// @Summary Get new cats
// @Description Get recently added cats (within last 30 days)
// @Tags Suggestions
// @Produce json
// @Param limit query int false "Number of suggestions" default(10)
// @Success 200 {object} models.SuggestionResponse "New cats"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /suggestions/new [get]
func (h *SuggestionHandler) GetNewCats(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}

	response, err := h.suggestionService.GetNewCats(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get new cats", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
