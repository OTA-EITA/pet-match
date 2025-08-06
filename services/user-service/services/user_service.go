package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"

	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/models"
)

type UserService struct {
	redisClient *redis.Client
	cfg         *config.Config
	ctx         context.Context
}

func NewUserService(redisClient *redis.Client, cfg *config.Config) *UserService {
	return &UserService{
		redisClient: redisClient,
		cfg:         cfg,
		ctx:         context.Background(),
	}
}

// GetByID retrieves user by ID
func (s *UserService) GetByID(userID string) (*models.User, error) {
	userKey := fmt.Sprintf("user:%s", userID)
	userData, err := s.redisClient.Get(s.ctx, userKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %v", err)
	}

	var user models.User
	err = json.Unmarshal([]byte(userData), &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user data: %v", err)
	}

	return &user, nil
}

// GetByEmail retrieves user by email
func (s *UserService) GetByEmail(email string) (*models.User, error) {
	emailKey := fmt.Sprintf("user:email:%s", email)
	userID, err := s.redisClient.Get(s.ctx, emailKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user ID: %v", err)
	}

	return s.GetByID(userID)
}

// Update updates user information
func (s *UserService) Update(user *models.User) error {
	user.UpdatedAt = time.Now()
	
	userKey := fmt.Sprintf("user:%s", user.ID)
	userData, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user data: %v", err)
	}

	err = s.redisClient.Set(s.ctx, userKey, userData, 0).Err()
	if err != nil {
		return fmt.Errorf("failed to update user: %v", err)
	}

	return nil
}

// Delete deletes a user
func (s *UserService) Delete(userID string) error {
	// Get user first to get email
	user, err := s.GetByID(userID)
	if err != nil {
		return err
	}

	// Delete user data
	userKey := fmt.Sprintf("user:%s", userID)
	err = s.redisClient.Del(s.ctx, userKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete user: %v", err)
	}

	// Delete email mapping
	emailKey := fmt.Sprintf("user:email:%s", user.Email)
	err = s.redisClient.Del(s.ctx, emailKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete email mapping: %v", err)
	}

	// Delete password
	passwordKey := fmt.Sprintf("user:password:%s", userID)
	err = s.redisClient.Del(s.ctx, passwordKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete password: %v", err)
	}

	// Delete refresh token
	refreshKey := fmt.Sprintf("user:refresh:%s", userID)
	s.redisClient.Del(s.ctx, refreshKey)

	return nil
}

// List returns paginated list of users
func (s *UserService) List(offset, limit int) ([]*models.User, error) {
	// Use SCAN to find all user keys
	pattern := "user:*"
	iter := s.redisClient.Scan(s.ctx, 0, pattern, int64(limit*2)).Iterator()
	
	var users []*models.User
	count := 0
	skipped := 0
	
	for iter.Next(s.ctx) {
		key := iter.Val()
		
		// Skip email and password keys, only process user data keys
		if len(key) > 5 && key[:5] == "user:" && 
		   key[5:10] != "email" && key[5:13] != "password" && 
		   key[5:12] != "refresh" {
			
			if skipped < offset {
				skipped++
				continue
			}
			
			if count >= limit {
				break
			}
			
			userData, err := s.redisClient.Get(s.ctx, key).Result()
			if err != nil {
				continue
			}
			
			var user models.User
			if err := json.Unmarshal([]byte(userData), &user); err != nil {
				continue
			}
			
			users = append(users, &user)
			count++
		}
	}
	
	if err := iter.Err(); err != nil {
		return nil, fmt.Errorf("failed to scan users: %v", err)
	}
	
	return users, nil
}
