// Package utils provides utility functions for the PetMatch application.
// It includes Redis connection management, JWT utilities, and common helper functions.
package utils

import (
	"context"
	"fmt"
	"log"

	"github.com/go-redis/redis/v8"

	"github.com/petmatch/app/shared/config"
)

const (
	// IndexExistsError is the error message returned when a Redis index already exists.
	IndexExistsError = "Index already exists"
)

var (
	RedisClient *redis.Client
	ctx         = context.Background()
)

// InitRedis initializes Redis connection
func InitRedis(cfg *config.Config) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	// Test connection
	pong, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %v", err)
	}

	log.Printf("Redis connected successfully: %s", pong)
	return nil
}

// GetRedisKey generates a Redis key with namespace
func GetRedisKey(namespace, id string) string {
	return fmt.Sprintf("%s:%s", namespace, id)
}

// SetupRedisIndexes creates Redis search indexes
func SetupRedisIndexes() error {
	// Pet search index
	petIndexCmd := redis.NewCmd(ctx,
		"FT.CREATE", "pet-index",
		"ON", "JSON",
		"PREFIX", "1", "pet:",
		"SCHEMA",
		"$.species", "AS", "species", "TEXT", "SORTABLE",
		"$.breed", "AS", "breed", "TEXT", "SORTABLE",
		"$.age", "AS", "age", "NUMERIC", "SORTABLE",
		"$.location", "AS", "location", "GEO",
		"$.status", "AS", "status", "TAG", "SORTABLE",
		"$.gender", "AS", "gender", "TAG",
		"$.size", "AS", "size", "TAG",
	)

	err := RedisClient.Process(ctx, petIndexCmd)
	if err != nil && err.Error() != IndexExistsError {
		log.Printf("Failed to create pet index: %v", err)
		return err
	}

	// User search index
	userIndexCmd := redis.NewCmd(ctx,
		"FT.CREATE", "user-index",
		"ON", "JSON",
		"PREFIX", "1", "user:",
		"SCHEMA",
		"$.type", "AS", "type", "TAG",
		"$.email", "AS", "email", "TEXT",
		"$.coordinates", "AS", "coordinates", "GEO",
		"$.verified", "AS", "verified", "TAG",
	)

	err = RedisClient.Process(ctx, userIndexCmd)
	if err != nil && err.Error() != IndexExistsError {
		log.Printf("Failed to create user index: %v", err)
		return err
	}

	log.Println("Redis search indexes setup completed")
	return nil
}

// HealthCheck checks if Redis is responding
func HealthCheck() error {
	_, err := RedisClient.Ping(ctx).Result()
	return err
}
