package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// サーバー設定
	Port    string
	AppEnv  string
	Version string

	// JWT設定
	JWTSecret           string
	JWTExpirationHours  int
	JWTRefreshHours     int

	// サービスURL
	PetServiceURL   string
	UserServiceURL  string
	AuthServiceURL  string
	MatchServiceURL string
	ChatServiceURL  string
	FileServiceURL  string

	// CORS設定
	CORSAllowedOrigins []string
	CORSAllowedMethods []string
	CORSAllowedHeaders []string

	// レート制限
	RateLimitEnabled bool
	RateLimitRPM     int

	// ログ設定
	LogLevel string
	LogJSON  bool
}

func LoadConfig() *Config {
	// .env ファイルを読み込み（エラーが出ても続行）
	if err := godotenv.Load(".env"); err != nil {
		// .env.development も試行
		if err := godotenv.Load(".env.development"); err != nil {
			log.Printf("Warning: No .env file found, using environment variables or defaults")
		}
	}

	config := &Config{
		// デフォルト値
		Port:               getEnv("PORT", "8080"),
		AppEnv:             getEnv("APP_ENV", "development"),
		Version:            getEnv("APP_VERSION", "1.0.0"),

		JWTSecret:          getEnv("JWT_SECRET", "your-secret-key-change-this-in-production"),
		JWTExpirationHours: getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		JWTRefreshHours:    getEnvAsInt("JWT_REFRESH_HOURS", 168), // 7 days

		PetServiceURL:   getEnv("PET_SERVICE_URL", "http://localhost:8083"),
		UserServiceURL:  getEnv("USER_SERVICE_URL", "http://localhost:8082"),
		AuthServiceURL:  getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		MatchServiceURL: getEnv("MATCH_SERVICE_URL", "http://localhost:8084"),
		ChatServiceURL:  getEnv("CHAT_SERVICE_URL", "http://localhost:8085"),
		FileServiceURL:  getEnv("FILE_SERVICE_URL", "http://localhost:8087"),

		CORSAllowedOrigins: []string{
			getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"),
		},
		CORSAllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		CORSAllowedHeaders: []string{
			"Content-Type",
			"Content-Length", 
			"Accept-Encoding",
			"X-CSRF-Token",
			"Authorization",
			"accept",
			"origin",
			"Cache-Control",
			"X-Requested-With",
		},

		RateLimitEnabled: getEnvAsBool("RATE_LIMIT_ENABLED", false),
		RateLimitRPM:     getEnvAsInt("RATE_LIMIT_RPM", 100),

		LogLevel: getEnv("LOG_LEVEL", "info"),
		LogJSON:  getEnvAsBool("LOG_JSON", false),
	}

	// 本番環境での設定検証
	if config.AppEnv == "production" {
		validateProductionConfig(config)
	}

	log.Printf("Loaded configuration: env=%s, port=%s", config.AppEnv, config.Port)
	return config
}

func validateProductionConfig(config *Config) {
	// 本番環境で必須の設定をチェック
	if config.JWTSecret == "your-secret-key-change-this-in-production" {
		log.Fatal("JWT_SECRET must be set in production environment")
	}

	if len(config.JWTSecret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters long in production")
	}

	log.Println("Production configuration validated successfully")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
		log.Printf("Warning: invalid integer value for %s: %s, using default %d", key, valueStr, defaultValue)
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.ParseBool(valueStr); err == nil {
			return value
		}
		log.Printf("Warning: invalid boolean value for %s: %s, using default %t", key, valueStr, defaultValue)
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := time.ParseDuration(valueStr); err == nil {
			return value
		}
		log.Printf("Warning: invalid duration value for %s: %s, using default %s", key, valueStr, defaultValue.String())
	}
	return defaultValue
}

// IsProduction - 本番環境かどうか
func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

// IsDevelopment - 開発環境かどうか
func (c *Config) IsDevelopment() bool {
	return c.AppEnv == "development"
}

// IsTest - テスト環境かどうか
func (c *Config) IsTest() bool {
	return c.AppEnv == "test"
}
