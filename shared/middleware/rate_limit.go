package middleware

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/petmatch/app/shared/errors"
	"github.com/petmatch/app/shared/logger"
)

// RateLimitConfig defines rate limiting configuration
type RateLimitConfig struct {
	RequestsPerMinute int
	BurstSize         int
	KeyPrefix         string
	RedisClient       *redis.Client
}

// InMemoryRateLimiter implements a simple in-memory rate limiter using token bucket algorithm
type InMemoryRateLimiter struct {
	mu      sync.RWMutex
	buckets map[string]*tokenBucket
	config  RateLimitConfig
}

type tokenBucket struct {
	tokens         float64
	lastRefillTime time.Time
}

// NewInMemoryRateLimiter creates a new in-memory rate limiter
func NewInMemoryRateLimiter(config RateLimitConfig) *InMemoryRateLimiter {
	limiter := &InMemoryRateLimiter{
		buckets: make(map[string]*tokenBucket),
		config:  config,
	}

	// Start cleanup goroutine to remove old buckets
	go limiter.cleanup()

	return limiter
}

// Allow checks if a request is allowed and consumes a token if so
func (r *InMemoryRateLimiter) Allow(key string) (bool, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	bucket, exists := r.buckets[key]
	if !exists {
		bucket = &tokenBucket{
			tokens:         float64(r.config.BurstSize),
			lastRefillTime: time.Now(),
		}
		r.buckets[key] = bucket
	}

	// Refill tokens based on time elapsed
	now := time.Now()
	elapsed := now.Sub(bucket.lastRefillTime).Seconds()
	tokensToAdd := elapsed * (float64(r.config.RequestsPerMinute) / 60.0)
	bucket.tokens = min(bucket.tokens+tokensToAdd, float64(r.config.BurstSize))
	bucket.lastRefillTime = now

	// Check if we have tokens available
	if bucket.tokens >= 1.0 {
		bucket.tokens -= 1.0
		return true, nil
	}

	return false, nil
}

// cleanup removes old buckets periodically
func (r *InMemoryRateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		r.mu.Lock()
		now := time.Now()
		for key, bucket := range r.buckets {
			if now.Sub(bucket.lastRefillTime) > 10*time.Minute {
				delete(r.buckets, key)
			}
		}
		r.mu.Unlock()
	}
}

// RedisRateLimiter implements rate limiting using Redis
type RedisRateLimiter struct {
	config RateLimitConfig
}

// NewRedisRateLimiter creates a new Redis-based rate limiter
func NewRedisRateLimiter(config RateLimitConfig) *RedisRateLimiter {
	return &RedisRateLimiter{config: config}
}

// Allow checks if a request is allowed using Redis
func (r *RedisRateLimiter) Allow(key string) (bool, error) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%s", r.config.KeyPrefix, key)

	// Use sliding window algorithm with Redis
	now := time.Now().Unix()
	windowStart := now - 60 // 1 minute window

	pipe := r.config.RedisClient.Pipeline()

	// Remove old entries
	pipe.ZRemRangeByScore(ctx, redisKey, "0", fmt.Sprintf("%d", windowStart))

	// Count current requests
	pipe.ZCard(ctx, redisKey)

	// Add current request
	pipe.ZAdd(ctx, redisKey, &redis.Z{
		Score:  float64(now),
		Member: fmt.Sprintf("%d", time.Now().UnixNano()),
	})

	// Set expiration
	pipe.Expire(ctx, redisKey, 2*time.Minute)

	results, err := pipe.Exec(ctx)
	if err != nil {
		return false, err
	}

	// Get count from results
	count := results[1].(*redis.IntCmd).Val()

	return count < int64(r.config.RequestsPerMinute), nil
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get client identifier (IP address or user ID if authenticated)
		clientID := c.ClientIP()
		if userID := c.GetString("user_id"); userID != "" {
			clientID = userID
		}

		var allowed bool
		var err error

		// Check rate limit based on limiter type
		switch lim := limiter.(type) {
		case *InMemoryRateLimiter:
			allowed, err = lim.Allow(clientID)
		case *RedisRateLimiter:
			allowed, err = lim.Allow(clientID)
		default:
			logger.Error("Unknown rate limiter type")
			c.Next()
			return
		}

		if err != nil {
			logger.Error("Rate limit check failed", logger.Err(err))
			c.Next()
			return
		}

		if !allowed {
			logger.Warn("Rate limit exceeded",
				logger.String("client_id", clientID),
				logger.String("path", c.Request.URL.Path),
			)

			requestID := GetRequestID(c)
			appErr := errors.NewAppError(
				errors.ErrCodeRateLimitExceeded,
				"レート制限を超えました。しばらく時間をおいてから再試行してください。",
			).WithRequestID(requestID)

			c.Header("X-RateLimit-Remaining", "0")
			c.Header("Retry-After", "60")
			c.JSON(http.StatusTooManyRequests, appErr)
			c.Abort()
			return
		}

		c.Next()
	}
}

// Helper function to get minimum of two floats
func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
