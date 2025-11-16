package models

import "time"

// Application represents a user's application to adopt/meet a cat
type Application struct {
	ID             string     `json:"id" redis:"id"`
	UserID         string     `json:"user_id" redis:"user_id"`
	CatID          string     `json:"cat_id" redis:"cat_id"`
	OrganizationID string     `json:"organization_id" redis:"organization_id"` // Shelter or Breeder ID
	Status         string     `json:"status" redis:"status"`                   // pending, approved, rejected, interview_scheduled, trial, adopted, cancelled
	Message        string     `json:"message" redis:"message"`                 // User's application message
	UserInfo       UserInfo   `json:"user_info"`                               // User's detailed information
	CreatedAt      time.Time  `json:"created_at" redis:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" redis:"updated_at"`
	RespondedAt    *time.Time `json:"responded_at,omitempty" redis:"responded_at,omitempty"`
	ResponseNote   string     `json:"response_note,omitempty" redis:"response_note,omitempty"` // Organization's response
}

// UserInfo contains detailed information about the applicant
type UserInfo struct {
	Experience   string `json:"experience"`    // beginner, intermediate, advanced
	HousingType  string `json:"housing_type"`  // apartment, house, condo
	HasYard      bool   `json:"has_yard"`      // Has yard/outdoor space
	HasOtherPets bool   `json:"has_other_pets"` // Has other pets at home
	HasChildren  bool   `json:"has_children"`  // Has children
	ChildrenAges []int  `json:"children_ages,omitempty"` // Ages of children if applicable
}

// ApplicationRequest represents a request to create an application
type ApplicationRequest struct {
	CatID          string   `json:"cat_id" binding:"required"`
	OrganizationID string   `json:"organization_id" binding:"required"`
	Message        string   `json:"message" binding:"required,min=20,max=1000"` // Require meaningful message
	UserInfo       UserInfo `json:"user_info" binding:"required"`
}

// ApplicationResponse represents the response for application requests
type ApplicationResponse struct {
	Applications []ApplicationWithDetails `json:"applications"`
	Total        int                      `json:"total"`
	Page         int                      `json:"page"`
	Limit        int                      `json:"limit"`
}

// ApplicationWithDetails includes cat and organization details
type ApplicationWithDetails struct {
	Application  *Application           `json:"application"`
	Cat          map[string]interface{} `json:"cat"`
	Organization map[string]interface{} `json:"organization"`
}

// UpdateApplicationStatusRequest represents a request to update application status
type UpdateApplicationStatusRequest struct {
	Status       string `json:"status" binding:"required,oneof=pending approved rejected interview_scheduled trial adopted cancelled"`
	ResponseNote string `json:"response_note,omitempty"`
}

// ApplicationStatusCounts represents counts of applications by status
type ApplicationStatusCounts struct {
	Pending            int `json:"pending"`
	Approved           int `json:"approved"`
	Rejected           int `json:"rejected"`
	InterviewScheduled int `json:"interview_scheduled"`
	Trial              int `json:"trial"`
	Adopted            int `json:"adopted"`
	Cancelled          int `json:"cancelled"`
	Total              int `json:"total"`
}
