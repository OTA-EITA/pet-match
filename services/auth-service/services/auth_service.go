package services

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/models"
	"github.com/petmatch/app/shared/utils"
)

type AuthService struct {
	userService *UserService
	cfg         *config.Config
}

func NewAuthService(userService *UserService, cfg *config.Config) *AuthService {
	return &AuthService{
		userService: userService,
		cfg:         cfg,
	}
}

// Register creates a new user account
func (s *AuthService) Register(req *models.UserRegisterRequest) (*models.User, *models.AuthTokens, error) {
	// Check if user already exists
	existingUser, err := s.userService.GetByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, nil, fmt.Errorf("user already exists with email: %s", req.Email)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %v", err)
	}

	// Create user
	user := models.NewUser(req.Email, req.Name, req.Type)
	user.Phone = req.Phone
	user.Address = req.Address

	// Create user with hashed password
	createdUser, err := s.userService.Create(user, string(hashedPassword))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %v", err)
	}

	// Generate tokens
	tokens, err := s.generateTokens(createdUser.ID, createdUser.Email, createdUser.Type)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %v", err)
	}

	// Store refresh token
	err = s.userService.StoreRefreshToken(createdUser.ID, tokens.RefreshToken)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to store refresh token: %v", err)
	}

	return createdUser, tokens, nil
}

// Login authenticates a user
func (s *AuthService) Login(req *models.UserLoginRequest) (*models.User, *models.AuthTokens, error) {
	// Get user by email
	user, err := s.userService.GetByEmail(req.Email)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	// Get stored password hash
	storedHash, err := s.userService.GetPasswordHash(user.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(req.Password))
	if err != nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	// Generate tokens
	tokens, err := s.generateTokens(user.ID, user.Email, user.Type)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %v", err)
	}

	// Store refresh token
	err = s.userService.StoreRefreshToken(user.ID, tokens.RefreshToken)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to store refresh token: %v", err)
	}

	return user, tokens, nil
}

// RefreshToken generates new tokens using refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*models.AuthTokens, error) {
	// Validate refresh token
	userID, err := utils.ValidateRefreshToken(refreshToken, s.cfg)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Check if refresh token exists in storage
	storedToken, err := s.userService.GetRefreshToken(userID)
	if err != nil || storedToken != refreshToken {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Get user info
	user, err := s.userService.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Generate new tokens
	tokens, err := s.generateTokens(user.ID, user.Email, user.Type)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %v", err)
	}

	// Store new refresh token
	err = s.userService.StoreRefreshToken(user.ID, tokens.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %v", err)
	}

	return tokens, nil
}

// Logout invalidates user session
func (s *AuthService) Logout(userID string) error {
	return s.userService.DeleteRefreshToken(userID)
}

// GetProfile returns user profile
func (s *AuthService) GetProfile(userID string) (*models.User, error) {
	return s.userService.GetByID(userID)
}

// UpdateProfile updates user profile information
func (s *AuthService) UpdateProfile(userID string, req *models.UpdateProfileRequest) (*models.User, error) {
	user, err := s.userService.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Address != "" {
		user.Address = req.Address
	}

	err = s.userService.Update(user)
	if err != nil {
		return nil, fmt.Errorf("failed to update profile: %v", err)
	}

	return user, nil
}

// UpdatePassword changes user password
func (s *AuthService) UpdatePassword(userID string, req *models.UpdatePasswordRequest) error {
	storedHash, err := s.userService.GetPasswordHash(userID)
	if err != nil {
		return fmt.Errorf("failed to get current password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(req.CurrentPassword))
	if err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %v", err)
	}

	err = s.userService.UpdatePassword(userID, string(newHash))
	if err != nil {
		return fmt.Errorf("failed to update password: %v", err)
	}

	return nil
}

// generateTokens creates access and refresh tokens
func (s *AuthService) generateTokens(userID, email, userType string) (*models.AuthTokens, error) {
	accessToken, err := utils.GenerateAccessToken(userID, email, userType, s.cfg)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(userID, s.cfg)
	if err != nil {
		return nil, err
	}

	return &models.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    s.cfg.JWTAccessTTL,
	}, nil
}
