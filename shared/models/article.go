package models

import (
	"time"

	"github.com/google/uuid"
)

// ArticleStatus represents article publication status
type ArticleStatus string

const (
	ArticleStatusDraft     ArticleStatus = "draft"
	ArticleStatusPublished ArticleStatus = "published"
	ArticleStatusArchived  ArticleStatus = "archived"
)

// ArticleCategory represents article category
type ArticleCategory string

const (
	ArticleCategoryAdoption   ArticleCategory = "adoption"    // 里親になるまで
	ArticleCategoryHealth     ArticleCategory = "health"      // 健康・医療
	ArticleCategoryNutrition  ArticleCategory = "nutrition"   // 食事・栄養
	ArticleCategoryBehavior   ArticleCategory = "behavior"    // 行動・しつけ
	ArticleCategoryGrooming   ArticleCategory = "grooming"    // お手入れ
	ArticleCategoryLifestyle  ArticleCategory = "lifestyle"   // 暮らし
	ArticleCategoryStory      ArticleCategory = "story"       // 体験談
	ArticleCategoryNews       ArticleCategory = "news"        // お知らせ
)

// Article represents a column or article
type Article struct {
	ID           string          `json:"id" gorm:"type:uuid;primaryKey"`
	Title        string          `json:"title" gorm:"type:varchar(255);not null"`
	Slug         string          `json:"slug" gorm:"type:varchar(255);uniqueIndex;not null"`
	Excerpt      string          `json:"excerpt" gorm:"type:text"` // 抜粋
	Content      string          `json:"content" gorm:"type:text;not null"`
	CoverImage   string          `json:"cover_image" gorm:"type:varchar(500)"`
	Category     ArticleCategory `json:"category" gorm:"type:varchar(50);not null;index"`
	Tags         []string        `json:"tags" gorm:"type:text[];serializer:json"`
	AuthorID     string          `json:"author_id" gorm:"type:uuid;not null;index"`
	Status       ArticleStatus   `json:"status" gorm:"type:varchar(20);not null;default:'draft';index"`
	ViewCount    int             `json:"view_count" gorm:"not null;default:0"`
	PublishedAt  *time.Time      `json:"published_at" gorm:"index"`
	CreatedAt    time.Time       `json:"created_at" gorm:"not null;autoCreateTime"`
	UpdatedAt    time.Time       `json:"updated_at" gorm:"not null;autoUpdateTime"`
}

// TableName returns the table name for Article
func (Article) TableName() string {
	return "articles"
}

// NewArticle creates a new article
func NewArticle(title, slug, content, excerpt, coverImage, authorID string, category ArticleCategory, tags []string) *Article {
	return &Article{
		ID:         uuid.New().String(),
		Title:      title,
		Slug:       slug,
		Content:    content,
		Excerpt:    excerpt,
		CoverImage: coverImage,
		Category:   category,
		Tags:       tags,
		AuthorID:   authorID,
		Status:     ArticleStatusDraft,
		ViewCount:  0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
}

// Publish publishes the article
func (a *Article) Publish() {
	now := time.Now()
	a.Status = ArticleStatusPublished
	a.PublishedAt = &now
	a.UpdatedAt = now
}

// ArticleCreateRequest represents article creation request
type ArticleCreateRequest struct {
	Title      string          `json:"title" binding:"required"`
	Slug       string          `json:"slug" binding:"required"`
	Excerpt    string          `json:"excerpt"`
	Content    string          `json:"content" binding:"required"`
	CoverImage string          `json:"cover_image"`
	Category   ArticleCategory `json:"category" binding:"required"`
	Tags       []string        `json:"tags"`
	Publish    bool            `json:"publish"` // 即時公開フラグ
}

// ArticleUpdateRequest represents article update request
type ArticleUpdateRequest struct {
	Title      *string          `json:"title"`
	Slug       *string          `json:"slug"`
	Excerpt    *string          `json:"excerpt"`
	Content    *string          `json:"content"`
	CoverImage *string          `json:"cover_image"`
	Category   *ArticleCategory `json:"category"`
	Tags       []string         `json:"tags"`
	Status     *ArticleStatus   `json:"status"`
}

// ArticleListResponse represents article list response
type ArticleListResponse struct {
	Articles []Article `json:"articles"`
	Total    int64     `json:"total"`
	Page     int       `json:"page"`
	Limit    int       `json:"limit"`
}
