# PetMatch Development Makefile
# 修正版 - 重複ターゲット削除、エラーハンドリング改善

.PHONY: help start stop restart status health build-all build-pet build-auth build-user build-gateway build-web deploy-all deploy-pet deploy-auth deploy-user deploy-gateway deploy-web logs logs-pet logs-auth logs-user logs-gateway logs-web test test-unit test-integration test-jwt test-redis lint lint-go lint-js fix setup reset clean clean-pods clean-images clean-all k8s-apply k8s-delete port-check pid-cleanup sample-data sample-data-quick sample-data-full sample-data-status sample-data-clean demo-ready security-scan security-install

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
	@echo "  make stop           - 開発環境停止"
	@echo "  make restart        - 開発環境再起動"
	@echo "  make status         - システム状況確認"
	@echo "  make health         - 詳細ヘルスチェック"
	@echo ""
	@echo "$(CYAN) 品質管理:$(NC)"
	@echo "  make lint           - 全コードリント"
	@echo "  make lint-go        - Go コードリント"
	@echo "  make fix            - 自動修正"
	@echo "  make security-scan  - セキュリティスキャン"
	@echo ""
	@echo "$(GREEN) テスト:$(NC)"
	@echo "  make test           - 全テスト実行"
	@echo "  make test-unit      - ユニットテスト"
	@echo "  make test-build     - ビルドテスト"
	@echo "  make test-coverage  - テストカバレッジ"
	@echo "  make test-bench     - ベンチマークテスト"

# ===========================
# セキュリティ
# ===========================

security-scan:
	@echo "$(CYAN)セキュリティスキャン実行中...$(NC)"
	@if command -v gosec >/dev/null 2>&1; then \
		gosec -fmt json -out security-report.json ./...; \
		echo "$(GREEN)セキュリティスキャン完了: security-report.json$(NC)"; \
	else \
		echo "$(YELLOW)gosec がインストールされていません$(NC)"; \
		echo "インストール: go install github.com/securego/gosec/v2/cmd/gosec@latest"; \
	fi

security-install:
	@echo "$(BLUE)gosec インストール中...$(NC)"
	@go install github.com/securego/gosec/v2/cmd/gosec@latest
	@echo "$(GREEN)gosec インストール完了$(NC)"

# ===========================
# 基本操作
# ===========================

start:
	@echo "$(CYAN)PetMatch 開発環境起動中...$(NC)"
	@$(MAKE) --no-print-directory _check-minikube
	@$(MAKE) --no-print-directory _check-pods
	@$(MAKE) --no-print-directory _start-port-forwards
	@echo ""
	@$(MAKE) --no-print-directory _health-check-services
	@$(MAKE) --no-print-directory _show-access-info
	@echo "$(GREEN)開発環境起動完了$(NC)"

stop:
	@echo "$(YELLOW)PetMatch 開発環境停止中...$(NC)"
	@$(MAKE) --no-print-directory _stop-port-forwards || true
	@$(MAKE) --no-print-directory pid-cleanup || true
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

health:
	@echo "$(GREEN)PetMatch ヘルスチェック$(NC)"
	@$(MAKE) --no-print-directory _health-check-services

# ===========================
# テスト関連（重複削除）
# ===========================

test:
	@echo "$(GREEN)全テスト実行中...$(NC)"
	@$(MAKE) --no-print-directory test-unit
	@$(MAKE) --no-print-directory test-build
	@echo "$(GREEN)全テスト完了$(NC)"

test-unit:
	@echo "$(GREEN)ユニットテスト実行中...$(NC)"
	@success_count=0; total_count=0; \
	for service in pet-service auth-service user-service match-service api-gateway; do \
		total_count=$((total_count + 1)); \
		echo "$(CYAN)[$total_count] Testing $service...$(NC)"; \
		if [ -d "services/$service" ]; then \
			cd "services/$service" && \
			if go test ./... -v -race -timeout=10m; then \
				echo "$(GREEN)✓ $service テスト成功$(NC)"; \
				success_count=$((success_count + 1)); \
			else \
				echo "$(RED)✗ $service テスト失敗$(NC)"; \
			fi && \
			cd ../..; \
		fi; \
	done; \
	echo "$(CYAN)テスト結果: $success_count/$total_count サービス成功$(NC)"

test-build:
	@echo "$(CYAN)ビルドテスト実行中...$(NC)"
	@success_count=0; total_count=0; \
	for service in pet-service auth-service user-service match-service api-gateway; do \
		total_count=$((total_count + 1)); \
		echo "$(BLUE)[$total_count] $service ビルド中...$(NC)"; \
		if [ -d "services/$service" ]; then \
			cd "services/$service" && \
			if go build -o /tmp/test-$service . 2>/dev/null; then \
				echo "$(GREEN)✓ $service ビルド成功$(NC)"; \
				rm -f /tmp/test-$service; \
				success_count=$((success_count + 1)); \
			else \
				echo "$(RED)✗ $service ビルド失敗$(NC)"; \
			fi && \
			cd ../..; \
		fi; \
	done; \
	echo "$(CYAN)ビルド結果: $success_count/$total_count サービス成功$(NC)"

test-coverage:
	@echo "$(CYAN)テストカバレッジ生成中...$(NC)"
	@mkdir -p coverage
	@for service in pet-service auth-service user-service match-service api-gateway; do \
		if [ -d "services/$service" ]; then \
			echo "$(BLUE)$service カバレッジ生成...$(NC)"; \
			cd "services/$service" && \
			go test -coverprofile=../../coverage/$service.out ./... && \
			go tool cover -html=../../coverage/$service.out -o ../../coverage/$service.html && \
			echo "$(GREEN)✓ $service カバレッジ: coverage/$service.html$(NC)" && \
			cd ../..; \
		fi; \
	done
	@echo "$(GREEN)全カバレッジレポート生成完了$(NC)"

test-bench:
	@echo "$(CYAN)ベンチマークテスト実行中...$(NC)"
	@for service in pet-service auth-service user-service; do \
		if [ -d "services/$service" ]; then \
			echo "$(BLUE)$service ベンチマーク...$(NC)"; \
			cd "services/$service" && \
			go test -bench=. -benchmem ./... || echo "No benchmarks in $service"; \
			cd ../..; \
		fi; \
	done

# ===========================
# 品質管理
# ===========================

lint:
	@echo "$(CYAN)全コードリント実行中...$(NC)"
	@$(MAKE) --no-print-directory lint-go
	@echo "$(GREEN)全コードリント完了$(NC)"

lint-go:
	@echo "$(CYAN)Go コードリント実行中...$(NC)"
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run ./services/...; \
	else \
		echo "$(YELLOW)golangci-lint がインストールされていません$(NC)"; \
		echo "インストール: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

fix:
	@echo "$(CYAN)自動修正実行中...$(NC)"
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run --fix ./services/...; \
	fi
	@echo "$(GREEN)自動修正完了$(NC)"

# ===========================
# ビルド
# ===========================

build-all:
	@echo "$(BLUE)全サービスビルド中...$(NC)"
	@$(MAKE) --no-print-directory build-pet
	@$(MAKE) --no-print-directory build-auth
	@$(MAKE) --no-print-directory build-user
	@$(MAKE) --no-print-directory build-match
	@$(MAKE) --no-print-directory build-gateway
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

build-match:
	@echo "$(BLUE)Match Service ビルド中...$(NC)"
	@eval $(minikube docker-env) && \
	docker build -t petmatch/match-service:latest -f services/match-service/Dockerfile . && \
	echo "$(GREEN)Match Service ビルド完了$(NC)"

# ===========================
# ユーティリティ
# ===========================

port-check:
	@echo "$(BLUE)ポート使用状況確認$(NC)"
	@echo "$(CYAN)kubectl port-forward プロセス:$(NC)"
	@ps aux | grep -E "kubectl port-forward" | grep -v grep || echo "$(YELLOW)アクティブなport-forwardプロセスなし$(NC)"

pid-cleanup:
	@echo "$(YELLOW)PIDファイルクリーンアップ中...$(NC)"
	@rm -f .pet-service.pid .auth-service.pid .user-service.pid .match-service.pid .api-gateway.pid 2>/dev/null || true
	@echo "$(GREEN)PIDファイルクリーンアップ完了$(NC)"

clean:
	@echo "$(YELLOW)基本クリーンアップ中...$(NC)"
	@$(MAKE) --no-print-directory pid-cleanup
	@echo "$(GREEN)基本クリーンアップ完了$(NC)"

# ===========================
# 内部ヘルパー関数（エラーハンドリング改善）
# ===========================

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
	echo $$! > .pet-service.pid && echo "  Pet Service: 8083"
	@kubectl port-forward service/auth-service 18091:8081 -n petmatch >/dev/null 2>&1 & \
	echo $$! > .auth-service.pid && echo "  Auth Service: 18091"
	@kubectl port-forward service/user-service 18092:8082 -n petmatch >/dev/null 2>&1 & \
	echo $$! > .user-service.pid && echo "  User Service: 18092"
	@kubectl port-forward service/match-service 8084:8084 -n petmatch >/dev/null 2>&1 & \
	echo $$! > .match-service.pid && echo "  Match Service: 8084"
	@kubectl port-forward service/api-gateway 8080:8080 -n petmatch >/dev/null 2>&1 & \
	echo $$! > .api-gateway.pid && echo "  API Gateway: 8080"
	@sleep 3

_stop-port-forwards:
	@echo "$(YELLOW)ポートフォワード停止中...$(NC)"
	@if [ -f .pet-service.pid ]; then \
		kill $$(cat .pet-service.pid) 2>/dev/null || true; \
		echo "$(GREEN)Pet Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .auth-service.pid ]; then \
		kill $$(cat .auth-service.pid) 2>/dev/null || true; \
		echo "$(GREEN)Auth Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .user-service.pid ]; then \
		kill $$(cat .user-service.pid) 2>/dev/null || true; \
		echo "$(GREEN)User Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .match-service.pid ]; then \
		kill $$(cat .match-service.pid) 2>/dev/null || true; \
		echo "$(GREEN)Match Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .api-gateway.pid ]; then \
		kill $$(cat .api-gateway.pid) 2>/dev/null || true; \
		echo "$(GREEN)API Gateway ポートフォワード停止$(NC)"; \
	fi
	@pkill -f "kubectl port-forward.*petmatch" 2>/dev/null || true

_health-check-services:
	@printf "Pet Service (8083): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8083/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "Auth Service (18091): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:18091/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "User Service (18092): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:18092/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "Match Service (8084): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8084/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"
	@printf "API Gateway (8080): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8080/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"

_show-access-info:
	@echo ""
	@echo "$(WHITE)アクセス情報:$(NC)"
	@echo "Pet Service: http://localhost:8083"
	@echo "Auth Service: http://localhost:18091"
	@echo "  └─ Swagger UI: http://localhost:18091/swagger/index.html"
	@echo "User Service: http://localhost:18092"
	@echo "Match Service: http://localhost:8084"
	@echo "API Gateway: http://localhost:8080"
	@echo ""
	@echo "停止方法: make stop"
