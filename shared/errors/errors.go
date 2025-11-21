package errors

import (
	"fmt"
	"time"
)

// ErrorCode represents a standardized error code
type ErrorCode string

// Error codes by domain
const (
	// Authentication errors
	ErrCodeInvalidCredentials    ErrorCode = "AUTH_INVALID_CREDENTIALS"
	ErrCodeUserNotFound          ErrorCode = "AUTH_USER_NOT_FOUND"
	ErrCodeUserAlreadyExists     ErrorCode = "AUTH_USER_ALREADY_EXISTS"
	ErrCodeInvalidToken          ErrorCode = "AUTH_INVALID_TOKEN"
	ErrCodeTokenExpired          ErrorCode = "AUTH_TOKEN_EXPIRED"
	ErrCodeUnauthorized          ErrorCode = "AUTH_UNAUTHORIZED"
	ErrCodeInsufficientPermissions ErrorCode = "AUTH_INSUFFICIENT_PERMISSIONS"

	// Validation errors
	ErrCodeValidationFailed      ErrorCode = "VALIDATION_FAILED"
	ErrCodeInvalidEmail          ErrorCode = "VALIDATION_INVALID_EMAIL"
	ErrCodeInvalidPassword       ErrorCode = "VALIDATION_INVALID_PASSWORD"
	ErrCodePasswordTooWeak       ErrorCode = "VALIDATION_PASSWORD_TOO_WEAK"
	ErrCodeInvalidPhoneNumber    ErrorCode = "VALIDATION_INVALID_PHONE"
	ErrCodeInvalidRequestBody    ErrorCode = "VALIDATION_INVALID_REQUEST_BODY"
	ErrCodeRequiredFieldMissing  ErrorCode = "VALIDATION_REQUIRED_FIELD_MISSING"

	// Pet errors
	ErrCodePetNotFound           ErrorCode = "PET_NOT_FOUND"
	ErrCodePetAlreadyExists      ErrorCode = "PET_ALREADY_EXISTS"
	ErrCodeInvalidPetStatus      ErrorCode = "PET_INVALID_STATUS"
	ErrCodePetNotAvailable       ErrorCode = "PET_NOT_AVAILABLE"

	// User errors
	ErrCodeUserProfileNotFound   ErrorCode = "USER_PROFILE_NOT_FOUND"
	ErrCodeUserUpdateFailed      ErrorCode = "USER_UPDATE_FAILED"

	// Application errors
	ErrCodeApplicationNotFound   ErrorCode = "APPLICATION_NOT_FOUND"
	ErrCodeApplicationDuplicate  ErrorCode = "APPLICATION_DUPLICATE"
	ErrCodeApplicationClosed     ErrorCode = "APPLICATION_CLOSED"

	// File/Image errors
	ErrCodeFileUploadFailed      ErrorCode = "FILE_UPLOAD_FAILED"
	ErrCodeFileTooLarge          ErrorCode = "FILE_TOO_LARGE"
	ErrCodeInvalidFileType       ErrorCode = "FILE_INVALID_TYPE"
	ErrCodeImageNotFound         ErrorCode = "IMAGE_NOT_FOUND"

	// Database errors
	ErrCodeDatabaseError         ErrorCode = "DATABASE_ERROR"
	ErrCodeDatabaseConnectionFailed ErrorCode = "DATABASE_CONNECTION_FAILED"
	ErrCodeDatabaseQueryFailed   ErrorCode = "DATABASE_QUERY_FAILED"

	// Redis/Cache errors
	ErrCodeCacheError            ErrorCode = "CACHE_ERROR"
	ErrCodeCacheNotFound         ErrorCode = "CACHE_NOT_FOUND"

	// General errors
	ErrCodeInternalServerError   ErrorCode = "INTERNAL_SERVER_ERROR"
	ErrCodeNotFound              ErrorCode = "NOT_FOUND"
	ErrCodeBadRequest            ErrorCode = "BAD_REQUEST"
	ErrCodeForbidden             ErrorCode = "FORBIDDEN"
	ErrCodeConflict              ErrorCode = "CONFLICT"
	ErrCodeRateLimitExceeded     ErrorCode = "RATE_LIMIT_EXCEEDED"
	ErrCodeServiceUnavailable    ErrorCode = "SERVICE_UNAVAILABLE"
)

// AppError represents a standardized application error
type AppError struct {
	Code      ErrorCode   `json:"code"`
	Message   string      `json:"message"`
	Details   interface{} `json:"details,omitempty"`
	RequestID string      `json:"request_id,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// NewAppError creates a new application error
func NewAppError(code ErrorCode, message string) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Timestamp: time.Now(),
	}
}

// NewAppErrorWithDetails creates a new application error with additional details
func NewAppErrorWithDetails(code ErrorCode, message string, details interface{}) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Details:   details,
		Timestamp: time.Now(),
	}
}

// WithRequestID adds a request ID to the error
func (e *AppError) WithRequestID(requestID string) *AppError {
	e.RequestID = requestID
	return e
}

// WithDetails adds details to the error
func (e *AppError) WithDetails(details interface{}) *AppError {
	e.Details = details
	return e
}

// Predefined common errors for convenience
var (
	ErrInvalidCredentials = NewAppError(
		ErrCodeInvalidCredentials,
		"Invalid email or password",
	)

	ErrUserNotFound = NewAppError(
		ErrCodeUserNotFound,
		"User not found",
	)

	ErrUserAlreadyExists = NewAppError(
		ErrCodeUserAlreadyExists,
		"User with this email already exists",
	)

	ErrInvalidToken = NewAppError(
		ErrCodeInvalidToken,
		"Invalid or malformed token",
	)

	ErrTokenExpired = NewAppError(
		ErrCodeTokenExpired,
		"Token has expired",
	)

	ErrUnauthorized = NewAppError(
		ErrCodeUnauthorized,
		"Authentication required",
	)

	ErrInsufficientPermissions = NewAppError(
		ErrCodeInsufficientPermissions,
		"You don't have permission to perform this action",
	)

	ErrValidationFailed = NewAppError(
		ErrCodeValidationFailed,
		"Request validation failed",
	)

	ErrInvalidRequestBody = NewAppError(
		ErrCodeInvalidRequestBody,
		"Invalid request body",
	)

	ErrPetNotFound = NewAppError(
		ErrCodePetNotFound,
		"Pet not found",
	)

	ErrInternalServerError = NewAppError(
		ErrCodeInternalServerError,
		"An internal server error occurred",
	)

	ErrNotFound = NewAppError(
		ErrCodeNotFound,
		"Resource not found",
	)

	ErrBadRequest = NewAppError(
		ErrCodeBadRequest,
		"Bad request",
	)

	ErrForbidden = NewAppError(
		ErrCodeForbidden,
		"Access forbidden",
	)

	ErrRateLimitExceeded = NewAppError(
		ErrCodeRateLimitExceeded,
		"Rate limit exceeded, please try again later",
	)

	ErrServiceUnavailable = NewAppError(
		ErrCodeServiceUnavailable,
		"Service temporarily unavailable",
	)
)

// HTTPStatusCode returns the appropriate HTTP status code for an error code
func (code ErrorCode) HTTPStatusCode() int {
	switch code {
	// 400 Bad Request
	case ErrCodeValidationFailed, ErrCodeInvalidEmail, ErrCodeInvalidPassword,
		ErrCodePasswordTooWeak, ErrCodeInvalidPhoneNumber, ErrCodeInvalidRequestBody,
		ErrCodeRequiredFieldMissing, ErrCodeBadRequest, ErrCodeInvalidFileType,
		ErrCodeFileTooLarge:
		return 400

	// 401 Unauthorized
	case ErrCodeInvalidCredentials, ErrCodeInvalidToken, ErrCodeTokenExpired,
		ErrCodeUnauthorized:
		return 401

	// 403 Forbidden
	case ErrCodeInsufficientPermissions, ErrCodeForbidden:
		return 403

	// 404 Not Found
	case ErrCodeUserNotFound, ErrCodePetNotFound, ErrCodeUserProfileNotFound,
		ErrCodeApplicationNotFound, ErrCodeImageNotFound, ErrCodeNotFound,
		ErrCodeCacheNotFound:
		return 404

	// 409 Conflict
	case ErrCodeUserAlreadyExists, ErrCodePetAlreadyExists, ErrCodeApplicationDuplicate,
		ErrCodeConflict:
		return 409

	// 429 Too Many Requests
	case ErrCodeRateLimitExceeded:
		return 429

	// 500 Internal Server Error
	case ErrCodeInternalServerError, ErrCodeDatabaseError, ErrCodeDatabaseConnectionFailed,
		ErrCodeDatabaseQueryFailed, ErrCodeCacheError, ErrCodeFileUploadFailed:
		return 500

	// 503 Service Unavailable
	case ErrCodeServiceUnavailable, ErrCodePetNotAvailable, ErrCodeApplicationClosed:
		return 503

	default:
		return 500
	}
}
