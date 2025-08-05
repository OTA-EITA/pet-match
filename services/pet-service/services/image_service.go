package services

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/nfnt/resize"
)

const (
	// MaxFileSize is the maximum allowed file size for uploads (10MB)
	MaxFileSize = 10 << 20 // 10MB
	
	// ThumbnailWidth is the width for thumbnail generation
	ThumbnailWidth = 300
	
	// ThumbnailHeight is the height for thumbnail generation
	ThumbnailHeight = 300
)

// ImageService handles image processing operations
type ImageService struct {
	uploadDir string
}

// NewImageService creates a new image service instance
func NewImageService(uploadDir string) *ImageService {
	return &ImageService{
		uploadDir: uploadDir,
	}
}

// ValidateImage validates the uploaded image file
func (s *ImageService) ValidateImage(fileHeader *multipart.FileHeader) error {
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

// SaveImage saves the uploaded image and creates a thumbnail
func (s *ImageService) SaveImage(petID string, fileHeader *multipart.FileHeader, file multipart.File) (originalPath, thumbnailPath string, width, height int, err error) {
	// Create directories with explicit permissions
	originalDir := filepath.Join(s.uploadDir, "pets", petID, "original")
	thumbnailDir := filepath.Join(s.uploadDir, "pets", petID, "thumbnails")
	
	if err := os.MkdirAll(originalDir, 0755); err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to create original directory: %v", err)
	}
	
	// Ensure directory has correct permissions
	if err := os.Chmod(originalDir, 0755); err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to set original directory permissions: %v", err)
	}
	
	if err := os.MkdirAll(thumbnailDir, 0755); err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to create thumbnail directory: %v", err)
	}
	
	// Ensure directory has correct permissions
	if err := os.Chmod(thumbnailDir, 0755); err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to set thumbnail directory permissions: %v", err)
	}

	// Generate unique filename
	filename := generateUniqueFilename(fileHeader.Filename)
	originalPath = filepath.Join(originalDir, filename)
	thumbnailPath = filepath.Join(thumbnailDir, filename)

	// Save original file
	originalFile, err := os.Create(originalPath)
	if err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to create original file: %v", err)
	}
	defer originalFile.Close()

	// Reset file reader
	file.Seek(0, 0)
	
	// Copy original file
	if _, err := io.Copy(originalFile, file); err != nil {
		return "", "", 0, 0, fmt.Errorf("failed to save original file: %v", err)
	}

	// Generate thumbnail
	width, height, err = s.generateThumbnail(originalPath, thumbnailPath)
	if err != nil {
		// Clean up original file if thumbnail generation fails
		os.Remove(originalPath)
		return "", "", 0, 0, fmt.Errorf("failed to generate thumbnail: %v", err)
	}

	return originalPath, thumbnailPath, width, height, nil
}

// generateThumbnail creates a thumbnail from the original image
func (s *ImageService) generateThumbnail(originalPath, thumbnailPath string) (width, height int, err error) {
	// Open original image
	originalFile, err := os.Open(originalPath)
	if err != nil {
		return 0, 0, err
	}
	defer originalFile.Close()

	// Decode image
	img, format, err := image.Decode(originalFile)
	if err != nil {
		return 0, 0, err
	}

	// Get original dimensions
	bounds := img.Bounds()
	width = bounds.Dx()
	height = bounds.Dy()

	// Create thumbnail
	thumbnail := resize.Thumbnail(ThumbnailWidth, ThumbnailHeight, img, resize.Lanczos3)

	// Create thumbnail file
	thumbnailFile, err := os.Create(thumbnailPath)
	if err != nil {
		return 0, 0, err
	}
	defer thumbnailFile.Close()

	// Encode thumbnail based on original format
	switch format {
	case "jpeg":
		err = jpeg.Encode(thumbnailFile, thumbnail, &jpeg.Options{Quality: 85})
	case "png":
		err = png.Encode(thumbnailFile, thumbnail)
	default:
		// Default to JPEG for unknown formats
		err = jpeg.Encode(thumbnailFile, thumbnail, &jpeg.Options{Quality: 85})
	}

	return width, height, err
}

// DeleteImage deletes both original and thumbnail images
func (s *ImageService) DeleteImage(petID, filename string) error {
	originalPath := filepath.Join(s.uploadDir, "pets", petID, "original", filename)
	thumbnailPath := filepath.Join(s.uploadDir, "pets", petID, "thumbnails", filename)

	// Delete original (ignore errors if file doesn't exist)
	os.Remove(originalPath)
	
	// Delete thumbnail (ignore errors if file doesn't exist)
	os.Remove(thumbnailPath)

	return nil
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
