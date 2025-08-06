package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/user-service/services"
	"github.com/petmatch/app/shared/config"
)

type UserHandler struct {
	userService *services.UserService
	cfg         *config.Config
}

func NewUserHandler(userService *services.UserService, cfg *config.Config) *UserHandler {
	return &UserHandler{
		userService: userService,
		cfg:         cfg,
	}
}

// GetProfile returns current user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateProfile updates current user's profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var updateReq struct {
		Name        string `json:"name"`
		Phone       string `json:"phone"`
		Address     string `json:"address"`
		Coordinates string `json:"coordinates"`
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"details": err.Error(),
		})
		return
	}

	// Get current user
	user, err := h.userService.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Update fields
	if updateReq.Name != "" {
		user.Name = updateReq.Name
	}
	if updateReq.Phone != "" {
		user.Phone = updateReq.Phone
	}
	if updateReq.Address != "" {
		user.Address = updateReq.Address
	}
	if updateReq.Coordinates != "" {
		user.Coordinates = updateReq.Coordinates
	}

	// Save updated user
	err = h.userService.Update(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

// GetUser returns user by ID (admin or same user only)
func (h *UserHandler) GetUser(c *gin.Context) {
	targetUserID := c.Param("id")
	currentUserID := c.GetString("user_id")
	currentUserType := c.GetString("user_type")

	// Check permission: only admin or same user can access
	if currentUserType != "admin" && currentUserID != targetUserID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	user, err := h.userService.GetByID(targetUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// ListUsers returns paginated list of users (admin only)
func (h *UserHandler) ListUsers(c *gin.Context) {
	currentUserType := c.GetString("user_type")
	if currentUserType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	// Parse pagination parameters
	offsetStr := c.DefaultQuery("offset", "0")
	limitStr := c.DefaultQuery("limit", "10")

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 10
	}

	users, err := h.userService.List(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  users,
		"offset": offset,
		"limit":  limit,
		"count":  len(users),
	})
}

// DeleteUser deletes a user (admin only)
func (h *UserHandler) DeleteUser(c *gin.Context) {
	targetUserID := c.Param("id")
	currentUserType := c.GetString("user_type")

	// Only admin can delete users
	if currentUserType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Admin access required",
		})
		return
	}

	err := h.userService.Delete(targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}
