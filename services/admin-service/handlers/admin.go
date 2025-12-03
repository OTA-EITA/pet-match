package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
)

// AdminHandler handles admin-related requests
type AdminHandler struct{}

// NewAdminHandler creates a new admin handler
func NewAdminHandler() *AdminHandler {
	return &AdminHandler{}
}

// DashboardStats represents aggregated statistics
type DashboardStats struct {
	TotalUsers       int64 `json:"total_users"`
	TotalPets        int64 `json:"total_pets"`
	TotalInquiries   int64 `json:"total_inquiries"`
	PendingInquiries int64 `json:"pending_inquiries"`
	TotalReviews     int64 `json:"total_reviews"`
	ActivePets       int64 `json:"active_pets"`
	AdoptedPets      int64 `json:"adopted_pets"`
	NewUsersToday    int64 `json:"new_users_today"`
	NewPetsToday     int64 `json:"new_pets_today"`
}

// GetStats returns dashboard statistics
func (h *AdminHandler) GetStats(c *gin.Context) {
	var stats DashboardStats

	// Total users
	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)

	// Total pets
	database.DB.Model(&models.Pet{}).Count(&stats.TotalPets)

	// Active pets
	database.DB.Model(&models.Pet{}).Where("status = ?", "available").Count(&stats.ActivePets)

	// Adopted pets
	database.DB.Model(&models.Pet{}).Where("status = ?", "adopted").Count(&stats.AdoptedPets)

	// Total inquiries
	database.DB.Model(&models.Inquiry{}).Count(&stats.TotalInquiries)

	// Pending inquiries
	database.DB.Model(&models.Inquiry{}).Where("status IN ?", []string{"sent", "replied"}).Count(&stats.PendingInquiries)

	// Total reviews
	database.DB.Model(&models.Review{}).Count(&stats.TotalReviews)

	// New users today
	database.DB.Model(&models.User{}).Where("DATE(created_at) = CURRENT_DATE").Count(&stats.NewUsersToday)

	// New pets today
	database.DB.Model(&models.Pet{}).Where("DATE(created_at) = CURRENT_DATE").Count(&stats.NewPetsToday)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// ListUsers returns a list of all users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []models.User

	query := database.DB.Model(&models.User{}).Order("created_at DESC")

	// Apply type filter if provided
	if userType := c.Query("type"); userType != "" {
		query = query.Where("type = ?", userType)
	}

	// Apply limit/offset
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var total int64
	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  users,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ListPets returns a list of all pets
func (h *AdminHandler) ListPets(c *gin.Context) {
	var pets []models.Pet

	query := database.DB.Model(&models.Pet{}).Order("created_at DESC")

	// Apply status filter if provided
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Apply limit/offset
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var total int64
	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&pets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pets":   pets,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ListInquiries returns a list of all inquiries
func (h *AdminHandler) ListInquiries(c *gin.Context) {
	var inquiries []models.Inquiry

	query := database.DB.Model(&models.Inquiry{}).Order("created_at DESC")

	// Apply status filter if provided
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Apply limit/offset
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var total int64
	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&inquiries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inquiries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inquiries": inquiries,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// UpdateUserStatus updates a user's verification status
func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	userID := c.Param("id")

	var input struct {
		Verified bool `json:"verified"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("verified", input.Verified)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User status updated"})
}

// DeletePet deletes a pet (admin action)
func (h *AdminHandler) DeletePet(c *gin.Context) {
	petID := c.Param("id")

	result := database.DB.Where("id = ?", petID).Delete(&models.Pet{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pet"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pet deleted"})
}

// DeleteReview deletes a review (admin action)
func (h *AdminHandler) DeleteReview(c *gin.Context) {
	reviewID := c.Param("id")

	result := database.DB.Where("id = ?", reviewID).Delete(&models.Review{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func parseInt(s string) (int, error) {
	var result int
	_, err := (func() (int, error) {
		result = 0
		for _, c := range s {
			if c < '0' || c > '9' {
				return 0, nil
			}
			result = result*10 + int(c-'0')
		}
		return result, nil
	})()
	return result, err
}
