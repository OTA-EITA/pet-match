package validator

import (
	"fmt"
	"regexp"
	"unicode"

	"github.com/go-playground/validator/v10"
)

var (
	// Common weak passwords (subset - in production, use a larger list)
	commonPasswords = map[string]bool{
		"password":   true,
		"12345678":   true,
		"123456789":  true,
		"qwerty":     true,
		"abc123":     true,
		"password1":  true,
		"password123": true,
		"welcome":    true,
		"admin":      true,
		"letmein":    true,
		"monkey":     true,
		"dragon":     true,
		"master":     true,
		"sunshine":   true,
		"princess":   true,
	}
)

// PasswordStrength validates password strength
// Requirements:
// - Minimum 12 characters (or 8 with high complexity)
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one digit
// - At least one special character
// - Not in common passwords list
func PasswordStrength(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	// Minimum length check
	if len(password) < 8 {
		return false
	}

	// Check against common passwords
	if commonPasswords[password] {
		return false
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	// If password is 12+ chars, require at least 3 of 4 character types
	if len(password) >= 12 {
		complexityCount := 0
		if hasUpper {
			complexityCount++
		}
		if hasLower {
			complexityCount++
		}
		if hasNumber {
			complexityCount++
		}
		if hasSpecial {
			complexityCount++
		}
		return complexityCount >= 3
	}

	// For 8-11 chars, require all 4 character types
	return hasUpper && hasLower && hasNumber && hasSpecial
}

// ValidatePasswordStrength provides detailed password validation feedback
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return fmt.Errorf("password must be less than 128 characters")
	}

	if commonPasswords[password] {
		return fmt.Errorf("password is too common, please choose a stronger password")
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	missing := []string{}
	if !hasUpper {
		missing = append(missing, "uppercase letter")
	}
	if !hasLower {
		missing = append(missing, "lowercase letter")
	}
	if !hasNumber {
		missing = append(missing, "number")
	}
	if !hasSpecial {
		missing = append(missing, "special character")
	}

	// For 12+ chars passwords, require 3 of 4
	if len(password) >= 12 {
		complexityCount := 4 - len(missing)
		if complexityCount < 3 {
			return fmt.Errorf("password must contain at least 3 of: uppercase, lowercase, number, special character")
		}
		return nil
	}

	// For 8-11 chars, require all 4
	if len(missing) > 0 {
		return fmt.Errorf("password must contain: %v", missing)
	}

	return nil
}

// EmailValidator validates email format and common issues
func EmailValidator(fl validator.FieldLevel) bool {
	email := fl.Field().String()

	// Basic email regex
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return false
	}

	// Check for common typos in popular email providers
	// e.g., gmial.com instead of gmail.com
	suspiciousDomains := map[string]bool{
		"gmial.com":     true,
		"gmai.com":      true,
		"yahooo.com":    true,
		"yaho.com":      true,
		"hotmial.com":   true,
		"outlok.com":    true,
		"outloo.com":    true,
	}

	// Extract domain
	domainRegex := regexp.MustCompile(`@(.+)$`)
	matches := domainRegex.FindStringSubmatch(email)
	if len(matches) > 1 {
		domain := matches[1]
		if suspiciousDomains[domain] {
			return false
		}
	}

	return true
}

// PhoneValidator validates phone number format
func PhoneValidator(fl validator.FieldLevel) bool {
	phone := fl.Field().String()

	// If phone is empty, it's optional - let required tag handle it
	if phone == "" {
		return true
	}

	// Japanese phone number format: 09012345678 or 090-1234-5678 or 03-1234-5678
	phoneRegex := regexp.MustCompile(`^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$`)
	return phoneRegex.MatchString(phone)
}

// SanitizedString validates that string doesn't contain potentially dangerous characters
func SanitizedString(fl validator.FieldLevel) bool {
	str := fl.Field().String()

	// Check for HTML/JavaScript injection attempts
	dangerous := []string{
		"<script",
		"javascript:",
		"onerror=",
		"onclick=",
		"onload=",
		"<iframe",
		"<object",
		"<embed",
		"eval(",
	}

	for _, pattern := range dangerous {
		if regexp.MustCompile(`(?i)` + regexp.QuoteMeta(pattern)).MatchString(str) {
			return false
		}
	}

	return true
}

// RegisterCustomValidators registers custom validators with the validator instance
func RegisterCustomValidators(v *validator.Validate) error {
	if err := v.RegisterValidation("password_strength", PasswordStrength); err != nil {
		return err
	}
	if err := v.RegisterValidation("email_strict", EmailValidator); err != nil {
		return err
	}
	if err := v.RegisterValidation("phone_jp", PhoneValidator); err != nil {
		return err
	}
	if err := v.RegisterValidation("sanitized", SanitizedString); err != nil {
		return err
	}
	return nil
}
