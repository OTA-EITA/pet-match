package handlers

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AdminProxy handles proxying requests to the admin service
type AdminProxy struct {
	serviceURL string
}

// NewAdminProxy creates a new admin proxy
func NewAdminProxy(serviceURL string) *AdminProxy {
	return &AdminProxy{serviceURL: serviceURL}
}

// GetStats returns dashboard statistics
func (p *AdminProxy) GetStats(c *gin.Context) {
	url := fmt.Sprintf("%s/api/v1/admin/stats", p.serviceURL)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// ListUsers returns a list of all users
func (p *AdminProxy) ListUsers(c *gin.Context) {
	url := fmt.Sprintf("%s/api/v1/admin/users?%s", p.serviceURL, c.Request.URL.RawQuery)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// UpdateUserStatus updates a user's status
func (p *AdminProxy) UpdateUserStatus(c *gin.Context) {
	userID := c.Param("id")
	bodyData, _ := io.ReadAll(c.Request.Body)
	url := fmt.Sprintf("%s/api/v1/admin/users/%s/status", p.serviceURL, userID)

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(bodyData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// ListPets returns a list of all pets
func (p *AdminProxy) ListPets(c *gin.Context) {
	url := fmt.Sprintf("%s/api/v1/admin/pets?%s", p.serviceURL, c.Request.URL.RawQuery)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// DeletePet deletes a pet
func (p *AdminProxy) DeletePet(c *gin.Context) {
	petID := c.Param("id")
	url := fmt.Sprintf("%s/api/v1/admin/pets/%s", p.serviceURL, petID)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// ListInquiries returns a list of all inquiries
func (p *AdminProxy) ListInquiries(c *gin.Context) {
	url := fmt.Sprintf("%s/api/v1/admin/inquiries?%s", p.serviceURL, c.Request.URL.RawQuery)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// DeleteReview deletes a review
func (p *AdminProxy) DeleteReview(c *gin.Context) {
	reviewID := c.Param("id")
	url := fmt.Sprintf("%s/api/v1/admin/reviews/%s", p.serviceURL, reviewID)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// CreateReport creates a new report (user-facing)
func (p *AdminProxy) CreateReport(c *gin.Context) {
	bodyData, _ := io.ReadAll(c.Request.Body)
	url := fmt.Sprintf("%s/api/v1/reports", p.serviceURL)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Forward user_id from context
	if userID, exists := c.Get("user_id"); exists {
		req.Header.Set("X-User-ID", userID.(string))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// ListReports returns a list of all reports (admin only)
func (p *AdminProxy) ListReports(c *gin.Context) {
	url := fmt.Sprintf("%s/api/v1/admin/reports?%s", p.serviceURL, c.Request.URL.RawQuery)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// UpdateReportStatus updates a report's status (admin only)
func (p *AdminProxy) UpdateReportStatus(c *gin.Context) {
	reportID := c.Param("id")
	bodyData, _ := io.ReadAll(c.Request.Body)
	url := fmt.Sprintf("%s/api/v1/admin/reports/%s/status", p.serviceURL, reportID)

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(bodyData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Forward user_id (admin ID) from context
	if userID, exists := c.Get("user_id"); exists {
		req.Header.Set("X-User-ID", userID.(string))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}
