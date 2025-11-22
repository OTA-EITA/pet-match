package validator

import "github.com/go-playground/validator/v10"

// GetValidationErrorMessage returns a user-friendly error message for validation errors
func GetValidationErrorMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email", "email_strict":
		return "Invalid email address"
	case "uuid":
		return "Invalid UUID format"
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
