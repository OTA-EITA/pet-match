package models

import (
	"time"
)

// Review represents a review for a shelter/breeder
type Review struct {
	ID         string    `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ReviewerID string    `json:"reviewer_id" gorm:"type:uuid;not null;index"` // The user who wrote the review
	TargetID   string    `json:"target_id" gorm:"type:uuid;not null;index"`   // The shelter/breeder being reviewed
	InquiryID  string    `json:"inquiry_id,omitempty" gorm:"type:uuid;index"` // Optional: related inquiry
	Rating     int       `json:"rating" gorm:"not null"`                       // 1-5 stars
	Title      string    `json:"title" gorm:"type:varchar(255)"`
	Content    string    `json:"content" gorm:"type:text"`
	Response   string    `json:"response,omitempty" gorm:"type:text"`         // Shelter's response to review
	RespondedAt *time.Time `json:"responded_at,omitempty" gorm:"type:timestamp"`
	CreatedAt  time.Time `json:"created_at" gorm:"type:timestamp;default:current_timestamp"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"type:timestamp;default:current_timestamp"`
}

// TableName returns the table name for Review
func (Review) TableName() string {
	return "reviews"
}

// ReviewSummary represents aggregated review statistics
type ReviewSummary struct {
	TotalReviews  int64   `json:"total_reviews"`
	AverageRating float64 `json:"average_rating"`
	RatingCounts  map[int]int64 `json:"rating_counts"` // Count per star rating
}

// ReviewWithUser includes reviewer information
type ReviewWithUser struct {
	Review
	ReviewerName string `json:"reviewer_name"`
}
