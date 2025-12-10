package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/shared/database"
	"github.com/petmatch/app/shared/models"
)

// ArticleHandler handles article-related requests
type ArticleHandler struct{}

// NewArticleHandler creates a new article handler
func NewArticleHandler() *ArticleHandler {
	return &ArticleHandler{}
}

// CreateArticle creates a new article (admin only)
func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.ArticleCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	article := models.NewArticle(
		req.Title,
		req.Slug,
		req.Content,
		req.Excerpt,
		req.CoverImage,
		userID.(string),
		req.Category,
		req.Tags,
	)

	// Publish immediately if requested
	if req.Publish {
		article.Publish()
	}

	if err := database.DB.Create(article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create article"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"article": article})
}

// UpdateArticle updates an existing article (admin only)
func (h *ArticleHandler) UpdateArticle(c *gin.Context) {
	articleID := c.Param("id")

	var article models.Article
	if err := database.DB.Where("id = ?", articleID).First(&article).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	var req models.ArticleUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Slug != nil {
		updates["slug"] = *req.Slug
	}
	if req.Excerpt != nil {
		updates["excerpt"] = *req.Excerpt
	}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.CoverImage != nil {
		updates["cover_image"] = *req.CoverImage
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Tags != nil {
		updates["tags"] = req.Tags
	}
	if req.Status != nil {
		updates["status"] = *req.Status
		// Set published_at when publishing
		if *req.Status == models.ArticleStatusPublished && article.PublishedAt == nil {
			now := time.Now()
			updates["published_at"] = now
		}
	}

	if err := database.DB.Model(&article).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article"})
		return
	}

	// Reload the article
	database.DB.Where("id = ?", articleID).First(&article)

	c.JSON(http.StatusOK, gin.H{"article": article})
}

// DeleteArticle deletes an article (admin only)
func (h *ArticleHandler) DeleteArticle(c *gin.Context) {
	articleID := c.Param("id")

	result := database.DB.Where("id = ?", articleID).Delete(&models.Article{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete article"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Article deleted"})
}

// ListArticles returns a list of articles (admin sees all, public sees published only)
func (h *ArticleHandler) ListArticles(c *gin.Context) {
	var articles []models.Article

	query := database.DB.Model(&models.Article{}).Order("created_at DESC")

	// Check if admin
	_, isAdmin := c.Get("user_id")
	if !isAdmin {
		// Public can only see published articles
		query = query.Where("status = ?", models.ArticleStatusPublished)
	} else {
		// Admin can filter by status
		if status := c.Query("status"); status != "" {
			query = query.Where("status = ?", status)
		}
	}

	// Apply category filter
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	// Apply limit/offset
	limit := 20
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var total int64
	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"articles": articles,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetArticle returns a single article by ID or slug
func (h *ArticleHandler) GetArticle(c *gin.Context) {
	idOrSlug := c.Param("id")

	var article models.Article
	query := database.DB.Where("id = ? OR slug = ?", idOrSlug, idOrSlug)

	// Check if admin
	_, isAdmin := c.Get("user_id")
	if !isAdmin {
		// Public can only see published articles
		query = query.Where("status = ?", models.ArticleStatusPublished)
	}

	if err := query.First(&article).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	// Increment view count for public views
	if !isAdmin {
		database.DB.Model(&article).Update("view_count", article.ViewCount+1)
		article.ViewCount++
	}

	c.JSON(http.StatusOK, gin.H{"article": article})
}

// ListPublicArticles returns published articles (public endpoint)
func (h *ArticleHandler) ListPublicArticles(c *gin.Context) {
	var articles []models.Article

	query := database.DB.Model(&models.Article{}).
		Where("status = ?", models.ArticleStatusPublished).
		Order("published_at DESC")

	// Apply category filter
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	// Apply limit/offset
	limit := 20
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var total int64
	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"articles": articles,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetPublicArticle returns a single published article
func (h *ArticleHandler) GetPublicArticle(c *gin.Context) {
	idOrSlug := c.Param("id")

	var article models.Article
	if err := database.DB.
		Where("(id = ? OR slug = ?) AND status = ?", idOrSlug, idOrSlug, models.ArticleStatusPublished).
		First(&article).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	// Increment view count
	database.DB.Model(&article).Update("view_count", article.ViewCount+1)
	article.ViewCount++

	c.JSON(http.StatusOK, gin.H{"article": article})
}
