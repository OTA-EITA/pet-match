package models

import (
	"time"

	"github.com/google/uuid"
)

// ReportType represents the type of content being reported
type ReportType string

const (
	ReportTypePet     ReportType = "pet"
	ReportTypeUser    ReportType = "user"
	ReportTypeReview  ReportType = "review"
	ReportTypeMessage ReportType = "message"
)

// ReportReason represents the reason for reporting
type ReportReason string

const (
	ReportReasonSpam           ReportReason = "spam"
	ReportReasonInappropriate  ReportReason = "inappropriate"
	ReportReasonFraud          ReportReason = "fraud"
	ReportReasonMisleading     ReportReason = "misleading"
	ReportReasonHarassment     ReportReason = "harassment"
	ReportReasonAnimalAbuse    ReportReason = "animal_abuse"
	ReportReasonOther          ReportReason = "other"
)

// ReportStatus represents the status of a report
type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "pending"
	ReportStatusReviewing ReportStatus = "reviewing"
	ReportStatusResolved  ReportStatus = "resolved"
	ReportStatusDismissed ReportStatus = "dismissed"
)

// Report represents a user report of content
type Report struct {
	ID           string       `json:"id" gorm:"type:uuid;primaryKey"`
	ReporterID   string       `json:"reporter_id" gorm:"type:uuid;not null;index"`
	TargetType   ReportType   `json:"target_type" gorm:"type:varchar(20);not null;index"`
	TargetID     string       `json:"target_id" gorm:"type:uuid;not null;index"`
	Reason       ReportReason `json:"reason" gorm:"type:varchar(50);not null"`
	Description  string       `json:"description" gorm:"type:text"`
	Status       ReportStatus `json:"status" gorm:"type:varchar(20);not null;default:'pending';index"`
	AdminNote    string       `json:"admin_note,omitempty" gorm:"type:text"`
	ResolvedBy   string       `json:"resolved_by,omitempty" gorm:"type:uuid"`
	ResolvedAt   *time.Time   `json:"resolved_at,omitempty"`
	CreatedAt    time.Time    `json:"created_at" gorm:"not null;autoCreateTime"`
	UpdatedAt    time.Time    `json:"updated_at" gorm:"not null;autoUpdateTime"`
}

// TableName specifies the table name for Report
func (Report) TableName() string {
	return "reports"
}

// NewReport creates a new report
func NewReport(reporterID string, targetType ReportType, targetID string, reason ReportReason, description string) *Report {
	return &Report{
		ID:          uuid.New().String(),
		ReporterID:  reporterID,
		TargetType:  targetType,
		TargetID:    targetID,
		Reason:      reason,
		Description: description,
		Status:      ReportStatusPending,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// CreateReportRequest represents a request to create a report
type CreateReportRequest struct {
	TargetType  ReportType   `json:"target_type" binding:"required"`
	TargetID    string       `json:"target_id" binding:"required"`
	Reason      ReportReason `json:"reason" binding:"required"`
	Description string       `json:"description"`
}

// UpdateReportRequest represents a request to update a report status
type UpdateReportRequest struct {
	Status    ReportStatus `json:"status" binding:"required"`
	AdminNote string       `json:"admin_note"`
}
