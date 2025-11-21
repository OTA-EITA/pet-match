package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
)

func main() {
	log.Println("=== Redis to PostgreSQL Migration ===")

	// Load configuration
	cfg := config.Load()

	// Initialize PostgreSQL
	log.Println("Connecting to PostgreSQL...")
	if err := database.InitPostgreSQL(); err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	log.Println("✓ PostgreSQL connected")

	// Run migrations
	log.Println("Running database migrations...")
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("✓ Migrations completed")

	// Initialize Redis
	log.Println("Connecting to Redis...")
	if err := utils.InitRedis(cfg); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("✓ Redis connected")

	// Migrate pets
	if err := migratePets(); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("✓ Migration completed successfully!")
}

func migratePets() error {
	ctx := context.Background()

	// Get all pet keys from Redis
	log.Println("\nFetching pets from Redis...")
	keys, err := utils.RedisClient.Keys(ctx, "pet:*").Result()
	if err != nil {
		return fmt.Errorf("failed to get pet keys: %w", err)
	}

	log.Printf("Found %d pets in Redis\n", len(keys))

	if len(keys) == 0 {
		log.Println("No pets to migrate")
		return nil
	}

	// Migrate each pet
	migrated := 0
	skipped := 0
	failed := 0

	for i, key := range keys {
		log.Printf("[%d/%d] Migrating %s...", i+1, len(keys), key)

		// Get pet data from Redis
		petJSON, err := utils.RedisClient.Get(ctx, key).Result()
		if err != nil {
			log.Printf("  ✗ Failed to get pet data: %v", err)
			failed++
			continue
		}

		// Unmarshal pet
		var pet models.Pet
		if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
			log.Printf("  ✗ Failed to unmarshal pet: %v", err)
			failed++
			continue
		}

		// Migrate age_info if needed
		pet.MigrateAgeInfo()

		// Check if pet already exists in PostgreSQL
		var existing models.Pet
		result := database.DB.Where("id = ?", pet.ID).First(&existing)
		if result.Error == nil {
			// Pet exists - check if we should update
			if shouldUpdate(&existing, &pet) {
				if err := database.DB.Save(&pet).Error; err != nil {
					log.Printf("  ✗ Failed to update pet: %v", err)
					failed++
					continue
				}
				log.Printf("  ✓ Updated existing pet")
				migrated++
			} else {
				log.Printf("  → Skipped (already up-to-date)")
				skipped++
			}
			continue
		}

		// Create new pet
		if err := database.DB.Create(&pet).Error; err != nil {
			log.Printf("  ✗ Failed to create pet: %v", err)
			failed++
			continue
		}

		log.Printf("  ✓ Created new pet")
		migrated++
	}

	// Summary
	log.Println("\n=== Migration Summary ===")
	log.Printf("Total:    %d", len(keys))
	log.Printf("Migrated: %d", migrated)
	log.Printf("Skipped:  %d", skipped)
	log.Printf("Failed:   %d", failed)

	if failed > 0 {
		return fmt.Errorf("migration completed with %d failures", failed)
	}

	return nil
}

func shouldUpdate(existing, new *models.Pet) bool {
	// Update if UpdatedAt is newer
	return new.UpdatedAt.After(existing.UpdatedAt)
}

func confirmAction(message string) bool {
	fmt.Printf("%s (y/n): ", message)
	var response string
	fmt.Scanln(&response)
	return response == "y" || response == "Y" || response == "yes"
}

func init() {
	// Check for dry-run mode
	if len(os.Args) > 1 && os.Args[1] == "--dry-run" {
		log.Println("DRY RUN MODE - No data will be modified")
	}
}
