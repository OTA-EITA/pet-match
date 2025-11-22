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

type InquiryService struct {
	redisClient *redis.Client
	cfg         *config.Config
	ctx         context.Context
}

func NewInquiryService(redisClient *redis.Client, cfg *config.Config) *InquiryService {
	return &InquiryService{
		redisClient: redisClient,
		cfg:         cfg,
		ctx:         context.Background(),
	}
}

// Create creates a new inquiry
func (s *InquiryService) Create(inquiry *models.Inquiry) (*models.Inquiry, error) {
	inquiryKey := fmt.Sprintf("inquiry:%s", inquiry.ID)
	inquiryData, err := json.Marshal(inquiry)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal inquiry data: %v", err)
	}

	err = s.redisClient.Set(s.ctx, inquiryKey, inquiryData, 0).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to store inquiry: %v", err)
	}

	// Add to user's inquiry list
	userInquiriesKey := fmt.Sprintf("user:inquiries:%s", inquiry.UserID)
	err = s.redisClient.LPush(s.ctx, userInquiriesKey, inquiry.ID).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to add inquiry to user list: %v", err)
	}

	// Add to pet's inquiry list
	petInquiriesKey := fmt.Sprintf("pet:inquiries:%s", inquiry.PetID)
	err = s.redisClient.LPush(s.ctx, petInquiriesKey, inquiry.ID).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to add inquiry to pet list: %v", err)
	}

	return inquiry, nil
}

// GetByID retrieves inquiry by ID
func (s *InquiryService) GetByID(inquiryID string) (*models.Inquiry, error) {
	inquiryKey := fmt.Sprintf("inquiry:%s", inquiryID)
	inquiryData, err := s.redisClient.Get(s.ctx, inquiryKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("inquiry not found")
		}
		return nil, fmt.Errorf("failed to get inquiry: %v", err)
	}

	var inquiry models.Inquiry
	err = json.Unmarshal([]byte(inquiryData), &inquiry)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal inquiry data: %v", err)
	}

	return &inquiry, nil
}

// GetByUserID retrieves all inquiries for a user
func (s *InquiryService) GetByUserID(userID string) ([]*models.Inquiry, error) {
	userInquiriesKey := fmt.Sprintf("user:inquiries:%s", userID)
	inquiryIDs, err := s.redisClient.LRange(s.ctx, userInquiriesKey, 0, -1).Result()
	if err != nil {
		if err == redis.Nil {
			return []*models.Inquiry{}, nil
		}
		return nil, fmt.Errorf("failed to get user inquiries: %v", err)
	}

	var inquiries []*models.Inquiry
	for _, id := range inquiryIDs {
		inquiry, err := s.GetByID(id)
		if err != nil {
			continue
		}
		inquiries = append(inquiries, inquiry)
	}

	return inquiries, nil
}

// Update updates inquiry information
func (s *InquiryService) Update(inquiry *models.Inquiry) error {
	inquiry.UpdatedAt = time.Now()

	inquiryKey := fmt.Sprintf("inquiry:%s", inquiry.ID)
	inquiryData, err := json.Marshal(inquiry)
	if err != nil {
		return fmt.Errorf("failed to marshal inquiry data: %v", err)
	}

	err = s.redisClient.Set(s.ctx, inquiryKey, inquiryData, 0).Err()
	if err != nil {
		return fmt.Errorf("failed to update inquiry: %v", err)
	}

	return nil
}
