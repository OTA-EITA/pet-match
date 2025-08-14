package models

import "time"

// UserPreference represents user's pet preferences
type UserPreference struct {
	UserID          string                 `json:"user_id" redis:"user_id"`
	Species         []string               `json:"species" redis:"species"`
	Breeds          []string               `json:"breeds" redis:"breeds"`
	AgeMin          int                    `json:"age_min" redis:"age_min"`
	AgeMax          int                    `json:"age_max" redis:"age_max"`
	Sizes           []string               `json:"sizes" redis:"sizes"`
	Genders         []string               `json:"genders" redis:"genders"`
	MaxRadius       int                    `json:"max_radius" redis:"max_radius"`
	Location        *Location              `json:"location" redis:"location"`
	Personalities   []string               `json:"personalities" redis:"personalities"`
	SpecialNeeds    bool                   `json:"special_needs" redis:"special_needs"`
	GoodWithKids    bool                   `json:"good_with_kids" redis:"good_with_kids"`
	GoodWithPets    bool                   `json:"good_with_pets" redis:"good_with_pets"`
	ExperienceLevel string                 `json:"experience_level" redis:"experience_level"` // beginner, intermediate, expert
	HousingType     string                 `json:"housing_type" redis:"housing_type"`          // apartment, house, farm
	HasYard         bool                   `json:"has_yard" redis:"has_yard"`
	CustomFilters   map[string]interface{} `json:"custom_filters" redis:"custom_filters"`
	CreatedAt       time.Time              `json:"created_at" redis:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at" redis:"updated_at"`
}

// PreferenceRequest represents a request to set/update preferences
type PreferenceRequest struct {
	Species         []string               `json:"species,omitempty"`
	Breeds          []string               `json:"breeds,omitempty"`
	AgeMin          *int                   `json:"age_min,omitempty"`
	AgeMax          *int                   `json:"age_max,omitempty"`
	Sizes           []string               `json:"sizes,omitempty"`
	Genders         []string               `json:"genders,omitempty"`
	MaxRadius       *int                   `json:"max_radius,omitempty"`
	Location        *Location              `json:"location,omitempty"`
	Personalities   []string               `json:"personalities,omitempty"`
	SpecialNeeds    *bool                  `json:"special_needs,omitempty"`
	GoodWithKids    *bool                  `json:"good_with_kids,omitempty"`
	GoodWithPets    *bool                  `json:"good_with_pets,omitempty"`
	ExperienceLevel string                 `json:"experience_level,omitempty"`
	HousingType     string                 `json:"housing_type,omitempty"`
	HasYard         *bool                  `json:"has_yard,omitempty"`
	CustomFilters   map[string]interface{} `json:"custom_filters,omitempty"`
}
