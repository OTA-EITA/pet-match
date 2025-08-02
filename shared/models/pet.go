// Package models contains data models and structures for the PetMatch application.
// It defines the core entities like Pet, User, and their relationships.
package models

import (
	"time"

	"github.com/google/uuid"
)

// Pet represents a pet in the system
type Pet struct {
	ID          string      `json:"id" redis:"id"`
	Name        string      `json:"name" redis:"name"`
	Species     string      `json:"species" redis:"species"` // dog, cat, bird, etc.
	Breed       string      `json:"breed" redis:"breed"`
	Age         int         `json:"age" redis:"age"`
	Gender      string      `json:"gender" redis:"gender"` // male, female, unknown
	Size        string      `json:"size" redis:"size"`     // small, medium, large
	Color       string      `json:"color" redis:"color"`
	Personality []string    `json:"personality" redis:"personality"`
	MedicalInfo MedicalInfo `json:"medical_info" redis:"medical_info"`
	OwnerID     string      `json:"owner_id" redis:"owner_id"`
	Status      string      `json:"status" redis:"status"`     // available, pending, adopted
	Location    string      `json:"location" redis:"location"` // "lat,lng"
	Images      []string    `json:"images" redis:"images"`
	Description string      `json:"description" redis:"description"`
	CreatedAt   time.Time   `json:"created_at" redis:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at" redis:"updated_at"`
}

// MedicalInfo represents pet medical information
type MedicalInfo struct {
	Vaccinated   bool     `json:"vaccinated" redis:"vaccinated"`
	Neutered     bool     `json:"neutered" redis:"neutered"`
	HealthIssues []string `json:"health_issues" redis:"health_issues"`
	LastCheckup  string   `json:"last_checkup" redis:"last_checkup"`
	Medications  []string `json:"medications" redis:"medications"`
}

// NewPet creates a new pet with generated ID
func NewPet(name, species, breed string, age int, ownerID string) *Pet {
	now := time.Now()
	return &Pet{
		ID:          uuid.New().String(),
		Name:        name,
		Species:     species,
		Breed:       breed,
		Age:         age,
		OwnerID:     ownerID,
		Status:      "available",
		Images:      []string{},
		Personality: []string{},
		MedicalInfo: MedicalInfo{
			HealthIssues: []string{},
			Medications:  []string{},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// PetCreateRequest represents pet creation request
type PetCreateRequest struct {
	Name        string      `json:"name" binding:"required"`
	Species     string      `json:"species" binding:"required"`
	Breed       string      `json:"breed" binding:"required"`
	Age         int         `json:"age" binding:"required,min=0"`
	Gender      string      `json:"gender" binding:"oneof=male female unknown"`
	Size        string      `json:"size" binding:"oneof=small medium large"`
	Color       string      `json:"color"`
	Personality []string    `json:"personality"`
	MedicalInfo MedicalInfo `json:"medical_info"`
	Location    string      `json:"location"`
	Description string      `json:"description"`
}

// PetSearchRequest represents pet search parameters
type PetSearchRequest struct {
	Species     string   `json:"species"`
	Breed       string   `json:"breed"`
	AgeMin      int      `json:"age_min"`
	AgeMax      int      `json:"age_max"`
	Gender      string   `json:"gender"`
	Size        string   `json:"size"`
	Location    string   `json:"location"`
	Radius      int      `json:"radius"` // in kilometers
	Personality []string `json:"personality"`
	Limit       int      `json:"limit"`
	Offset      int      `json:"offset"`
}
