package services

import (
	"context"

	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/shared/config"
)

type AlgorithmService struct {
	cfg *config.Config
}

func NewAlgorithmService(cfg *config.Config) *AlgorithmService {
	return &AlgorithmService{
		cfg: cfg,
	}
}

// ProcessMatches applies advanced matching algorithms
func (s *AlgorithmService) ProcessMatches(ctx context.Context, matches []models.MatchResult, userID string) ([]models.MatchResult, error) {
	// Apply diversity filter to ensure variety
	diverseMatches := s.applyDiversityFilter(matches)
	
	// Apply freshness boost for recently posted pets
	boostedMatches := s.applyFreshnessBoost(diverseMatches)
	
	// Apply user behavior learning (placeholder for ML implementation)
	learnedMatches := s.applyUserBehaviorLearning(boostedMatches, userID)
	
	return learnedMatches, nil
}

// applyDiversityFilter ensures variety in species, breeds, and sizes
func (s *AlgorithmService) applyDiversityFilter(matches []models.MatchResult) []models.MatchResult {
	if len(matches) <= 5 {
		return matches // Too few matches to diversify
	}

	// Group matches by species
	speciesGroups := make(map[string][]models.MatchResult)
	for _, match := range matches {
		if species, ok := match.Pet["species"].(string); ok {
			speciesGroups[species] = append(speciesGroups[species], match)
		}
	}

	// Ensure at least 2 different species in top results
	diverseMatches := make([]models.MatchResult, 0)
	usedSpecies := make(map[string]int)
	maxPerSpecies := 3

	for _, match := range matches {
		species, ok := match.Pet["species"].(string)
		if !ok {
			species = "unknown"
		}

		if usedSpecies[species] < maxPerSpecies {
			diverseMatches = append(diverseMatches, match)
			usedSpecies[species]++
		}

		if len(diverseMatches) >= len(matches) {
			break
		}
	}

	// Fill remaining slots with any matches
	for _, match := range matches {
		found := false
		for _, existing := range diverseMatches {
			if existing.Match.PetID == match.Match.PetID {
				found = true
				break
			}
		}
		if !found {
			diverseMatches = append(diverseMatches, match)
		}
	}

	return diverseMatches
}

// applyFreshnessBoost boosts scores for recently posted pets
func (s *AlgorithmService) applyFreshnessBoost(matches []models.MatchResult) []models.MatchResult {
	for i := range matches {
		// Boost recently posted pets (placeholder logic)
		if createdAt, ok := matches[i].Pet["created_at"].(string); ok && createdAt != "" {
			// Simple boost - in real implementation, parse date and calculate days
			matches[i].Match.Score *= 1.05 // 5% boost for fresh posts
		}
	}

	// Re-sort by score
	for i := 0; i < len(matches)-1; i++ {
		for j := i + 1; j < len(matches); j++ {
			if matches[i].Match.Score < matches[j].Match.Score {
				matches[i], matches[j] = matches[j], matches[i]
			}
		}
	}

	return matches
}

// applyUserBehaviorLearning adjusts scores based on user preferences (placeholder for ML)
func (s *AlgorithmService) applyUserBehaviorLearning(matches []models.MatchResult, userID string) []models.MatchResult {
	// In a real implementation, this would:
	// 1. Load user's interaction history (clicks, favorites, applications)
	// 2. Apply ML model to predict user preferences
	// 3. Adjust scores based on learned patterns
	
	// For now, apply simple heuristics
	for i := range matches {
		// Boost pets with photos (users prefer visual content)
		if photos, ok := matches[i].Pet["photos"].([]interface{}); ok && len(photos) > 0 {
			matches[i].Match.Score *= 1.1
		}

		// Boost pets with detailed descriptions
		if description, ok := matches[i].Pet["description"].(string); ok && len(description) > 100 {
			matches[i].Match.Score *= 1.05
		}

		// Boost verified organizations
		if verified, ok := matches[i].Pet["verified"].(bool); ok && verified {
			matches[i].Match.Score *= 1.08
		}
	}

	return matches
}
