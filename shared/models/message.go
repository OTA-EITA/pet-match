package models

import (
	"time"

	"github.com/google/uuid"
)

// Message represents a chat message between users
type Message struct {
	ID         string     `json:"id" gorm:"type:uuid;primaryKey"`
	InquiryID  string     `json:"inquiry_id" gorm:"type:uuid;not null;index"`
	SenderID   string     `json:"sender_id" gorm:"type:uuid;not null;index"`
	ReceiverID string     `json:"receiver_id" gorm:"type:uuid;not null;index"`
	Content    string     `json:"content" gorm:"type:text;not null"`
	ReadAt     *time.Time `json:"read_at" gorm:"type:timestamp"`
	CreatedAt  time.Time  `json:"created_at" gorm:"not null;autoCreateTime"`
}

// TableName overrides the table name for GORM
func (Message) TableName() string {
	return "messages"
}

// NewMessage creates a new message
func NewMessage(inquiryID, senderID, receiverID, content string) *Message {
	return &Message{
		ID:         uuid.New().String(),
		InquiryID:  inquiryID,
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		CreatedAt:  time.Now(),
	}
}

// CreateMessageRequest represents a message creation request
type CreateMessageRequest struct {
	InquiryID string `json:"inquiry_id" binding:"required"`
	Content   string `json:"content" binding:"required,min=1,max=5000"`
}

// Conversation represents a conversation thread
type Conversation struct {
	InquiryID      string    `json:"inquiry_id"`
	PetID          string    `json:"pet_id"`
	PetName        string    `json:"pet_name"`
	PetImage       string    `json:"pet_image"`
	OtherUserID    string    `json:"other_user_id"`
	OtherUserName  string    `json:"other_user_name"`
	LastMessage    string    `json:"last_message"`
	LastMessageAt  time.Time `json:"last_message_at"`
	UnreadCount    int       `json:"unread_count"`
}
