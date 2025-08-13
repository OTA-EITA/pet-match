package services

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"log"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/nfnt/resize"

	"github.com/petmatch/app/services/pet-service/storage"
)

const (
	// MaxFileSize is the maximum allowed file size for uploads (10MB)
	MaxFileSize = 10 << 20 // 10MB
	
	// ThumbnailWidth is the width for thumbnail generation
	ThumbnailWidth = 300
	
	// ThumbnailHeight is the height for thumbnail generation
	ThumbnailHeight = 300
)

// ImageService handles image processing operations (legacy local storage)
type ImageService struct {
	uploadDir string
}

// MinioImageService handles image processing operations with MinIO
type MinioImageService struct{}

// NewImageService creates a new image service instance (legacy local storage)
func NewImageService(uploadDir string) *ImageService {
	return &ImageService{
		uploadDir: uploadDir,
	}
}

// NewMinioImageService creates a new MinIO image service instance
func NewMinioImageService() *MinioImageService {
	return &MinioImageService{}
}

// ValidateImage validates the uploaded image file (common validation)
func ValidateImage(fileHeader *multipart.FileHeader) error {
	// Check file size
	if fileHeader.Size > MaxFileSize {
		return fmt.Errorf("file size exceeds maximum allowed size of %d MB", MaxFileSize/(1<<20))
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		return fmt.Errorf("unsupported file format. Only JPG, JPEG, and PNG are allowed")
	}

	return nil
}

// ValidateImage validates the uploaded image file (legacy method for compatibility)
func (s *ImageService) ValidateImage(fileHeader *multipart.FileHeader) error {
	return ValidateImage(fileHeader)
}

// ValidateImage validates the uploaded image file (MinIO method)
func (s *MinioImageService) ValidateImage(fileHeader *multipart.FileHeader) error {
	return ValidateImage(fileHeader)
}

// SaveImage saves the uploaded image to MinIO and creates a thumbnail
func (s *MinioImageService) SaveImage(petID string, fileHeader *multipart.FileHeader, file multipart.File) (originalURL, thumbnailURL string, width, height int, err error) {
	// Generate unique filename
	filename := generateUniqueFilename(fileHeader.Filename)
	
	// Create object names
	originalObjectName := fmt.Sprintf("pets/%s/original/%s", petID, filename)
	thumbnailObjectName := fmt.Sprintf("pets/%s/thumbnails/%s", petID, filename)

	// Reset file reader
	if _, err := file.Seek(0, 0); err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to reset file reader: %v", err)
	}

	// Read file content for processing
	fileContent, err := io.ReadAll(file)
	if err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to read file content: %v", err)
	}

	// Decode image to get dimensions
	img, format, err := image.Decode(bytes.NewReader(fileContent))
	if err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to decode image: %v", err)
	}

	// Get original dimensions
	bounds := img.Bounds()
	width = bounds.Dx()
	height = bounds.Dy()

	// Upload original image
	originalReader := bytes.NewReader(fileContent)
	originalURL, err = storage.UploadFile(
		storage.PetImagesBucket,
		originalObjectName,
		originalReader,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
	)
	if err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to upload original image: %v", err)
	}

	// Generate thumbnail
	thumbnailData, err := generateThumbnail(img, format)
	if err != nil {
		// Clean up original file if thumbnail generation fails
		if delErr := storage.DeleteFile(storage.PetImagesBucket, originalObjectName); delErr != nil {
			log.Printf("Failed to cleanup original file: %v", delErr)
		}
		return "", "", 0, 0, fmt.Errorf("failed to generate thumbnail: %v", err)
	}

	// Upload thumbnail
	thumbnailReader := bytes.NewReader(thumbnailData)
	thumbnailURL, err = storage.UploadFile(
		storage.PetThumbnailsBucket,
		thumbnailObjectName,
		thumbnailReader,
		int64(len(thumbnailData)),
		fileHeader.Header.Get("Content-Type"),
	)
	if err != nil {
		// Clean up original file if thumbnail upload fails
		if delErr := storage.DeleteFile(storage.PetImagesBucket, originalObjectName); delErr != nil {
			log.Printf("Failed to cleanup original file: %v", delErr)
		}
		return "", "", 0, 0, fmt.Errorf("failed to upload thumbnail: %v", err)
	}

	return originalURL, thumbnailURL, width, height, nil
}

// DeleteImage deletes both original and thumbnail images from MinIO
func (s *MinioImageService) DeleteImage(petID, filename string) error {
	originalObjectName := fmt.Sprintf("pets/%s/original/%s", petID, filename)
	thumbnailObjectName := fmt.Sprintf("pets/%s/thumbnails/%s", petID, filename)

	// Delete original (ignore errors if file doesn't exist)
	if err := storage.DeleteFile(storage.PetImagesBucket, originalObjectName); err != nil {
		log.Printf("Failed to delete original file: %v", err)
	}
	
	// Delete thumbnail (ignore errors if file doesn't exist)
	if err := storage.DeleteFile(storage.PetThumbnailsBucket, thumbnailObjectName); err != nil {
		log.Printf("Failed to delete thumbnail file: %v", err)
	}

	return nil
}

// GetImageURLs returns the public URLs for original and thumbnail images
func (s *MinioImageService) GetImageURLs(petID, filename string) (originalURL, thumbnailURL string) {
	originalObjectName := fmt.Sprintf("pets/%s/original/%s", petID, filename)
	thumbnailObjectName := fmt.Sprintf("pets/%s/thumbnails/%s", petID, filename)

	originalURL = storage.GetPublicURL(storage.PetImagesBucket, originalObjectName)
	thumbnailURL = storage.GetPublicURL(storage.PetThumbnailsBucket, thumbnailObjectName)

	return originalURL, thumbnailURL
}

// generateThumbnail creates a thumbnail from the image and returns byte data
func generateThumbnail(img image.Image, format string) ([]byte, error) {
	// Create thumbnail
	thumbnail := resize.Thumbnail(ThumbnailWidth, ThumbnailHeight, img, resize.Lanczos3)

	// Encode thumbnail to bytes
	var buf bytes.Buffer
	
	switch format {
	case "jpeg":
		err := jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: 85})
		if err != nil {
			return nil, err
		}
	case "png":
		err := png.Encode(&buf, thumbnail)
		if err != nil {
			return nil, err
		}
	default:
		// Default to JPEG for unknown formats
		err := jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: 85})
		if err != nil {
			return nil, err
		}
	}

	return buf.Bytes(), nil
}

// generateUniqueFilename generates a unique filename while preserving the extension
func generateUniqueFilename(originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	name := strings.TrimSuffix(originalFilename, ext)
	
	// Simple approach: add timestamp
	// In production, you might want to use UUIDs or more sophisticated naming
	timestamp := fmt.Sprintf("%d", getCurrentTimestamp())
	return fmt.Sprintf("%s_%s%s", name, timestamp, ext)
}

// getCurrentTimestamp returns current unix timestamp
func getCurrentTimestamp() int64 {
	return time.Now().Unix()
}

// Legacy ImageService methods (for local file storage - kept for backward compatibility)

// SaveImage saves the uploaded image and creates a thumbnail (legacy local storage)
func (s *ImageService) SaveImage(petID string, fileHeader *multipart.FileHeader, file multipart.File) (originalPath, thumbnailPath string, width, height int, err error) {
	// This method is kept for backward compatibility but should be replaced with MinIO
	return "", "", 0, 0, fmt.Errorf("local file storage is deprecated, use MinioImageService instead")
}

// DeleteImage deletes both original and thumbnail images (legacy local storage)
func (s *ImageService) DeleteImage(petID, filename string) error {
	// This method is kept for backward compatibility but should be replaced with MinIO
	return fmt.Errorf("local file storage is deprecated, use MinioImageService instead")
}
