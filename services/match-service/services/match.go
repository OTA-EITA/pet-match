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

	// Increment pet's favorites count
	countKey := fmt.Sprintf("pet:favorites_count:%s", petID)
	s.redis.Incr(ctx, countKey)

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

	// Decrement pet's favorites count
	countKey := fmt.Sprintf("pet:favorites_count:%s", petID)
	s.redis.Decr(ctx, countKey)

	return nil
}

// GetPetFavoritesCount returns the favorites count for a pet
func (s *MatchService) GetPetFavoritesCount(ctx context.Context, petID string) (int64, error) {
	countKey := fmt.Sprintf("pet:favorites_count:%s", petID)
	count, err := s.redis.Get(ctx, countKey).Int64()
	if err != nil {
		if err == redis.Nil {
			return 0, nil
		}
		return 0, err
	}
	return count, nil
}

// GetPetsFavoritesCounts returns favorites counts for multiple pets
func (s *MatchService) GetPetsFavoritesCounts(ctx context.Context, petIDs []string) (map[string]int64, error) {
	result := make(map[string]int64)
	if len(petIDs) == 0 {
		return result, nil
	}

	pipe := s.redis.Pipeline()
	cmds := make(map[string]*redis.StringCmd)

	for _, petID := range petIDs {
		countKey := fmt.Sprintf("pet:favorites_count:%s", petID)
		cmds[petID] = pipe.Get(ctx, countKey)
	}

	_, _ = pipe.Exec(ctx)

	for petID, cmd := range cmds {
		count, err := cmd.Int64()
		if err != nil {
			result[petID] = 0
		} else {
			result[petID] = count
		}
	}

	return result, nil
}

// GetSimilarPets returns similar pets based on breed, personality, age, etc.
func (s *MatchService) GetSimilarPets(ctx context.Context, petID string, limit int) ([]map[string]interface{}, error) {
	// Get the target pet
	targetPet, err := s.getPetByID(ctx, petID)
	if err != nil {
		return nil, fmt.Errorf("failed to get target pet: %w", err)
	}

	// Get all available pets from Redis
	allPets, err := s.getAllAvailablePets(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get available pets: %w", err)
	}

	// Calculate similarity scores
	type scoredPet struct {
		pet   map[string]interface{}
		score float64
	}
	scoredPets := make([]scoredPet, 0)

	for _, pet := range allPets {
		// Skip the target pet itself
		if pet["id"] == petID {
			continue
		}
		// Skip non-available pets
		if status, ok := pet["status"].(string); ok && status != "available" {
			continue
		}

		score := s.calculateSimilarityScore(targetPet, pet)
		if score > 0 {
			scoredPets = append(scoredPets, scoredPet{pet: pet, score: score})
		}
	}

	// Sort by score descending
	for i := 0; i < len(scoredPets)-1; i++ {
		for j := i + 1; j < len(scoredPets); j++ {
			if scoredPets[j].score > scoredPets[i].score {
				scoredPets[i], scoredPets[j] = scoredPets[j], scoredPets[i]
			}
		}
	}

	// Return top N pets
	result := make([]map[string]interface{}, 0, limit)
	for i := 0; i < len(scoredPets) && i < limit; i++ {
		result = append(result, scoredPets[i].pet)
	}

	return result, nil
}

// GetRecommendedPets returns recommended pets for a user based on their favorites and preferences
func (s *MatchService) GetRecommendedPets(ctx context.Context, userID string, limit int) ([]map[string]interface{}, error) {
	// Get user's favorite pet IDs
	listKey := fmt.Sprintf("user:favorites:list:%s", userID)
	favoritePetIDs, err := s.redis.SMembers(ctx, listKey).Result()
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to get user favorites: %w", err)
	}

	// Get user preferences
	preferences, _ := s.GetUserPreferences(ctx, userID)

	// Get all available pets
	allPets, err := s.getAllAvailablePets(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get available pets: %w", err)
	}

	// Build a set of favorite IDs for quick lookup
	favoriteSet := make(map[string]bool)
	for _, id := range favoritePetIDs {
		favoriteSet[id] = true
	}

	// Collect breed and personality patterns from favorites
	breedCounts := make(map[string]int)
	personalityCounts := make(map[string]int)
	var avgAge float64
	var ageCount int

	for _, petID := range favoritePetIDs {
		pet, err := s.getPetByID(ctx, petID)
		if err != nil {
			continue
		}
		if breed, ok := pet["breed"].(string); ok && breed != "" {
			breedCounts[breed]++
		}
		if personalities, ok := pet["personality"].([]interface{}); ok {
			for _, p := range personalities {
				if ps, ok := p.(string); ok {
					personalityCounts[ps]++
				}
			}
		}
		if ageInfo, ok := pet["age_info"].(map[string]interface{}); ok {
			if years, ok := ageInfo["years"].(float64); ok {
				avgAge += years
				ageCount++
			}
		}
	}

	if ageCount > 0 {
		avgAge = avgAge / float64(ageCount)
	}

	// Score pets based on similarity to user's preferences
	type scoredPet struct {
		pet   map[string]interface{}
		score float64
	}
	scoredPets := make([]scoredPet, 0)

	for _, pet := range allPets {
		petID, _ := pet["id"].(string)
		// Skip already favorited pets
		if favoriteSet[petID] {
			continue
		}
		// Skip non-available pets
		if status, ok := pet["status"].(string); ok && status != "available" {
			continue
		}

		score := s.calculateRecommendationScore(pet, breedCounts, personalityCounts, avgAge, preferences)
		if score > 0 {
			scoredPets = append(scoredPets, scoredPet{pet: pet, score: score})
		}
	}

	// Sort by score descending
	for i := 0; i < len(scoredPets)-1; i++ {
		for j := i + 1; j < len(scoredPets); j++ {
			if scoredPets[j].score > scoredPets[i].score {
				scoredPets[i], scoredPets[j] = scoredPets[j], scoredPets[i]
			}
		}
	}

	// Return top N pets
	result := make([]map[string]interface{}, 0, limit)
	for i := 0; i < len(scoredPets) && i < limit; i++ {
		result = append(result, scoredPets[i].pet)
	}

	return result, nil
}

// calculateSimilarityScore calculates how similar two pets are
func (s *MatchService) calculateSimilarityScore(target, candidate map[string]interface{}) float64 {
	var score float64

	// Same breed = +30 points
	if targetBreed, ok := target["breed"].(string); ok {
		if candidateBreed, ok := candidate["breed"].(string); ok && targetBreed == candidateBreed {
			score += 30
		}
	}

	// Similar age (within 2 years) = +20 points
	targetAge := s.extractAge(target)
	candidateAge := s.extractAge(candidate)
	ageDiff := targetAge - candidateAge
	if ageDiff < 0 {
		ageDiff = -ageDiff
	}
	if ageDiff <= 2 {
		score += 20 - (float64(ageDiff) * 5)
	}

	// Same gender = +10 points
	if targetGender, ok := target["gender"].(string); ok {
		if candidateGender, ok := candidate["gender"].(string); ok && targetGender == candidateGender {
			score += 10
		}
	}

	// Matching personalities = +5 points each (max 25)
	targetPersonalities := s.extractPersonalities(target)
	candidatePersonalities := s.extractPersonalities(candidate)
	personalityScore := 0.0
	for _, tp := range targetPersonalities {
		for _, cp := range candidatePersonalities {
			if tp == cp {
				personalityScore += 5
			}
		}
	}
	if personalityScore > 25 {
		personalityScore = 25
	}
	score += personalityScore

	// Similar color = +5 points
	if targetColor, ok := target["color"].(string); ok {
		if candidateColor, ok := candidate["color"].(string); ok && targetColor == candidateColor {
			score += 5
		}
	}

	return score
}

// calculateRecommendationScore calculates recommendation score for a pet
func (s *MatchService) calculateRecommendationScore(
	pet map[string]interface{},
	breedCounts map[string]int,
	personalityCounts map[string]int,
	avgAge float64,
	preferences *models.UserPreference,
) float64 {
	var score float64

	// Breed matching from favorites history
	if breed, ok := pet["breed"].(string); ok && breed != "" {
		if count, exists := breedCounts[breed]; exists {
			score += float64(count) * 15
		}
	}

	// Personality matching from favorites history
	personalities := s.extractPersonalities(pet)
	for _, p := range personalities {
		if count, exists := personalityCounts[p]; exists {
			score += float64(count) * 10
		}
	}

	// Age similarity to average of favorites
	if avgAge > 0 {
		petAge := s.extractAge(pet)
		ageDiff := float64(petAge) - avgAge
		if ageDiff < 0 {
			ageDiff = -ageDiff
		}
		if ageDiff <= 3 {
			score += 15 - (ageDiff * 3)
		}
	}

	// Match user preferences if available
	if preferences != nil {
		// Breed preference
		if len(preferences.Breeds) > 0 {
			if breed, ok := pet["breed"].(string); ok {
				for _, prefBreed := range preferences.Breeds {
					if breed == prefBreed {
						score += 20
						break
					}
				}
			}
		}

		// Gender preference
		if len(preferences.Genders) > 0 {
			if gender, ok := pet["gender"].(string); ok {
				for _, prefGender := range preferences.Genders {
					if gender == prefGender {
						score += 10
						break
					}
				}
			}
		}

		// Personality preference
		if len(preferences.Personalities) > 0 {
			for _, p := range personalities {
				for _, prefP := range preferences.Personalities {
					if p == prefP {
						score += 8
					}
				}
			}
		}

		// Age range preference
		petAge := s.extractAge(pet)
		if preferences.AgeMin > 0 || preferences.AgeMax > 0 {
			if (preferences.AgeMin == 0 || petAge >= preferences.AgeMin) &&
				(preferences.AgeMax == 0 || petAge <= preferences.AgeMax) {
				score += 15
			}
		}
	}

	// Boost score based on popularity (favorites count)
	if petID, ok := pet["id"].(string); ok {
		count, _ := s.GetPetFavoritesCount(context.Background(), petID)
		score += float64(count) * 2 // Each favorite adds 2 points
	}

	return score
}

// extractAge extracts age in years from pet data
func (s *MatchService) extractAge(pet map[string]interface{}) int {
	if ageInfo, ok := pet["age_info"].(map[string]interface{}); ok {
		if years, ok := ageInfo["years"].(float64); ok {
			return int(years)
		}
	}
	return 0
}

// extractPersonalities extracts personality slice from pet data
func (s *MatchService) extractPersonalities(pet map[string]interface{}) []string {
	result := []string{}
	if personalities, ok := pet["personality"].([]interface{}); ok {
		for _, p := range personalities {
			if ps, ok := p.(string); ok {
				result = append(result, ps)
			}
		}
	}
	return result
}

// getAllAvailablePets retrieves all available pets from Redis
func (s *MatchService) getAllAvailablePets(ctx context.Context) ([]map[string]interface{}, error) {
	// Get all pet keys
	keys, err := s.redis.Keys(ctx, "pet:*").Result()
	if err != nil {
		return nil, err
	}

	pets := make([]map[string]interface{}, 0)
	for _, key := range keys {
		// Skip non-pet keys (like pet:favorites_count:*)
		if len(key) > 40 { // UUID + "pet:" prefix
			continue
		}

		data, err := s.redis.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var pet map[string]interface{}
		if err := json.Unmarshal([]byte(data), &pet); err != nil {
			continue
		}

		pets = append(pets, pet)
	}

	return pets, nil
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
