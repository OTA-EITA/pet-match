package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/petmatch/app/services/pet-service/models"
	sharedModels "github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
)

// ImageRepository handles image data operations with Redis
type ImageRepository struct {
	ctx context.Context
}

// NewImageRepository creates a new image repository
func NewImageRepository() *ImageRepository {
	return &ImageRepository{
		ctx: context.Background(),
	}
}

// GetPetByID retrieves a pet by ID from Redis
func (r *ImageRepository) GetPetByID(petID string) (*sharedModels.Pet, error) {
	key := utils.GetRedisKey("pet", petID)
	petJSON, err := utils.RedisClient.Get(r.ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var pet sharedModels.Pet
	if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
		return nil, err
	}

	return &pet, nil
}

// SaveImage saves an image record to Redis
func (r *ImageRepository) SaveImage(image *models.PetImage) error {
	imageJSON, err := json.Marshal(image)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("pet_image:%s:%s", image.PetID, image.ID)
	return utils.RedisClient.Set(r.ctx, key, imageJSON, 0).Err()
}

// GetImage retrieves an image by pet ID and image ID
func (r *ImageRepository) GetImage(petID, imageID string) (*models.PetImage, error) {
	key := fmt.Sprintf("pet_image:%s:%s", petID, imageID)
	imageJSON, err := utils.RedisClient.Get(r.ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var image models.PetImage
	if err := json.Unmarshal([]byte(imageJSON), &image); err != nil {
		return nil, err
	}

	return &image, nil
}

// GetAllImages retrieves all images for a pet
func (r *ImageRepository) GetAllImages(petID string) ([]models.PetImage, error) {
	keys, err := utils.RedisClient.Keys(r.ctx, fmt.Sprintf("pet_image:%s:*", petID)).Result()
	if err != nil {
		return nil, err
	}

	var images []models.PetImage
	for _, key := range keys {
		imageJSON, err := utils.RedisClient.Get(r.ctx, key).Result()
		if err != nil {
			continue
		}

		var image models.PetImage
		if err := json.Unmarshal([]byte(imageJSON), &image); err != nil {
			continue
		}

		images = append(images, image)
	}

	return images, nil
}

// DeleteImage deletes an image record from Redis
func (r *ImageRepository) DeleteImage(petID, imageID string) error {
	key := fmt.Sprintf("pet_image:%s:%s", petID, imageID)
	return utils.RedisClient.Del(r.ctx, key).Err()
}

// AddImageToPet adds an image ID to a pet's images list
func (r *ImageRepository) AddImageToPet(petID, imageID string) error {
	pet, err := r.GetPetByID(petID)
	if err != nil {
		return err
	}

	// Add image ID to pet's images list if not already present
	for _, existingImageID := range pet.Images {
		if existingImageID == imageID {
			return nil // Already exists
		}
	}

	pet.Images = append(pet.Images, imageID)

	// Save updated pet
	petJSON, err := json.Marshal(pet)
	if err != nil {
		return err
	}

	key := utils.GetRedisKey("pet", petID)
	return utils.RedisClient.Set(r.ctx, key, petJSON, 0).Err()
}

// RemoveImageFromPet removes an image ID from a pet's images list
func (r *ImageRepository) RemoveImageFromPet(petID, imageID string) error {
	pet, err := r.GetPetByID(petID)
	if err != nil {
		return err
	}

	// Remove image ID from pet's images list
	var newImages []string
	for _, existingImageID := range pet.Images {
		if existingImageID != imageID {
			newImages = append(newImages, existingImageID)
		}
	}

	pet.Images = newImages

	// Save updated pet
	petJSON, err := json.Marshal(pet)
	if err != nil {
		return err
	}

	key := utils.GetRedisKey("pet", petID)
	return utils.RedisClient.Set(r.ctx, key, petJSON, 0).Err()
}

// UnsetOtherMainImages unsets the main flag for all images except the current one
func (r *ImageRepository) UnsetOtherMainImages(petID, currentImageID string) error {
	// Get all image keys for this pet
	keys, err := utils.RedisClient.Keys(r.ctx, fmt.Sprintf("pet_image:%s:*", petID)).Result()
	if err != nil {
		return err
	}

	for _, key := range keys {
		imageJSON, err := utils.RedisClient.Get(r.ctx, key).Result()
		if err != nil {
			continue
		}

		var image models.PetImage
		if err := json.Unmarshal([]byte(imageJSON), &image); err != nil {
			continue
		}

		// Skip current image
		if image.ID == currentImageID {
			continue
		}

		// Unset main flag if set
		if image.IsMain {
			image.IsMain = false
			updatedJSON, err := json.Marshal(image)
			if err != nil {
				continue
			}
			utils.RedisClient.Set(r.ctx, key, updatedJSON, 0)
		}
	}

	return nil
}
