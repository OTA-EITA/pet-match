package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/message-service/repository"
	"github.com/petmatch/app/shared/models"
)

// MessageHandler handles message-related operations
type MessageHandler struct {
	repo *repository.MessageRepository
}

// NewMessageHandler creates a new message handler
func NewMessageHandler() *MessageHandler {
	return &MessageHandler{
		repo: repository.NewMessageRepository(),
	}
}

// GetMessages handles GET /messages/:inquiry_id
func (h *MessageHandler) GetMessages(c *gin.Context) {
	inquiryID := c.Param("inquiry_id")
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := h.repo.GetByInquiryID(inquiryID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	// Mark messages as read
	_ = h.repo.MarkAsRead(inquiryID, userID)

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
	})
}

// SendMessage handles POST /messages/:inquiry_id
func (h *MessageHandler) SendMessage(c *gin.Context) {
	inquiryID := c.Param("inquiry_id")
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Content    string `json:"content" binding:"required"`
		ReceiverID string `json:"receiver_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := models.NewMessage(inquiryID, userID, req.ReceiverID, req.Content)

	if err := h.repo.Create(message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": message,
	})
}

// GetConversations handles GET /messages/conversations
func (h *MessageHandler) GetConversations(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversations, err := h.repo.GetConversations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": conversations,
	})
}

// GetUnreadCount handles GET /messages/unread-count
func (h *MessageHandler) GetUnreadCount(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	count, err := h.repo.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"unread_count": count,
	})
}

// MarkAsRead handles PUT /messages/:inquiry_id/read
func (h *MessageHandler) MarkAsRead(c *gin.Context) {
	inquiryID := c.Param("inquiry_id")
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.repo.MarkAsRead(inquiryID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Messages marked as read",
	})
}
