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

type PetProxy struct {
	petServiceURL string
	proxy         *httputil.ReverseProxy
}

func NewPetProxy(petServiceURL string) *PetProxy {
	target, err := url.Parse(petServiceURL)
	if err != nil {
		log.Fatalf("Failed to parse pet service URL %s: %v", petServiceURL, err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	// プロキシの設定
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
		req.Header.Set("X-Forwarded-For", req.Header.Get("X-Real-IP"))
		req.Header.Set("X-Forwarded-Proto", "http")
		req.Header.Set("X-Gateway", "petmatch-api-gateway")
	}

	// レスポンス修正
	proxy.ModifyResponse = func(resp *http.Response) error {
		// CORS ヘッダーの重複を防ぐ
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		return nil
	}

	// エラーハンドリング
	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		log.Printf("Pet service proxy error: %v", err)
		rw.Header().Set("Content-Type", "application/json")
		rw.WriteHeader(http.StatusBadGateway)
		if _, writeErr := rw.Write([]byte(`{"error": "pet_service_unavailable", "message": "Pet service is temporarily unavailable"}`)); writeErr != nil {
			log.Printf("Error writing error response: %v", writeErr)
		}
	}

	return &PetProxy{
		petServiceURL: petServiceURL,
		proxy:         proxy,
	}
}

// GetPets - ペット一覧取得
func (p *PetProxy) GetPets(c *gin.Context) {
	p.proxyRequest(c, "GET", "/pets")
}

// GetPet - 特定のペット取得
func (p *PetProxy) GetPet(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequest(c, "GET", fmt.Sprintf("/pets/%s", petID))
}

// SearchPets - ペット検索
func (p *PetProxy) SearchPets(c *gin.Context) {
	p.proxyRequest(c, "GET", "/pets/search")
}

// GetPetImages - ペット画像一覧取得
func (p *PetProxy) GetPetImages(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequest(c, "GET", fmt.Sprintf("/pets/%s/images", petID))
}

// UploadPetImage - ペット画像アップロード
func (p *PetProxy) UploadPetImage(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequest(c, "POST", fmt.Sprintf("/pets/%s/images", petID))
}

// DeletePetImage - ペット画像削除
func (p *PetProxy) DeletePetImage(c *gin.Context) {
	petID := c.Param("id")
	imageID := c.Param("image_id")
	p.proxyRequest(c, "DELETE", fmt.Sprintf("/pets/%s/images/%s", petID, imageID))
}

// GetImageHealth - MinIO画像ストレージのヘルスチェック
func (p *PetProxy) GetImageHealth(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequest(c, "GET", fmt.Sprintf("/pets/%s/images/health", petID))
}

// CreatePet - ペット作成（Shelter限定）
func (p *PetProxy) CreatePet(c *gin.Context) {
	p.proxyRequestWithAuth(c, "POST", "/pets")
}

// UpdatePet - ペット更新（Shelter限定）
func (p *PetProxy) UpdatePet(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequestWithAuth(c, "PUT", fmt.Sprintf("/pets/%s", petID))
}

// DeletePet - ペット削除（Shelter限定）
func (p *PetProxy) DeletePet(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequestWithAuth(c, "DELETE", fmt.Sprintf("/pets/%s", petID))
}

// MigratePets - データ移行（Shelter限定）
func (p *PetProxy) MigratePets(c *gin.Context) {
	p.proxyRequestWithAuth(c, "POST", "/pets/migrate")
}

// AddToFavorites - お気に入り追加（認証必須）
func (p *PetProxy) AddToFavorites(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequestWithAuth(c, "POST", fmt.Sprintf("/pets/%s/favorite", petID))
}

// RemoveFromFavorites - お気に入り削除（認証必須）
func (p *PetProxy) RemoveFromFavorites(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequestWithAuth(c, "DELETE", fmt.Sprintf("/pets/%s/favorite", petID))
}

// GetFavorites - お気に入り一覧取得（認証必須）
func (p *PetProxy) GetFavorites(c *gin.Context) {
	p.proxyRequestWithAuth(c, "GET", "/pets/favorites")
}

// CreateApplication - 譲渡申請作成（認証必須）
func (p *PetProxy) CreateApplication(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequestWithAuth(c, "POST", fmt.Sprintf("/pets/%s/application", petID))
}

// GetPetApplications - ペットの申請一覧取得（Shelter限定）
func (p *PetProxy) GetPetApplications(c *gin.Context) {
	petID := c.Param("id")
	p.proxyRequestWithAuth(c, "GET", fmt.Sprintf("/pets/%s/applications", petID))
}

// UpdateApplication - 申請状況更新（Shelter限定）
func (p *PetProxy) UpdateApplication(c *gin.Context) {
	petID := c.Param("id")
	appID := c.Param("app_id")
	p.proxyRequestWithAuth(c, "PUT", fmt.Sprintf("/pets/%s/applications/%s", petID, appID))
}

// proxyRequest - 基本的なプロキシリクエスト
func (p *PetProxy) proxyRequest(c *gin.Context, method, path string) {
	// パスの修正
	originalPath := c.Request.URL.Path
	c.Request.URL.Path = path
	c.Request.Method = method

	// クエリパラメータはRawQueryで保持され、ReverseProxyが自動的に処理するため、
	// Pathに追加する必要はない

	log.Printf("Proxying %s %s -> %s%s?%s", method, originalPath, p.petServiceURL, path, c.Request.URL.RawQuery)
	p.proxy.ServeHTTP(c.Writer, c.Request)
}

// proxyRequestWithAuth - 認証情報付きプロキシリクエスト
func (p *PetProxy) proxyRequestWithAuth(c *gin.Context, method, path string) {
	// ユーザー情報をヘッダーに追加
	userID, userType, email, exists := middleware.GetCurrentUser(c)
	if exists {
		c.Request.Header.Set("X-User-ID", userID)
		c.Request.Header.Set("X-User-Type", userType)
		c.Request.Header.Set("X-User-Email", email)
	}

	p.proxyRequest(c, method, path)
}

// HealthCheck - Pet Service のヘルスチェック
func (p *PetProxy) HealthCheck() bool {
	healthURL := fmt.Sprintf("%s/health", p.petServiceURL)
	
	// タイムアウト設定でHTTPクライアント作成
	client := &http.Client{
		Timeout: 5 * time.Second,
	}
	
	resp, err := client.Get(healthURL)
	if err != nil {
		log.Printf("Pet service health check failed: %v", err)
		return false
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Printf("Error closing response body: %v", closeErr)
		}
	}()

	return resp.StatusCode == http.StatusOK
}
