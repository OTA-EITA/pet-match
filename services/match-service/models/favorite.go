package models

import "time"

// Favorite represents a user's favorite pet
type Favorite struct {
	ID        string    `json:"id" redis:"id"`
	UserID    string    `json:"user_id" redis:"user_id"`
	PetID     string    `json:"pet_id" redis:"pet_id"`
	Note      string    `json:"note" redis:"note"`
	CreatedAt time.Time `json:"created_at" redis:"created_at"`
}

// FavoriteRequest represents a request to add a favorite
type FavoriteRequest struct {
	PetID string `json:"pet_id" binding:"required"`
	Note  string `json:"note,omitempty"`
}

// FavoriteResponse represents the response for favorites
type FavoriteResponse struct {
	Favorites []FavoriteResult `json:"favorites"`
	Total     int              `json:"total"`
	Page      int              `json:"page"`
	Limit     int              `json:"limit"`
}

// FavoriteResult represents a favorite with pet information
type FavoriteResult struct {
	Favorite *Favorite              `json:"favorite"`
	Pet      map[string]interface{} `json:"pet"`
}
