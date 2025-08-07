# PetMatch Development Makefile
# 完全版 - すべての開発・運用機能を含む

.PHONY: help start stop restart status health build-all build-pet build-auth build-user build-gateway build-web deploy-all deploy-pet deploy-auth deploy-user deploy-gateway deploy-web logs logs-pet logs-auth logs-user logs-gateway logs-web test test-unit test-integration test-jwt test-redis lint lint-go lint-js fix setup reset clean clean-pods clean-images clean-all k8s-apply k8s-delete port-check pid-cleanup

# Color codes for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
PURPLE=\033[0;35m
CYAN=\033[0;36m
WHITE=\033[1;37m
NC=\033[0m # No Color

# Default target
help:
	@echo "$(CYAN)PetMatch 完全開発環境$(NC)"
	@echo "$(WHITE)========================$(NC)"
	@echo ""
	@echo "$(GREEN) 基本操作:$(NC)"
	@echo "  make start          - 開発環境起動 (ポートフォワード)"
	@echo "  make start-local-gateway - ローカルAPI Gateway + K8sバックエンド"
	@echo "  make stop           - 開発環境停止"
	@echo "  make restart        - 開発環境再起動"
	@echo "  make status         - システム状況確認"
	@echo "  make health         - 詳細ヘルスチェック"
	@echo ""
	@echo "$(BLUE) ビルド:$(NC)"
	@echo "  make build-all      - 全サービスビルド"
	@echo "  make build-pet      - Pet Service ビルド"
	@echo "  make build-auth     - Auth Service ビルド"
	@echo "  make build-user     - User Service ビルド"
	@echo "  make build-gateway  - API Gateway ビルド"
	@echo "  make build-web      - Web App ビルド"
	@echo ""
	@echo "$(PURPLE) デプロイ:$(NC)"
	@echo "  make deploy-all     - 全サービス再デプロイ"
	@echo "  make deploy-pet     - Pet Service 再デプロイ"
	@echo "  make deploy-auth    - Auth Service 再デプロイ"
	@echo "  make deploy-user    - User Service 再デプロイ"
	@echo "  make deploy-gateway - API Gateway 再デプロイ"
	@echo "  make deploy-web     - Web App 再デプロイ"
	@echo ""
	@echo "$(YELLOW) 監視・ログ:$(NC)"
	@echo "  make logs           - Pet Service ログ表示"
	@echo "  make logs-pet       - Pet Service ログ"
	@echo "  make logs-auth      - Auth Service ログ"
	@echo "  make logs-user      - User Service ログ"
	@echo "  make logs-gateway   - API Gateway ログ"
	@echo "  make logs-web       - Web App ログ"
	@echo ""
	@echo "$(GREEN) テスト:$(NC)"
	@echo "  make test           - 全テスト実行"
	@echo "  make test-unit      - ユニットテスト"
	@echo "  make test-integration - 統合テスト"
	@echo "  make test-jwt       - JWT認証テスト"
	@echo "  make test-redis     - Redis接続テスト"
	@echo ""
	@echo "$(CYAN) 品質管理:$(NC)"
	@echo "  make lint           - 全コードリント"
	@echo "  make lint-go        - Go コードリント"
	@echo "  make lint-js        - JavaScript コードリント"
	@echo "  make fix            - 自動修正"
	@echo ""
	@echo "$(BLUE) 環境管理:$(NC)"
	@echo "  make setup          - 初期環境セットアップ"
	@echo "  make reset          - 環境完全リセット"
	@echo "  make k8s-apply      - Kubernetes マニフェスト適用"
	@echo "  make k8s-delete     - Kubernetes リソース削除"
	@echo ""
	@echo "$(RED) クリーンアップ:$(NC)"
	@echo "  make clean          - 基本クリーンアップ"
	@echo "  make clean-pods     - Pod強制削除"
	@echo "  make clean-images   - Docker Image削除"
	@echo "  make clean-all      - 完全クリーンアップ"
	@echo ""
	@echo "$(WHITE) ユーティリティ:$(NC)"
	@echo "  make port-check     - ポート使用状況確認"
	@echo "  make pid-cleanup    - PIDファイルクリーンアップ"

# 基本操作
start:
	@echo "$(CYAN)PetMatch 開発環境起動中...$(NC)"
	@$(MAKE) --no-print-directory _check-minikube
	@$(MAKE) --no-print-directory _check-pods
	@$(MAKE) --no-print-directory _start-port-forwards
	@echo ""
	@$(MAKE) --no-print-directory _health-check-services
	@$(MAKE) --no-print-directory _show-access-info
	@echo "$(GREEN)開発環境起動完了$(NC)"

start-local-gateway:
	@echo "$(CYAN)ローカルAPI Gateway + K8s Services起動中...$(NC)"
	@$(MAKE) --no-print-directory _check-minikube
	@$(MAKE) --no-print-directory _check-pods
	@$(MAKE) --no-print-directory _start-port-forwards-backend-only
	@$(MAKE) --no-print-directory _start-local-api-gateway
	@echo ""
	@$(MAKE) --no-print-directory _health-check-all
	@echo "$(GREEN)ハイブリッド環境起動完了$(NC)"

stop:
	@echo "$(YELLOW)PetMatch 開発環境停止中...$(NC)"
	@$(MAKE) --no-print-directory _stop-port-forwards
	@$(MAKE) --no-print-directory pid-cleanup
	@echo "$(GREEN)開発環境停止完了$(NC)"

restart: stop start

status:
	@echo "$(BLUE)PetMatch システム状況$(NC)"
	@echo "$(WHITE)========================$(NC)"
	@echo ""
	@echo "$(CYAN)Minikube:$(NC)"
	@minikube status || echo "$(RED)X Minikube 停止中$(NC)"
	@echo ""
	@echo "$(CYAN)Kubernetes Pods:$(NC)"
	@kubectl get pods -n petmatch 2>/dev/null || echo "$(RED)X Namespace 'petmatch' が存在しません$(NC)"
	@echo ""
	@echo "$(CYAN)Services:$(NC)"
	@kubectl get services -n petmatch 2>/dev/null || echo "$(RED)X Services が見つかりません$(NC)"
	@echo ""
	@echo "$(CYAN)Port Forwards (Active):$(NC)"
	@ps aux | grep -E "kubectl port-forward.*petmatch" | grep -v grep || echo "$(YELLOW)アクティブなポートフォワードなし$(NC)"

health:
	@echo "$(GREEN)PetMatch ヘルスチェック$(NC)"
	@echo "$(WHITE)=============================$(NC)"
	@echo ""
	@$(MAKE) --no-print-directory _check-minikube
	@$(MAKE) --no-print-directory _check-pods
	@echo ""
	@echo "$(CYAN)Service Health Checks:$(NC)"
	@$(MAKE) --no-print-directory _health-check-services
	@echo ""
	@echo "$(CYAN)External Dependencies:$(NC)"
	@$(MAKE) --no-print-directory _health-check-external

# ビルド
build-all:
	@echo "$(BLUE)全サービスビルド中...$(NC)"
	@$(MAKE) --no-print-directory build-pet
	@$(MAKE) --no-print-directory build-auth
	@$(MAKE) --no-print-directory build-user
	@$(MAKE) --no-print-directory build-gateway
	@$(MAKE) --no-print-directory build-web
	@echo "$(GREEN)全サービスビルド完了$(NC)"

build-pet:
	@echo "$(BLUE)Pet Service ビルド中...$(NC)"
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/pet-service:latest -f services/pet-service/Dockerfile . && \
	echo "$(GREEN)Pet Service ビルド完了$(NC)"

build-auth:
	@echo "$(BLUE)Auth Service ビルド中...$(NC)"
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/auth-service:latest -f services/auth-service/Dockerfile . && \
	echo "$(GREEN)Auth Service ビルド完了$(NC)"

build-user:
	@echo "$(BLUE)User Service ビルド中...$(NC)"
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/user-service:latest -f services/user-service/Dockerfile . && \
	echo "$(GREEN)User Service ビルド完了$(NC)"

build-gateway:
	@echo "$(BLUE)API Gateway ビルド中...$(NC)"
	@eval $(minikube docker-env) && \
	docker build -t petmatch/api-gateway:latest -f services/api-gateway/Dockerfile . && \
	echo "$(GREEN)API Gateway ビルド完了$(NC)"

build-web:
	@echo "$(BLUE)Web App ビルド中...$(NC)"
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/web-app:latest -f web-app/Dockerfile ./web-app && \
	echo "$(GREEN)Web App ビルド完了$(NC)"

# デプロイ
deploy-all:
	@echo "$(PURPLE)全サービス再デプロイ中...$(NC)"
	@$(MAKE) --no-print-directory deploy-pet
	@$(MAKE) --no-print-directory deploy-auth
	@$(MAKE) --no-print-directory deploy-user
	@$(MAKE) --no-print-directory deploy-gateway
	@$(MAKE) --no-print-directory deploy-web
	@echo "$(GREEN)全サービス再デプロイ完了$(NC)"

deploy-pet:
	@echo "$(PURPLE)Pet Service 再デプロイ中...$(NC)"
	@kubectl rollout restart deployment/pet-service -n petmatch
	@kubectl rollout status deployment/pet-service -n petmatch --timeout=120s
	@echo "$(GREEN)Pet Service 再デプロイ完了$(NC)"

deploy-auth:
	@echo "$(PURPLE)Auth Service 再デプロイ中...$(NC)"
	@kubectl rollout restart deployment/auth-service -n petmatch
	@kubectl rollout status deployment/auth-service -n petmatch --timeout=120s
	@echo "$(GREEN)Auth Service 再デプロイ完了$(NC)"

deploy-user:
	@echo "$(PURPLE)User Service 再デプロイ中...$(NC)"
	@kubectl rollout restart deployment/user-service -n petmatch
	@kubectl rollout status deployment/user-service -n petmatch --timeout=120s
	@echo "$(GREEN)User Service 再デプロイ完了$(NC)"

deploy-gateway:
	@echo "$(PURPLE)API Gateway 再デプロイ中...$(NC)"
	@kubectl rollout restart deployment/api-gateway -n petmatch
	@kubectl rollout status deployment/api-gateway -n petmatch --timeout=120s
	@echo "$(GREEN)API Gateway 再デプロイ完了$(NC)"

deploy-web:
	@echo "$(PURPLE)Web App 再デプロイ中...$(NC)"
	@kubectl rollout restart deployment/web-app -n petmatch
	@kubectl rollout status deployment/web-app -n petmatch --timeout=120s
	@echo "$(GREEN)Web App 再デプロイ完了$(NC)"

# ログ
logs: logs-pet

logs-pet:
	@echo "$(YELLOW)Pet Service ログ$(NC)"
	@kubectl logs -f deployment/pet-service -n petmatch

logs-auth:
	@echo "$(YELLOW)Auth Service ログ$(NC)"
	@kubectl logs -f deployment/auth-service -n petmatch

logs-user:
	@echo "$(YELLOW)User Service ログ$(NC)"
	@kubectl logs -f deployment/user-service -n petmatch

logs-gateway:
	@echo "$(YELLOW)API Gateway ログ$(NC)"
	@kubectl logs -f deployment/api-gateway -n petmatch

logs-web:
	@echo "$(YELLOW)Web App ログ$(NC)"
	@kubectl logs -f deployment/web-app -n petmatch

# テスト
test:
	@echo "$(GREEN)全テスト実行中...$(NC)"
	@$(MAKE) --no-print-directory test-unit
	@$(MAKE) --no-print-directory test-integration
	@$(MAKE) --no-print-directory test-jwt
	@$(MAKE) --no-print-directory test-redis
	@echo "$(GREEN)全テスト完了$(NC)"

test-unit:
	@echo "$(GREEN)ユニットテスト実行中...$(NC)"
	@cd services/pet-service && go test ./... -v
	@cd services/auth-service && go test ./... -v
	@cd services/user-service && go test ./... -v
	@cd services/api-gateway && go test ./... -v
	@echo "$(GREEN)ユニットテスト完了$(NC)"

test-integration:
	@echo "$(GREEN)統合テスト実行中...$(NC)"
	@if [ -d "test-integration" ]; then \
		cd test-integration && go test ./... -v; \
	else \
		echo "$(YELLOW)統合テストディレクトリが見つかりません$(NC)"; \
	fi

test-jwt:
	@echo "$(GREEN)JWT認証テスト実行中...$(NC)"
	@if [ -f "test-jwt-fixed.make" ]; then \
		make -f test-jwt-fixed.make; \
	else \
		echo "$(RED)JWT テストファイルが見つかりません$(NC)"; \
	fi

test-redis:
	@echo "$(GREEN)Redis接続テスト実行中...$(NC)"
	@if [ -f "test-redis.sh" ]; then \
		chmod +x test-redis.sh && ./test-redis.sh; \
	else \
		echo "$(RED)Redis テストスクリプトが見つかりません$(NC)"; \
	fi

# 品質管理
lint:
	@echo "$(CYAN)全コードリント実行中...$(NC)"
	@$(MAKE) --no-print-directory lint-go
	@$(MAKE) --no-print-directory lint-js
	@echo "$(GREEN)全コードリント完了$(NC)"

lint-go:
	@echo "$(CYAN)Go コードリント実行中...$(NC)"
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run ./services/...; \
	else \
		echo "$(YELLOW)golangci-lint がインストールされていません$(NC)"; \
		echo "インストール: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

lint-js:
	@echo "$(CYAN)JavaScript コードリント実行中...$(NC)"
	@if [ -d "web-app" ] && [ -f "web-app/package.json" ]; then \
		cd web-app && npm run lint 2>/dev/null || echo "$(YELLOW)lint script が設定されていません$(NC)"; \
	else \
		echo "$(YELLOW)Web App ディレクトリまたは package.json が見つかりません$(NC)"; \
	fi

fix:
	@echo "$(CYAN)自動修正実行中...$(NC)"
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run --fix ./services/...; \
	fi
	@if [ -d "web-app" ] && [ -f "web-app/package.json" ]; then \
		cd web-app && npm run lint:fix 2>/dev/null || echo "$(YELLOW)lint:fix script が設定されていません$(NC)"; \
	fi
	@echo "$(GREEN)自動修正完了$(NC)"

# 環境管理
setup:
	@echo "$(BLUE)初期環境セットアップ中...$(NC)"
	@echo "$(YELLOW)この操作は環境を変更します。続行しますか? [y/N]$(NC)"
	@read -p "" confirm && [ "$$confirm" = "y" ] || ( echo "$(RED)セットアップをキャンセルしました$(NC)" && exit 1 )
	@$(MAKE) --no-print-directory _setup-minikube
	@$(MAKE) --no-print-directory k8s-apply
	@$(MAKE) --no-print-directory build-all
	@$(MAKE) --no-print-directory deploy-all
	@echo "$(GREEN)初期環境セットアップ完了$(NC)"

reset:
	@echo "$(RED)環境完全リセット中...$(NC)"
	@echo "$(RED)警告: この操作は全てのリソースを削除します。本当に続行しますか? [y/N]$(NC)"
	@read -p "" confirm && [ "$$confirm" = "y" ] || ( echo "$(YELLOW)リセットをキャンセルしました$(NC)" && exit 1 )
	@$(MAKE) --no-print-directory stop
	@$(MAKE) --no-print-directory k8s-delete
	@$(MAKE) --no-print-directory clean-all
	@echo "$(GREEN)環境完全リセット完了$(NC)"

k8s-apply:
	@echo "$(BLUE)Kubernetes マニフェスト適用中...$(NC)"
	@kubectl apply -f k8s/namespace.yaml 2>/dev/null || true
	@kubectl apply -f k8s/configmap.yaml 2>/dev/null || true
	@kubectl apply -f k8s/secrets.yaml 2>/dev/null || true
	@kubectl apply -f k8s/redis/ 2>/dev/null || true
	@kubectl apply -f k8s/services/ 2>/dev/null || true
	@echo "$(GREEN)Kubernetes マニフェスト適用完了$(NC)"

k8s-delete:
	@echo "$(RED)Kubernetes リソース削除中...$(NC)"
	@kubectl delete namespace petmatch --ignore-not-found=true
	@echo "$(GREEN)Kubernetes リソース削除完了$(NC)"

# クリーンアップ
clean:
	@echo "$(YELLOW)基本クリーンアップ中...$(NC)"
	@$(MAKE) --no-print-directory pid-cleanup
	@eval $$(minikube docker-env) && docker image prune -f 2>/dev/null || true
	@echo "$(GREEN)基本クリーンアップ完了$(NC)"

clean-pods:
	@echo "$(RED)Pod強制削除中...$(NC)"
	@kubectl delete pods --all -n petmatch --force --grace-period=0 2>/dev/null || true
	@echo "$(GREEN)Pod強制削除完了$(NC)"

clean-images:
	@echo "$(RED)Docker Image削除中...$(NC)"
	@eval $$(minikube docker-env) && docker rmi $$(docker images -q petmatch/*) 2>/dev/null || true
	@eval $$(minikube docker-env) && docker image prune -a -f 2>/dev/null || true
	@echo "$(GREEN)Docker Image削除完了$(NC)"

clean-all:
	@echo "$(RED)完全クリーンアップ中...$(NC)"
	@$(MAKE) --no-print-directory clean
	@$(MAKE) --no-print-directory clean-pods
	@$(MAKE) --no-print-directory clean-images
	@echo "$(GREEN)完全クリーンアップ完了$(NC)"

# ユーティリティ
port-check:
	@echo "$(BLUE)ポート使用状況確認$(NC)"
	@echo "$(WHITE)=====================$(NC)"
	@echo ""
	@echo "$(CYAN)Listen ポート:$(NC)"
	@netstat -tlnp 2>/dev/null | grep -E ':80(80|83|81|82|84|85|86|87|88|90|91)' || echo "$(GREEN)対象ポートは空いています$(NC)"
	@echo ""
	@echo "$(CYAN)kubectl port-forward プロセス:$(NC)"
	@ps aux | grep -E "kubectl port-forward" | grep -v grep || echo "$(YELLOW)アクティブなport-forwardプロセスなし$(NC)"

pid-cleanup:
	@echo "$(YELLOW)PIDファイルクリーンアップ中...$(NC)"
	@rm -f .pet-service.pid .auth-service.pid .user-service.pid .api-gateway.pid 2>/dev/null || true
	@echo "$(GREEN)PIDファイルクリーンアップ完了$(NC)"

# 内部ヘルパー関数
_check-minikube:
	@if ! minikube status >/dev/null 2>&1; then \
		echo "$(RED)Minikube が起動していません$(NC)"; \
		echo "$(YELLOW)起動コマンド: minikube start$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Minikube 起動中$(NC)"

_check-pods:
	@echo "$(CYAN)Pod状況確認中...$(NC)"
	@kubectl get pods -n petmatch 2>/dev/null || echo "$(YELLOW)Namespace 'petmatch' が見つかりません$(NC)"

_start-port-forwards:
	@echo "$(CYAN)ポートフォワード開始中...$(NC)"
	@$(MAKE) --no-print-directory pid-cleanup
	@kubectl port-forward service/pet-service 8083:8083 -n petmatch >/dev/null 2>&1 & \
	echo $! > .pet-service.pid && echo "  Pet Service: 8083"
	@kubectl port-forward service/auth-service 18091:8081 -n petmatch >/dev/null 2>&1 & \
	echo $! > .auth-service.pid && echo "  Auth Service: 18091"
	@kubectl port-forward service/user-service 18092:8082 -n petmatch >/dev/null 2>&1 & \
	echo $! > .user-service.pid && echo "  User Service: 18092"
	@kubectl port-forward service/api-gateway 8080:8080 -n petmatch >/dev/null 2>&1 & \
	echo $! > .api-gateway.pid && echo "  API Gateway: 8080"
	@sleep 3

_stop-port-forwards:
	@if [ -f .pet-service.pid ]; then \
		kill $$(cat .pet-service.pid) 2>/dev/null && echo "$(GREEN)Pet Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .auth-service.pid ]; then \
		kill $$(cat .auth-service.pid) 2>/dev/null && echo "$(GREEN)Auth Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .user-service.pid ]; then \
		kill $$(cat .user-service.pid) 2>/dev/null && echo "$(GREEN)User Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .api-gateway.pid ]; then \
		kill $$(cat .api-gateway.pid) 2>/dev/null && echo "$(GREEN)API Gateway ポートフォワード停止$(NC)"; \
	fi
	@pkill -f "kubectl port-forward.*petmatch" 2>/dev/null || true

_health-check-services:
	@printf "Pet Service (8083): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8083/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "Auth Service (18091): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:18091/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "User Service (18092): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:18092/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "API Gateway (8080): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8080/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"

_health-check-external:
	@printf "Redis: "
	@kubectl exec -n petmatch deployment/redis -- redis-cli ping 2>/dev/null | grep -q PONG && echo "$(GREEN)OK$(NC)" || echo "$(RED)FAIL$(NC)"

_show-access-info:
	@echo ""
	@echo "$(WHITE)アクセス情報:$(NC)"
	@echo "Pet Service: http://localhost:8083"
	@echo "Auth Service: http://localhost:18091"
	@echo "User Service: http://localhost:18092"
	@echo "API Gateway: http://localhost:8080"
	@echo "Web App: $(minikube service web-app-nodeport -n petmatch --url 2>/dev/null || echo 'N/A')"
	@echo ""
	@echo "停止方法: make stop"

_start-port-forwards-backend-only:
	@echo "$(CYAN)バックエンドサービスポートフォワード開始中...$(NC)"
	@$(MAKE) --no-print-directory pid-cleanup
	@kubectl port-forward service/pet-service 8083:8083 -n petmatch >/dev/null 2>&1 & \
	echo $! > .pet-service.pid && echo "  Pet Service: 8083"
	@kubectl port-forward service/auth-service 18091:8081 -n petmatch >/dev/null 2>&1 & \
	echo $! > .auth-service.pid && echo "  Auth Service: 18091"
	@kubectl port-forward service/user-service 18092:8082 -n petmatch >/dev/null 2>&1 & \
	echo $! > .user-service.pid && echo "  User Service: 18092"
	@sleep 3

_start-local-api-gateway:
	@echo "$(CYAN)ローカルAPI Gateway起動中...$(NC)"
	@pkill -f "api-gateway" 2>/dev/null || true
	@cd services/api-gateway && go build -o ../../bin/api-gateway . >/dev/null 2>&1
	@echo "  API Gateway ビルド完了"
	@export $(grep -v '^#' .env | xargs) && ./bin/api-gateway > logs/api-gateway.log 2>&1 &
	@echo $! > .api-gateway.pid
	@echo "  API Gateway 起動 (PID: $(cat .api-gateway.pid))"
	@sleep 3

_health-check-all:
	@echo "$(CYAN)Service Health Checks:$(NC)"
	@printf "Pet Service (8083): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8083/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "Auth Service (18091): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:18091/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "User Service (18092): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:18092/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "API Gateway (8080 - Local): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8080/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@echo ""
	@echo "$(CYAN)API Tests:$(NC)"
	@printf "Auth Verify Endpoint: "
	@AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/verify 2>/dev/null) && \
	if [ "$AUTH_TEST" = "401" ]; then echo "$(GREEN)OK (401)$(NC)"; else echo "$(YELLOW)Status: $AUTH_TEST$(NC)"; fi
	@printf "Pets Endpoint: "
	@PETS_TEST=$(curl -s http://localhost:8080/api/pets?limit=1 2>/dev/null) && \
	if echo "$PETS_TEST" | grep -q "pets"; then echo "$(GREEN)OK$(NC)"; else echo "$(YELLOW)Empty or Error$(NC)"; fi
