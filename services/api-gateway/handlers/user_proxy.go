package handlers

import (
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserProxy struct {
	serviceURL string
}

func NewUserProxy(serviceURL string) *UserProxy {
	return &UserProxy{serviceURL: serviceURL}
}

// GetPublicProfile proxies the public profile request
func (p *UserProxy) GetPublicProfile(c *gin.Context) {
	userID := c.Param("id")
	targetURL := p.serviceURL + "/api/v1/users/" + userID + "/public-profile"

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Forward headers
	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error proxying to user service: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "User service unavailable"})
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
}

// GetUserPets proxies the request to get pets by owner
func (p *UserProxy) GetUserPets(petServiceURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("id")
		targetURL := petServiceURL + "/api/v1/pets?owner=" + userID

		req, err := http.NewRequest("GET", targetURL, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
			return
		}

		// Forward headers
		for key, values := range c.Request.Header {
			for _, value := range values {
				req.Header.Add(key, value)
			}
		}

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error proxying to pet service: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Pet service unavailable"})
			return
		}
		defer resp.Body.Close()

		// Copy response headers
		for key, values := range resp.Header {
			for _, value := range values {
				c.Header(key, value)
			}
		}

		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	}
}
