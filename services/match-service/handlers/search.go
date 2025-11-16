package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
)

type SearchHandler struct {
	searchService *services.SearchService
	cfg           *config.Config
}

func NewSearchHandler(searchService *services.SearchService, cfg *config.Config) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
		cfg:           cfg,
	}
}

// SearchCats handles GET /search/cats - search for cats
// @Summary Search for cats
// @Description Search for cats based on various filters
// @Tags Search
// @Accept json
// @Produce json
// @Param species query string false "Species (e.g., cat)"
// @Param breeds query []string false "Breeds"
// @Param age_min query int false "Minimum age"
// @Param age_max query int false "Maximum age"
// @Param gender query string false "Gender (male/female)"
// @Param size query string false "Size (small/medium/large)"
// @Param max_radius query int false "Maximum search radius in km"
// @Param good_with_kids query bool false "Good with kids"
// @Param good_with_pets query bool false "Good with pets"
// @Param special_needs query bool false "Has special needs"
// @Param available query bool false "Only available cats"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param sort_by query string false "Sort by (created_at/age/distance)" default(created_at)
// @Param sort_order query string false "Sort order (asc/desc)" default(desc)
// @Success 200 {object} models.SearchResponse "Search results"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /search/cats [get]
func (h *SearchHandler) SearchCats(c *gin.Context) {
	var query models.SearchQuery
	
	// Bind query parameters
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters", "details": err.Error()})
		return
	}

	// Set defaults
	query.SetDefaults()

	// Execute search
	response, err := h.searchService.SearchCats(c.Request.Context(), &query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetCatByID handles GET /search/cats/:id - get cat details
// @Summary Get cat by ID
// @Description Get detailed information about a specific cat
// @Tags Search
// @Produce json
// @Param id path string true "Cat ID"
// @Success 200 {object} map[string]interface{} "Cat details"
// @Failure 404 {object} map[string]interface{} "Cat not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /search/cats/{id} [get]
func (h *SearchHandler) GetCatByID(c *gin.Context) {
	catID := c.Param("id")
	if catID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cat ID is required"})
		return
	}

	cat, err := h.searchService.GetCatByID(c.Request.Context(), catID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cat not found", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cat)
}
