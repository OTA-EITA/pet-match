// Package models contains data models and structures for the PetMatch application.
// It defines the core entities like Pet, User, and their relationships.
package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID          string    `json:"id" redis:"id"`
	Email       string    `json:"email" redis:"email"`
	Name        string    `json:"name" redis:"name"`
	Type        string    `json:"type" redis:"type"` // adopter, shelter, individual
	Phone       string    `json:"phone" redis:"phone"`
	Address     string    `json:"address" redis:"address"`
	Coordinates string    `json:"coordinates" redis:"coordinates"` // "lat,lng"
	Verified    bool      `json:"verified" redis:"verified"`
	CreatedAt   time.Time `json:"created_at" redis:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" redis:"updated_at"`
}

// NewUser creates a new user with generated ID
func NewUser(email, name, userType string) *User {
	now := time.Now()
	return &User{
		ID:        uuid.New().String(),
		Email:     email,
		Name:      name,
		Type:      userType,
		Verified:  false,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// UserRegisterRequest represents user registration request
type UserRegisterRequest struct {
	Email    string `json:"email" binding:"required,email_strict,max=255"`
	Password string `json:"password" binding:"required,password_strength"`
	Name     string `json:"name" binding:"required,min=2,max=100,sanitized"`
	Type     string `json:"type" binding:"required,oneof=adopter shelter individual"`
	Phone    string `json:"phone" binding:"omitempty,phone_jp"`
	Address  string `json:"address" binding:"omitempty,max=500,sanitized"`
}

// UserLoginRequest represents user login request
type UserLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthTokens represents JWT tokens
type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}
