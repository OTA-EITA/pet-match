package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	// MaxUploadSize is the maximum size for file uploads (10MB)
	MaxUploadSize = 10 << 20 // 10MB
)

// FileUploadMiddleware creates middleware for handling file uploads
func FileUploadMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set maximum multipart form memory
		_ = c.Request.ParseMultipartForm(MaxUploadSize)
		
		// Check content type for multipart forms
		contentType := c.GetHeader("Content-Type")
		if contentType != "" && !isMultipartForm(contentType) {
			// Allow non-multipart requests to pass through
			c.Next()
			return
		}

		c.Next()
	}
}

// isMultipartForm checks if the content type is multipart/form-data
func isMultipartForm(contentType string) bool {
	return len(contentType) > 19 && contentType[:19] == "multipart/form-data"
}

// ImageUploadMiddleware provides specific middleware for image uploads
func ImageUploadMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Set max multipart memory for image uploads
		_ = c.Request.ParseMultipartForm(MaxUploadSize)
		
		// Add headers for file upload responses
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}
		
		c.Next()
	})
}
