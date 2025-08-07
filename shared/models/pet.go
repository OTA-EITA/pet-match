// Package models contains data models and structures for the PetMatch application.
// It defines the core entities like Pet, User, and their relationships.
package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Pet represents a pet in the system
type Pet struct {
	ID          string      `json:"id" redis:"id"`
	Name        string      `json:"name" redis:"name"`
	Species     string      `json:"species" redis:"species"` // dog, cat, bird, etc.
	Breed       string      `json:"breed" redis:"breed"`
	AgeInfo     AgeInfo     `json:"age_info" redis:"age_info"` // 詳細な年齢情報
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

// AgeInfo represents detailed age information for pets
type AgeInfo struct {
	Years       int    `json:"years"`         // 年 (既存のageと同じ)
	Months      int    `json:"months"`        // 追加の月数 (0-11)
	TotalMonths int    `json:"total_months"`  // 総月齢
	IsEstimated bool   `json:"is_estimated"`  // 推定年齢フラグ
	AgeText     string `json:"age_text"`      // "4歳2ヶ月" 等の表示用
}

// MedicalInfo represents pet medical information
type MedicalInfo struct {
	Vaccinated   bool     `json:"vaccinated" redis:"vaccinated"`
	Neutered     bool     `json:"neutered" redis:"neutered"`
	HealthIssues []string `json:"health_issues" redis:"health_issues"`
	LastCheckup  string   `json:"last_checkup" redis:"last_checkup"`
	Medications  []string `json:"medications" redis:"medications"`
}

// CalculateAgeInfo creates detailed age information from years and additional months
func CalculateAgeInfo(years, additionalMonths int, isEstimated bool) AgeInfo {
	totalMonths := years*12 + additionalMonths
	ageText := formatAgeText(years, additionalMonths)
	
	return AgeInfo{
		Years:       years,
		Months:      additionalMonths,
		TotalMonths: totalMonths,
		IsEstimated: isEstimated,
		AgeText:     ageText,
	}
}

// formatAgeText creates human-readable age text
func formatAgeText(years, months int) string {
	if years == 0 {
		if months == 0 {
			return "生後間もない"
		}
		return fmt.Sprintf("生後%dヶ月", months)
	}
	
	if months == 0 {
		return fmt.Sprintf("%d歳", years)
	}
	
	return fmt.Sprintf("%d歳%dヶ月", years, months)
}

// NewPetFromRequest creates a new pet from PetCreateRequest
func NewPetFromRequest(req PetCreateRequest, ownerID string) *Pet {
	now := time.Now()
	ageInfo := CalculateAgeInfo(req.AgeYears, req.AgeMonths, req.IsEstimated)
	
	return &Pet{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Species:     req.Species,
		Breed:       req.Breed,
		AgeInfo:     ageInfo,
		Gender:      req.Gender,
		Size:        req.Size,
		Color:       req.Color,
		Personality: req.Personality,
		MedicalInfo: req.MedicalInfo,
		OwnerID:     ownerID,
		Status:      "available",
		Location:    req.Location,
		Images:      []string{},
		Description: req.Description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// MigrateAgeInfo migrates existing pets to include age_info
func (p *Pet) MigrateAgeInfo() {
	// If age_info is not properly initialized, set default values
	if p.AgeInfo.TotalMonths == 0 && p.AgeInfo.Years == 0 {
		// Default to 1 year if no age info
		p.AgeInfo = CalculateAgeInfo(1, 0, true)
	}
	// If age_text is empty, recalculate it
	if p.AgeInfo.AgeText == "" {
		p.AgeInfo.AgeText = formatAgeText(p.AgeInfo.Years, p.AgeInfo.Months)
	}
}

// NewPet creates a new pet with generated ID (deprecated - use NewPetFromRequest)
func NewPet(name, species, breed string, age int, ownerID string) *Pet {
	now := time.Now()
	ageInfo := CalculateAgeInfo(age, 0, false) // age年, 0ヶ月追加, 推定ではない
	return &Pet{
		ID:          uuid.New().String(),
		Name:        name,
		Species:     species,
		Breed:       breed,
		AgeInfo:     ageInfo,
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
	AgeYears    int         `json:"age_years" binding:"required,min=0"`  // 年齢(年)
	AgeMonths   int         `json:"age_months" binding:"min=0,max=11"`   // 追加月数 (0-11)
	IsEstimated bool        `json:"is_estimated"`                        // 推定年齢フラグ
	Gender      string      `json:"gender" binding:"oneof=male female unknown"`
	Size        string      `json:"size" binding:"oneof=small medium large extra_large"`
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
