package models

// SearchQuery represents a search query for cats
type SearchQuery struct {
	Species      string    `json:"species,omitempty" form:"species"`           // cat, dog (future)
	Breeds       []string  `json:"breeds,omitempty" form:"breeds"`             // specific breeds
	AgeMin       int       `json:"age_min,omitempty" form:"age_min"`           // minimum age in years
	AgeMax       int       `json:"age_max,omitempty" form:"age_max"`           // maximum age in years
	Gender       string    `json:"gender,omitempty" form:"gender"`             // male, female
	Size         string    `json:"size,omitempty" form:"size"`                 // small, medium, large
	Location     *Location `json:"location,omitempty"`                         // user's location
	MaxRadius    int       `json:"max_radius,omitempty" form:"max_radius"`     // search radius in km
	GoodWithKids *bool     `json:"good_with_kids,omitempty" form:"good_with_kids"` // filter for kid-friendly
	GoodWithPets *bool     `json:"good_with_pets,omitempty" form:"good_with_pets"` // filter for pet-friendly
	SpecialNeeds *bool     `json:"special_needs,omitempty" form:"special_needs"`   // filter for special needs
	Available    *bool     `json:"available,omitempty" form:"available"`       // only available cats
	Page         int       `json:"page" form:"page"`           // page number (starts at 1)
	Limit        int       `json:"limit" form:"limit"`         // items per page
	SortBy       string    `json:"sort_by,omitempty" form:"sort_by"`           // created_at, age, distance
	SortOrder    string    `json:"sort_order,omitempty" form:"sort_order"`     // asc, desc
}

// SearchResponse represents the response for search queries
type SearchResponse struct {
	Cats   []map[string]interface{} `json:"cats"`
	Total  int                      `json:"total"`
	Page   int                      `json:"page"`
	Limit  int                      `json:"limit"`
	Filters *SearchQuery            `json:"filters,omitempty"` // Echo back applied filters
}

// Location represents geographical coordinates
type Location struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
}

// SetDefaults sets default values for search query
func (q *SearchQuery) SetDefaults() {
	if q.Page == 0 {
		q.Page = 1
	}
	if q.Limit == 0 {
		q.Limit = 20
	}
	if q.SortBy == "" {
		q.SortBy = "created_at"
	}
	if q.SortOrder == "" {
		q.SortOrder = "desc"
	}
	if q.MaxRadius == 0 && q.Location != nil {
		q.MaxRadius = 50 // default 50km radius
	}
}

// Validate validates the search query
func (q *SearchQuery) Validate() error {
	q.SetDefaults()
	
	// Validate sort_by
	validSortBy := map[string]bool{
		"created_at": true,
		"age":        true,
		"distance":   true,
	}
	if !validSortBy[q.SortBy] {
		q.SortBy = "created_at"
	}
	
	// Validate sort_order
	if q.SortOrder != "asc" && q.SortOrder != "desc" {
		q.SortOrder = "desc"
	}
	
	// Validate age range
	if q.AgeMin < 0 {
		q.AgeMin = 0
	}
	if q.AgeMax < 0 {
		q.AgeMax = 0
	}
	if q.AgeMax > 0 && q.AgeMin > q.AgeMax {
		q.AgeMin, q.AgeMax = q.AgeMax, q.AgeMin // swap
	}
	
	return nil
}
