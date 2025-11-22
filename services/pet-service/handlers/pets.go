package handlers

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/petmatch/app/services/pet-service/repository"
	"github.com/petmatch/app/services/pet-service/services"
	"github.com/petmatch/app/shared/models"
)

var petCtx = context.Background()

// isTestEnvironment checks if we're running in a test environment
func isTestEnvironment() bool {
	return os.Getenv("GO_ENV") == "test" ||
		   (len(os.Args) > 0 &&
		    (os.Args[0] == "/tmp/go-build" ||
		     os.Args[0] == "/_test/"))
}

// PetHandler handles pet-related operations
type PetHandler struct {
	repo *repository.PetRepository
}

// NewPetHandler creates a new pet handler
func NewPetHandler() *PetHandler {
	return &PetHandler{
		repo: repository.NewPetRepository(),
	}
}

// GetPets handles GET /pets
func (h *PetHandler) GetPets(c *gin.Context) {
	// Parse query parameters
	params := parsePetSearchParams(c)

	// Use repository to fetch pets
	pets, total, err := h.repo.List(repository.ListParams{
		Species:  params.Species,
		Breed:    params.Breed,
		Gender:   params.Gender,
		Size:     params.Size,
		Status:   "available",
		OwnerID:  params.OwnerID,
		AgeMin:   params.AgeMin,
		AgeMax:   params.AgeMax,
		Limit:    params.Limit,
		Offset:   params.Offset,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pets":   pets,
		"total":  total,
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
	OwnerID string  // For filtering by owner
	Limit   int
	Offset  int
}

func parsePetSearchParams(c *gin.Context) petSearchParams {
	ageMin, _ := strconv.Atoi(c.Query("age_min"))
	ageMax, _ := strconv.Atoi(c.Query("age_max"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	// Handle "owner=me" parameter - extract current user ID
	var ownerID string
	if c.Query("owner") == "me" {
		if userID, exists := c.Get("user_id"); exists {
			ownerID = userID.(string)
		}
	} else {
		ownerID = c.Query("owner_id") // Direct owner ID
	}

	return petSearchParams{
		Species: c.Query("species"),
		Breed:   c.Query("breed"),
		AgeMin:  ageMin,
		AgeMax:  ageMax,
		Gender:  c.Query("gender"),
		Size:    c.Query("size"),
		OwnerID: ownerID,
		Limit:   limit,
		Offset:  offset,
	}
}

// GetPet handles GET /pets/:id
func (h *PetHandler) GetPet(c *gin.Context) {
	petID := c.Param("id")

	pet, err := h.repo.GetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	c.JSON(http.StatusOK, pet)
}

// CreatePet handles POST /pets
func (h *PetHandler) CreatePet(c *gin.Context) {
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

	// Save to database (dual-write: PostgreSQL + Redis)
	if err := h.repo.Create(pet); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save pet"})
		return
	}

	c.JSON(http.StatusCreated, pet)
}

func createNewPetFromRequest(req models.PetCreateRequest, userID string) *models.Pet {
	return models.NewPetFromRequest(req, userID)
}

// UpdatePet handles PUT /pets/:id
func (h *PetHandler) UpdatePet(c *gin.Context) {
	petID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Get existing pet
	pet, err := h.repo.GetByID(petID)
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

	// Save to database (write-through: update DB, invalidate cache)
	if err := h.repo.Update(pet); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pet"})
		return
	}

	c.JSON(http.StatusOK, pet)
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

// DeletePet handles DELETE /pets/:id
func (h *PetHandler) DeletePet(c *gin.Context) {
	petID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Get existing pet
	pet, err := h.repo.GetByID(petID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// Check ownership
	if pet.OwnerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this pet"})
		return
	}

	// Delete from database (removes from DB and cache)
	if err := h.repo.Delete(petID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pet"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pet deleted successfully"})
}

// MigrateAllPets handles POST /pets/migrate - migrates all existing pets
func (h *PetHandler) MigrateAllPets(c *gin.Context) {
	migrationService := services.NewMigrationService()

	result, err := migrationService.MigrateAllPets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to migrate pets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Migration completed",
		"total_pets": result.TotalPets,
		"migrated":   result.MigratedCount,
		"errors":     result.ErrorCount,
	})
}
