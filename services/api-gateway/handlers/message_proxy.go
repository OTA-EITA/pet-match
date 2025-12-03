package handlers

import (
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MessageProxy struct {
	serviceURL string
}

func NewMessageProxy(serviceURL string) *MessageProxy {
	return &MessageProxy{serviceURL: serviceURL}
}

func (p *MessageProxy) proxyRequest(c *gin.Context, method, path string) {
	targetURL := p.serviceURL + path

	var body io.Reader
	if method == "POST" || method == "PUT" {
		body = c.Request.Body
	}

	req, err := http.NewRequest(method, targetURL, body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Forward headers
	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Forward user context
	if userID := c.GetString("user_id"); userID != "" {
		req.Header.Set("X-User-ID", userID)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error proxying to message service: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Message service unavailable"})
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	respBody, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), respBody)
}

// GetConversations handles GET /api/v1/messages/conversations
func (p *MessageProxy) GetConversations(c *gin.Context) {
	p.proxyRequest(c, "GET", "/api/v1/messages/conversations")
}

// GetUnreadCount handles GET /api/v1/messages/unread-count
func (p *MessageProxy) GetUnreadCount(c *gin.Context) {
	p.proxyRequest(c, "GET", "/api/v1/messages/unread-count")
}

// GetMessages handles GET /api/v1/messages/:inquiry_id
func (p *MessageProxy) GetMessages(c *gin.Context) {
	inquiryID := c.Param("inquiry_id")
	query := c.Request.URL.RawQuery
	path := "/api/v1/messages/" + inquiryID
	if query != "" {
		path += "?" + query
	}
	p.proxyRequest(c, "GET", path)
}

// SendMessage handles POST /api/v1/messages/:inquiry_id
func (p *MessageProxy) SendMessage(c *gin.Context) {
	inquiryID := c.Param("inquiry_id")
	p.proxyRequest(c, "POST", "/api/v1/messages/"+inquiryID)
}

// MarkAsRead handles PUT /api/v1/messages/:inquiry_id/read
func (p *MessageProxy) MarkAsRead(c *gin.Context) {
	inquiryID := c.Param("inquiry_id")
	p.proxyRequest(c, "PUT", "/api/v1/messages/"+inquiryID+"/read")
}
