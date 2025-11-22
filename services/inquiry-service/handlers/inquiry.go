package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/petmatch/app/services/inquiry-service/services"
	"github.com/petmatch/app/shared/config"
	"github.com/petmatch/app/shared/errors"
	"github.com/petmatch/app/shared/middleware"
	"github.com/petmatch/app/shared/models"
)

type InquiryHandler struct {
	inquiryService *services.InquiryService
	cfg            *config.Config
}

func NewInquiryHandler(inquiryService *services.InquiryService, cfg *config.Config) *InquiryHandler {
	return &InquiryHandler{
		inquiryService: inquiryService,
		cfg:            cfg,
	}
}

// CreateInquiry handles inquiry creation
// @Summary      問い合わせ作成
// @Description  猫に対する問い合わせを作成します
// @Tags         inquiry
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        request body models.CreateInquiryRequest true "問い合わせ情報"
// @Success      201 {object} map[string]interface{} "Inquiry created successfully"
// @Failure      400 {object} errors.AppError "Invalid request body"
// @Failure      401 {object} errors.AppError "Unauthorized"
// @Failure      500 {object} errors.AppError "Internal server error"
// @Router       /inquiries [post]
func (h *InquiryHandler) CreateInquiry(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	var req models.CreateInquiryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		if validationErrs, ok := err.(validator.ValidationErrors); ok {
			fieldErrors := make(map[string]string)
			for _, fieldErr := range validationErrs {
				fieldErrors[fieldErr.Field()] = getValidationErrorMessage(fieldErr)
			}
			middleware.RespondWithValidationError(c, fieldErrors)
			return
		}
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails(err.Error()))
		return
	}

	// Validate phone if contact method is phone
	if req.ContactMethod == "phone" && req.Phone == "" {
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails("Phone number is required for phone contact method"))
		return
	}

	inquiry := models.NewInquiry(userID, req.PetID, req.Message, req.Type, req.ContactMethod, req.Phone)
	createdInquiry, err := h.inquiryService.Create(inquiry)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails(err.Error()))
		return
	}

	middleware.RespondWithSuccess(c, http.StatusCreated, gin.H{
		"message": "Inquiry created successfully",
		"inquiry": createdInquiry,
	})
}

// GetUserInquiries retrieves all inquiries for the authenticated user
// @Summary      問い合わせ一覧取得
// @Description  認証済みユーザーの問い合わせ一覧を取得します
// @Tags         inquiry
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Success      200 {object} map[string]interface{} "Inquiries retrieved successfully"
// @Failure      401 {object} errors.AppError "Unauthorized"
// @Failure      500 {object} errors.AppError "Internal server error"
// @Router       /inquiries [get]
func (h *InquiryHandler) GetUserInquiries(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	inquiries, err := h.inquiryService.GetByUserID(userID)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails(err.Error()))
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"inquiries": inquiries,
	})
}

// getValidationErrorMessage returns a user-friendly error message for validation errors
func getValidationErrorMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "uuid":
		return "Invalid UUID format"
	case "min":
		return "Must be at least " + fe.Param() + " characters"
	case "max":
		return "Must be at most " + fe.Param() + " characters"
	case "phone_jp":
		return "Invalid phone number format"
	case "sanitized":
		return "Contains invalid characters"
	case "oneof":
		return "Must be one of: " + fe.Param()
	default:
		return "Invalid value"
	}
}
