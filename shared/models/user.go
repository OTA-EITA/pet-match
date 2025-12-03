// Package models contains data models and structures for the PetMatch application.
// It defines the core entities like Pet, User, and their relationships.
package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID           string    `json:"id" redis:"id"`
	Email        string    `json:"email" redis:"email"`
	Name         string    `json:"name" redis:"name"`
	Type         string    `json:"type" redis:"type"` // adopter, shelter, individual
	Phone        string    `json:"phone" redis:"phone"`
	Address      string    `json:"address" redis:"address"`
	Coordinates  string    `json:"coordinates" redis:"coordinates"` // "lat,lng"
	Verified     bool      `json:"verified" redis:"verified"`
	Description  string    `json:"description" redis:"description"`       // 自己紹介
	Website      string    `json:"website" redis:"website"`               // Webサイト
	ProfileImage string    `json:"profile_image" redis:"profile_image"`   // プロフィール画像URL
	CreatedAt    time.Time `json:"created_at" redis:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" redis:"updated_at"`
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
	Type     string `json:"type" binding:"required,oneof=adopter shelter"`
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

// UpdateProfileRequest represents profile update request
type UpdateProfileRequest struct {
	Name         string `json:"name" binding:"omitempty,min=2,max=100,sanitized"`
	Phone        string `json:"phone" binding:"omitempty,phone_jp"`
	Address      string `json:"address" binding:"omitempty,max=500,sanitized"`
	Description  string `json:"description" binding:"omitempty,max=2000,sanitized"`
	Website      string `json:"website" binding:"omitempty,url,max=500"`
	ProfileImage string `json:"profile_image" binding:"omitempty,url,max=500"`
}

// PublicProfile represents a public user profile (without sensitive info)
type PublicProfile struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Address      string    `json:"address"`
	Description  string    `json:"description"`
	Website      string    `json:"website"`
	ProfileImage string    `json:"profile_image"`
	Verified     bool      `json:"verified"`
	CreatedAt    time.Time `json:"created_at"`
}

// ToPublicProfile converts User to PublicProfile
func (u *User) ToPublicProfile() *PublicProfile {
	return &PublicProfile{
		ID:           u.ID,
		Name:         u.Name,
		Type:         u.Type,
		Address:      u.Address,
		Description:  u.Description,
		Website:      u.Website,
		ProfileImage: u.ProfileImage,
		Verified:     u.Verified,
		CreatedAt:    u.CreatedAt,
	}
}

// UpdatePasswordRequest represents password update request
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,password_strength"`
}
