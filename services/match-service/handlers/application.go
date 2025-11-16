package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/services"
	"github.com/petmatch/app/shared/config"
)

type ApplicationHandler struct {
	applicationService *services.ApplicationService
	cfg                *config.Config
}

func NewApplicationHandler(applicationService *services.ApplicationService, cfg *config.Config) *ApplicationHandler {
	return &ApplicationHandler{
		applicationService: applicationService,
		cfg:                cfg,
	}
}

// CreateApplication handles POST /applications - create a new application
// @Summary Create a new application
// @Description Submit an application to adopt a cat
// @Tags Applications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.ApplicationRequest true "Application details"
// @Success 201 {object} models.Application "Created application"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /applications [post]
func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.ApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Create application
	application, err := h.applicationService.CreateApplication(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create application", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, application)
}

// GetApplication handles GET /applications/:id - get application details
// @Summary Get application by ID
// @Description Get detailed information about a specific application
// @Tags Applications
// @Produce json
// @Security BearerAuth
// @Param id path string true "Application ID"
// @Success 200 {object} models.ApplicationWithDetails "Application details"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Application not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /applications/{id} [get]
func (h *ApplicationHandler) GetApplication(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	applicationID := c.Param("id")
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Application ID is required"})
		return
	}

	application, err := h.applicationService.GetApplication(c.Request.Context(), applicationID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, application)
}

// GetUserApplications handles GET /applications - get user's applications
// @Summary Get user's applications
// @Description Get all applications submitted by the authenticated user
// @Tags Applications
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status"
// @Success 200 {object} models.ApplicationResponse "List of applications"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /applications [get]
func (h *ApplicationHandler) GetUserApplications(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	status := c.Query("status")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	// Get applications
	response, err := h.applicationService.GetUserApplications(c.Request.Context(), userID.(string), page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get applications", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateApplicationStatus handles PUT /applications/:id/status - update application status
// @Summary Update application status
// @Description Update the status of an application (user can only cancel)
// @Tags Applications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Application ID"
// @Param request body models.UpdateApplicationStatusRequest true "Status update"
// @Success 200 {object} map[string]interface{} "Status updated"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /applications/{id}/status [put]
func (h *ApplicationHandler) UpdateApplicationStatus(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	applicationID := c.Param("id")
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Application ID is required"})
		return
	}

	var req models.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Update status
	err := h.applicationService.UpdateApplicationStatus(c.Request.Context(), applicationID, userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update status", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Application status updated successfully",
		"application_id": applicationID,
		"status":         req.Status,
	})
}

// CancelApplication handles DELETE /applications/:id - cancel application
// @Summary Cancel an application
// @Description Cancel a pending application
// @Tags Applications
// @Produce json
// @Security BearerAuth
// @Param id path string true "Application ID"
// @Success 200 {object} map[string]interface{} "Application cancelled"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /applications/{id} [delete]
func (h *ApplicationHandler) CancelApplication(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	applicationID := c.Param("id")
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Application ID is required"})
		return
	}

	// Cancel application
	err := h.applicationService.CancelApplication(c.Request.Context(), applicationID, userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to cancel application", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Application cancelled successfully",
		"application_id": applicationID,
	})
}

// GetApplicationStatusCounts handles GET /applications/stats - get application statistics
// @Summary Get application statistics
// @Description Get counts of applications by status
// @Tags Applications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.ApplicationStatusCounts "Application statistics"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /applications/stats [get]
func (h *ApplicationHandler) GetApplicationStatusCounts(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	counts, err := h.applicationService.GetApplicationStatusCounts(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, counts)
}
