package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/petmatch/app/services/api-gateway/middleware"
)

type InquiryProxy struct {
	inquiryServiceURL string
	petServiceURL     string
	proxy             *httputil.ReverseProxy
}

func NewInquiryProxy(inquiryServiceURL, petServiceURL string) *InquiryProxy {
	target, err := url.Parse(inquiryServiceURL)
	if err != nil {
		log.Fatalf("Failed to parse inquiry service URL %s: %v", inquiryServiceURL, err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
		req.Header.Set("X-Forwarded-For", req.Header.Get("X-Real-IP"))
		req.Header.Set("X-Forwarded-Proto", "http")
		req.Header.Set("X-Gateway", "petmatch-api-gateway")
	}

	proxy.ModifyResponse = func(resp *http.Response) error {
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		return nil
	}

	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		log.Printf("Inquiry service proxy error: %v", err)
		rw.Header().Set("Content-Type", "application/json")
		rw.WriteHeader(http.StatusBadGateway)
		fmt.Fprintf(rw, `{"error":"inquiry_service_unavailable","message":"The inquiry service is temporarily unavailable. Please try again later."}`)
	}

	return &InquiryProxy{
		inquiryServiceURL: inquiryServiceURL,
		petServiceURL:     petServiceURL,
		proxy:             proxy,
	}
}

func (p *InquiryProxy) ProxyRequest(c *gin.Context) {
	start := time.Now()
	path := c.Request.URL.Path
	method := c.Request.Method

	userID, userType, email, authenticated := middleware.GetCurrentUser(c)
	if authenticated {
		c.Request.Header.Set("X-User-ID", userID)
		c.Request.Header.Set("X-User-Type", userType)
		c.Request.Header.Set("X-User-Email", email)
	}

	p.proxy.ServeHTTP(c.Writer, c.Request)

	duration := time.Since(start)
	status := c.Writer.Status()
	log.Printf("Inquiry service proxy: %s %s -> %d (took %v)", method, path, status, duration)
}

func (p *InquiryProxy) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"service": "inquiry-service",
		"url":     p.inquiryServiceURL,
		"status":  "ok",
	})
}

// CreateInquiry handles inquiry creation with pet owner ID lookup
func (p *InquiryProxy) CreateInquiry(c *gin.Context) {
	start := time.Now()
	path := c.Request.URL.Path
	method := c.Request.Method

	userID, userType, email, authenticated := middleware.GetCurrentUser(c)
	if !authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Read the request body
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}

	// Parse the request to get pet_id
	var req struct {
		PetID string `json:"pet_id"`
	}
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Fetch pet info from pet-service to get owner_id
	petOwnerID := ""
	if req.PetID != "" {
		petURL := fmt.Sprintf("%s/pets/%s", p.petServiceURL, req.PetID)
		petResp, err := http.Get(petURL)
		if err == nil && petResp.StatusCode == http.StatusOK {
			defer petResp.Body.Close()
			var petData struct {
				OwnerID string `json:"owner_id"`
			}
			if err := json.NewDecoder(petResp.Body).Decode(&petData); err == nil {
				petOwnerID = petData.OwnerID
			}
		}
	}

	// Restore the request body
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// Set headers
	c.Request.Header.Set("X-User-ID", userID)
	c.Request.Header.Set("X-User-Type", userType)
	c.Request.Header.Set("X-User-Email", email)
	if petOwnerID != "" {
		c.Request.Header.Set("X-Pet-Owner-ID", petOwnerID)
	}

	p.proxy.ServeHTTP(c.Writer, c.Request)

	duration := time.Since(start)
	status := c.Writer.Status()
	log.Printf("Inquiry service proxy (CreateInquiry): %s %s -> %d (took %v)", method, path, status, duration)
}
