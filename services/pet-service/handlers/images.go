package handlers

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/pet-service/models"
	"github.com/petmatch/app/services/pet-service/repository"
	"github.com/petmatch/app/services/pet-service/services"
	"github.com/petmatch/app/services/pet-service/storage"
)

// ImageHandler handles image-related operations with MinIO
type ImageHandler struct {
	imageService *services.MinioImageService
	imageRepo    *repository.ImageRepository
}

// NewImageHandler creates a new image handler with MinIO support
func NewImageHandler(uploadDir string) *ImageHandler {
	return &ImageHandler{
		imageService: services.NewMinioImageService(),
		imageRepo:    repository.NewImageRepository(),
	}
}

// UploadPetImage handles POST /pets/:id/images with MinIO storage
func (h *ImageHandler) UploadPetImage(c *gin.Context) {
	petID := c.Param("id")
	// Development: Skip user authentication
	_ = "dev-user" // Mock user for development (unused)

	// Verify pet exists
	pet, err := h.imageRepo.GetPetByID(petID)
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
	defer func() {
		if err := file.Close(); err != nil {
			log.Printf("Failed to close uploaded file: %v", err)
		}
	}()

	// Save image to MinIO
	originalURL, thumbnailURL, width, height, err := h.imageService.SaveImage(petID, fileHeader, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save image: %v", err)})
		return
	}

	// Create image record
	image := models.NewPetImageWithMinIO(
		petID,
		filepath.Base(originalURL), // Extract filename from URL
		originalURL,
		thumbnailURL,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
		width,
		height,
	)

	// Check if this should be the main image
	if isMain := c.PostForm("is_main"); isMain == "true" {
		image.IsMain = true
		// Unset other main images for this pet
		if err := h.imageRepo.UnsetOtherMainImages(petID, image.ID); err != nil {
			// Log warning but don't fail the upload
			fmt.Printf("Warning: Failed to unset other main images: %v\n", err)
		}
	}

	// Save image record to Redis
	if err := h.imageRepo.SaveImage(image); err != nil {
		// Clean up uploaded files from MinIO
		if err := h.imageService.DeleteImage(petID, image.FileName); err != nil {
			fmt.Printf("Warning: Failed to clean up uploaded files: %v\n", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record"})
		return
	}

	// Update pet's images list
	if err := h.imageRepo.AddImageToPet(petID, image.ID); err != nil {
		// Log warning but don't fail the upload
		fmt.Printf("Warning: Failed to update pet images list: %v\n", err)
	}

	c.JSON(http.StatusCreated, models.ImageUploadResponse{
		Image:   image,
		Message: "Image uploaded successfully to MinIO",
	})
}

// GetPetImages handles GET /pets/:id/images
func (h *ImageHandler) GetPetImages(c *gin.Context) {
	petID := c.Param("id")

	// Verify pet exists
	_, err := h.imageRepo.GetPetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Get all images for this pet
	images, err := h.imageRepo.GetAllImages(petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
		return
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
	pet, err := h.imageRepo.GetPetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Development: Skip ownership check
	_ = pet.OwnerID // Suppress unused variable warning

	// Get image record
	image, err := h.imageRepo.GetImage(petID, imageID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// Delete physical files from MinIO
	if err := h.imageService.DeleteImage(petID, image.FileName); err != nil {
		fmt.Printf("Warning: Failed to delete physical files from MinIO: %v\n", err)
	}

	// Delete image record from Redis
	if err := h.imageRepo.DeleteImage(petID, imageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image record"})
		return
	}

	// Remove image from pet's images list
	if err := h.imageRepo.RemoveImageFromPet(petID, imageID); err != nil {
		fmt.Printf("Warning: Failed to update pet images list: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully from MinIO"})
}

// HealthCheck endpoint for MinIO connectivity
func (h *ImageHandler) HealthCheck(c *gin.Context) {
	if err := storage.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  fmt.Sprintf("MinIO connection failed: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"storage": "minio",
		"buckets": []string{storage.PetImagesBucket, storage.PetThumbnailsBucket},
	})
}
