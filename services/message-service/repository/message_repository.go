package repository

import (
	"fmt"

	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
)

// MessageRepository handles message data operations
type MessageRepository struct{}

// NewMessageRepository creates a new message repository
func NewMessageRepository() *MessageRepository {
	return &MessageRepository{}
}

// Create creates a new message
func (r *MessageRepository) Create(message *models.Message) error {
	if err := database.DB.Create(message).Error; err != nil {
		return fmt.Errorf("failed to create message: %w", err)
	}
	return nil
}

// GetByInquiryID retrieves all messages for an inquiry
func (r *MessageRepository) GetByInquiryID(inquiryID string, limit, offset int) ([]models.Message, error) {
	var messages []models.Message
	err := database.DB.
		Where("inquiry_id = ?", inquiryID).
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error
	if err != nil {
		return nil, err
	}
	return messages, nil
}

// MarkAsRead marks messages as read
func (r *MessageRepository) MarkAsRead(inquiryID, receiverID string) error {
	return database.DB.
		Model(&models.Message{}).
		Where("inquiry_id = ? AND receiver_id = ? AND read_at IS NULL", inquiryID, receiverID).
		Update("read_at", database.DB.NowFunc()).Error
}

// GetUnreadCount gets the count of unread messages for a user
func (r *MessageRepository) GetUnreadCount(userID string) (int64, error) {
	var count int64
	err := database.DB.
		Model(&models.Message{}).
		Where("receiver_id = ? AND read_at IS NULL", userID).
		Count(&count).Error
	return count, err
}

// GetConversations gets all conversations for a user
func (r *MessageRepository) GetConversations(userID string) ([]models.Conversation, error) {
	var conversations []models.Conversation

	// This query gets the latest message for each inquiry involving the user
	query := `
		SELECT DISTINCT ON (m.inquiry_id)
			m.inquiry_id,
			i.pet_id,
			p.name as pet_name,
			COALESCE(p.images[1], '') as pet_image,
			CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
			u.name as other_user_name,
			m.content as last_message,
			m.created_at as last_message_at,
			(SELECT COUNT(*) FROM messages WHERE inquiry_id = m.inquiry_id AND receiver_id = ? AND read_at IS NULL) as unread_count
		FROM messages m
		JOIN inquiries i ON m.inquiry_id = i.id
		JOIN pets p ON i.pet_id = p.id
		JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
		WHERE m.sender_id = ? OR m.receiver_id = ?
		ORDER BY m.inquiry_id, m.created_at DESC
	`

	err := database.DB.Raw(query, userID, userID, userID, userID, userID).Scan(&conversations).Error
	if err != nil {
		return nil, err
	}

	return conversations, nil
}
