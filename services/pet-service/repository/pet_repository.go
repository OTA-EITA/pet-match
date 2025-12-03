package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
)

// PetRepository handles pet data operations with Cache-Aside pattern
type PetRepository struct {
	ctx context.Context
}

// NewPetRepository creates a new pet repository
func NewPetRepository() *PetRepository {
	return &PetRepository{
		ctx: context.Background(),
	}
}

const (
	cacheTTL = 1 * time.Hour
)

// Create creates a new pet (dual-write: PostgreSQL + Redis)
func (r *PetRepository) Create(pet *models.Pet) error {
	// Write to PostgreSQL first
	if err := database.DB.Create(pet).Error; err != nil {
		return fmt.Errorf("failed to create pet in database: %w", err)
	}

	// Cache to Redis
	if err := r.cachePet(pet); err != nil {
		// Log warning but don't fail - database is source of truth
		fmt.Printf("Warning: Failed to cache pet %s: %v\n", pet.ID, err)
	}

	return nil
}

// GetByID retrieves a pet by ID (Cache-Aside: check cache, then database)
func (r *PetRepository) GetByID(id string) (*models.Pet, error) {
	// Try cache first
	pet, err := r.getCachedPet(id)
	if err == nil {
		return pet, nil
	}

	// Cache miss - query database
	pet = &models.Pet{}
	if err := database.DB.Where("id = ?", id).First(pet).Error; err != nil {
		return nil, err
	}

	// Populate cache for next time
	if err := r.cachePet(pet); err != nil {
		fmt.Printf("Warning: Failed to cache pet %s: %v\n", id, err)
	}

	return pet, nil
}

// Update updates a pet (write-through: update database, invalidate cache)
func (r *PetRepository) Update(pet *models.Pet) error {
	// Update in database
	if err := database.DB.Save(pet).Error; err != nil {
		return fmt.Errorf("failed to update pet in database: %w", err)
	}

	// Invalidate cache
	if err := r.invalidateCache(pet.ID); err != nil {
		fmt.Printf("Warning: Failed to invalidate cache for pet %s: %v\n", pet.ID, err)
	}

	return nil
}

// Delete deletes a pet (remove from database and cache)
func (r *PetRepository) Delete(id string) error {
	// Delete from database
	if err := database.DB.Delete(&models.Pet{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete pet from database: %w", err)
	}

	// Remove from cache
	if err := r.invalidateCache(id); err != nil {
		fmt.Printf("Warning: Failed to invalidate cache for pet %s: %v\n", id, err)
	}

	return nil
}

// List retrieves pets with filtering and pagination
func (r *PetRepository) List(params ListParams) ([]models.Pet, int64, error) {
	if database.DB == nil {
		return nil, 0, fmt.Errorf("database not initialized")
	}

	query := database.DB.Model(&models.Pet{})

	// Apply filters
	if params.Species != "" {
		query = query.Where("species = ?", params.Species)
	}
	if params.Breed != "" {
		query = query.Where("breed = ?", params.Breed)
	}
	if params.Gender != "" {
		query = query.Where("gender = ?", params.Gender)
	}
	if params.Size != "" {
		query = query.Where("size = ?", params.Size)
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.OwnerID != "" {
		query = query.Where("owner_id = ?", params.OwnerID)
	}
	if params.AgeMin > 0 {
		query = query.Where("age_total_months >= ?", params.AgeMin*12)
	}
	if params.AgeMax > 0 {
		query = query.Where("age_total_months <= ?", params.AgeMax*12)
	}
	if params.Location != "" {
		query = query.Where("location ILIKE ?", "%"+params.Location+"%")
	}
	if params.Color != "" {
		query = query.Where("color ILIKE ?", "%"+params.Color+"%")
	}
	if params.Vaccinated != nil {
		query = query.Where("medical_info->>'vaccinated' = ?", fmt.Sprintf("%t", *params.Vaccinated))
	}
	if params.Neutered != nil {
		query = query.Where("medical_info->>'neutered' = ?", fmt.Sprintf("%t", *params.Neutered))
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	var pets []models.Pet
	if err := query.
		Order("created_at DESC").
		Limit(params.Limit).
		Offset(params.Offset).
		Find(&pets).Error; err != nil {
		return nil, 0, err
	}

	return pets, total, nil
}

// ListParams defines filtering and pagination parameters
type ListParams struct {
	Species    string
	Breed      string
	Gender     string
	Size       string
	Status     string
	OwnerID    string
	Location   string
	Color      string
	Vaccinated *bool
	Neutered   *bool
	AgeMin     int
	AgeMax     int
	Limit      int
	Offset     int
}

// Cache helper functions

func (r *PetRepository) getCachedPet(id string) (*models.Pet, error) {
	if utils.RedisClient == nil {
		return nil, fmt.Errorf("redis not available")
	}

	key := fmt.Sprintf("pet:%s", id)
	data, err := utils.RedisClient.Get(r.ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var pet models.Pet
	if err := json.Unmarshal([]byte(data), &pet); err != nil {
		return nil, err
	}

	return &pet, nil
}

func (r *PetRepository) cachePet(pet *models.Pet) error {
	if utils.RedisClient == nil {
		return fmt.Errorf("redis not available")
	}

	key := fmt.Sprintf("pet:%s", pet.ID)
	data, err := json.Marshal(pet)
	if err != nil {
		return err
	}

	return utils.RedisClient.Set(r.ctx, key, data, cacheTTL).Err()
}

func (r *PetRepository) invalidateCache(id string) error {
	if utils.RedisClient == nil {
		return fmt.Errorf("redis not available")
	}

	key := fmt.Sprintf("pet:%s", id)
	return utils.RedisClient.Del(r.ctx, key).Err()
}
