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
	sharedvalidator "github.com/petmatch/app/shared/validator"
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
				fieldErrors[fieldErr.Field()] = sharedvalidator.GetValidationErrorMessage(fieldErr)
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

	// Get pet owner ID from X-Pet-Owner-ID header (set by api-gateway after fetching pet info)
	// For now, we'll use a placeholder - in production, api-gateway should look up the pet and set this
	petOwnerID := c.GetHeader("X-Pet-Owner-ID")

	inquiry := models.NewInquiry(userID, req.PetID, petOwnerID, req.Message, req.Type, req.ContactMethod, req.Phone)
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

// GetReceivedInquiries retrieves all received inquiries for a pet owner
// @Summary      受信問い合わせ一覧取得
// @Description  ペットオーナー（シェルター/個人）が受信した問い合わせ一覧を取得します
// @Tags         inquiry
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Success      200 {object} map[string]interface{} "Inquiries retrieved successfully"
// @Failure      401 {object} errors.AppError "Unauthorized"
// @Failure      500 {object} errors.AppError "Internal server error"
// @Router       /inquiries/received [get]
func (h *InquiryHandler) GetReceivedInquiries(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	inquiries, err := h.inquiryService.GetByOwnerID(userID)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails(err.Error()))
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"inquiries": inquiries,
	})
}

// UpdateInquiryStatus updates the status of an inquiry
// @Summary      問い合わせステータス更新
// @Description  問い合わせのステータスを更新します
// @Tags         inquiry
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id path string true "問い合わせID"
// @Param        request body models.UpdateInquiryStatusRequest true "ステータス情報"
// @Success      200 {object} map[string]interface{} "Status updated successfully"
// @Failure      400 {object} errors.AppError "Invalid request body"
// @Failure      401 {object} errors.AppError "Unauthorized"
// @Failure      403 {object} errors.AppError "Forbidden"
// @Failure      404 {object} errors.AppError "Inquiry not found"
// @Failure      500 {object} errors.AppError "Internal server error"
// @Router       /inquiries/{id}/status [put]
func (h *InquiryHandler) UpdateInquiryStatus(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	inquiryID := c.Param("id")
	if inquiryID == "" {
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails("Inquiry ID is required"))
		return
	}

	// Get the inquiry to verify ownership
	inquiry, err := h.inquiryService.GetByID(inquiryID)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrNotFound.WithDetails("Inquiry not found"))
		return
	}

	// Verify the user is the pet owner
	if inquiry.PetOwnerID != userID {
		middleware.AbortWithError(c, errors.ErrForbidden.WithDetails("Not authorized to update this inquiry"))
		return
	}

	var req models.UpdateInquiryStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		if validationErrs, ok := err.(validator.ValidationErrors); ok {
			fieldErrors := make(map[string]string)
			for _, fieldErr := range validationErrs {
				fieldErrors[fieldErr.Field()] = sharedvalidator.GetValidationErrorMessage(fieldErr)
			}
			middleware.RespondWithValidationError(c, fieldErrors)
			return
		}
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails(err.Error()))
		return
	}

	updatedInquiry, err := h.inquiryService.UpdateStatus(inquiryID, req.Status)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails(err.Error()))
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"message": "Status updated successfully",
		"inquiry": updatedInquiry,
	})
}

// ReplyToInquiry adds a reply to an inquiry
// @Summary      問い合わせ返信
// @Description  問い合わせに返信します
// @Tags         inquiry
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id path string true "問い合わせID"
// @Param        request body models.ReplyInquiryRequest true "返信内容"
// @Success      200 {object} map[string]interface{} "Reply added successfully"
// @Failure      400 {object} errors.AppError "Invalid request body"
// @Failure      401 {object} errors.AppError "Unauthorized"
// @Failure      403 {object} errors.AppError "Forbidden"
// @Failure      404 {object} errors.AppError "Inquiry not found"
// @Failure      500 {object} errors.AppError "Internal server error"
// @Router       /inquiries/{id}/reply [post]
func (h *InquiryHandler) ReplyToInquiry(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	inquiryID := c.Param("id")
	if inquiryID == "" {
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails("Inquiry ID is required"))
		return
	}

	// Get the inquiry to verify ownership
	inquiry, err := h.inquiryService.GetByID(inquiryID)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrNotFound.WithDetails("Inquiry not found"))
		return
	}

	// Verify the user is the pet owner
	if inquiry.PetOwnerID != userID {
		middleware.AbortWithError(c, errors.ErrForbidden.WithDetails("Not authorized to reply to this inquiry"))
		return
	}

	var req models.ReplyInquiryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		if validationErrs, ok := err.(validator.ValidationErrors); ok {
			fieldErrors := make(map[string]string)
			for _, fieldErr := range validationErrs {
				fieldErrors[fieldErr.Field()] = sharedvalidator.GetValidationErrorMessage(fieldErr)
			}
			middleware.RespondWithValidationError(c, fieldErrors)
			return
		}
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails(err.Error()))
		return
	}

	updatedInquiry, err := h.inquiryService.AddReply(inquiryID, req.Reply)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrInternalServerError.WithDetails(err.Error()))
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"message": "Reply added successfully",
		"inquiry": updatedInquiry,
	})
}

// GetInquiry retrieves a single inquiry by ID
// @Summary      問い合わせ詳細取得
// @Description  問い合わせの詳細を取得します
// @Tags         inquiry
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id path string true "問い合わせID"
// @Success      200 {object} map[string]interface{} "Inquiry retrieved successfully"
// @Failure      401 {object} errors.AppError "Unauthorized"
// @Failure      403 {object} errors.AppError "Forbidden"
// @Failure      404 {object} errors.AppError "Inquiry not found"
// @Failure      500 {object} errors.AppError "Internal server error"
// @Router       /inquiries/{id} [get]
func (h *InquiryHandler) GetInquiry(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		middleware.AbortWithError(c, errors.ErrUnauthorized)
		return
	}

	inquiryID := c.Param("id")
	if inquiryID == "" {
		middleware.AbortWithError(c, errors.ErrInvalidRequestBody.WithDetails("Inquiry ID is required"))
		return
	}

	inquiry, err := h.inquiryService.GetByID(inquiryID)
	if err != nil {
		middleware.AbortWithError(c, errors.ErrNotFound.WithDetails("Inquiry not found"))
		return
	}

	// Verify the user is either the sender or the pet owner
	if inquiry.UserID != userID && inquiry.PetOwnerID != userID {
		middleware.AbortWithError(c, errors.ErrForbidden.WithDetails("Not authorized to view this inquiry"))
		return
	}

	middleware.RespondWithSuccess(c, http.StatusOK, gin.H{
		"inquiry": inquiry,
	})
}

