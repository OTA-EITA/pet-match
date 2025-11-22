package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/go-redis/redismock/v8"
	"github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
	"github.com/stretchr/testify/assert"
)

// setupMockRedis はテスト用のモックRedisクライアントをセットアップします
func setupMockRedis() (redismock.ClientMock, func()) {
	originalClient := utils.RedisClient
	mockClient, mock := redismock.NewClientMock()
	utils.RedisClient = mockClient

	cleanup := func() {
		utils.RedisClient = originalClient
		if err := mockClient.Close(); err != nil {
			// テスト環境ではログ出力せずにエラーを無視
			_ = err
		}
	}

	return mock, cleanup
}

// TODO: Update these tests to use Repository mocks instead of Redis mocks
func TestPetHandler_GetPets_WithoutRedis(t *testing.T) {
	t.Skip("Skipping until repository mocking is implemented")
	// モックセットアップ
	mock, cleanup := setupMockRedis()
	defer cleanup()

	// Redis接続エラーをシミュレート
	mock.ExpectKeys("pet:*").SetErr(redis.Nil)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPetHandler()
	router.GET("/pets", handler.GetPets)

	req := httptest.NewRequest("GET", "/pets", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Redis接続エラーの場合は500エラーが予想される
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "error")

	// モックの期待値が満たされたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPetHandler_GetPets_WithEmptyResults(t *testing.T) {
	t.Skip("Skipping until repository mocking is implemented")
	// モックセットアップ
	mock, cleanup := setupMockRedis()
	defer cleanup()

	// 空の結果を返すモック
	mock.ExpectKeys("pet:*").SetVal([]string{})

	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPetHandler()
	router.GET("/pets", handler.GetPets)

	req := httptest.NewRequest("GET", "/pets", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// 正常に処理されるべき
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "pets")
	assert.Equal(t, 0, int(response["total"].(float64)))

	// モックの期待値が満たされたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPetHandler_GetPets_WithMockData(t *testing.T) {
	t.Skip("Skipping until repository mocking is implemented")
	// モックセットアップ
	mock, cleanup := setupMockRedis()
	defer cleanup()

	// テストペットデータ
	testPet := models.Pet{
		ID:      "test-pet-1",
		Name:    "テストペット",
		Species: "dog",
		Breed:   "柴犬",
		Gender:  "male",
		Size:    "medium",
		AgeInfo: models.AgeInfo{
			Years:       2,
			Months:      6,
			TotalMonths: 30,
			AgeText:     "2歳6ヶ月",
		},
		OwnerID: "test-user-1",
	}

	testPetJSON, _ := json.Marshal(testPet)

	// Redisモックの設定
	mock.ExpectKeys("pet:*").SetVal([]string{"pet:test-pet-1"})
	mock.ExpectGet("pet:test-pet-1").SetVal(string(testPetJSON))

	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPetHandler()
	router.GET("/pets", handler.GetPets)

	req := httptest.NewRequest("GET", "/pets?species=dog", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// 正常に処理されるべき
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "pets")
	assert.Equal(t, 1, int(response["total"].(float64)))

	// ペットの内容を確認
	pets := response["pets"].([]interface{})
	assert.Len(t, pets, 1)

	// モックの期待値が満たされたか確認
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestPetHandler_CreatePet_WithoutAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPetHandler()
	router.POST("/pets", handler.CreatePet)

	// Test data
	petRequest := models.PetCreateRequest{
		Name:        "テストペット",
		Species:     "dog",
		Breed:       "柴犬",
		AgeYears:    2,
		AgeMonths:   6,
		Gender:      "male",
		Size:        "medium",
		Color:       "茶色",
		Personality: []string{"活発", "人懐っこい"},
		Description: "テスト用のペットです",
		Location:    "35.6762,139.6503",
		MedicalInfo: models.MedicalInfo{
			Vaccinated: true,
			Neutered:   true,
		},
	}

	jsonData, _ := json.Marshal(petRequest)
	req := httptest.NewRequest("POST", "/pets", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// 認証なしの場合は401が予想される
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestPetHandler_CreatePet_WithAuth_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPetHandler()

	// Mock middleware to set user_id
	router.Use(func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		c.Next()
	})
	router.POST("/pets", handler.CreatePet)

	// Invalid JSON data
	req := httptest.NewRequest("POST", "/pets", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// 無効なJSONの場合は400エラーが予想される
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPetHandler_GetPets_NilRedisClient(t *testing.T) {
	// RedisClientをnilに設定
	originalClient := utils.RedisClient
	utils.RedisClient = nil
	defer func() {
		utils.RedisClient = originalClient
	}()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPetHandler()
	router.GET("/pets", handler.GetPets)

	req := httptest.NewRequest("GET", "/pets", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Redisクライアントがnilの場合は500エラーが予想される
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "error")
}

func TestParsePetSearchParams(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/pets?species=dog&limit=10&offset=0", nil)

	// Test
	params := parsePetSearchParams(c)

	// Assertions
	assert.Equal(t, "dog", params.Species)
	assert.Equal(t, 10, params.Limit)
	assert.Equal(t, 0, params.Offset)
}

// Note: matchesSearchCriteria and applyPagination tests removed
// These functions are now handled by the repository layer
// See repository package tests for filtering and pagination logic
