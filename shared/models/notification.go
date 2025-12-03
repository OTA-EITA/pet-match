package models

import (
	"time"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeNewMessage     NotificationType = "new_message"
	NotificationTypeInquiryCreated NotificationType = "inquiry_created"
	NotificationTypeInquiryUpdated NotificationType = "inquiry_updated"
	NotificationTypePetLiked       NotificationType = "pet_liked"
	NotificationTypeNewReview      NotificationType = "new_review"
	NotificationTypeSystemAlert    NotificationType = "system_alert"
)

// Notification represents a user notification
type Notification struct {
	ID          string           `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID      string           `json:"user_id" gorm:"type:uuid;not null;index"`
	Type        NotificationType `json:"type" gorm:"type:varchar(50);not null"`
	Title       string           `json:"title" gorm:"type:varchar(255);not null"`
	Message     string           `json:"message" gorm:"type:text;not null"`
	ReferenceID string           `json:"reference_id,omitempty" gorm:"type:uuid"` // ID of related entity (inquiry, pet, etc.)
	ReadAt      *time.Time       `json:"read_at,omitempty" gorm:"type:timestamp"`
	CreatedAt   time.Time        `json:"created_at" gorm:"type:timestamp;default:current_timestamp"`
}

// TableName returns the table name for Notification
func (Notification) TableName() string {
	return "notifications"
}

// NotificationSummary represents notification count summary
type NotificationSummary struct {
	TotalUnread int `json:"total_unread"`
}
