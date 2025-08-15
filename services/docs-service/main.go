package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/shared/config"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title PetMatch API Documentation
// @version 1.0
// @description Comprehensive API documentation for all PetMatch services
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.petmatch.com/support
// @contact.email support@petmatch.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8090
// @BasePath /

type DocsService struct {
	cfg *config.Config
}

type ServiceInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
	SpecURL     string `json:"spec_url"`
	Available   bool   `json:"available"`
}

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Gin
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	docsService := &DocsService{cfg: cfg}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "docs-service"})
	})

	// Default swagger.json endpoint (統合仕様を配信)
	router.GET("/swagger.json", docsService.GetCombinedSpec)
	router.GET("/doc.json", func(c *gin.Context) {
		c.Redirect(302, "/swagger.json")
	})

	// Swagger UI (統合ドキュメント) - デフォルトで統合仕様を読み込み
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("/swagger.json")))
	router.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/swagger/index.html")
	})

	// API specifications from individual services (legacy support)
	specs := router.Group("/specs")
	{
		specs.GET("/", docsService.ListServices)
		specs.GET("/matches", docsService.ProxyMatchServiceSpec)
	}

	// Combined API specification (main endpoint)
	router.GET("/openapi.json", docsService.GetCombinedSpec)

	// Start server
	port := "8090"
	log.Printf("📚 Docs Service starting on port %s", port)
	log.Printf("🌍 Swagger UI: http://localhost:%s/swagger/", port)
	log.Printf("📋 Service specs: http://localhost:%s/specs/", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start docs service:", err)
	}
}

// ListServices returns information about all available API services
func (d *DocsService) ListServices(c *gin.Context) {
	services := []ServiceInfo{
		{
			Name:        "Combined API",
			Description: "All PetMatch services combined",
			URL:         "http://localhost:8080",
			SpecURL:     "/swagger.json",
			Available:   true,
		},
		{
			Name:        "Match Service",
			Description: "Pet matching, recommendations, and user preferences",
			URL:         "http://localhost:8084",
			SpecURL:     "/specs/matches",
			Available:   d.checkServiceAvailability("http://localhost:8084/health"),
		},
	}

	c.JSON(200, gin.H{
		"services": services,
		"total":    len(services),
	})
}

// ProxyMatchServiceSpec proxies Match Service OpenAPI specification
func (d *DocsService) ProxyMatchServiceSpec(c *gin.Context) {
	d.proxyServiceSpec(c, "http://localhost:8084/docs/swagger.json")
}

// GetCombinedSpec returns a combined OpenAPI specification
func (d *DocsService) GetCombinedSpec(c *gin.Context) {
	combinedSpec := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title":       "PetMatch API - 統合仕様",
			"version":     "1.0.0",
			"description": "PetMatch全サービスの統合API仕様",
			"contact": map[string]string{
				"name":  "PetMatch Support",
				"email": "support@petmatch.com",
			},
		},
		"servers": []map[string]string{
			{"url": "http://localhost:8080", "description": "API Gateway"},
		},
		"paths": make(map[string]interface{}),
		"components": map[string]interface{}{
			"schemas": make(map[string]interface{}),
			"securitySchemes": map[string]interface{}{
				"BearerAuth": map[string]interface{}{
					"type": "http",
					"scheme": "bearer",
					"bearerFormat": "JWT",
					"description": "JWT認証トークン",
				},
			},
		},
		"security": []map[string]interface{}{
			{"BearerAuth": []string{}},
		},
	}

	paths := combinedSpec["paths"].(map[string]interface{})
	schemas := combinedSpec["components"].(map[string]interface{})["schemas"].(map[string]interface{})

	// Pet Service APIs
	d.addPetServicePaths(paths, schemas)

	// Auth Service APIs  
	d.addAuthServicePaths(paths, schemas)

	// User Service APIs
	d.addUserServicePaths(paths, schemas)

	// Match Service APIs
	d.addMatchServicePaths(paths, schemas)

	c.JSON(200, combinedSpec)
}

// Helper functions

func (d *DocsService) proxyServiceSpec(c *gin.Context, serviceSpecURL string) {
	resp, err := http.Get(serviceSpecURL)
	if err != nil {
		c.JSON(503, gin.H{
			"error": "Service unavailable",
			"details": fmt.Sprintf("Cannot fetch specification from %s", serviceSpecURL),
		})
		return
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Printf("Error closing response body: %v", closeErr)
		}
	}()

	if resp.StatusCode != 200 {
		c.JSON(resp.StatusCode, gin.H{
			"error": "Specification not available",
			"details": fmt.Sprintf("Service returned %s", resp.Status),
		})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to read specification",
			"details": err.Error(),
		})
		return
	}

	// Parse and potentially modify the specification
	var spec map[string]interface{}
	if err := json.Unmarshal(body, &spec); err != nil {
		c.JSON(500, gin.H{
			"error": "Invalid specification format",
			"details": err.Error(),
		})
		return
	}

	// Update host information for proper testing in Swagger UI
	if servers, ok := spec["servers"].([]interface{}); ok && len(servers) > 0 {
		if server, ok := servers[0].(map[string]interface{}); ok {
			// Keep the original service URL for testing
			server["url"] = strings.Replace(serviceSpecURL, "/docs/swagger.json", "", 1)
		}
	}

	c.Header("Content-Type", "application/json")
	c.JSON(200, spec)
}

func (d *DocsService) checkServiceAvailability(healthURL string) bool {
	resp, err := http.Get(healthURL)
	if err != nil {
		return false
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Printf("Error closing response body: %v", closeErr)
		}
	}()
	return resp.StatusCode == 200
}

// API Path Generators for Combined Specification

func (d *DocsService) addPetServicePaths(paths map[string]interface{}, schemas map[string]interface{}) {
	// Pet Service APIs
	paths["/api/pets"] = map[string]interface{}{
		"get": map[string]interface{}{
			"tags": []string{"Pets"},
			"summary": "ペット一覧取得",
			"description": "検索条件によるペット一覧の取得",
			"parameters": []map[string]interface{}{
				{"name": "species", "in": "query", "schema": map[string]string{"type": "string"}, "description": "動物種別（dog, cat, bird等）"},
				{"name": "breed", "in": "query", "schema": map[string]string{"type": "string"}, "description": "品種"},
				{"name": "age_min", "in": "query", "schema": map[string]string{"type": "integer"}, "description": "最小年齢"},
				{"name": "age_max", "in": "query", "schema": map[string]string{"type": "integer"}, "description": "最大年齢"},
				{"name": "limit", "in": "query", "schema": map[string]interface{}{"type": "integer", "default": 20}, "description": "取得件数"},
				{"name": "page", "in": "query", "schema": map[string]interface{}{"type": "integer", "default": 1}, "description": "ページ番号"},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "ペット一覧取得成功"},
				"400": map[string]interface{}{"description": "不正なリクエスト"},
				"500": map[string]interface{}{"description": "サーバーエラー"},
			},
		},
		"post": map[string]interface{}{
			"tags": []string{"Pets"},
			"summary": "ペット登録",
			"description": "新しいペットの登録",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"requestBody": map[string]interface{}{
				"required": true,
				"content": map[string]interface{}{
					"application/json": map[string]interface{}{
						"schema": map[string]string{"$ref": "#/components/schemas/PetCreateRequest"},
					},
				},
			},
			"responses": map[string]interface{}{
				"201": map[string]interface{}{"description": "ペット登録成功"},
				"400": map[string]interface{}{"description": "不正なリクエスト"},
				"401": map[string]interface{}{"description": "認証エラー"},
				"500": map[string]interface{}{"description": "サーバーエラー"},
			},
		},
	}

	paths["/api/pets/{id}"] = map[string]interface{}{
		"get": map[string]interface{}{
			"tags": []string{"Pets"},
			"summary": "ペット詳細取得",
			"parameters": []map[string]interface{}{
				{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "string"}, "description": "ペットID"},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "ペット詳細取得成功"},
				"404": map[string]interface{}{"description": "ペットが見つかりません"},
			},
		},
		"put": map[string]interface{}{
			"tags": []string{"Pets"},
			"summary": "ペット情報更新",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"parameters": []map[string]interface{}{
				{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "string"}},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "更新成功"},
				"401": map[string]interface{}{"description": "認証エラー"},
				"404": map[string]interface{}{"description": "ペットが見つかりません"},
			},
		},
		"delete": map[string]interface{}{
			"tags": []string{"Pets"},
			"summary": "ペット削除",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"parameters": []map[string]interface{}{
				{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "string"}},
			},
			"responses": map[string]interface{}{
				"204": map[string]interface{}{"description": "削除成功"},
				"401": map[string]interface{}{"description": "認証エラー"},
				"404": map[string]interface{}{"description": "ペットが見つかりません"},
			},
		},
	}

	// Pet schemas
	schemas["PetCreateRequest"] = map[string]interface{}{
		"type": "object",
		"required": []string{"name", "species", "breed", "age_years", "gender", "size"},
		"properties": map[string]interface{}{
			"name": map[string]string{"type": "string", "description": "ペット名", "example": "ポチ"},
			"species": map[string]interface{}{"type": "string", "description": "動物種別", "enum": []string{"dog", "cat", "bird", "rabbit", "hamster"}, "example": "dog"},
			"breed": map[string]string{"type": "string", "description": "品種", "example": "柴犬"},
			"age_years": map[string]interface{}{"type": "integer", "description": "年齢（年）", "minimum": 0, "example": 3},
			"age_months": map[string]interface{}{"type": "integer", "description": "追加月数 (0-11)", "minimum": 0, "maximum": 11, "example": 2},
			"is_estimated": map[string]interface{}{"type": "boolean", "description": "推定年齢フラグ", "example": false},
			"gender": map[string]interface{}{"type": "string", "description": "性別", "enum": []string{"male", "female", "unknown"}, "example": "male"},
			"size": map[string]interface{}{"type": "string", "description": "サイズ", "enum": []string{"small", "medium", "large", "extra_large"}, "example": "medium"},
			"color": map[string]string{"type": "string", "description": "毛色", "example": "茶色"},
			"personality": map[string]interface{}{"type": "array", "items": map[string]string{"type": "string"}, "description": "性格タグ", "example": []string{"活発", "人懐っこい"}},
			"medical_info": map[string]string{"$ref": "#/components/schemas/MedicalInfo"},
			"location": map[string]string{"type": "string", "description": "所在地座標 (lat,lng)", "example": "35.6762,139.6503"},
			"description": map[string]string{"type": "string", "description": "説明文", "example": "とても元気な柴犬です"},
		},
	}

	schemas["MedicalInfo"] = map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"vaccinated": map[string]interface{}{"type": "boolean", "description": "ワクチン接種済み", "example": true},
			"neutered": map[string]interface{}{"type": "boolean", "description": "去勢手術済み", "example": false},
			"health_issues": map[string]interface{}{"type": "array", "items": map[string]string{"type": "string"}, "description": "既往症", "example": []string{}},
			"last_checkup": map[string]string{"type": "string", "description": "最終検診日", "example": "2024-01-15"},
			"medications": map[string]interface{}{"type": "array", "items": map[string]string{"type": "string"}, "description": "服用薬", "example": []string{}},
		},
	}
}

func (d *DocsService) addAuthServicePaths(paths map[string]interface{}, schemas map[string]interface{}) {
	// Auth Service APIs
	paths["/api/auth/login"] = map[string]interface{}{
		"post": map[string]interface{}{
			"tags": []string{"Authentication"},
			"summary": "ユーザーログイン",
			"description": "メールアドレスとパスワードでログイン",
			"requestBody": map[string]interface{}{
				"required": true,
				"content": map[string]interface{}{
					"application/json": map[string]interface{}{
						"schema": map[string]string{"$ref": "#/components/schemas/LoginRequest"},
					},
				},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{
					"description": "ログイン成功",
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]string{"$ref": "#/components/schemas/LoginResponse"},
						},
					},
				},
				"401": map[string]interface{}{"description": "認証失敗"},
				"400": map[string]interface{}{"description": "不正なリクエスト"},
			},
		},
	}

	paths["/api/auth/register"] = map[string]interface{}{
		"post": map[string]interface{}{
			"tags": []string{"Authentication"},
			"summary": "ユーザー登録",
			"requestBody": map[string]interface{}{
				"required": true,
				"content": map[string]interface{}{
					"application/json": map[string]interface{}{
						"schema": map[string]string{"$ref": "#/components/schemas/RegisterRequest"},
					},
				},
			},
			"responses": map[string]interface{}{
				"201": map[string]interface{}{"description": "登録成功"},
				"400": map[string]interface{}{"description": "不正なリクエスト"},
				"409": map[string]interface{}{"description": "既に登録済み"},
			},
		},
	}

	paths["/api/auth/verify"] = map[string]interface{}{
		"get": map[string]interface{}{
			"tags": []string{"Authentication"},
			"summary": "トークン検証",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "有効なトークン"},
				"401": map[string]interface{}{"description": "無効なトークン"},
			},
		},
	}

	// Auth schemas
	schemas["LoginRequest"] = map[string]interface{}{
		"type": "object",
		"required": []string{"email", "password"},
		"properties": map[string]interface{}{
			"email": map[string]interface{}{"type": "string", "format": "email", "description": "メールアドレス", "example": "user@example.com"},
			"password": map[string]interface{}{"type": "string", "minLength": 6, "description": "パスワード（最僎6文字）", "example": "password123"},
		},
	}

	schemas["LoginResponse"] = map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"message": map[string]string{"type": "string", "example": "Login successful"},
			"user": map[string]string{"$ref": "#/components/schemas/User"},
			"tokens": map[string]string{"$ref": "#/components/schemas/AuthTokens"},
		},
	}

	schemas["RegisterRequest"] = map[string]interface{}{
		"type": "object",
		"required": []string{"email", "password", "name", "type"},
		"properties": map[string]interface{}{
			"email": map[string]interface{}{"type": "string", "format": "email", "description": "メールアドレス", "example": "user@example.com"},
			"password": map[string]interface{}{"type": "string", "minLength": 6, "description": "パスワード（最僎6文字）", "example": "password123"},
			"name": map[string]string{"type": "string", "description": "ユーザー名", "example": "山田太郎"},
			"type": map[string]interface{}{"type": "string", "description": "ユーザータイプ", "enum": []string{"adopter", "shelter", "individual"}, "example": "adopter"},
			"phone": map[string]string{"type": "string", "description": "電話番号", "example": "090-1234-5678"},
			"address": map[string]string{"type": "string", "description": "住所", "example": "東京都渋谷区"},
		},
	}

	schemas["AuthTokens"] = map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"access_token": map[string]string{"type": "string", "description": "JWTアクセストークン"},
			"refresh_token": map[string]string{"type": "string", "description": "リフレッシュトークン"},
			"expires_in": map[string]interface{}{"type": "integer", "description": "有効期限（秒）", "example": 3600},
		},
	}

	schemas["User"] = map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"id": map[string]string{"type": "string", "description": "ユーザーID"},
			"email": map[string]string{"type": "string", "description": "メールアドレス"},
			"name": map[string]string{"type": "string", "description": "ユーザー名"},
			"type": map[string]string{"type": "string", "description": "ユーザータイプ"},
			"phone": map[string]string{"type": "string", "description": "電話番号"},
			"address": map[string]string{"type": "string", "description": "住所"},
			"verified": map[string]string{"type": "boolean", "description": "メール認証状態"},
		},
	}
}

func (d *DocsService) addUserServicePaths(paths map[string]interface{}, schemas map[string]interface{}) {
	// User Service APIs
	paths["/api/users/profile"] = map[string]interface{}{
		"get": map[string]interface{}{
			"tags": []string{"Users"},
			"summary": "プロフィール取得",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "プロフィール取得成功"},
				"401": map[string]interface{}{"description": "認証エラー"},
			},
		},
		"put": map[string]interface{}{
			"tags": []string{"Users"},
			"summary": "プロフィール更新",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "更新成功"},
				"401": map[string]interface{}{"description": "認証エラー"},
			},
		},
	}
}

func (d *DocsService) addMatchServicePaths(paths map[string]interface{}, schemas map[string]interface{}) {
	// Match Service APIs
	paths["/api/matches"] = map[string]interface{}{
		"post": map[string]interface{}{
			"tags": []string{"Matching"},
			"summary": "ペットマッチング検索",
			"description": "ユーザーの条件に基づいてペットをマッチング",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"requestBody": map[string]interface{}{
				"required": true,
				"content": map[string]interface{}{
					"application/json": map[string]interface{}{
						"schema": map[string]string{"$ref": "#/components/schemas/MatchRequest"},
					},
				},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "マッチング結果"},
				"401": map[string]interface{}{"description": "認証エラー"},
				"400": map[string]interface{}{"description": "不正なリクエスト"},
			},
		},
	}

	paths["/api/matches/recommendations"] = map[string]interface{}{
		"get": map[string]interface{}{
			"tags": []string{"Matching"},
			"summary": "おすすめペット取得",
			"description": "ユーザーの履歴に基づくおすすめペット",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"parameters": []map[string]interface{}{
				{"name": "limit", "in": "query", "schema": map[string]interface{}{"type": "integer", "default": 10}},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "おすすめペット一覧"},
				"401": map[string]interface{}{"description": "認証エラー"},
			},
		},
	}

	paths["/api/matches/history"] = map[string]interface{}{
		"get": map[string]interface{}{
			"tags": []string{"Matching"},
			"summary": "マッチング履歴取得",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"parameters": []map[string]interface{}{
				{"name": "page", "in": "query", "schema": map[string]interface{}{"type": "integer", "default": 1}},
				{"name": "limit", "in": "query", "schema": map[string]interface{}{"type": "integer", "default": 20}},
				{"name": "status", "in": "query", "schema": map[string]string{"type": "string"}, "description": "pending, viewed, contacted, rejected"},
			},
			"responses": map[string]interface{}{
				"200": map[string]interface{}{"description": "マッチング履歴"},
				"401": map[string]interface{}{"description": "認証エラー"},
			},
		},
	}

	paths["/api/matches/favorites"] = map[string]interface{}{
		"post": map[string]interface{}{
			"tags": []string{"Matching"},
			"summary": "お気に入り追加",
			"security": []map[string]interface{}{{"BearerAuth": []string{}}},
			"requestBody": map[string]interface{}{
				"required": true,
				"content": map[string]interface{}{
					"application/json": map[string]interface{}{
						"schema": map[string]string{"$ref": "#/components/schemas/FavoriteRequest"},
					},
				},
			},
			"responses": map[string]interface{}{
				"201": map[string]interface{}{"description": "お気に入り追加成功"},
				"401": map[string]interface{}{"description": "認証エラー"},
			},
		},
	}

	// Match schemas
	schemas["MatchRequest"] = map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"species": map[string]interface{}{"type": "string", "description": "動物種別", "enum": []string{"dog", "cat", "bird", "rabbit", "hamster"}, "example": "dog"},
			"breed": map[string]string{"type": "string", "description": "品種", "example": "柴犬"},
			"age_min": map[string]interface{}{"type": "integer", "description": "最小年齢", "minimum": 0, "example": 1},
			"age_max": map[string]interface{}{"type": "integer", "description": "最大年齢", "minimum": 0, "example": 10},
			"gender": map[string]interface{}{"type": "string", "description": "性別", "enum": []string{"male", "female", "unknown"}, "example": "male"},
			"size": map[string]interface{}{"type": "string", "description": "サイズ", "enum": []string{"small", "medium", "large", "extra_large"}, "example": "medium"},
			"location": map[string]string{"type": "string", "description": "検索中心地点 (lat,lng)", "example": "35.6762,139.6503"},
			"max_radius": map[string]interface{}{"type": "integer", "description": "検索半径 (キロメートル)", "minimum": 1, "example": 50},
			"limit": map[string]interface{}{"type": "integer", "description": "取得件数", "minimum": 1, "maximum": 100, "default": 10, "example": 10},
		},
	}

	schemas["FavoriteRequest"] = map[string]interface{}{
		"type": "object",
		"required": []string{"pet_id"},
		"properties": map[string]interface{}{
			"pet_id": map[string]string{"type": "string", "description": "ペットID", "example": "123e4567-e89b-12d3-a456-426614174000"},
			"note": map[string]string{"type": "string", "description": "メモ", "example": "とても可愛いペットです"},
		},
	}
}
