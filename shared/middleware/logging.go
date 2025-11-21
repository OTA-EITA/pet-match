package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/shared/logger"
)

// StructuredLoggingMiddleware logs HTTP requests with structured fields
func StructuredLoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		startTime := time.Now()

		// Get request ID
		requestID := GetRequestID(c)

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Since(startTime)

		// Extract user ID if authenticated
		userID := c.GetString("user_id")

		// Get error if any
		var errorMsg string
		if len(c.Errors) > 0 {
			errorMsg = c.Errors.Last().Error()
		}

		// Log request
		logger.LogRequest(logger.RequestLog{
			Timestamp:   startTime,
			RequestID:   requestID,
			Method:      c.Request.Method,
			Path:        c.Request.URL.Path,
			StatusCode:  c.Writer.Status(),
			Duration:    duration,
			UserID:      userID,
			IP:          c.ClientIP(),
			UserAgent:   c.Request.UserAgent(),
			Error:       errorMsg,
		})
	}
}

// LoggingMiddleware is a fallback logging middleware (for backwards compatibility)
// Use StructuredLoggingMiddleware for new services
func LoggingMiddleware() gin.HandlerFunc {
	return StructuredLoggingMiddleware()
}
