package models

// SuggestionQuery represents a query for cat suggestions
type SuggestionQuery struct {
	CatID  string    `json:"cat_id,omitempty"`  // For "similar cats"
	Location *Location `json:"location,omitempty"` // For "nearby cats"
	Limit  int       `json:"limit" form:"limit" binding:"min=1,max=50"`
}

// SuggestionResponse represents the response for suggestion queries
type SuggestionResponse struct {
	Cats   []map[string]interface{} `json:"cats"`
	Type   string                   `json:"type"` // similar, nearby, new
	Total  int                      `json:"total"`
	Limit  int                      `json:"limit"`
}

// SimilarityScore represents the similarity between two cats
type SimilarityScore struct {
	CatID          string  `json:"cat_id"`
	SimilarityType string  `json:"similarity_type"` // image, breed, personality
	Score          float64 `json:"score"`           // 0.0 to 1.0
}

// SetDefaults sets default values for suggestion query
func (q *SuggestionQuery) SetDefaults() {
	if q.Limit == 0 {
		q.Limit = 10
	}
}
