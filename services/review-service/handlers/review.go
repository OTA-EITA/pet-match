package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/review-service/repository"
	"github.com/petmatch/app/shared/models"
)

// ReviewHandler handles review-related requests
type ReviewHandler struct {
	repo *repository.ReviewRepository
}

// NewReviewHandler creates a new review handler
func NewReviewHandler(repo *repository.ReviewRepository) *ReviewHandler {
	return &ReviewHandler{repo: repo}
}

// Create creates a new review
func (h *ReviewHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		TargetID  string `json:"target_id" binding:"required"`
		InquiryID string `json:"inquiry_id"`
		Rating    int    `json:"rating" binding:"required,min=1,max=5"`
		Title     string `json:"title"`
		Content   string `json:"content"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user has already reviewed this target
	hasReviewed, err := h.repo.HasReviewed(userID, input.TargetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing review"})
		return
	}
	if hasReviewed {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already reviewed this shelter"})
		return
	}

	review := &models.Review{
		ReviewerID: userID,
		TargetID:   input.TargetID,
		InquiryID:  input.InquiryID,
		Rating:     input.Rating,
		Title:      input.Title,
		Content:    input.Content,
	}

	if err := h.repo.Create(review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"review": review})
}

// GetByID retrieves a review by ID
func (h *ReviewHandler) GetByID(c *gin.Context) {
	reviewID := c.Param("id")
	review, err := h.repo.GetByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"review": review})
}

// ListByTarget lists reviews for a specific shelter/breeder
func (h *ReviewHandler) ListByTarget(c *gin.Context) {
	targetID := c.Param("target_id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	reviews, total, err := h.repo.ListByTargetID(targetID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews": reviews,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetSummary retrieves review summary for a target
func (h *ReviewHandler) GetSummary(c *gin.Context) {
	targetID := c.Param("target_id")

	summary, err := h.repo.GetSummary(targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch review summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// ListMyReviews lists reviews written by the authenticated user
func (h *ReviewHandler) ListMyReviews(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	reviews, total, err := h.repo.ListByReviewerID(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews": reviews,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// Update updates a review
func (h *ReviewHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	reviewID := c.Param("id")
	review, err := h.repo.GetByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	if review.ReviewerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own reviews"})
		return
	}

	var input struct {
		Rating  int    `json:"rating" binding:"min=1,max=5"`
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Rating > 0 {
		review.Rating = input.Rating
	}
	if input.Title != "" {
		review.Title = input.Title
	}
	if input.Content != "" {
		review.Content = input.Content
	}

	if err := h.repo.Update(review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"review": review})
}

// AddResponse adds a shelter's response to a review
func (h *ReviewHandler) AddResponse(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	reviewID := c.Param("id")

	var input struct {
		Response string `json:"response" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// User can only respond to reviews about themselves
	if err := h.repo.AddResponse(reviewID, userID, input.Response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add response"})
		return
	}

	review, _ := h.repo.GetByID(reviewID)
	c.JSON(http.StatusOK, gin.H{"review": review})
}

// Delete deletes a review
func (h *ReviewHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	reviewID := c.Param("id")

	if err := h.repo.Delete(reviewID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}
