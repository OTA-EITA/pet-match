package models

import (
	"time"

	"github.com/google/uuid"
)

// Inquiry represents an inquiry from a user to a shelter about a pet
type Inquiry struct {
	ID            string    `json:"id" redis:"id"`
	UserID        string    `json:"user_id" redis:"user_id"`
	PetID         string    `json:"pet_id" redis:"pet_id"`
	Message       string    `json:"message" redis:"message"`
	Type          string    `json:"type" redis:"type"`                     // question, interview, adoption
	ContactMethod string    `json:"contact_method" redis:"contact_method"` // email, phone
	Phone         string    `json:"phone" redis:"phone"`
	Status        string    `json:"status" redis:"status"` // sent, replied, scheduled, completed
	CreatedAt     time.Time `json:"created_at" redis:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" redis:"updated_at"`
}

// NewInquiry creates a new inquiry with generated ID
func NewInquiry(userID, petID, message, inquiryType, contactMethod, phone string) *Inquiry {
	now := time.Now()
	return &Inquiry{
		ID:            uuid.New().String(),
		UserID:        userID,
		PetID:         petID,
		Message:       message,
		Type:          inquiryType,
		ContactMethod: contactMethod,
		Phone:         phone,
		Status:        "sent",
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// CreateInquiryRequest represents inquiry creation request
type CreateInquiryRequest struct {
	PetID         string `json:"pet_id" binding:"required,uuid"`
	Message       string `json:"message" binding:"required,min=10,max=2000,sanitized"`
	Type          string `json:"type" binding:"required,oneof=question interview adoption"`
	ContactMethod string `json:"contact_method" binding:"required,oneof=email phone"`
	Phone         string `json:"phone" binding:"omitempty,phone_jp"`
}
