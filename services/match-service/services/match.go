package services

import (
	"context"
	"encoding/json"
	"fmt"
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

// Helper method
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
