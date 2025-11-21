package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"

	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/models"
	customValidator "github.com/petmatch/app/shared/validator"
)

func init() {
	// Register custom validators for testing
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		customValidator.RegisterCustomValidators(v)
	}
	gin.SetMode(gin.TestMode)
}

// TestUserRegisterRequest_Validation tests the validation of UserRegisterRequest
func TestUserRegisterRequest_Validation(t *testing.T) {
	testCases := []struct {
		name      string
		reqBody   models.UserRegisterRequest
		shouldErr bool
		errorMsg  string
	}{
		{
			name: "Valid request",
			reqBody: models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "adopter",
			},
			shouldErr: false,
		},
		{
			name: "Invalid email",
			reqBody: models.UserRegisterRequest{
				Email:    "invalid-email",
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "adopter",
			},
			shouldErr: true,
			errorMsg:  "email",
		},
		{
			name: "Weak password",
			reqBody: models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "123",
				Name:     "Test User",
				Type:     "adopter",
			},
			shouldErr: true,
			errorMsg:  "password",
		},
		{
			name: "Missing email",
			reqBody: models.UserRegisterRequest{
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "adopter",
			},
			shouldErr: true,
			errorMsg:  "email",
		},
		{
			name: "Missing password",
			reqBody: models.UserRegisterRequest{
				Email: "test@example.com",
				Name:  "Test User",
				Type:  "adopter",
			},
			shouldErr: true,
			errorMsg:  "password",
		},
		{
			name: "Missing name",
			reqBody: models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Type:     "adopter",
			},
			shouldErr: true,
			errorMsg:  "name",
		},
		{
			name: "Invalid user type",
			reqBody: models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "invalid",
			},
			shouldErr: true,
			errorMsg:  "type",
		},
		{
			name: "Name too short",
			reqBody: models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Name:     "A",
				Type:     "adopter",
			},
			shouldErr: true,
			errorMsg:  "name",
		},
		{
			name: "Valid with optional phone",
			reqBody: models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "shelter",
				Phone:    "09012345678",
			},
			shouldErr: false,
		},
	}

	validate := binding.Validator.Engine().(*validator.Validate)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validate.Struct(tc.reqBody)

			if tc.shouldErr {
				assert.Error(t, err, "Expected validation error but got none")
				if err != nil {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
			} else {
				assert.NoError(t, err, "Expected no validation error but got: %v", err)
			}
		})
	}
}

// TestValidationErrorMessage tests the getValidationErrorMessage function
func TestGetValidationErrorMessage(t *testing.T) {
	// This would require exposing getValidationErrorMessage or testing it indirectly
	// For now, we'll test the actual validator behavior

	testCases := []struct {
		name      string
		reqBody   map[string]interface{}
		checkFunc func(*testing.T, *httptest.ResponseRecorder)
	}{
		{
			name: "Missing required field",
			reqBody: map[string]interface{}{
				"password": "Test@1234",
				"name":     "Test User",
				"type":     "adopter",
			},
			checkFunc: func(t *testing.T, w *httptest.ResponseRecorder) {
				assert.Equal(t, http.StatusBadRequest, w.Code)
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jsonBody, _ := json.Marshal(tc.reqBody)
			req := httptest.NewRequest(http.MethodPost, "/test", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			c, _ := gin.CreateTestContext(w)
			c.Request = req

			var model models.UserRegisterRequest
			err := c.ShouldBindJSON(&model)

			if err != nil {
				tc.checkFunc(t, w)
			}
		})
	}
}

// TestPasswordStrengthValidation tests password strength requirements
func TestPasswordStrengthValidation(t *testing.T) {
	testCases := []struct {
		name      string
		password  string
		shouldErr bool
	}{
		{
			name:      "Strong password with all requirements",
			password:  "Test@1234",
			shouldErr: false,
		},
		{
			name:      "Password with 12+ chars, 3 of 4 types",
			password:  "TestPassword123",
			shouldErr: false,
		},
		{
			name:      "Too short",
			password:  "Test@1",
			shouldErr: true,
		},
		{
			name:      "No uppercase",
			password:  "test@1234",
			shouldErr: true,
		},
		{
			name:      "No lowercase",
			password:  "TEST@1234",
			shouldErr: true,
		},
		{
			name:      "No number",
			password:  "Test@test",
			shouldErr: true,
		},
		{
			name:      "Common password",
			password:  "password",
			shouldErr: true,
		},
	}

	validate := binding.Validator.Engine().(*validator.Validate)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: tc.password,
				Name:     "Test User",
				Type:     "adopter",
			}

			err := validate.Struct(req)

			if tc.shouldErr {
				assert.Error(t, err, "Expected password validation error")
			} else {
				assert.NoError(t, err, "Expected valid password")
			}
		})
	}
}

// TestEmailValidation tests email validation including typo detection
func TestEmailValidation(t *testing.T) {
	testCases := []struct {
		name      string
		email     string
		shouldErr bool
	}{
		{
			name:      "Valid email",
			email:     "test@example.com",
			shouldErr: false,
		},
		{
			name:      "Valid gmail",
			email:     "user@gmail.com",
			shouldErr: false,
		},
		{
			name:      "Invalid format",
			email:     "invalid-email",
			shouldErr: true,
		},
		{
			name:      "Typo in domain (gmial)",
			email:     "user@gmial.com",
			shouldErr: true,
		},
		{
			name:      "Missing @",
			email:     "userexample.com",
			shouldErr: true,
		},
		{
			name:      "Empty",
			email:     "",
			shouldErr: true,
		},
	}

	validate := binding.Validator.Engine().(*validator.Validate)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := models.UserRegisterRequest{
				Email:    tc.email,
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "adopter",
			}

			err := validate.Struct(req)

			if tc.shouldErr {
				assert.Error(t, err, "Expected email validation error")
			} else {
				assert.NoError(t, err, "Expected valid email")
			}
		})
	}
}

// TestPhoneValidation tests Japanese phone number validation
func TestPhoneValidation(t *testing.T) {
	testCases := []struct {
		name      string
		phone     string
		shouldErr bool
	}{
		{
			name:      "Valid mobile without dashes",
			phone:     "09012345678",
			shouldErr: false,
		},
		{
			name:      "Valid mobile with dashes",
			phone:     "090-1234-5678",
			shouldErr: false,
		},
		{
			name:      "Valid landline",
			phone:     "03-1234-5678",
			shouldErr: false,
		},
		{
			name:      "Empty (optional field)",
			phone:     "",
			shouldErr: false,
		},
		{
			name:      "Invalid format",
			phone:     "123-456",
			shouldErr: true,
		},
		{
			name:      "Too short",
			phone:     "090123",
			shouldErr: true,
		},
	}

	validate := binding.Validator.Engine().(*validator.Validate)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Name:     "Test User",
				Type:     "adopter",
				Phone:    tc.phone,
			}

			err := validate.Struct(req)

			if tc.shouldErr {
				assert.Error(t, err, "Expected phone validation error")
			} else {
				assert.NoError(t, err, "Expected valid phone")
			}
		})
	}
}

// TestSanitization tests that dangerous characters are rejected
func TestSanitization(t *testing.T) {
	testCases := []struct {
		name      string
		inputName string
		shouldErr bool
	}{
		{
			name:      "Valid name",
			inputName: "Test User",
			shouldErr: false,
		},
		{
			name:      "Name with script tag",
			inputName: "<script>alert('xss')</script>",
			shouldErr: true,
		},
		{
			name:      "Name with javascript",
			inputName: "javascript:alert('xss')",
			shouldErr: true,
		},
		{
			name:      "Name with onerror",
			inputName: "<img onerror='alert(1)'>",
			shouldErr: true,
		},
	}

	validate := binding.Validator.Engine().(*validator.Validate)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := models.UserRegisterRequest{
				Email:    "test@example.com",
				Password: "Test@1234",
				Name:     tc.inputName,
				Type:     "adopter",
			}

			err := validate.Struct(req)

			if tc.shouldErr {
				assert.Error(t, err, "Expected sanitization error")
			} else {
				assert.NoError(t, err, "Expected valid name")
			}
		})
	}
}

// TestUserLoginRequest_Validation tests login request validation
func TestUserLoginRequest_Validation(t *testing.T) {
	testCases := []struct {
		name      string
		reqBody   models.UserLoginRequest
		shouldErr bool
	}{
		{
			name: "Valid login",
			reqBody: models.UserLoginRequest{
				Email:    "test@example.com",
				Password: "anypassword",
			},
			shouldErr: false,
		},
		{
			name: "Missing email",
			reqBody: models.UserLoginRequest{
				Password: "password",
			},
			shouldErr: true,
		},
		{
			name: "Missing password",
			reqBody: models.UserLoginRequest{
				Email: "test@example.com",
			},
			shouldErr: true,
		},
		{
			name: "Invalid email format",
			reqBody: models.UserLoginRequest{
				Email:    "invalid-email",
				Password: "password",
			},
			shouldErr: true,
		},
	}

	validate := binding.Validator.Engine().(*validator.Validate)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validate.Struct(tc.reqBody)

			if tc.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Benchmarks
func BenchmarkPasswordValidation(b *testing.B) {
	validate := binding.Validator.Engine().(*validator.Validate)
	req := models.UserRegisterRequest{
		Email:    "test@example.com",
		Password: "Test@1234",
		Name:     "Test User",
		Type:     "adopter",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		validate.Struct(req)
	}
}

func TestConfig(t *testing.T) {
	cfg := &config.Config{
		Port: "8081",
		Env:  "test",
	}

	assert.NotNil(t, cfg)
	assert.Equal(t, "8081", cfg.Port)
	assert.Equal(t, "test", cfg.Env)
}
