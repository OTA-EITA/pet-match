package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/petmatch/app/services/auth-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/errors"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/models"
)

type AuthHandler struct {
	authService *services.AuthService
	cfg         *config.Config
}

func NewAuthHandler(authService *services.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.UserRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Parse validation errors
		if validationErrs, ok := err.(validator.ValidationErrors); ok {
			fieldErrors := make(map[string]string)
			for _, fieldErr := range validationErrs {
				fieldErrors[fieldErr.Field()] = getValidationErrorMessage(fieldErr)
			}
			middleware.RespondWithValidationError(c, fieldErrors)
			return
		}

		// Generic validation error
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails(err.Error()))
		return
	}

	// Register user
	user, tokens, err := h.authService.Register(&req)
	if err != nil {
		// Check for specific error types
		if err.Error() == "user already exists" {
			middleware.AbortWithError(c, errors.ErrUserAlreadyExists)
			return
		}

		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails(err.Error()))
		return
	}

	// Return user info and tokens
	middleware.RespondWithSuccess(c, http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    user,
		"tokens":  tokens,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.UserLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails(err.Error()))
		return
	}

	// Authenticate user
	user, tokens, err := h.authService.Login(&req)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrInvalidCredentials)
		return
	}

	// Return user info and tokens
	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    user,
		"tokens":  tokens,
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails(err.Error()))
		return
	}

	// Refresh tokens
	tokens, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		if err.Error() == "invalid refresh token" {
			middleware.AbortWithError(c, errors.ErrInvalidToken)
			return
		}
		middleware.AbortWithError(c, errors.ErrTokenExpired)
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"tokens":  tokens,
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	// Logout user (invalidate refresh token)
	if err := h.authService.Logout(userID); err != nil {
		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails("Failed to logout"))
		return
	}

	middleware.RespondWithMessage(c, http.StatusOK, "Logout successful")
}

// GetProfile returns user profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	// Get user profile
	user, err := h.authService.GetProfile(userID)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrUserNotFound)
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"user": user,
	})
}

// VerifyToken verifies the current token and returns user info
func (h *AuthHandler) VerifyToken(c *gin.Context) {
	userID := c.GetString("user_id")
	userType := c.GetString("user_type")
	email := c.GetString("email")

	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	// Token is valid (we reached this point through auth middleware)
	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"valid": true,
		"user": gin.H{
			"id":    userID,
			"type":  userType,
			"email": email,
		},
	})
}

// getValidationErrorMessage returns a user-friendly error message for validation errors
func getValidationErrorMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email", "email_strict":
		return "Invalid email address"
	case "min":
		return "Must be at least " + fe.Param() + " characters"
	case "max":
		return "Must be at most " + fe.Param() + " characters"
	case "password_strength":
		return "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
	case "phone_jp":
		return "Invalid phone number format"
	case "sanitized":
		return "Contains invalid characters"
	case "oneof":
		return "Must be one of: " + fe.Param()
	default:
		return "Invalid value"
	}
}
