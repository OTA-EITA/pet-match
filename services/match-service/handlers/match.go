package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
)

type MatchHandler struct {
	matchService     *services.MatchService
	algorithmService *services.AlgorithmService
	scoringService   *services.ScoringService
	cfg              *config.Config
}

func NewMatchHandler(matchService *services.MatchService, algorithmService *services.AlgorithmService, scoringService *services.ScoringService, cfg *config.Config) *MatchHandler {
	return &MatchHandler{
		matchService:     matchService,
		algorithmService: algorithmService,
		scoringService:   scoringService,
		cfg:              cfg,
	}
}

// FindMatches handles POST /matches - find matches for user
// @Summary Find pet matches for user
// @Description Find pet matches based on user criteria and preferences
// @Tags Matching
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.MatchRequest true "Match search criteria"
// @Success 200 {object} models.MatchResponse "Successful match response"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /matches [post]
func (h *MatchHandler) FindMatches(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.MatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Set user ID from auth context
	req.UserID = userID.(string)

	// Set default limit if not provided
	if req.Limit == 0 {
		req.Limit = 20
	}

	// Find matches
	response, err := h.matchService.FindMatches(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find matches", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateMatchStatus handles PUT /matches/:match_id/status - update match status
// @Summary Update match status
// @Description Update the status of a specific match
// @Tags Matching
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param match_id path string true "Match ID"
// @Param request body models.UpdateMatchStatusRequest true "Status update request"
// @Success 200 {object} map[string]interface{} "Status updated successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /matches/{match_id}/status [put]
func (h *MatchHandler) UpdateMatchStatus(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	matchID := c.Param("match_id")
	if matchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Match ID is required"})
		return
	}

	var req models.UpdateMatchStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Update match status
	err := h.matchService.UpdateMatchStatus(c.Request.Context(), userID.(string), matchID, req.Status, req.Note)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update match status", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Match status updated successfully",
		"match_id": matchID,
		"status": req.Status,
	})
}

// GetRecommendations handles GET /matches/recommendations - get personalized recommendations
// @Summary Get personalized pet recommendations
// @Description Get personalized pet recommendations based on user preferences
// @Tags Matching
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Number of recommendations" default(10)
// @Success 200 {object} map[string]interface{} "Successful recommendations response"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /matches/recommendations [get]
func (h *MatchHandler) GetRecommendations(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	// Create match request based on user preferences
	req := &models.MatchRequest{
		UserID: userID.(string),
		Limit:  limit,
	}

	// Find matches using user's saved preferences
	response, err := h.matchService.FindMatches(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"recommendations": response.Matches,
		"total":           response.Total,
		"limit":           limit,
	})
}

// GetMatchHistory handles GET /matches/history - get user's match history
// @Summary Get user's match history
// @Description Get user's match history with pagination and optional status filtering
// @Tags Matching
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status" Enums(pending,viewed,contacted,rejected)
// @Success 200 {object} models.MatchHistoryResponse "Successful history response"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /matches/history [get]
func (h *MatchHandler) GetMatchHistory(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	status := c.Query("status") // pending, viewed, contacted, rejected

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	// Get match history from service
	response, err := h.matchService.GetMatchHistory(c.Request.Context(), userID.(string), page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get match history", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
