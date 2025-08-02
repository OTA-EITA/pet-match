// Package config provides application configuration management.
// It handles loading configuration from environment variables and .env files.
package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

const (
	// DefaultJWTAccessTTL is the default JWT access token TTL in seconds (15 minutes).
	DefaultJWTAccessTTL = 900
	// DefaultJWTRefreshTTL is the default JWT refresh token TTL in seconds (7 days).
	DefaultJWTRefreshTTL = 604800
)

type Config struct {
	// Server
	Port string
	Env  string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// JWT
	JWTAccessSecret  string
	JWTRefreshSecret string
	JWTAccessTTL     int
	JWTRefreshTTL    int

	// Services
	AuthServiceURL   string
	UserServiceURL   string
	PetServiceURL    string
	MatchServiceURL  string
	ChatServiceURL   string
	NotifyServiceURL string
	FileServiceURL   string

	// External
	MinIOEndpoint    string
	MinIOAccessKey   string
	MinIOSecretKey   string
	FCMServerKey     string
	GoogleMapsAPIKey string
}

func Load() *Config {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		// Server
		Port: getEnv("PORT", "8080"),
		Env:  getEnv("APP_ENV", "development"),

		// Redis
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		// JWT
		JWTAccessSecret:  getEnv("JWT_ACCESS_SECRET", "access-secret-key"),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", "refresh-secret-key"),
		JWTAccessTTL:     getEnvAsInt("JWT_ACCESS_TTL", DefaultJWTAccessTTL),
		JWTRefreshTTL:    getEnvAsInt("JWT_REFRESH_TTL", DefaultJWTRefreshTTL),

		// Services
		AuthServiceURL:   getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
		UserServiceURL:   getEnv("USER_SERVICE_URL", "http://localhost:8082"),
		PetServiceURL:    getEnv("PET_SERVICE_URL", "http://localhost:8083"),
		MatchServiceURL:  getEnv("MATCH_SERVICE_URL", "http://localhost:8084"),
		ChatServiceURL:   getEnv("CHAT_SERVICE_URL", "http://localhost:8085"),
		NotifyServiceURL: getEnv("NOTIFY_SERVICE_URL", "http://localhost:8086"),
		FileServiceURL:   getEnv("FILE_SERVICE_URL", "http://localhost:8087"),

		// External
		MinIOEndpoint:    getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey:   getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinIOSecretKey:   getEnv("MINIO_SECRET_KEY", "minioadmin"),
		FCMServerKey:     getEnv("FCM_SERVER_KEY", ""),
		GoogleMapsAPIKey: getEnv("GOOGLE_MAPS_API_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(name string, defaultVal int) int {
	valueStr := getEnv(name, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultVal
}
