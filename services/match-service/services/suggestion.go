package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/utils"
	"github.com/petmatch/app/shared/config"
)

type SuggestionService struct {
	redis *redis.Client
	cfg   *config.Config
}

func NewSuggestionService(redisClient *redis.Client, cfg *config.Config) *SuggestionService {
	return &SuggestionService{
		redis: redisClient,
		cfg:   cfg,
	}
}

// GetSimilarCats returns cats similar to the specified cat
func (s *SuggestionService) GetSimilarCats(ctx context.Context, catID string, limit int) (*models.SuggestionResponse, error) {
	// Get the source cat
	sourceCat, err := s.getCatByID(ctx, catID)
	if err != nil {
		return nil, err
	}

	// Get all cats for comparison
	allCats, err := s.getAllCats(ctx)
	if err != nil {
		return nil, err
	}

	// Calculate similarity scores
	similarCats := make([]map[string]interface{}, 0)

	for _, cat := range allCats {
		// Skip the source cat itself
		if cat["id"] == catID {
			continue
		}

		// Calculate similarity score based on multiple factors
		score := s.calculateSimilarity(sourceCat, cat)

		if score > 0.3 { // Minimum similarity threshold
			cat["similarity_score"] = score
			similarCats = append(similarCats, cat)
		}
	}

	// Sort by similarity score (highest first)
	s.sortBySimilarity(similarCats)

	// Apply limit
	if limit > 0 && len(similarCats) > limit {
		similarCats = similarCats[:limit]
	}

	return &models.SuggestionResponse{
		Cats:  similarCats,
		Type:  "similar",
		Total: len(similarCats),
		Limit: limit,
	}, nil
}

// GetNearbyCats returns cats near the specified location
func (s *SuggestionService) GetNearbyCats(ctx context.Context, location *models.Location, limit int) (*models.SuggestionResponse, error) {
	// Get all available cats
	allCats, err := s.getAllAvailableCats(ctx)
	if err != nil {
		return nil, err
	}

	// Calculate distances and filter
	nearbyCats := make([]map[string]interface{}, 0)

	for _, cat := range allCats {
		// Get cat location
		locationStr, ok := cat["location"].(string)
		if !ok {
			continue
		}

		var catLat, catLng float64
		if _, err := fmt.Sscanf(locationStr, "%f,%f", &catLat, &catLng); err != nil {
			continue
		}

		// Calculate distance
		distance := utils.CalculateDistance(
			location.Latitude,
			location.Longitude,
			catLat,
			catLng,
		)

		// Include cats within reasonable distance (e.g., 100km)
		if distance <= 100 {
			cat["distance"] = distance
			nearbyCats = append(nearbyCats, cat)
		}
	}

	// Sort by distance (closest first)
	s.sortByDistance(nearbyCats)

	// Apply limit
	if limit > 0 && len(nearbyCats) > limit {
		nearbyCats = nearbyCats[:limit]
	}

	return &models.SuggestionResponse{
		Cats:  nearbyCats,
		Type:  "nearby",
		Total: len(nearbyCats),
		Limit: limit,
	}, nil
}

// GetNewCats returns recently added cats
func (s *SuggestionService) GetNewCats(ctx context.Context, limit int) (*models.SuggestionResponse, error) {
	// Get all available cats
	allCats, err := s.getAllAvailableCats(ctx)
	if err != nil {
		return nil, err
	}

	// Filter for recent cats (e.g., within last 30 days)
	now := time.Now()
	newCats := make([]map[string]interface{}, 0)

	for _, cat := range allCats {
		createdAtStr, ok := cat["created_at"].(string)
		if !ok {
			continue
		}

		createdAt, err := time.Parse(time.RFC3339, createdAtStr)
		if err != nil {
			continue
		}

		// Check if created within last 30 days
		daysSinceCreation := now.Sub(createdAt).Hours() / 24
		if daysSinceCreation <= 30 {
			cat["days_since_posted"] = int(daysSinceCreation)
			newCats = append(newCats, cat)
		}
	}

	// Sort by creation date (newest first)
	s.sortByCreationDate(newCats)

	// Apply limit
	if limit > 0 && len(newCats) > limit {
		newCats = newCats[:limit]
	}

	return &models.SuggestionResponse{
		Cats:  newCats,
		Type:  "new",
		Total: len(newCats),
		Limit: limit,
	}, nil
}

// Helper methods

func (s *SuggestionService) calculateSimilarity(cat1, cat2 map[string]interface{}) float64 {
	score := 0.0
	factors := 0

	// Breed similarity (weight: 0.4)
	if breed1, ok1 := cat1["breed"].(string); ok1 {
		if breed2, ok2 := cat2["breed"].(string); ok2 {
			if breed1 == breed2 {
				score += 0.4
			}
			factors++
		}
	}

	// Age similarity (weight: 0.2)
	if age1, ok1 := cat1["age"].(float64); ok1 {
		if age2, ok2 := cat2["age"].(float64); ok2 {
			ageDiff := age1 - age2
			if ageDiff < 0 {
				ageDiff = -ageDiff
			}
			if ageDiff <= 1 {
				score += 0.2
			} else if ageDiff <= 2 {
				score += 0.1
			}
			factors++
		}
	}

	// Size similarity (weight: 0.2)
	if size1, ok1 := cat1["size"].(string); ok1 {
		if size2, ok2 := cat2["size"].(string); ok2 {
			if size1 == size2 {
				score += 0.2
			}
			factors++
		}
	}

	// Personality similarity (weight: 0.2)
	if pers1, ok1 := cat1["personality"].([]interface{}); ok1 {
		if pers2, ok2 := cat2["personality"].([]interface{}); ok2 {
			commonTraits := 0
			for _, p1 := range pers1 {
				for _, p2 := range pers2 {
					if p1 == p2 {
						commonTraits++
						break
					}
				}
			}
			if len(pers1) > 0 && len(pers2) > 0 {
				personalityScore := float64(commonTraits) / float64(len(pers1)+len(pers2)-commonTraits)
				score += personalityScore * 0.2
				factors++
			}
		}
	}

	if factors == 0 {
		return 0
	}

	return score
}

func (s *SuggestionService) sortBySimilarity(cats []map[string]interface{}) {
	for i := 0; i < len(cats)-1; i++ {
		for j := i + 1; j < len(cats); j++ {
			score1, _ := cats[i]["similarity_score"].(float64)
			score2, _ := cats[j]["similarity_score"].(float64)

			if score1 < score2 {
				cats[i], cats[j] = cats[j], cats[i]
			}
		}
	}
}

func (s *SuggestionService) sortByDistance(cats []map[string]interface{}) {
	for i := 0; i < len(cats)-1; i++ {
		for j := i + 1; j < len(cats); j++ {
			dist1, _ := cats[i]["distance"].(float64)
			dist2, _ := cats[j]["distance"].(float64)

			if dist1 > dist2 {
				cats[i], cats[j] = cats[j], cats[i]
			}
		}
	}
}

func (s *SuggestionService) sortByCreationDate(cats []map[string]interface{}) {
	for i := 0; i < len(cats)-1; i++ {
		for j := i + 1; j < len(cats); j++ {
			// Sort by days_since_posted (ascending = newest first)
			days1, _ := cats[i]["days_since_posted"].(int)
			days2, _ := cats[j]["days_since_posted"].(int)

			if days1 > days2 {
				cats[i], cats[j] = cats[j], cats[i]
			}
		}
	}
}

func (s *SuggestionService) getCatByID(ctx context.Context, catID string) (map[string]interface{}, error) {
	key := fmt.Sprintf("cat:%s", catID)
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var cat map[string]interface{}
	if err := json.Unmarshal([]byte(data), &cat); err != nil {
		return nil, err
	}

	return cat, nil
}

func (s *SuggestionService) getAllCats(ctx context.Context) ([]map[string]interface{}, error) {
	// Use Redis SCAN to get all cat keys
	keys, err := s.redis.Keys(ctx, "cat:*").Result()
	if err != nil {
		return nil, err
	}

	cats := make([]map[string]interface{}, 0)
	for _, key := range keys {
		data, err := s.redis.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var cat map[string]interface{}
		if err := json.Unmarshal([]byte(data), &cat); err != nil {
			continue
		}

		cats = append(cats, cat)
	}

	return cats, nil
}

func (s *SuggestionService) getAllAvailableCats(ctx context.Context) ([]map[string]interface{}, error) {
	allCats, err := s.getAllCats(ctx)
	if err != nil {
		return nil, err
	}

	// Filter for available cats only
	availableCats := make([]map[string]interface{}, 0)
	for _, cat := range allCats {
		if available, ok := cat["available"].(bool); ok && available {
			availableCats = append(availableCats, cat)
		}
	}

	return availableCats, nil
}
