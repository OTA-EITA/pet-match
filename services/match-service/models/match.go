package models

import "time"

// Match represents a matching result between user and pet
type Match struct {
	ID        string    `json:"id" redis:"id"`
	UserID    string    `json:"user_id" redis:"user_id"`
	PetID     string    `json:"pet_id" redis:"pet_id"`
	Score     float64   `json:"score" redis:"score"`
	Reason    string    `json:"reason" redis:"reason"`
	Status    string    `json:"status" redis:"status"` // pending, viewed, contacted, rejected
	CreatedAt time.Time `json:"created_at" redis:"created_at"`
	UpdatedAt time.Time `json:"updated_at" redis:"updated_at"`
}

// MatchRequest represents a match search request
type MatchRequest struct {
	UserID     string             `json:"user_id"`
	Species    string             `json:"species,omitempty"`
	Breed      string             `json:"breed,omitempty"`
	AgeMin     int                `json:"age_min,omitempty"`
	AgeMax     int                `json:"age_max,omitempty"`
	Size       string             `json:"size,omitempty"`
	Gender     string             `json:"gender,omitempty"`
	Location   *Location          `json:"location,omitempty"`
	MaxRadius  int                `json:"max_radius,omitempty"` // in kilometers
	Filters    map[string]interface{} `json:"filters,omitempty"`
	Limit      int                `json:"limit,omitempty"`
}

// MatchResponse represents the response for match requests
type MatchResponse struct {
	Matches []MatchResult `json:"matches"`
	Total   int           `json:"total"`
	Page    int           `json:"page"`
	Limit   int           `json:"limit"`
}

// MatchResult represents a single match result with pet info
type MatchResult struct {
	Match *Match                 `json:"match"`
	Pet   map[string]interface{} `json:"pet"`
}

// MatchHistoryResponse represents the response for match history
type MatchHistoryResponse struct {
	Matches []MatchResult `json:"matches"`
	Total   int           `json:"total"`
	Page    int           `json:"page"`
	Limit   int           `json:"limit"`
	Status  string        `json:"status,omitempty"`
}

// UpdateMatchStatusRequest represents a request to update match status
type UpdateMatchStatusRequest struct {
	MatchID string `json:"match_id" binding:"required"`
	Status  string `json:"status" binding:"required,oneof=pending viewed contacted rejected"`
	Note    string `json:"note,omitempty"`
}

// Location represents geographical coordinates
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
