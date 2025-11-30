package models

import (
	"time"

	"github.com/google/uuid"
)

// Inquiry represents an inquiry from a user to a shelter about a pet
type Inquiry struct {
	ID            string    `json:"id" redis:"id"`
	UserID        string    `json:"user_id" redis:"user_id"`         // 問い合わせ送信者
	PetID         string    `json:"pet_id" redis:"pet_id"`
	PetOwnerID    string    `json:"pet_owner_id" redis:"pet_owner_id"` // ペットのオーナー（問い合わせ受信者）
	Message       string    `json:"message" redis:"message"`
	Type          string    `json:"type" redis:"type"`                     // question, interview, adoption
	ContactMethod string    `json:"contact_method" redis:"contact_method"` // email, phone
	Phone         string    `json:"phone" redis:"phone"`
	Status        string    `json:"status" redis:"status"` // sent, replied, scheduled, completed
	Reply         string    `json:"reply,omitempty" redis:"reply"`
	RepliedAt     time.Time `json:"replied_at,omitempty" redis:"replied_at"`
	CreatedAt     time.Time `json:"created_at" redis:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" redis:"updated_at"`
}

// NewInquiry creates a new inquiry with generated ID
func NewInquiry(userID, petID, petOwnerID, message, inquiryType, contactMethod, phone string) *Inquiry {
	now := time.Now()
	return &Inquiry{
		ID:            uuid.New().String(),
		UserID:        userID,
		PetID:         petID,
		PetOwnerID:    petOwnerID,
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

// UpdateInquiryStatusRequest represents status update request
type UpdateInquiryStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=sent replied scheduled completed rejected"`
}

// ReplyInquiryRequest represents reply request
type ReplyInquiryRequest struct {
	Reply string `json:"reply" binding:"required,min=1,max=2000"`
}
