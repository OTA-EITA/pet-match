package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
)

var ctx = context.Background()

// getPets handles GET /pets
func getPets(c *gin.Context) {
	// Parse query parameters
	params := parsePetSearchParams(c)

	// Fetch and filter pets
	pets, err := fetchAndFilterPets(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pets"})
		return
	}

	// Apply pagination
	result := applyPagination(pets, params.Offset, params.Limit)

	c.JSON(http.StatusOK, gin.H{
		"pets":   result,
		"total":  len(pets),
		"limit":  params.Limit,
		"offset": params.Offset,
	})
}

type petSearchParams struct {
	Species string
	Breed   string
	AgeMin  int
	AgeMax  int
	Gender  string
	Size    string
	Limit   int
	Offset  int
}

func parsePetSearchParams(c *gin.Context) petSearchParams {
	ageMin, _ := strconv.Atoi(c.Query("age_min"))
	ageMax, _ := strconv.Atoi(c.Query("age_max"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	return petSearchParams{
		Species: c.Query("species"),
		Breed:   c.Query("breed"),
		AgeMin:  ageMin,
		AgeMax:  ageMax,
		Gender:  c.Query("gender"),
		Size:    c.Query("size"),
		Limit:   limit,
		Offset:  offset,
	}
}

func fetchAndFilterPets(params petSearchParams) ([]models.Pet, error) {
	// Get all pet keys from Redis
	keys, err := utils.RedisClient.Keys(ctx, "pet:*").Result()
	if err != nil {
		return nil, err
	}

	var pets []models.Pet
	for _, key := range keys {
		pet, err := fetchPetFromRedis(key)
		if err != nil {
			continue
		}

		if matchesSearchCriteria(pet, params) {
			pets = append(pets, pet)
		}
	}

	return pets, nil
}

func fetchPetFromRedis(key string) (models.Pet, error) {
	petJSON, err := utils.RedisClient.Get(ctx, key).Result()
	if err != nil {
		return models.Pet{}, err
	}

	var pet models.Pet
	err = json.Unmarshal([]byte(petJSON), &pet)
	if err != nil {
		return models.Pet{}, err
	}
	
	// マイグレーション: 既存データのage_infoを補完
	pet.MigrateAgeInfo()
	
	// マイグレーション後のデータを保存して永続化
	saveMigratedPetToRedis(&pet, key)
	
	return pet, nil
}

func matchesSearchCriteria(pet models.Pet, params petSearchParams) bool {
	if params.Species != "" && pet.Species != params.Species {
		return false
	}
	if params.Breed != "" && pet.Breed != params.Breed {
		return false
	}
	if params.Gender != "" && pet.Gender != params.Gender {
		return false
	}
	if params.Size != "" && pet.Size != params.Size {
		return false
	}
	if params.AgeMin > 0 && pet.AgeInfo.Years < params.AgeMin {
		return false
	}
	if params.AgeMax > 0 && pet.AgeInfo.Years > params.AgeMax {
		return false
	}
	return true
}

func applyPagination(pets []models.Pet, offset, limit int) []models.Pet {
	start := offset
	end := offset + limit

	if start > len(pets) {
		start = len(pets)
	}
	if end > len(pets) {
		end = len(pets)
	}

	return pets[start:end]
}

// getPet handles GET /pets/:id
func getPet(c *gin.Context) {
	petID := c.Param("id")
	key := utils.GetRedisKey("pet", petID)

	petJSON, err := utils.RedisClient.Get(ctx, key).Result()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	var pet models.Pet
	if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse pet data"})
		return
	}

	c.JSON(http.StatusOK, pet)
}

// createPet handles POST /pets
func createPet(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.PetCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create new pet
	pet := createNewPetFromRequest(req, userID.(string))

	// Save to Redis
	if err := savePetToRedis(pet); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save pet"})
		return
	}

	c.JSON(http.StatusCreated, pet)
}

func createNewPetFromRequest(req models.PetCreateRequest, userID string) *models.Pet {
	return models.NewPetFromRequest(req, userID)
}

func savePetToRedis(pet *models.Pet) error {
	petJSON, err := json.Marshal(pet)
	if err != nil {
		return err
	}

	key := utils.GetRedisKey("pet", pet.ID)
	return utils.RedisClient.Set(ctx, key, petJSON, 0).Err()
}

// saveMigratedPetToRedis saves migrated pet data back to Redis (async, best effort)
func saveMigratedPetToRedis(pet *models.Pet, key string) {
	// 非同期でマイグレーション後のデータを保存
	go func() {
		petJSON, err := json.Marshal(pet)
		if err != nil {
			return // Silent fail for migration saves
		}
		utils.RedisClient.Set(ctx, key, petJSON, 0)
	}()
}

// updatePet handles PUT /pets/:id
func updatePet(c *gin.Context) {
	petID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Get existing pet
	pet, err := getPetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Check ownership
	if pet.OwnerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this pet"})
		return
	}

	var req models.PetCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update pet
	updatePetFromRequest(pet, req)

	// Save to Redis
	if err := savePetToRedis(pet); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pet"})
		return
	}

	c.JSON(http.StatusOK, pet)
}

func getPetByID(petID string) (*models.Pet, error) {
	key := utils.GetRedisKey("pet", petID)
	petJSON, err := utils.RedisClient.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var pet models.Pet
	if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
		return nil, err
	}
	
	// マイグレーション: 既存データのage_infoを補完
	pet.MigrateAgeInfo()
	
	// マイグレーション後のデータを保存して永続化
	saveMigratedPetToRedis(&pet, key)

	return &pet, nil
}

func updatePetFromRequest(pet *models.Pet, req models.PetCreateRequest) {
	pet.Name = req.Name
	pet.Species = req.Species
	pet.Breed = req.Breed
	pet.AgeInfo = models.CalculateAgeInfo(req.AgeYears, req.AgeMonths, req.IsEstimated)
	pet.Gender = req.Gender
	pet.Size = req.Size
	pet.Color = req.Color
	pet.Personality = req.Personality
	pet.MedicalInfo = req.MedicalInfo
	pet.Location = req.Location
	pet.Description = req.Description
	pet.UpdatedAt = time.Now()
}

// deletePet handles DELETE /pets/:id
func deletePet(c *gin.Context) {
	petID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Get existing pet
	pet, err := getPetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Check ownership
	if pet.OwnerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this pet"})
		return
	}

	// Delete from Redis
	key := utils.GetRedisKey("pet", petID)
	if err := utils.RedisClient.Del(ctx, key).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pet"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pet deleted successfully"})
}

// uploadPetImage handles POST /pets/:id/images
func uploadPetImage(c *gin.Context) {
	petID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Get existing pet
	pet, err := getPetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Check ownership
	if pet.OwnerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to upload images for this pet"})
		return
	}

	// For now, just return a mock response
	// In production, integrate with MinIO or file service
	c.JSON(http.StatusOK, gin.H{
		"message":  "Image upload endpoint ready",
		"pet_id":   petID,
		"owner_id": userID,
		"note":     "File service integration pending",
	})
}

// migrateAllPets handles POST /pets/migrate - migrates all existing pets
func migrateAllPets(c *gin.Context) {
	// Get all pet keys from Redis
	keys, err := utils.RedisClient.Keys(ctx, "pet:*").Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pet keys"})
		return
	}

	migratedCount := 0
	errorCount := 0

	for _, key := range keys {
		petJSON, err := utils.RedisClient.Get(ctx, key).Result()
		if err != nil {
			errorCount++
			continue
		}

		var pet models.Pet
		if err := json.Unmarshal([]byte(petJSON), &pet); err != nil {
			errorCount++
			continue
		}

		// Apply migration
		oldTotalMonths := pet.AgeInfo.TotalMonths
		pet.MigrateAgeInfo()

		// Save if migration was applied
		if pet.AgeInfo.TotalMonths != oldTotalMonths || pet.AgeInfo.AgeText == "" {
			migratedJSON, err := json.Marshal(pet)
			if err != nil {
				errorCount++
				continue
			}
			if err := utils.RedisClient.Set(ctx, key, migratedJSON, 0).Err(); err != nil {
				errorCount++
				continue
			}
			migratedCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Migration completed",
		"total_pets": len(keys),
		"migrated": migratedCount,
		"errors": errorCount,
	})
}
