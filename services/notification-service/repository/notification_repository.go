package repository

import (
	"fmt"

	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
)

// NotificationRepository handles notification data operations
type NotificationRepository struct{}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository() *NotificationRepository {
	return &NotificationRepository{}
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification *models.Notification) error {
	if err := database.DB.Create(notification).Error; err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}
	return nil
}

// GetByID retrieves a notification by ID
func (r *NotificationRepository) GetByID(id string) (*models.Notification, error) {
	var notification models.Notification
	if err := database.DB.Where("id = ?", id).First(&notification).Error; err != nil {
		return nil, err
	}
	return &notification, nil
}

// ListByUserID retrieves notifications for a user with pagination
func (r *NotificationRepository) ListByUserID(userID string, limit, offset int, unreadOnly bool) ([]models.Notification, int64, error) {
	query := database.DB.Model(&models.Notification{}).Where("user_id = ?", userID)

	if unreadOnly {
		query = query.Where("read_at IS NULL")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var notifications []models.Notification
	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(id, userID string) error {
	result := database.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("read_at", database.DB.NowFunc())

	if result.Error != nil {
		return fmt.Errorf("failed to mark notification as read: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("notification not found or unauthorized")
	}
	return nil
}

// MarkAllAsRead marks all notifications for a user as read
func (r *NotificationRepository) MarkAllAsRead(userID string) error {
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", database.DB.NowFunc()).Error; err != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}
	return nil
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *NotificationRepository) GetUnreadCount(userID string) (int64, error) {
	var count int64
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// Delete deletes a notification
func (r *NotificationRepository) Delete(id, userID string) error {
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete notification: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("notification not found or unauthorized")
	}
	return nil
}

// DeleteOldNotifications deletes notifications older than specified days
func (r *NotificationRepository) DeleteOldNotifications(days int) error {
	if err := database.DB.
		Where("created_at < NOW() - INTERVAL '1 day' * ?", days).
		Delete(&models.Notification{}).Error; err != nil {
		return fmt.Errorf("failed to delete old notifications: %w", err)
	}
	return nil
}
