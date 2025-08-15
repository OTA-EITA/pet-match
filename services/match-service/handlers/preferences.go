package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
)

type PreferencesHandler struct {
	matchService *services.MatchService
	cfg          *config.Config
}

func NewPreferencesHandler(matchService *services.MatchService, cfg *config.Config) *PreferencesHandler {
	return &PreferencesHandler{
		matchService: matchService,
		cfg:          cfg,
	}
}

// SetPreferences handles POST /matches/preferences
// @Summary Set user preferences
// @Description Set or update user matching preferences
// @Tags Preferences
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.PreferenceRequest true "Preference request"
// @Success 200 {object} map[string]interface{} "Preferences saved successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /matches/preferences [post]
func (h *PreferencesHandler) SetPreferences(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.PreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	preferences, err := h.matchService.SetUserPreferences(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set preferences", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Preferences saved successfully",
		"preferences": preferences,
	})
}

// GetPreferences handles GET /matches/preferences
func (h *PreferencesHandler) GetPreferences(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	preferences, err := h.matchService.GetUserPreferences(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get preferences", "details": err.Error()})
		return
	}

	if preferences == nil {
		c.JSON(http.StatusOK, gin.H{
			"preferences": nil,
			"message":     "No preferences set",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"preferences": preferences,
	})
}

// UpdatePreferences handles PUT /matches/preferences
func (h *PreferencesHandler) UpdatePreferences(c *gin.Context) {
	// Reuse SetPreferences logic for updates
	h.SetPreferences(c)
}
