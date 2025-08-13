package models

import (
	"time"

	"github.com/google/uuid"
)

// PetImage represents an image associated with a pet
type PetImage struct {
	ID           string    `json:"id"`
	PetID        string    `json:"pet_id"`
	FileName     string    `json:"file_name"`
	OriginalURL  string    `json:"original_url"`
	ThumbnailURL string    `json:"thumbnail_url"`
	FileSize     int64     `json:"file_size"`
	MimeType     string    `json:"mime_type"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	IsMain       bool      `json:"is_main"`
	UploadedAt   time.Time `json:"uploaded_at"`
}

// NewPetImageWithMinIO creates a new pet image instance for MinIO storage
func NewPetImageWithMinIO(petID, fileName, originalURL, thumbnailURL string, fileSize int64, mimeType string, width, height int) *PetImage {
	return &PetImage{
		ID:           uuid.New().String(),
		PetID:        petID,
		FileName:     fileName,
		OriginalURL:  originalURL,
		ThumbnailURL: thumbnailURL,
		FileSize:     fileSize,
		MimeType:     mimeType,
		Width:        width,
		Height:       height,
		IsMain:       false,
		UploadedAt:   time.Now(),
	}
}

// NewPetImage creates a new pet image instance (legacy for local storage)
func NewPetImage(petID, fileName, originalPath, thumbnailPath string, fileSize int64, mimeType string, width, height int) *PetImage {
	return &PetImage{
		ID:           uuid.New().String(),
		PetID:        petID,
		FileName:     fileName,
		OriginalURL:  "/uploads/pets/" + petID + "/original/" + fileName,
		ThumbnailURL: "/uploads/pets/" + petID + "/thumbnails/" + fileName,
		FileSize:     fileSize,
		MimeType:     mimeType,
		Width:        width,
		Height:       height,
		IsMain:       false,
		UploadedAt:   time.Now(),
	}
}

// ImageUploadRequest represents an image upload request
type ImageUploadRequest struct {
	IsMain bool `json:"is_main" form:"is_main"`
}

// ImageUploadResponse represents the response after successful image upload
type ImageUploadResponse struct {
	Image   *PetImage `json:"image"`
	Message string    `json:"message"`
}

// ImagesListResponse represents a list of images for a pet
type ImagesListResponse struct {
	Images []PetImage `json:"images"`
	Total  int        `json:"total"`
}
