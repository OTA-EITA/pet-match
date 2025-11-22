package services

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
)

// MigrationService handles data migration operations
type MigrationService struct {
	ctx context.Context
}

// NewMigrationService creates a new migration service
func NewMigrationService() *MigrationService {
	return &MigrationService{
		ctx: context.Background(),
	}
}

// MigrationResult represents the result of a migration operation
type MigrationResult struct {
	TotalPets     int
	MigratedCount int
	ErrorCount    int
}

// MigrateAllPets migrates all existing pets with age info migration
func (s *MigrationService) MigrateAllPets() (*MigrationResult, error) {
	if utils.RedisClient == nil {
		return nil, errors.New("redis not available")
	}

	// Get all pet keys from Redis
	keys, err := utils.RedisClient.Keys(s.ctx, "pet:*").Result()
	if err != nil {
		return nil, err
	}

	result := &MigrationResult{
		TotalPets: len(keys),
	}

	for _, key := range keys {
		petJSON, err := utils.RedisClient.Get(s.ctx, key).Result()
		if err != nil {
			result.ErrorCount++
			continue
		}

		var pet models.Pet
		if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
			result.ErrorCount++
			continue
		}

		// Apply migration
		oldTotalMonths := pet.AgeInfo.TotalMonths
		pet.MigrateAgeInfo()

		// Save if migration was applied
		if pet.AgeInfo.TotalMonths != oldTotalMonths || pet.AgeInfo.AgeText == "" {
			migratedJSON, err := json.Marshal(pet)
			if err != nil {
				result.ErrorCount++
				continue
			}
			if err := utils.RedisClient.Set(s.ctx, key, migratedJSON, 0).Err(); err != nil {
				result.ErrorCount++
				continue
			}
			result.MigratedCount++
		}
	}

	return result, nil
}
