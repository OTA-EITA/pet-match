package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var (
	MinioClient *minio.Client
	ctx         = context.Background()
)

const (
	PetImagesBucket     = "pet-images"
	PetThumbnailsBucket = "pet-thumbnails"
)

// MinioConfig holds MinIO connection configuration
type MinioConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
}

// InitMinio initializes the MinIO client
func InitMinio(config MinioConfig) error {
	client, err := minio.New(config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.UseSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to create MinIO client: %v", err)
	}

	MinioClient = client

	// Ensure buckets exist
	if err := ensureBucketsExist(); err != nil {
		return fmt.Errorf("failed to ensure buckets exist: %v", err)
	}

	log.Println("MinIO client initialized successfully")
	return nil
}

// ensureBucketsExist creates buckets if they don't exist
func ensureBucketsExist() error {
	buckets := []string{PetImagesBucket, PetThumbnailsBucket}

	for _, bucketName := range buckets {
		exists, err := MinioClient.BucketExists(ctx, bucketName)
		if err != nil {
			return fmt.Errorf("failed to check if bucket %s exists: %v", bucketName, err)
		}

		if !exists {
			err = MinioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
			if err != nil {
				return fmt.Errorf("failed to create bucket %s: %v", bucketName, err)
			}
			log.Printf("Created bucket: %s", bucketName)

			// Set bucket policy to allow public read access
			if err := setBucketPublicReadPolicy(bucketName); err != nil {
				log.Printf("Warning: Failed to set public read policy for bucket %s: %v", bucketName, err)
			}
		}
	}

	return nil
}

// setBucketPublicReadPolicy sets the bucket policy to allow public read access
func setBucketPublicReadPolicy(bucketName string) error {
	policy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Principal": {"AWS": ["*"]},
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}
		]
	}`, bucketName)

	return MinioClient.SetBucketPolicy(ctx, bucketName, policy)
}

// UploadFile uploads a file to MinIO and returns the URL
func UploadFile(bucketName, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	_, err := MinioClient.PutObject(ctx, bucketName, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to MinIO: %v", err)
	}

	// Generate public URL
	url := GetPublicURL(bucketName, objectName)
	return url, nil
}

// GetPublicURL generates a public URL for an object
func GetPublicURL(bucketName, objectName string) string {
	if MinioClient == nil {
		return ""
	}

	// Get MinIO endpoint
	endpoint := MinioClient.EndpointURL()
	
	// Construct public URL
	publicURL := fmt.Sprintf("%s/%s/%s", endpoint.String(), bucketName, objectName)
	return publicURL
}

// GetPresignedURL generates a presigned URL for temporary access
func GetPresignedURL(bucketName, objectName string, expires time.Duration) (string, error) {
	reqParams := make(url.Values)
	presignedURL, err := MinioClient.PresignedGetObject(ctx, bucketName, objectName, expires, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %v", err)
	}

	return presignedURL.String(), nil
}

// DeleteFile deletes a file from MinIO
func DeleteFile(bucketName, objectName string) error {
	err := MinioClient.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file from MinIO: %v", err)
	}

	return nil
}

// ListFiles lists all files in a bucket with a given prefix
func ListFiles(bucketName, prefix string) ([]string, error) {
	var files []string

	objectCh := MinioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})

	for object := range objectCh {
		if object.Err != nil {
			return nil, fmt.Errorf("failed to list objects: %v", object.Err)
		}
		files = append(files, object.Key)
	}

	return files, nil
}

// HealthCheck checks if MinIO is accessible
func HealthCheck() error {
	if MinioClient == nil {
		return fmt.Errorf("MinIO client not initialized")
	}

	// Try to list buckets to check connectivity
	_, err := MinioClient.ListBuckets(ctx)
	if err != nil {
		return fmt.Errorf("MinIO health check failed: %v", err)
	}

	return nil
}
