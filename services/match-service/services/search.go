package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"

	"github.com/go-redis/redis/v8"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/utils"
	"github.com/petmatch/app/shared/config"
)

type SearchService struct {
	redis *redis.Client
	cfg   *config.Config
}

func NewSearchService(redisClient *redis.Client, cfg *config.Config) *SearchService {
	return &SearchService{
		redis: redisClient,
		cfg:   cfg,
	}
}

// SearchCats performs a search for cats based on query parameters
func (s *SearchService) SearchCats(ctx context.Context, query *models.SearchQuery) (*models.SearchResponse, error) {
	// Validate and set defaults
	if err := query.Validate(); err != nil {
		return nil, err
	}

	// Get all cats from Redis (using KEYS pattern)
	allCats, err := s.getAllCats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get cats: %v", err)
	}

	// Apply filters
	filteredCats := s.filterCats(allCats, query)

	// Apply sorting
	s.sortCats(filteredCats, query)

	// Apply pagination
	total := len(filteredCats)
	offset := (query.Page - 1) * query.Limit
	if offset > len(filteredCats) {
		offset = len(filteredCats)
	}
	end := offset + query.Limit
	if end > len(filteredCats) {
		end = len(filteredCats)
	}

	paginatedCats := filteredCats[offset:end]

	return &models.SearchResponse{
		Cats:    paginatedCats,
		Total:   total,
		Page:    query.Page,
		Limit:   query.Limit,
		Filters: query,
	}, nil
}

// GetCatByID retrieves a single cat by ID
func (s *SearchService) GetCatByID(ctx context.Context, catID string) (map[string]interface{}, error) {
	key := fmt.Sprintf("cat:%s", catID)
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("cat not found")
		}
		return nil, err
	}

	var cat map[string]interface{}
	if err := json.Unmarshal([]byte(data), &cat); err != nil {
		return nil, err
	}

	return cat, nil
}

// getAllCats retrieves all cats from Redis
func (s *SearchService) getAllCats(ctx context.Context) ([]map[string]interface{}, error) {
	// Use KEYS to find all cat entries
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

// filterCats filters cats based on query parameters
func (s *SearchService) filterCats(cats []map[string]interface{}, query *models.SearchQuery) []map[string]interface{} {
	filtered := make([]map[string]interface{}, 0)

	for _, cat := range cats {
		// Species filter
		if query.Species != "" {
			if species, ok := cat["species"].(string); !ok || species != query.Species {
				continue
			}
		}

		// Breed filter
		if len(query.Breeds) > 0 {
			breed, _ := cat["breed"].(string)
			matched := false
			for _, b := range query.Breeds {
				if breed == b {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}

		// Age filter
		if query.AgeMin > 0 || query.AgeMax > 0 {
			age, ok := cat["age"].(float64)
			if !ok {
				continue
			}
			if query.AgeMin > 0 && int(age) < query.AgeMin {
				continue
			}
			if query.AgeMax > 0 && int(age) > query.AgeMax {
				continue
			}
		}

		// Gender filter
		if query.Gender != "" {
			if gender, ok := cat["gender"].(string); !ok || gender != query.Gender {
				continue
			}
		}

		// Size filter
		if query.Size != "" {
			if size, ok := cat["size"].(string); !ok || size != query.Size {
				continue
			}
		}

		// Good with kids filter
		if query.GoodWithKids != nil && *query.GoodWithKids {
			if goodWithKids, ok := cat["good_with_kids"].(bool); !ok || !goodWithKids {
				continue
			}
		}

		// Good with pets filter
		if query.GoodWithPets != nil && *query.GoodWithPets {
			if goodWithPets, ok := cat["good_with_pets"].(bool); !ok || !goodWithPets {
				continue
			}
		}

		// Special needs filter
		if query.SpecialNeeds != nil {
			specialNeeds, _ := cat["special_needs"].(bool)
			if *query.SpecialNeeds != specialNeeds {
				continue
			}
		}

		// Available filter
		if query.Available != nil && *query.Available {
			if available, ok := cat["available"].(bool); !ok || !available {
				continue
			}
		}

		// Location/distance filter
		if query.Location != nil && query.MaxRadius > 0 {
			locationStr, ok := cat["location"].(string)
			if !ok {
				continue
			}

			var catLat, catLng float64
			if _, err := fmt.Sscanf(locationStr, "%f,%f", &catLat, &catLng); err != nil {
				continue
			}

			distance := utils.CalculateDistance(
				query.Location.Latitude,
				query.Location.Longitude,
				catLat,
				catLng,
			)

			if distance > float64(query.MaxRadius) {
				continue
			}

			cat["distance"] = math.Round(distance*10) / 10
		}

		filtered = append(filtered, cat)
	}

	return filtered
}

// sortCats sorts cats based on query parameters
func (s *SearchService) sortCats(cats []map[string]interface{}, query *models.SearchQuery) {
	if query.SortBy == "" {
		return
	}

	ascending := query.SortOrder == "asc"

	for i := 0; i < len(cats)-1; i++ {
		for j := i + 1; j < len(cats); j++ {
			var shouldSwap bool

			switch query.SortBy {
			case "created_at":
				createdAt1, _ := cats[i]["created_at"].(string)
				createdAt2, _ := cats[j]["created_at"].(string)
				if ascending {
					shouldSwap = createdAt1 > createdAt2
				} else {
					shouldSwap = createdAt1 < createdAt2
				}
			case "age":
				age1, _ := cats[i]["age"].(float64)
				age2, _ := cats[j]["age"].(float64)
				if ascending {
					shouldSwap = age1 > age2
				} else {
					shouldSwap = age1 < age2
				}
			case "distance":
				dist1, ok1 := cats[i]["distance"].(float64)
				dist2, ok2 := cats[j]["distance"].(float64)
				if ok1 && ok2 {
					if ascending {
						shouldSwap = dist1 > dist2
					} else {
						shouldSwap = dist1 < dist2
					}
				}
			}

			if shouldSwap {
				cats[i], cats[j] = cats[j], cats[i]
			}
		}
	}
}
