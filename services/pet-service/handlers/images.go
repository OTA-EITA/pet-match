package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/pet-service/models"
	"github.com/petmatch/app/services/pet-service/services"
	sharedModels "github.com/petmatch/app/shared/models" // shared modelsをインポート
	"github.com/petmatch/app/shared/utils"
)

var imageCtx = context.Background()

// ImageHandler handles image-related operations
type ImageHandler struct {
	imageService *services.ImageService
}

// NewImageHandler creates a new image handler
func NewImageHandler(uploadDir string) *ImageHandler {
	return &ImageHandler{
		imageService: services.NewImageService(uploadDir),
	}
}

// UploadPetImage handles POST /pets/:id/images
func (h *ImageHandler) UploadPetImage(c *gin.Context) {
	petID := c.Param("id")
	// Development: Skip user authentication
	_ = "dev-user" // Mock user for development (unused)

	// Verify pet exists
	pet, err := getPetByIDFromRedis(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Development: Skip ownership check
	_ = pet.OwnerID // Suppress unused variable warning

	// Get uploaded file
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}

	// Validate image
	if err := h.imageService.ValidateImage(fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer file.Close()

	// Save image
	originalPath, thumbnailPath, width, height, err := h.imageService.SaveImage(petID, fileHeader, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save image: %v", err)})
		return
	}

	// Create image record
	image := models.NewPetImage(
		petID,
		filepath.Base(originalPath),
		originalPath,
		thumbnailPath,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
		width,
		height,
	)

	// Check if this should be the main image
	if isMain := c.PostForm("is_main"); isMain == "true" {
		image.IsMain = true
		// Unset other main images for this pet
		if err := h.unsetOtherMainImages(petID, image.ID); err != nil {
			// Log warning but don't fail the upload
			fmt.Printf("Warning: Failed to unset other main images: %v\n", err)
		}
	}

	// Save image record to Redis
	if err := h.saveImageToRedis(image); err != nil {
		// Clean up uploaded files
		h.imageService.DeleteImage(petID, image.FileName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
		return
	}

	// Update pet's images list
	if err := h.addImageToPet(petID, image.ID); err != nil {
		// Log warning but don't fail the upload
		fmt.Printf("Warning: Failed to update pet images list: %v\n", err)
	}

	c.JSON(http.StatusCreated, models.ImageUploadResponse{
		Image:   image,
		Message: "Image uploaded successfully",
	})
}

// GetPetImages handles GET /pets/:id/images
func (h *ImageHandler) GetPetImages(c *gin.Context) {
	petID := c.Param("id")

	// Verify pet exists
	_, err := getPetByIDFromRedis(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Get all image keys for this pet
	keys, err := utils.RedisClient.Keys(imageCtx, fmt.Sprintf("pet_image:%s:*", petID)).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
		return
	}

	var images []models.PetImage
	for _, key := range keys {
		imageJSON, err := utils.RedisClient.Get(imageCtx, key).Result()
		if err != nil {
			continue
		}

		var image models.PetImage
		if err := json.Unmarshal([]byte(imageJSON), &image); err != nil {
			continue
		}

		images = append(images, image)
	}

	c.JSON(http.StatusOK, models.ImagesListResponse{
		Images: images,
		Total:  len(images),
	})
}

// DeletePetImage handles DELETE /pets/:id/images/:image_id
func (h *ImageHandler) DeletePetImage(c *gin.Context) {
	petID := c.Param("id")
	imageID := c.Param("image_id")
	// Development: Skip user authentication
	_ = "dev-user" // Mock user for development (unused)

	// Verify pet exists
	pet, err := getPetByIDFromRedis(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Development: Skip ownership check  
	_ = pet.OwnerID // Suppress unused variable warning

	// Get image record
	image, err := h.getImageFromRedis(petID, imageID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// Delete physical files
	if err := h.imageService.DeleteImage(petID, image.FileName); err != nil {
		fmt.Printf("Warning: Failed to delete physical files: %v\n", err)
	}

	// Delete image record from Redis
	if err := h.deleteImageFromRedis(petID, imageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image record"})
		return
	}

	// Remove image from pet's images list
	if err := h.removeImageFromPet(petID, imageID); err != nil {
		fmt.Printf("Warning: Failed to update pet images list: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

// Helper functions

func getPetByIDFromRedis(petID string) (*sharedModels.Pet, error) {
	key := utils.GetRedisKey("pet", petID)
	petJSON, err := utils.RedisClient.Get(imageCtx, key).Result()
	if err != nil {
		return nil, err
	}

	var pet sharedModels.Pet
	if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
		return nil, err
	}

	return &pet, nil
}

func (h *ImageHandler) saveImageToRedis(image *models.PetImage) error {
	imageJSON, err := json.Marshal(image)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("pet_image:%s:%s", image.PetID, image.ID)
	return utils.RedisClient.Set(imageCtx, key, imageJSON, 0).Err()
}

func (h *ImageHandler) getImageFromRedis(petID, imageID string) (*models.PetImage, error) {
	key := fmt.Sprintf("pet_image:%s:%s", petID, imageID)
	imageJSON, err := utils.RedisClient.Get(imageCtx, key).Result()
	if err != nil {
		return nil, err
	}

	var image models.PetImage
	if err := json.Unmarshal([]byte(imageJSON), &image); err != nil {
		return nil, err
	}

	return &image, nil
}

func (h *ImageHandler) deleteImageFromRedis(petID, imageID string) error {
	key := fmt.Sprintf("pet_image:%s:%s", petID, imageID)
	return utils.RedisClient.Del(imageCtx, key).Err()
}

func (h *ImageHandler) addImageToPet(petID, imageID string) error {
	pet, err := getPetByIDFromRedis(petID)
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
	return utils.RedisClient.Set(imageCtx, key, petJSON, 0).Err()
}

func (h *ImageHandler) removeImageFromPet(petID, imageID string) error {
	pet, err := getPetByIDFromRedis(petID)
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
	return utils.RedisClient.Set(imageCtx, key, petJSON, 0).Err()
}

func (h *ImageHandler) unsetOtherMainImages(petID, currentImageID string) error {
	// Get all image keys for this pet
	keys, err := utils.RedisClient.Keys(imageCtx, fmt.Sprintf("pet_image:%s:*", petID)).Result()
	if err != nil {
		return err
	}

	for _, key := range keys {
		imageJSON, err := utils.RedisClient.Get(imageCtx, key).Result()
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
			utils.RedisClient.Set(imageCtx, key, updatedJSON, 0)
		}
	}

	return nil
}
