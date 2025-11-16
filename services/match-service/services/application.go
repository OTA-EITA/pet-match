package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/petmatch/app/services/match-service/models"
	"github.com/petmatch/app/shared/config"
)

type ApplicationService struct {
	redis *redis.Client
	cfg   *config.Config
}

func NewApplicationService(redisClient *redis.Client, cfg *config.Config) *ApplicationService {
	return &ApplicationService{
		redis: redisClient,
		cfg:   cfg,
	}
}

// CreateApplication creates a new application
func (s *ApplicationService) CreateApplication(ctx context.Context, userID string, req *models.ApplicationRequest) (*models.Application, error) {
	// Validate cat exists and is available
	cat, err := s.getCatByID(ctx, req.CatID)
	if err != nil {
		return nil, fmt.Errorf("cat not found: %v", err)
	}

	// Check if cat is available
	if available, ok := cat["available"].(bool); ok && !available {
		return nil, fmt.Errorf("cat is not available for adoption")
	}

	// Check if user already applied for this cat
	existingKey := fmt.Sprintf("user:applications:%s:%s", userID, req.CatID)
	exists, err := s.redis.Exists(ctx, existingKey).Result()
	if err == nil && exists > 0 {
		return nil, fmt.Errorf("you have already applied for this cat")
	}

	// Create application
	application := &models.Application{
		ID:             uuid.New().String(),
		UserID:         userID,
		CatID:          req.CatID,
		OrganizationID: req.OrganizationID,
		Status:         "pending",
		Message:        req.Message,
		UserInfo:       req.UserInfo,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Save to Redis
	if err := s.saveApplication(ctx, application); err != nil {
		return nil, err
	}

	// Add to user's application list
	userListKey := fmt.Sprintf("user:applications:list:%s", userID)
	if err := s.redis.LPush(ctx, userListKey, application.ID).Err(); err != nil {
		return nil, err
	}

	// Add to organization's application list
	orgListKey := fmt.Sprintf("organization:applications:list:%s", req.OrganizationID)
	if err := s.redis.LPush(ctx, orgListKey, application.ID).Err(); err != nil {
		return nil, err
	}

	// Mark that user applied for this cat
	if err := s.redis.Set(ctx, existingKey, application.ID, 0).Err(); err != nil {
		return nil, err
	}

	return application, nil
}

// GetApplication retrieves a single application by ID
func (s *ApplicationService) GetApplication(ctx context.Context, applicationID, userID string) (*models.ApplicationWithDetails, error) {
	// Get application
	application, err := s.getApplicationByID(ctx, applicationID)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if application.UserID != userID {
		return nil, fmt.Errorf("unauthorized: application does not belong to user")
	}

	// Get cat details
	cat, err := s.getCatByID(ctx, application.CatID)
	if err != nil {
		return nil, err
	}

	// Get organization details
	org, err := s.getOrganizationByID(ctx, application.OrganizationID)
	if err != nil {
		return nil, err
	}

	return &models.ApplicationWithDetails{
		Application:  application,
		Cat:          cat,
		Organization: org,
	}, nil
}

// GetUserApplications retrieves all applications for a user with pagination
func (s *ApplicationService) GetUserApplications(ctx context.Context, userID string, page, limit int, status string) (*models.ApplicationResponse, error) {
	userListKey := fmt.Sprintf("user:applications:list:%s", userID)

	// Calculate pagination
	start := (page - 1) * limit
	end := start + limit - 1

	// Get application IDs
	applicationIDs, err := s.redis.LRange(ctx, userListKey, int64(start), int64(end)).Result()
	if err != nil {
		return nil, err
	}

	// Get total count
	totalCount, err := s.redis.LLen(ctx, userListKey).Result()
	if err != nil {
		return nil, err
	}

	applications := make([]models.ApplicationWithDetails, 0)

	for _, appID := range applicationIDs {
		// Get application
		app, err := s.getApplicationByID(ctx, appID)
		if err != nil {
			continue // Skip missing applications
		}

		// Filter by status if specified
		if status != "" && app.Status != status {
			continue
		}

		// Get cat details
		cat, err := s.getCatByID(ctx, app.CatID)
		if err != nil {
			continue
		}

		// Get organization details
		org, err := s.getOrganizationByID(ctx, app.OrganizationID)
		if err != nil {
			org = map[string]interface{}{"id": app.OrganizationID, "name": "Unknown"}
		}

		applications = append(applications, models.ApplicationWithDetails{
			Application:  app,
			Cat:          cat,
			Organization: org,
		})
	}

	return &models.ApplicationResponse{
		Applications: applications,
		Total:        int(totalCount),
		Page:         page,
		Limit:        limit,
	}, nil
}

// UpdateApplicationStatus updates the status of an application
func (s *ApplicationService) UpdateApplicationStatus(ctx context.Context, applicationID, userID string, req *models.UpdateApplicationStatusRequest) error {
	// Get application
	application, err := s.getApplicationByID(ctx, applicationID)
	if err != nil {
		return err
	}

	// Verify ownership
	if application.UserID != userID {
		return fmt.Errorf("unauthorized: application does not belong to user")
	}

	// Update status (only user can cancel)
	if req.Status != "cancelled" {
		return fmt.Errorf("users can only cancel applications")
	}

	application.Status = req.Status
	application.UpdatedAt = time.Now()

	// Save updated application
	if err := s.saveApplication(ctx, application); err != nil {
		return err
	}

	return nil
}

// CancelApplication cancels an application
func (s *ApplicationService) CancelApplication(ctx context.Context, applicationID, userID string) error {
	return s.UpdateApplicationStatus(ctx, applicationID, userID, &models.UpdateApplicationStatusRequest{
		Status: "cancelled",
	})
}

// GetApplicationStatusCounts gets counts of applications by status for a user
func (s *ApplicationService) GetApplicationStatusCounts(ctx context.Context, userID string) (*models.ApplicationStatusCounts, error) {
	userListKey := fmt.Sprintf("user:applications:list:%s", userID)

	// Get all application IDs
	applicationIDs, err := s.redis.LRange(ctx, userListKey, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	counts := &models.ApplicationStatusCounts{}

	for _, appID := range applicationIDs {
		app, err := s.getApplicationByID(ctx, appID)
		if err != nil {
			continue
		}

		switch app.Status {
		case "pending":
			counts.Pending++
		case "approved":
			counts.Approved++
		case "rejected":
			counts.Rejected++
		case "interview_scheduled":
			counts.InterviewScheduled++
		case "trial":
			counts.Trial++
		case "adopted":
			counts.Adopted++
		case "cancelled":
			counts.Cancelled++
		}
		counts.Total++
	}

	return counts, nil
}

// Helper methods

func (s *ApplicationService) saveApplication(ctx context.Context, application *models.Application) error {
	key := fmt.Sprintf("application:%s", application.ID)
	data, err := json.Marshal(application)
	if err != nil {
		return err
	}

	return s.redis.Set(ctx, key, data, 0).Err()
}

func (s *ApplicationService) getApplicationByID(ctx context.Context, applicationID string) (*models.Application, error) {
	key := fmt.Sprintf("application:%s", applicationID)
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("application not found")
		}
		return nil, err
	}

	var application models.Application
	if err := json.Unmarshal([]byte(data), &application); err != nil {
		return nil, err
	}

	return &application, nil
}

func (s *ApplicationService) getCatByID(ctx context.Context, catID string) (map[string]interface{}, error) {
	key := fmt.Sprintf("cat:%s", catID)
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var cat map[string]interface{}
	if err := json.Unmarshal([]byte(data), &cat); err != nil {
		return nil, err
	}

	return cat, nil
}

func (s *ApplicationService) getOrganizationByID(ctx context.Context, orgID string) (map[string]interface{}, error) {
	key := fmt.Sprintf("organization:%s", orgID)
	data, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var org map[string]interface{}
	if err := json.Unmarshal([]byte(data), &org); err != nil {
		return nil, err
	}

	return org, nil
}
