package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type MatchProxy struct {
	matchServiceURL string
	client          *http.Client
}

// NewMatchProxy creates a new match service proxy
func NewMatchProxy(matchServiceURL string) *MatchProxy {
	return &MatchProxy{
		matchServiceURL: matchServiceURL,
		client:          &http.Client{},
	}
}

// FindMatches proxies POST /matches requests
func (p *MatchProxy) FindMatches(c *gin.Context) {
	p.proxyRequest(c, "POST", "/matches")
}

// GetRecommendations proxies GET /matches/recommendations requests
func (p *MatchProxy) GetRecommendations(c *gin.Context) {
	p.proxyRequest(c, "GET", "/matches/recommendations")
}

// GetMatchHistory proxies GET /matches/history requests
func (p *MatchProxy) GetMatchHistory(c *gin.Context) {
	p.proxyRequest(c, "GET", "/matches/history")
}

// AddFavorite proxies POST /matches/favorites requests
func (p *MatchProxy) AddFavorite(c *gin.Context) {
	p.proxyRequest(c, "POST", "/matches/favorites")
}

// GetFavorites proxies GET /matches/favorites requests
func (p *MatchProxy) GetFavorites(c *gin.Context) {
	p.proxyRequest(c, "GET", "/matches/favorites")
}

// RemoveFavorite proxies DELETE /matches/favorites/:pet_id requests
func (p *MatchProxy) RemoveFavorite(c *gin.Context) {
	path := fmt.Sprintf("/matches/favorites/%s", c.Param("pet_id"))
	p.proxyRequest(c, "DELETE", path)
}

// SetPreferences proxies POST /matches/preferences requests
func (p *MatchProxy) SetPreferences(c *gin.Context) {
	p.proxyRequest(c, "POST", "/matches/preferences")
}

// GetPreferences proxies GET /matches/preferences requests
func (p *MatchProxy) GetPreferences(c *gin.Context) {
	p.proxyRequest(c, "GET", "/matches/preferences")
}

// UpdatePreferences proxies PUT /matches/preferences requests
func (p *MatchProxy) UpdatePreferences(c *gin.Context) {
	p.proxyRequest(c, "PUT", "/matches/preferences")
}

// HealthCheck proxies health check to match service
func (p *MatchProxy) HealthCheck(c *gin.Context) {
	resp, err := p.client.Get(p.matchServiceURL + "/health")
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"service": "match-service",
			"status":  "unhealthy",
			"error":   err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	c.JSON(resp.StatusCode, gin.H{
		"service": "match-service",
		"status":  "healthy",
	})
}

// proxyRequest handles the actual proxying logic
func (p *MatchProxy) proxyRequest(c *gin.Context, method, path string) {
	// Build target URL
	targetURL := p.matchServiceURL + path

	// Add query parameters if present
	if c.Request.URL.RawQuery != "" {
		targetURL += "?" + c.Request.URL.RawQuery
	}

	// Read request body
	var bodyReader io.Reader
	if c.Request.Body != nil {
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			log.Printf("Error reading request body: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read request body",
			})
			return
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	// Create request
	req, err := http.NewRequest(method, targetURL, bodyReader)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create request",
		})
		return
	}

	// Copy headers from original request
	for name, values := range c.Request.Header {
		// Skip host header
		if strings.ToLower(name) == "host" {
			continue
		}
		for _, value := range values {
			req.Header.Add(name, value)
		}
	}

	// Ensure content-type for requests with body
	if method == "POST" || method == "PUT" || method == "PATCH" {
		if req.Header.Get("Content-Type") == "" {
			req.Header.Set("Content-Type", "application/json")
		}
	}

	// Log the proxied request
	log.Printf("Proxying %s %s to %s", method, path, targetURL)

	// Make request
	resp, err := p.client.Do(req)
	if err != nil {
		log.Printf("Error making request to match service: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "Match service unavailable",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read response from match service",
		})
		return
	}

	// Copy response headers
	for name, values := range resp.Header {
		for _, value := range values {
			c.Header(name, value)
		}
	}

	// Set status code and return response
	c.Status(resp.StatusCode)

	// Try to parse as JSON first, fallback to raw response
	var jsonResponse interface{}
	if err := json.Unmarshal(respBody, &jsonResponse); err == nil {
		c.JSON(resp.StatusCode, jsonResponse)
	} else {
		c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), respBody)
	}
}
