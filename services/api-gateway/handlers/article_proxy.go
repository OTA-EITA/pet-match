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

// ArticleProxy handles proxying requests to the admin service for articles
type ArticleProxy struct {
	adminServiceURL string
	client          *http.Client
}

// NewArticleProxy creates a new article proxy
func NewArticleProxy(adminServiceURL string) *ArticleProxy {
	return &ArticleProxy{
		adminServiceURL: adminServiceURL,
		client:          &http.Client{},
	}
}

// ListPublicArticles proxies GET /articles requests (public)
func (p *ArticleProxy) ListPublicArticles(c *gin.Context) {
	p.proxyRequest(c, "GET", "/api/v1/articles")
}

// GetPublicArticle proxies GET /articles/:id requests (public)
func (p *ArticleProxy) GetPublicArticle(c *gin.Context) {
	path := fmt.Sprintf("/api/v1/articles/%s", c.Param("id"))
	p.proxyRequest(c, "GET", path)
}

// ListAdminArticles proxies GET /admin/articles requests (admin)
func (p *ArticleProxy) ListAdminArticles(c *gin.Context) {
	p.proxyRequest(c, "GET", "/api/v1/admin/articles")
}

// CreateArticle proxies POST /admin/articles requests (admin)
func (p *ArticleProxy) CreateArticle(c *gin.Context) {
	p.proxyRequest(c, "POST", "/api/v1/admin/articles")
}

// GetAdminArticle proxies GET /admin/articles/:id requests (admin)
func (p *ArticleProxy) GetAdminArticle(c *gin.Context) {
	path := fmt.Sprintf("/api/v1/admin/articles/%s", c.Param("id"))
	p.proxyRequest(c, "GET", path)
}

// UpdateArticle proxies PUT /admin/articles/:id requests (admin)
func (p *ArticleProxy) UpdateArticle(c *gin.Context) {
	path := fmt.Sprintf("/api/v1/admin/articles/%s", c.Param("id"))
	p.proxyRequest(c, "PUT", path)
}

// DeleteArticle proxies DELETE /admin/articles/:id requests (admin)
func (p *ArticleProxy) DeleteArticle(c *gin.Context) {
	path := fmt.Sprintf("/api/v1/admin/articles/%s", c.Param("id"))
	p.proxyRequest(c, "DELETE", path)
}

// proxyRequest handles the actual proxying logic
func (p *ArticleProxy) proxyRequest(c *gin.Context, method, path string) {
	targetURL := p.adminServiceURL + path

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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
			return
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	// Create request
	req, err := http.NewRequest(method, targetURL, bodyReader)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Copy headers from original request
	for name, values := range c.Request.Header {
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

	log.Printf("Proxying %s %s to %s", method, path, targetURL)

	// Make request
	resp, err := p.client.Do(req)
	if err != nil {
		log.Printf("Error making request to admin service: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Admin service unavailable", "details": err.Error()})
		return
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Printf("Error closing response body: %v", closeErr)
		}
	}()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response from admin service"})
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
