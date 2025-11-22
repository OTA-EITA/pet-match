package handlers

import (
	"fmt"
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
	proxy             *httputil.ReverseProxy
}

func NewInquiryProxy(inquiryServiceURL string) *InquiryProxy {
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
