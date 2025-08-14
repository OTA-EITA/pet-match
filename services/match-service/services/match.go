package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/shared/config"
)

type MatchService struct {
	redis *redis.Client
	cfg   *config.Config
}

func NewMatchService(redisClient *redis.Client, cfg *config.Config) *MatchService {
	return &MatchService{
		redis: redisClient,
		cfg:   cfg,
	}
}

// FindMatches performs matching algorithm and returns results
func (s *MatchService) FindMatches(ctx context.Context, req *models.MatchRequest) (*models.MatchResponse, error) {
	// Get user preferences if not provided in request
	preferences, err := s.GetUserPreferences(ctx, req.UserID)
	if err != nil {
		log.Printf("Warning: Could not get user preferences: %v", err)
	}

	// Merge request with preferences
	mergedReq := s.mergeRequestWithPreferences(req, preferences)

	// Get pets from Pet Service (via Redis for now)
	pets, err := s.getPetsFromRedis(ctx, mergedReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get pets: %v", err)
	}

	// Apply filtering and scoring
	scoringService := NewScoringService(s.cfg)
	matches := make([]models.MatchResult, 0)

	for _, pet := range pets {
		// Calculate match score
		score := scoringService.CalculateScore(pet, preferences, mergedReq.Location)
		
		// Only include pets with score above threshold
		if score >= 0.3 { // 30% minimum match
			match := &models.Match{
				ID:        uuid.New().String(),
				UserID:    req.UserID,
				PetID:     pet["id"].(string),
				Score:     score,
				Reason:    scoringService.GenerateReason(pet, preferences),
				Status:    "pending",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			// Save match to Redis
			if err := s.saveMatch(ctx, match); err != nil {
				log.Printf("Warning: Could not save match: %v", err)
			}

			matches = append(matches, models.MatchResult{
				Match: match,
				Pet:   pet,
			})
		}
	}

	// Sort by score (highest first)
	for i := 0; i < len(matches)-1; i++ {
		for j := i + 1; j < len(matches); j++ {
			if matches[i].Match.Score < matches[j].Match.Score {
				matches[i], matches[j] = matches[j], matches[i]
			}
		}
	}

	// Apply limit
	limit := req.Limit
	if limit == 0 {
		limit = 20
	}
	if len(matches) > limit {
		matches = matches[:limit]
	}

	return &models.MatchResponse{
		Matches: matches,
		Total:   len(matches),
		Page:    1,
		Limit:   limit,
	}, nil
}

// GetUserPreferences retrieves user preferences from Redis
func (s *MatchService) GetUserPreferences(ctx context.Context, userID string) (*models.UserPreference, error) {
	key := fmt.Sprintf("user:preferences:%s", userID)
	
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // No preferences set
		}
		return nil, err
	}

	var preferences models.UserPreference
	if err := json.Unmarshal([]byte(data), &preferences); err != nil {
		return nil, err
	}

	return &preferences, nil
}

// SetUserPreferences saves user preferences to Redis
func (s *MatchService) SetUserPreferences(ctx context.Context, userID string, req *models.PreferenceRequest) (*models.UserPreference, error) {
	// Get existing preferences or create new
	existing, _ := s.GetUserPreferences(ctx, userID)
	
	preferences := &models.UserPreference{
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if existing != nil {
		preferences = existing
		preferences.UpdatedAt = time.Now()
	}

	// Update with new values
	if req.Species != nil {
		preferences.Species = req.Species
	}
	if req.Breeds != nil {
		preferences.Breeds = req.Breeds
	}
	if req.AgeMin != nil {
		preferences.AgeMin = *req.AgeMin
	}
	if req.AgeMax != nil {
		preferences.AgeMax = *req.AgeMax
	}
	if req.Sizes != nil {
		preferences.Sizes = req.Sizes
	}
	if req.Genders != nil {
		preferences.Genders = req.Genders
	}
	if req.MaxRadius != nil {
		preferences.MaxRadius = *req.MaxRadius
	}
	if req.Location != nil {
		preferences.Location = req.Location
	}
	if req.Personalities != nil {
		preferences.Personalities = req.Personalities
	}
	if req.SpecialNeeds != nil {
		preferences.SpecialNeeds = *req.SpecialNeeds
	}
	if req.GoodWithKids != nil {
		preferences.GoodWithKids = *req.GoodWithKids
	}
	if req.GoodWithPets != nil {
		preferences.GoodWithPets = *req.GoodWithPets
	}
	if req.ExperienceLevel != "" {
		preferences.ExperienceLevel = req.ExperienceLevel
	}
	if req.HousingType != "" {
		preferences.HousingType = req.HousingType
	}
	if req.HasYard != nil {
		preferences.HasYard = *req.HasYard
	}
	if req.CustomFilters != nil {
		preferences.CustomFilters = req.CustomFilters
	}

	// Save to Redis
	key := fmt.Sprintf("user:preferences:%s", userID)
	data, err := json.Marshal(preferences)
	if err != nil {
		return nil, err
	}

	if err := s.redis.Set(ctx, key, data, 0).Err(); err != nil {
		return nil, err
	}

	return preferences, nil
}

// AddFavorite adds a pet to user's favorites
func (s *MatchService) AddFavorite(ctx context.Context, userID, petID, note string) (*models.Favorite, error) {
	favorite := &models.Favorite{
		ID:        uuid.New().String(),
		UserID:    userID,
		PetID:     petID,
		Note:      note,
		CreatedAt: time.Now(),
	}

	// Save to Redis
	key := fmt.Sprintf("user:favorites:%s:%s", userID, petID)
	data, err := json.Marshal(favorite)
	if err != nil {
		return nil, err
	}

	if err := s.redis.Set(ctx, key, data, 0).Err(); err != nil {
		return nil, err
	}

	// Add to user's favorites list
	listKey := fmt.Sprintf("user:favorites:list:%s", userID)
	if err := s.redis.SAdd(ctx, listKey, petID).Err(); err != nil {
		return nil, err
	}

	return favorite, nil
}

// GetFavorites retrieves user's favorite pets
func (s *MatchService) GetFavorites(ctx context.Context, userID string, page, limit int) (*models.FavoriteResponse, error) {
	listKey := fmt.Sprintf("user:favorites:list:%s", userID)
	
	// Get favorite pet IDs
	petIDs, err := s.redis.SMembers(ctx, listKey).Result()
	if err != nil {
		return nil, err
	}

	favorites := make([]models.FavoriteResult, 0)

	for _, petID := range petIDs {
		// Get favorite details
		favoriteKey := fmt.Sprintf("user:favorites:%s:%s", userID, petID)
		favoriteData, err := s.redis.Get(ctx, favoriteKey).Result()
		if err != nil {
			continue
		}

		var favorite models.Favorite
		if err := json.Unmarshal([]byte(favoriteData), &favorite); err != nil {
			continue
		}

		// Get pet details
		pet, err := s.getPetByID(ctx, petID)
		if err != nil {
			continue
		}

		favorites = append(favorites, models.FavoriteResult{
			Favorite: &favorite,
			Pet:      pet,
		})
	}

	return &models.FavoriteResponse{
		Favorites: favorites,
		Total:     len(favorites),
		Page:      page,
		Limit:     limit,
	}, nil
}

// RemoveFavorite removes a pet from user's favorites
func (s *MatchService) RemoveFavorite(ctx context.Context, userID, petID string) error {
	// Remove from favorites
	key := fmt.Sprintf("user:favorites:%s:%s", userID, petID)
	if err := s.redis.Del(ctx, key).Err(); err != nil {
		return err
	}

	// Remove from favorites list
	listKey := fmt.Sprintf("user:favorites:list:%s", userID)
	if err := s.redis.SRem(ctx, listKey, petID).Err(); err != nil {
		return err
	}

	return nil
}

// GetMatchHistory retrieves user's match history with pagination and filtering
func (s *MatchService) GetMatchHistory(ctx context.Context, userID string, page, limit int, status string) (*models.MatchHistoryResponse, error) {
	// Get user's match IDs from Redis list
	historyKey := fmt.Sprintf("user:matches:%s", userID)
	
	// Calculate pagination offsets
	start := (page - 1) * limit
	end := start + limit - 1
	
	// Get match IDs for the requested page
	matchIDs, err := s.redis.LRange(ctx, historyKey, int64(start), int64(end)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get match IDs: %v", err)
	}
	
	// Get total count
	totalCount, err := s.redis.LLen(ctx, historyKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get total count: %v", err)
	}
	
	matches := make([]models.MatchResult, 0)
	
	for _, matchID := range matchIDs {
		// Get match details
		matchKey := fmt.Sprintf("match:%s", matchID)
		matchData, err := s.redis.Get(ctx, matchKey).Result()
		if err != nil {
			continue // Skip missing matches
		}
		
		var match models.Match
		if err := json.Unmarshal([]byte(matchData), &match); err != nil {
			continue
		}
		
		// Filter by status if specified
		if status != "" && match.Status != status {
			continue
		}
		
		// Get pet details
		pet, err := s.getPetByID(ctx, match.PetID)
		if err != nil {
			continue
		}
		
		matches = append(matches, models.MatchResult{
			Match: &match,
			Pet:   pet,
		})
	}
	
	return &models.MatchHistoryResponse{
		Matches: matches,
		Total:   int(totalCount),
		Page:    page,
		Limit:   limit,
		Status:  status,
	}, nil
}

// UpdateMatchStatus updates the status of a match
func (s *MatchService) UpdateMatchStatus(ctx context.Context, userID, matchID, status, note string) error {
	// Get match details to verify ownership
	matchKey := fmt.Sprintf("match:%s", matchID)
	matchData, err := s.redis.Get(ctx, matchKey).Result()
	if err != nil {
		return fmt.Errorf("match not found: %v", err)
	}
	
	var match models.Match
	if err := json.Unmarshal([]byte(matchData), &match); err != nil {
		return fmt.Errorf("failed to parse match: %v", err)
	}
	
	// Verify ownership
	if match.UserID != userID {
		return fmt.Errorf("unauthorized: match does not belong to user")
	}
	
	// Update match status
	match.Status = status
	match.UpdatedAt = time.Now()
	
	// Save updated match
	updatedData, err := json.Marshal(match)
	if err != nil {
		return fmt.Errorf("failed to marshal match: %v", err)
	}
	
	if err := s.redis.Set(ctx, matchKey, updatedData, 0).Err(); err != nil {
		return fmt.Errorf("failed to update match: %v", err)
	}
	
	// Optional: Save status change history
	if note != "" {
		historyKey := fmt.Sprintf("match:history:%s", matchID)
		historyEntry := map[string]interface{}{
			"status":    status,
			"note":      note,
			"timestamp": time.Now(),
			"user_id":   userID,
		}
		
		historyData, _ := json.Marshal(historyEntry)
		s.redis.LPush(ctx, historyKey, historyData)
	}
	
	return nil
}

// Helper methods

func (s *MatchService) mergeRequestWithPreferences(req *models.MatchRequest, prefs *models.UserPreference) *models.MatchRequest {
	if prefs == nil {
		return req
	}

	merged := *req

	if merged.Species == "" && len(prefs.Species) > 0 {
		merged.Species = prefs.Species[0] // Use first preference
	}
	if merged.AgeMin == 0 {
		merged.AgeMin = prefs.AgeMin
	}
	if merged.AgeMax == 0 {
		merged.AgeMax = prefs.AgeMax
	}
	if merged.Size == "" && len(prefs.Sizes) > 0 {
		merged.Size = prefs.Sizes[0]
	}
	if merged.MaxRadius == 0 {
		merged.MaxRadius = prefs.MaxRadius
	}
	if merged.Location == nil {
		merged.Location = prefs.Location
	}

	return &merged
}

func (s *MatchService) getPetsFromRedis(ctx context.Context, req *models.MatchRequest) ([]map[string]interface{}, error) {
	// Build Redis search query
	query := "*"
	if req.Species != "" {
		query = fmt.Sprintf("@species:%s", req.Species)
	}

	// Execute Redis search
	cmd := []interface{}{"FT.SEARCH", "pet-index", query}
	
	if req.Limit > 0 {
		cmd = append(cmd, "LIMIT", 0, req.Limit)
	} else {
		cmd = append(cmd, "LIMIT", 0, 50)
	}

	result, err := s.redis.Do(ctx, cmd...).Result()
	if err != nil {
		return nil, err
	}

	// Parse results
	pets := make([]map[string]interface{}, 0)
	if resultSlice, ok := result.([]interface{}); ok && len(resultSlice) > 1 {
		for i := 2; i < len(resultSlice); i += 2 {
			if i+1 < len(resultSlice) {
				if petData, ok := resultSlice[i+1].([]interface{}); ok {
					pet := make(map[string]interface{})
					for j := 0; j < len(petData); j += 2 {
						if j+1 < len(petData) {
							key := fmt.Sprintf("%v", petData[j])
							value := fmt.Sprintf("%v", petData[j+1])
							
							// Try to parse JSON values
							var jsonValue interface{}
							if err := json.Unmarshal([]byte(value), &jsonValue); err == nil {
								pet[key] = jsonValue
							} else {
								pet[key] = value
							}
						}
					}
					pets = append(pets, pet)
				}
			}
		}
	}

	return pets, nil
}

func (s *MatchService) getPetByID(ctx context.Context, petID string) (map[string]interface{}, error) {
	key := fmt.Sprintf("pet:%s", petID)
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var pet map[string]interface{}
	if err := json.Unmarshal([]byte(data), &pet); err != nil {
		return nil, err
	}

	return pet, nil
}

func (s *MatchService) saveMatch(ctx context.Context, match *models.Match) error {
	key := fmt.Sprintf("match:%s", match.ID)
	data, err := json.Marshal(match)
	if err != nil {
		return err
	}

	// Save match
	if err := s.redis.Set(ctx, key, data, 0).Err(); err != nil {
		return err
	}

	// Add to user's match history
	historyKey := fmt.Sprintf("user:matches:%s", match.UserID)
	if err := s.redis.LPush(ctx, historyKey, match.ID).Err(); err != nil {
		return err
	}

	return nil
}
