package services

import (
	"fmt"
	"math"
	"strings"

	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/services/match-service/utils"
	"github.com/petmatch/app/shared/config"
)

type ScoringService struct {
	cfg *config.Config
}

func NewScoringService(cfg *config.Config) *ScoringService {
	return &ScoringService{
		cfg: cfg,
	}
}

// CalculateScore calculates match score between user preferences and pet
func (s *ScoringService) CalculateScore(pet map[string]interface{}, prefs *models.UserPreference, userLocation *models.Location) float64 {
	if prefs == nil {
		return 0.5 // Default neutral score
	}

	totalScore := 0.0
	totalWeight := 0.0

	// Species match (weight: 0.25)
	if speciesScore := s.calculateSpeciesScore(pet, prefs); speciesScore >= 0 {
		totalScore += speciesScore * 0.25
		totalWeight += 0.25
	}

	// Age match (weight: 0.15)
	if ageScore := s.calculateAgeScore(pet, prefs); ageScore >= 0 {
		totalScore += ageScore * 0.15
		totalWeight += 0.15
	}

	// Size match (weight: 0.15)
	if sizeScore := s.calculateSizeScore(pet, prefs); sizeScore >= 0 {
		totalScore += sizeScore * 0.15
		totalWeight += 0.15
	}

	// Location/Distance match (weight: 0.20)
	if locationScore := s.calculateLocationScore(pet, prefs, userLocation); locationScore >= 0 {
		totalScore += locationScore * 0.20
		totalWeight += 0.20
	}

	// Personality match (weight: 0.10)
	if personalityScore := s.calculatePersonalityScore(pet, prefs); personalityScore >= 0 {
		totalScore += personalityScore * 0.10
		totalWeight += 0.10
	}

	// Special requirements match (weight: 0.15)
	if specialScore := s.calculateSpecialScore(pet, prefs); specialScore >= 0 {
		totalScore += specialScore * 0.15
		totalWeight += 0.15
	}

	if totalWeight == 0 {
		return 0.5
	}

	return totalScore / totalWeight
}

// GenerateReason generates human-readable reason for the match
func (s *ScoringService) GenerateReason(pet map[string]interface{}, prefs *models.UserPreference) string {
	reasons := make([]string, 0)

	// Check species match
	if petSpecies, ok := pet["species"].(string); ok && prefs != nil {
		for _, prefSpecies := range prefs.Species {
			if strings.EqualFold(petSpecies, prefSpecies) {
				reasons = append(reasons, "perfect species match")
				break
			}
		}
	}

	// Check age match
	if petAge, ok := pet["age"].(float64); ok && prefs != nil {
		age := int(petAge)
		if (prefs.AgeMin == 0 || age >= prefs.AgeMin) && (prefs.AgeMax == 0 || age <= prefs.AgeMax) {
			reasons = append(reasons, "age preference match")
		}
	}

	// Check size match
	if petSize, ok := pet["size"].(string); ok && prefs != nil {
		for _, prefSize := range prefs.Sizes {
			if strings.EqualFold(petSize, prefSize) {
				reasons = append(reasons, "ideal size")
				break
			}
		}
	}

	// Check personality match
	if petPersonalities, ok := pet["personality"].([]interface{}); ok && prefs != nil {
		matchCount := 0
		for _, petPers := range petPersonalities {
			petPersonality := strings.ToLower(petPers.(string))
			for _, prefPers := range prefs.Personalities {
				if strings.Contains(strings.ToLower(prefPers), petPersonality) {
					matchCount++
					break
				}
			}
		}
		if matchCount > 0 {
			reasons = append(reasons, "personality compatibility")
		}
	}

	if len(reasons) == 0 {
		return "good overall compatibility"
	}

	if len(reasons) == 1 {
		return reasons[0]
	}

	if len(reasons) == 2 {
		return reasons[0] + " and " + reasons[1]
	}

	return strings.Join(reasons[:len(reasons)-1], ", ") + " and " + reasons[len(reasons)-1]
}

// Individual scoring functions

func (s *ScoringService) calculateSpeciesScore(pet map[string]interface{}, prefs *models.UserPreference) float64 {
	petSpecies, ok := pet["species"].(string)
	if !ok || len(prefs.Species) == 0 {
		return -1 // Skip this factor
	}

	for _, prefSpecies := range prefs.Species {
		if strings.EqualFold(petSpecies, prefSpecies) {
			return 1.0 // Perfect match
		}
	}

	return 0.0 // No match
}

func (s *ScoringService) calculateAgeScore(pet map[string]interface{}, prefs *models.UserPreference) float64 {
	petAge, ok := pet["age"].(float64)
	if !ok {
		return -1
	}

	age := int(petAge)
	
	// If no age preferences, neutral score
	if prefs.AgeMin == 0 && prefs.AgeMax == 0 {
		return 0.7
	}

	// Check if within range
	if (prefs.AgeMin == 0 || age >= prefs.AgeMin) && (prefs.AgeMax == 0 || age <= prefs.AgeMax) {
		return 1.0
	}

	// Calculate how far outside the range
	var distance int
	if prefs.AgeMin > 0 && age < prefs.AgeMin {
		distance = prefs.AgeMin - age
	} else if prefs.AgeMax > 0 && age > prefs.AgeMax {
		distance = age - prefs.AgeMax
	}

	// Graceful degradation (within 2 years still gets some score)
	if distance <= 2 {
		return 1.0 - float64(distance)*0.3
	}

	return 0.1
}

func (s *ScoringService) calculateSizeScore(pet map[string]interface{}, prefs *models.UserPreference) float64 {
	petSize, ok := pet["size"].(string)
	if !ok || len(prefs.Sizes) == 0 {
		return -1
	}

	for _, prefSize := range prefs.Sizes {
		if strings.EqualFold(petSize, prefSize) {
			return 1.0
		}
	}

	// Size compatibility scoring
	sizeOrder := map[string]int{
		"extra_small": 1,
		"small":       2,
		"medium":      3,
		"large":       4,
		"extra_large": 5,
	}

	petSizeVal, petExists := sizeOrder[strings.ToLower(petSize)]
	if !petExists {
		return 0.5
	}

	bestScore := 0.0
	for _, prefSize := range prefs.Sizes {
		prefSizeVal, prefExists := sizeOrder[strings.ToLower(prefSize)]
		if !prefExists {
			continue
		}

		distance := int(math.Abs(float64(petSizeVal - prefSizeVal)))
		score := 0.0
		switch distance {
		case 0:
			score = 1.0
		case 1:
			score = 0.7
		case 2:
			score = 0.4
		default:
			score = 0.1
		}

		if score > bestScore {
			bestScore = score
		}
	}

	return bestScore
}

func (s *ScoringService) calculateLocationScore(pet map[string]interface{}, prefs *models.UserPreference, userLocation *models.Location) float64 {
	if userLocation == nil || prefs.MaxRadius == 0 {
		return 0.7 // Neutral score if no location constraints
	}

	petLocation, ok := pet["location"].(string)
	if !ok {
		return 0.5
	}

	// Parse pet location (assuming "lat,lng" format)
	var petLat, petLng float64
	if _, err := fmt.Sscanf(petLocation, "%f,%f", &petLat, &petLng); err != nil {
		return 0.5
	}

	distance := utils.CalculateDistance(userLocation.Latitude, userLocation.Longitude, petLat, petLng)

	if distance <= float64(prefs.MaxRadius) {
		// Linear scoring: closer = better
		score := 1.0 - (distance/float64(prefs.MaxRadius))*0.5
		return math.Max(score, 0.5)
	}

	// Outside radius but within 50% extra distance gets low score
	maxDistance := float64(prefs.MaxRadius) * 1.5
	if distance <= maxDistance {
		return 0.2
	}

	return 0.0
}

func (s *ScoringService) calculatePersonalityScore(pet map[string]interface{}, prefs *models.UserPreference) float64 {
	petPersonalities, ok := pet["personality"].([]interface{})
	if !ok || len(prefs.Personalities) == 0 {
		return -1
	}

	matchCount := 0
	totalPref := len(prefs.Personalities)

	for _, petPers := range petPersonalities {
		petPersonality := strings.ToLower(petPers.(string))
		for _, prefPers := range prefs.Personalities {
			if strings.Contains(strings.ToLower(prefPers), petPersonality) ||
				strings.Contains(petPersonality, strings.ToLower(prefPers)) {
				matchCount++
				break
			}
		}
	}

	if totalPref == 0 {
		return 0.7
	}

	return float64(matchCount) / float64(totalPref)
}

func (s *ScoringService) calculateSpecialScore(pet map[string]interface{}, prefs *models.UserPreference) float64 {
	score := 1.0

	// Good with kids check
	if prefs.GoodWithKids {
		if goodWithKids, ok := pet["good_with_kids"].(bool); ok {
			if !goodWithKids {
				score *= 0.3 // Heavy penalty
			}
		} else {
			score *= 0.7 // Unknown gets moderate penalty
		}
	}

	// Good with pets check
	if prefs.GoodWithPets {
		if goodWithPets, ok := pet["good_with_pets"].(bool); ok {
			if !goodWithPets {
				score *= 0.3
			}
		} else {
			score *= 0.7
		}
	}

	// Special needs check
	if !prefs.SpecialNeeds {
		if specialNeeds, ok := pet["special_needs"].(bool); ok {
			if specialNeeds {
				score *= 0.5 // Moderate penalty if user doesn't want special needs
			}
		}
	}

	return score
}
