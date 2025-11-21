package middleware

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/petmatch/app/shared/errors"
)

// ErrorHandlerMiddleware handles errors and panics, returning standardized error responses
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate request ID if not already set
		requestID := c.GetString("request_id")
		if requestID == "" {
			requestID = uuid.New().String()
			c.Set("request_id", requestID)
		}

		// Add request ID to response header
		c.Header("X-Request-ID", requestID)

		// Recover from panics
		defer func() {
			if err := recover(); err != nil {
				// Log the panic with stack trace
				log.Printf("PANIC: %v\nRequest ID: %s\nStack trace:\n%s",
					err, requestID, debug.Stack())

				// Return standardized error response
				appErr := errors.ErrInternalServerError.WithRequestID(requestID)
				c.JSON(appErr.Code.HTTPStatusCode(), appErr)
				c.Abort()
			}
		}()

		c.Next()

		// Check if there were any errors during request processing
		if len(c.Errors) > 0 {
			// Get the last error
			err := c.Errors.Last()

			// Check if it's an AppError
			if appErr, ok := err.Err.(*errors.AppError); ok {
				appErr.RequestID = requestID
				statusCode := appErr.Code.HTTPStatusCode()

				// Log errors (exclude 4xx client errors from error logs)
				if statusCode >= 500 {
					log.Printf("ERROR: %v | Request ID: %s | Path: %s",
						appErr, requestID, c.Request.URL.Path)
				}

				c.JSON(statusCode, appErr)
				return
			}

			// For non-AppError, wrap it in InternalServerError
			log.Printf("UNHANDLED ERROR: %v | Request ID: %s | Path: %s",
				err.Err, requestID, c.Request.URL.Path)

			appErr := errors.ErrInternalServerError.
				WithRequestID(requestID).
				WithDetails(map[string]string{"internal_error": err.Error()})

			c.JSON(http.StatusInternalServerError, appErr)
		}
	}
}

// RequestIDMiddleware generates a unique request ID for each request
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID is provided in header
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Store in context
		c.Set("request_id", requestID)

		// Add to response header
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

// GetRequestID retrieves the request ID from the context
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get("request_id"); exists {
		return requestID.(string)
	}
	return ""
}

// RespondWithError sends a standardized error response
func RespondWithError(c *gin.Context, appErr *errors.AppError) {
	requestID := GetRequestID(c)
	if requestID != "" {
		appErr.RequestID = requestID
	}

	statusCode := appErr.Code.HTTPStatusCode()
	c.JSON(statusCode, appErr)
}

// RespondWithValidationError sends a validation error response with field-specific details
func RespondWithValidationError(c *gin.Context, fieldErrors map[string]string) {
	requestID := GetRequestID(c)
	appErr := errors.ErrValidationFailed.
		WithRequestID(requestID).
		WithDetails(map[string]interface{}{
			"field_errors": fieldErrors,
		})

	c.JSON(http.StatusBadRequest, appErr)
}

// RespondWithSuccess sends a standardized success response
func RespondWithSuccess(c *gin.Context, statusCode int, data interface{}) {
	requestID := GetRequestID(c)

	response := gin.H{
		"success":    true,
		"data":       data,
		"request_id": requestID,
	}

	c.JSON(statusCode, response)
}

// RespondWithMessage sends a simple message response
func RespondWithMessage(c *gin.Context, statusCode int, message string) {
	requestID := GetRequestID(c)

	response := gin.H{
		"success":    true,
		"message":    message,
		"request_id": requestID,
	}

	c.JSON(statusCode, response)
}

// ValidationErrorResponse converts gin validation errors to field-specific errors
func ValidationErrorResponse(err error) map[string]string {
	fieldErrors := make(map[string]string)

	// Parse validation errors
	// This is a simplified version - you can expand this to handle validator.ValidationErrors
	fieldErrors["error"] = err.Error()

	return fieldErrors
}

// AbortWithError aborts the request with an error
func AbortWithError(c *gin.Context, appErr *errors.AppError) {
	requestID := GetRequestID(c)
	if requestID != "" {
		appErr.RequestID = requestID
	}

	statusCode := appErr.Code.HTTPStatusCode()

	// Log server errors
	if statusCode >= 500 {
		log.Printf("ERROR: %v | Request ID: %s | Path: %s | Method: %s",
			appErr, requestID, c.Request.URL.Path, c.Request.Method)
	}

	c.AbortWithStatusJSON(statusCode, appErr)
}

// NotFoundHandler handles 404 errors
func NotFoundHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := GetRequestID(c)
		if requestID == "" {
			requestID = uuid.New().String()
			c.Set("request_id", requestID)
			c.Header("X-Request-ID", requestID)
		}

		appErr := errors.ErrNotFound.
			WithRequestID(requestID).
			WithDetails(map[string]string{
				"path":   c.Request.URL.Path,
				"method": c.Request.Method,
			})

		c.JSON(http.StatusNotFound, appErr)
	}
}

// MethodNotAllowedHandler handles 405 errors
func MethodNotAllowedHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := GetRequestID(c)
		if requestID == "" {
			requestID = uuid.New().String()
			c.Set("request_id", requestID)
			c.Header("X-Request-ID", requestID)
		}

		appErr := errors.NewAppError(
			errors.ErrCodeBadRequest,
			fmt.Sprintf("Method %s not allowed for this endpoint", c.Request.Method),
		).WithRequestID(requestID).WithDetails(map[string]string{
			"path":   c.Request.URL.Path,
			"method": c.Request.Method,
		})

		c.JSON(http.StatusMethodNotAllowed, appErr)
	}
}
