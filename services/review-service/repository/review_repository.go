package repository

import (
	"fmt"

	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
)

// ReviewRepository handles review data operations
type ReviewRepository struct{}

// NewReviewRepository creates a new review repository
func NewReviewRepository() *ReviewRepository {
	return &ReviewRepository{}
}

// Create creates a new review
func (r *ReviewRepository) Create(review *models.Review) error {
	if err := database.DB.Create(review).Error; err != nil {
		return fmt.Errorf("failed to create review: %w", err)
	}
	return nil
}

// GetByID retrieves a review by ID
func (r *ReviewRepository) GetByID(id string) (*models.Review, error) {
	var review models.Review
	if err := database.DB.Where("id = ?", id).First(&review).Error; err != nil {
		return nil, err
	}
	return &review, nil
}

// ListByTargetID retrieves reviews for a specific shelter/breeder
func (r *ReviewRepository) ListByTargetID(targetID string, limit, offset int) ([]models.Review, int64, error) {
	var total int64
	if err := database.DB.Model(&models.Review{}).Where("target_id = ?", targetID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var reviews []models.Review
	if err := database.DB.
		Where("target_id = ?", targetID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// ListByReviewerID retrieves reviews written by a specific user
func (r *ReviewRepository) ListByReviewerID(reviewerID string, limit, offset int) ([]models.Review, int64, error) {
	var total int64
	if err := database.DB.Model(&models.Review{}).Where("reviewer_id = ?", reviewerID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var reviews []models.Review
	if err := database.DB.
		Where("reviewer_id = ?", reviewerID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// GetSummary retrieves review summary statistics for a target
func (r *ReviewRepository) GetSummary(targetID string) (*models.ReviewSummary, error) {
	var total int64
	if err := database.DB.Model(&models.Review{}).Where("target_id = ?", targetID).Count(&total).Error; err != nil {
		return nil, err
	}

	var avgRating float64
	if total > 0 {
		if err := database.DB.Model(&models.Review{}).
			Where("target_id = ?", targetID).
			Select("AVG(rating)").
			Scan(&avgRating).Error; err != nil {
			return nil, err
		}
	}

	// Get rating counts
	ratingCounts := make(map[int]int64)
	type RatingCount struct {
		Rating int
		Count  int64
	}
	var counts []RatingCount
	if err := database.DB.Model(&models.Review{}).
		Where("target_id = ?", targetID).
		Select("rating, COUNT(*) as count").
		Group("rating").
		Scan(&counts).Error; err != nil {
		return nil, err
	}

	for _, rc := range counts {
		ratingCounts[rc.Rating] = rc.Count
	}

	return &models.ReviewSummary{
		TotalReviews:  total,
		AverageRating: avgRating,
		RatingCounts:  ratingCounts,
	}, nil
}

// Update updates a review
func (r *ReviewRepository) Update(review *models.Review) error {
	if err := database.DB.Save(review).Error; err != nil {
		return fmt.Errorf("failed to update review: %w", err)
	}
	return nil
}

// AddResponse adds a response from the shelter to a review
func (r *ReviewRepository) AddResponse(id, targetID, response string) error {
	result := database.DB.Model(&models.Review{}).
		Where("id = ? AND target_id = ?", id, targetID).
		Updates(map[string]interface{}{
			"response":     response,
			"responded_at": database.DB.NowFunc(),
		})

	if result.Error != nil {
		return fmt.Errorf("failed to add response: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("review not found or unauthorized")
	}
	return nil
}

// Delete deletes a review
func (r *ReviewRepository) Delete(id, reviewerID string) error {
	result := database.DB.Where("id = ? AND reviewer_id = ?", id, reviewerID).Delete(&models.Review{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete review: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("review not found or unauthorized")
	}
	return nil
}

// HasReviewed checks if a user has already reviewed a target
func (r *ReviewRepository) HasReviewed(reviewerID, targetID string) (bool, error) {
	var count int64
	if err := database.DB.Model(&models.Review{}).
		Where("reviewer_id = ? AND target_id = ?", reviewerID, targetID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
