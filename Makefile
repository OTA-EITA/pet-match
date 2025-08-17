# Swagger API仕様管理
swagger-install:
	@echo "$(BLUE)Swagger CLI インストール & 確認中...$(NC)"
	@export PATH="/usr/local/go/bin:$(HOME)/go/bin:$PATH" && \
	if ! command -v swag >/dev/null 2>&1; then \
		echo "$(YELLOW)swagが見つかりません。インストール中...$(NC)"; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
		echo "$(GREEN)swagインストール完了$(NC)"; \
	else \
		echo "$(GREEN)swag確認済み$(NC)"; \
	fi

# Match Service単体でのSwagger生成（match-service専用）
swagger-gen-match:
	@echo "$(CYAN)Match Service Swagger仕様生成中...$(NC)"
	@$(MAKE) --no-print-directory swagger-install
	@if [ ! -d "services/match-service" ]; then \
		echo "$(RED)ERROR: services/match-service ディレクトリが見つかりません$(NC)"; \
		exit 1; \
	fi
	@cd services/match-service && \
	export PATH="/usr/local/go/bin:$(HOME)/go/bin:$PATH" && \
	echo "$(BLUE)  docs/ ディレクトリクリーンアップ中...$(NC)" && \
	rm -rf docs/* && \
	echo "$(BLUE)  Swagger仕様生成中...$(NC)" && \
	swag init -g main.go -o docs --parseDependency --parseInternal && \
	if [ -f "docs/swagger.json" ] && [ -f "docs/swagger.yaml" ]; then \
		echo "$(GREEN)  ✓ swagger.json 生成完了$(NC)"; \
		echo "$(GREEN)  ✓ swagger.yaml 生成完了$(NC)"; \
	else \
		echo "$(RED)  ✗ Swagger生成に失敗しました$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Match Service Swagger生成完了$(NC)"

# 全サービスでのSwagger生成（各サービス個別）
swagger-gen-all:
	@echo "$(CYAN)各サービス Swagger仕様生成中...$(NC)"
	@$(MAKE) --no-print-directory swagger-install
	@services="pet-service auth-service user-service match-service api-gateway"; \
	success_count=0; \
	total_count=0; \
	for service in $services; do \
		total_count=$((total_count + 1)); \
		if [ -d "services/$service" ]; then \
			echo "$(BLUE)$service Swagger生成中...$(NC)"; \
			cd services/$service && \
			export PATH="/usr/local/go/bin:$(HOME)/go/bin:$PATH" && \
			rm -rf docs/* 2>/dev/null || true && \
			if swag init -g main.go -o docs --parseDependency --parseInternal 2>/dev/null; then \
				if [ -f "docs/swagger.json" ]; then \
					echo "$(GREEN)  ✓ $service 生成成功$(NC)"; \
					success_count=$((success_count + 1)); \
				else \
					echo "$(YELLOW)  ⚠ $service 生成完了だがファイル不完全$(NC)"; \
				fi; \
			else \
				echo "$(RED)  ✗ $service 生成失敗（コメント不足の可能性）$(NC)"; \
			fi && \
			cd ../..; \
		else \
			echo "$(YELLOW)  ⚠ $service ディレクトリが見つかりません$(NC)"; \
		fi; \
	done; \
	echo ""; \
	echo "$(CYAN)生成結果: $success_count/$total_count サービス成功$(NC)"
	@echo "$(GREEN)各サービス Swagger生成完了$(NC)"

# 統合Swagger（docs-serviceで全API統合表示）
swagger-gen:
	@echo "$(PURPLE)PetMatch 統合Swagger 更新中...$(NC)"
	@echo "$(CYAN)Step 1: Docs Service 統合仕様ビルド...$(NC)"
	@$(MAKE) --no-print-directory build-docs
	@echo "$(CYAN)Step 2: Docs Service 再デプロイ...$(NC)"
	@$(MAKE) --no-print-directory deploy-docs
	@echo "$(CYAN)Step 3: 統合API確認...$(NC)"
	@sleep 3
	@printf "統合Swagger仕様: "
	@if curl -s "http://localhost:8090/swagger.json" 2>/dev/null | grep -q '"openapi"'; then \
		echo "$(GREEN)OK$(NC)"; \
	else \
		echo "$(YELLOW)要確認$(NC)"; \
	fi
	@printf "統合Swagger UI: "
	@if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8090/swagger/" 2>/dev/null | grep -q "200"; then \
		echo "$(GREEN)OK$(NC)"; \
	else \
		echo "$(YELLOW)要確認$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)SUCCESS 統合Swagger完了！$(NC)"
	@echo "$(WHITE)統合API仕様: http://localhost:8090/swagger.json$(NC)"
	@echo "$(WHITE)統合Swagger UI: http://localhost:8090/swagger/index.html$(NC)"
	@echo "$(CYAN)含まれるAPI:$(NC)"
	@echo "  • Pet API: /api/pets (CRUD)"
	@echo "  • Auth API: /api/auth (login, register, verify)"
	@echo "  • User API: /api/users (profile)"
	@echo "  • Match API: /api/matches (matching, recommendations, history)"

# PetMatch Development Makefile
# 完全版 - すべての開発・運用機能を含む

.PHONY: help start stop restart status health build-all build-pet build-auth build-user build-gateway build-web deploy-all deploy-pet deploy-auth deploy-user deploy-gateway deploy-web logs logs-pet logs-auth logs-user logs-gateway logs-web test test-unit test-integration test-jwt test-redis lint lint-go lint-js fix setup reset clean clean-pods clean-images clean-all k8s-apply k8s-delete port-check pid-cleanup sample-data sample-data-quick sample-data-full sample-data-status sample-data-clean demo-ready

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
	@echo "  make build-match    - Match Service ビルド"
	@echo "  make build-gateway  - API Gateway ビルド"
	@echo "  make build-docs     - Docs Service ビルド"
	@echo "  make build-web      - Web App ビルド"
	@echo ""
	@echo "$(PURPLE) デプロイ:$(NC)"
	@echo "  make deploy-all     - 全サービス再デプロイ"
	@echo "  make deploy-pet     - Pet Service 再デプロイ
  make deploy-pet-safe - Pet Service 安全再起動（依存関係確認付き）"
	@echo "  make deploy-auth    - Auth Service 再デプロイ"
	@echo "  make deploy-user    - User Service 再デプロイ"
	@echo "  make deploy-match   - Match Service デプロイ"
	@echo "  make deploy-gateway - API Gateway 再デプロイ"
	@echo "  make deploy-docs    - Docs Service デプロイ"
	@echo "  make deploy-web     - Web App 再デプロイ"
	@echo ""
	@echo "$(YELLOW) 監視・ログ:$(NC)"
	@echo "  make logs           - Pet Service ログ表示"
	@echo "  make logs-pet       - Pet Service ログ"
	@echo "  make logs-auth      - Auth Service ログ"
	@echo "  make logs-user      - User Service ログ"
	@echo "  make logs-match     - Match Service ログ"
	@echo "  make logs-gateway   - API Gateway ログ"
	@echo "  make logs-docs      - Docs Service ログ"
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
	@echo "  make setup          - 初期環境セットアップ（手動確認あり）"
	@echo "  make setup-auto     - 完全自動セットアップ（起動まで）"
	@echo "  make fix-gateway    - API Gateway修復"
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
	@echo "$(WHITE) サンプルデータ:$(NC)"
	@echo "  make sample-data        - サンプルデータ生成 (30匹)"
	@echo "  make sample-data-quick  - 少量サンプルデータ (10匹)"
	@echo "  make sample-data-full   - 大量サンプルデータ (100匹)"
	@echo "  make sample-data-status - サンプルデータ確認"
	@echo "  make sample-data-debug  - 認証デバッグテスト"
	@echo "  make sample-data-clean  - サンプルデータ削除"
	@echo "  make minio-deploy       - MinIOデプロイ"
	@echo "  make minio-setup        - MinIOセットアップ"
	@echo "  make minio-console      - MinIOコンソールアクセス
  make deploy-pet-safe    - Pet Service安全再起動"
	@echo "  make demo-ready         - デモ用完全セットアップ"
	@echo ""
	@echo "$(WHITE) ユーティリティ:$(NC)"
	@echo "  make port-check     - ポート使用状況確認"
	@echo "  make pid-cleanup    - PIDファイルクリーンアップ"
	@echo ""
	@echo "$(CYAN) Swagger/APIドキュメント:$(NC)"
	@echo "  make swagger-gen       - 統合Swagger更新（全API一括表示）"
	@echo "  make swagger-gen-match - Match Service仕様のみ生成"
	@echo "  make swagger-gen-all   - 全サービス仕様生成（個別）"
	@echo "  make swagger-install   - Swagger CLIインストール"
	@echo "  統合Swagger UI: http://localhost:8090/swagger/index.html (make start後)"
	@echo "  全API（Pets, Auth, Users, Matches）を1つのSwagger UIで表示"

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
	@$(MAKE) --no-print-directory build-match
	@$(MAKE) --no-print-directory build-gateway
	@$(MAKE) --no-print-directory build-docs
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

build-docs:
	@echo "$(BLUE)Docs Service ビルド中...$(NC)"
	@eval $(minikube docker-env) && \
	docker build -t petmatch/docs-service:latest -f services/docs-service/Dockerfile . && \
	echo "$(GREEN)Docs Service ビルド完了$(NC)"

build-match:
	@echo "$(BLUE)Match Service ビルド中...$(NC)"
	@eval $(minikube docker-env) && \
	docker build -t petmatch/match-service:latest -f services/match-service/Dockerfile . && \
	echo "$(GREEN)Match Service ビルド完了$(NC)"

build-web:
	@echo "$(BLUE)Web App ビルド中...$(NC)"
	@eval $(minikube docker-env) && \
	docker build -t petmatch/web-app:latest -f web-app/Dockerfile ./web-app && \
	echo "$(GREEN)Web App ビルド完了$(NC)"

# デプロイ
deploy-all:
	@echo "$(PURPLE)全サービス再デプロイ中...$(NC)"
	@$(MAKE) --no-print-directory deploy-pet
	@$(MAKE) --no-print-directory deploy-auth
	@$(MAKE) --no-print-directory deploy-user
	@$(MAKE) --no-print-directory deploy-match
	@$(MAKE) --no-print-directory deploy-gateway
	@$(MAKE) --no-print-directory deploy-docs
	@$(MAKE) --no-print-directory deploy-web
	@echo "$(GREEN)全サービス再デプロイ完了$(NC)"

deploy-pet:
	@echo "$(PURPLE)Pet Service 再デプロイ中...$(NC)"
	@$(MAKE) --no-print-directory _restart-pet-service-safe
	@echo "$(GREEN)Pet Service 再デプロイ完了$(NC)"

deploy-pet-safe:
	@echo "$(PURPLE)Pet Service 安全再起動中...$(NC)"
	@$(MAKE) --no-print-directory _restart-pet-service-safe
	@echo "$(GREEN)Pet Service 安全再起動完了$(NC)"

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

deploy-docs:
	@echo "$(PURPLE)Docs Service デプロイ中...$(NC)"
	@if kubectl get deployment docs-service -n petmatch >/dev/null 2>&1; then \
		echo "$(BLUE)既存デプロイメント再起動中...$(NC)"; \
		kubectl rollout restart deployment/docs-service -n petmatch; \
		kubectl rollout status deployment/docs-service -n petmatch --timeout=120s; \
	else \
		echo "$(BLUE)初回デプロイ実行中...$(NC)"; \
		kubectl apply -f k8s/services/docs-service.yaml; \
		kubectl wait --for=condition=Ready pod -l app=docs-service -n petmatch --timeout=120s; \
	fi
	@echo "$(GREEN)Docs Service デプロイ完了$(NC)"

deploy-match:
	@echo "$(PURPLE)Match Service デプロイ中...$(NC)"
	@if kubectl get deployment match-service -n petmatch >/dev/null 2>&1; then \
		echo "$(BLUE)既存デプロイメント再起動中...$(NC)"; \
		kubectl rollout restart deployment/match-service -n petmatch; \
		kubectl rollout status deployment/match-service -n petmatch --timeout=120s; \
	else \
		echo "$(BLUE)初回デプロイ実行中...$(NC)"; \
		kubectl apply -f k8s/services/match-service.yaml; \
		kubectl wait --for=condition=Ready pod -l app=match-service -n petmatch --timeout=120s; \
	fi
	@echo "$(GREEN)Match Service デプロイ完了$(NC)"

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

logs-match:
	@echo "$(YELLOW)Match Service ログ$(NC)"
	@kubectl logs -f deployment/match-service -n petmatch

logs-docs:
	@echo "$(YELLOW)Docs Service ログ$(NC)"
	@kubectl logs -f deployment/docs-service -n petmatch

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
	@cd services/match-service && go test ./... -v
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
	@echo "$(BLUE)PetMatch 完全セットアップ開始$(NC)"
	@$(MAKE) --no-print-directory _setup-minikube
	@$(MAKE) --no-print-directory _full-k8s-setup
	@$(MAKE) --no-print-directory _build-and-deploy-all
	@$(MAKE) --no-print-directory _wait-for-ready
	@echo "$(GREEN)SUCCESS セットアップ完了！make start で起動してください$(NC)"

# 一発セットアップ（確認なし）
setup-auto:
	@echo "$(BLUE)PetMatch 自動セットアップ開始$(NC)"
	@$(MAKE) --no-print-directory _setup-minikube
	@$(MAKE) --no-print-directory _full-k8s-setup
	@$(MAKE) --no-print-directory _build-and-deploy-all
	@$(MAKE) --no-print-directory _wait-for-ready
	@$(MAKE) --no-print-directory start
	@echo "$(GREEN)LAUNCH 全システム起動完了！$(NC)"

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
	@kubectl apply -f k8s/01-namespace-configmap.yaml 2>/dev/null || true
	@kubectl apply -f k8s/02-secrets.yaml 2>/dev/null || true
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
	@rm -f .pet-service.pid .auth-service.pid .user-service.pid .match-service.pid .api-gateway.pid .docs-service.pid 2>/dev/null || true
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
	@$(MAKE) --no-print-directory _ensure-minio-running

_start-port-forwards:
	@echo "$(CYAN)ポートフォワード開始中...$(NC)"
	@$(MAKE) --no-print-directory pid-cleanup
	@kubectl port-forward service/pet-service 8083:8083 -n petmatch >/dev/null 2>&1 & \
	echo $! > .pet-service.pid && echo "  Pet Service: 8083"
	@kubectl port-forward service/auth-service 18091:8081 -n petmatch >/dev/null 2>&1 & \
	echo $! > .auth-service.pid && echo "  Auth Service: 18091"
	@kubectl port-forward service/user-service 18092:8082 -n petmatch >/dev/null 2>&1 & \
	echo $! > .user-service.pid && echo "  User Service: 18092"
	@kubectl port-forward service/match-service 8084:8084 -n petmatch >/dev/null 2>&1 & \
	echo $! > .match-service.pid && echo "  Match Service: 8084"
	@kubectl port-forward service/api-gateway 8080:8080 -n petmatch >/dev/null 2>&1 & \
	echo $! > .api-gateway.pid && echo "  API Gateway: 8080"
	@kubectl port-forward service/docs-service 8090:8090 -n petmatch >/dev/null 2>&1 & \
	echo $! > .docs-service.pid && echo "  Docs Service: 8090"
	@sleep 3

_stop-port-forwards:
	@if [ -f .pet-service.pid ]; then \
		kill $(cat .pet-service.pid) 2>/dev/null && echo "$(GREEN)Pet Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .auth-service.pid ]; then \
		kill $(cat .auth-service.pid) 2>/dev/null && echo "$(GREEN)Auth Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .user-service.pid ]; then \
		kill $(cat .user-service.pid) 2>/dev/null && echo "$(GREEN)User Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .match-service.pid ]; then \
		kill $(cat .match-service.pid) 2>/dev/null && echo "$(GREEN)Match Service ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .api-gateway.pid ]; then \
		kill $(cat .api-gateway.pid) 2>/dev/null && echo "$(GREEN)API Gateway ポートフォワード停止$(NC)"; \
	fi
	@if [ -f .docs-service.pid ]; then \
		kill $(cat .docs-service.pid) 2>/dev/null && echo "$(GREEN)Docs Service ポートフォワード停止$(NC)"; \
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
	@printf "Docs Service (8090): "
	@curl -s -o /dev/null -w "$(GREEN)Status %{http_code}$(NC)\n" "http://localhost:8090/health" 2>/dev/null || echo "$(RED)FAIL$(NC)"

_health-check-external:
	@printf "Redis: "
	@kubectl exec -n petmatch deployment/redis -- redis-cli ping 2>/dev/null | grep -q PONG && echo "$(GREEN)OK$(NC)" || echo "$(RED)FAIL$(NC)"

_show-access-info:
	@echo ""
	@echo "$(WHITE)アクセス情報:$(NC)"
	@echo "Pet Service: http://localhost:8083"
	@echo "Auth Service: http://localhost:18091"
	@echo "User Service: http://localhost:18092"
	@echo "Match Service: http://localhost:8084"
	@echo "API Gateway: http://localhost:8080"
	@echo "Docs Service: http://localhost:8090"
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

# 内部ヘルパー関数（新規追加）
_full-k8s-setup:
	@echo "$(CYAN)Step 1 Namespace & ConfigMap...$(NC)"
	@kubectl apply -f k8s/01-namespace-configmap.yaml
	@echo "$(CYAN)Step 2 Secrets...$(NC)"
	@kubectl apply -f k8s/02-secrets.yaml
	@echo "$(CYAN)Step 3 Redis...$(NC)"
	@kubectl apply -f k8s/redis/
	@echo "$(CYAN)Step 4 MinIO...$(NC)"
	@kubectl apply -f k8s/minio/minio.yaml
	@echo "$(CYAN)Step 5 Services...$(NC)"
	@kubectl apply -f k8s/services/
	@echo "$(GREEN)OK Kubernetes リソース作成完了$(NC)"

_build-and-deploy-all:
	@echo "$(BLUE)BUILD Docker環境設定...$(NC)"
	@eval $(minikube docker-env)
	@echo "$(BLUE)BUILD 全イメージビルド...$(NC)"
	@eval $(minikube docker-env) && docker build -t petmatch/pet-service:latest -f services/pet-service/Dockerfile . --quiet
	@eval $(minikube docker-env) && docker build -t petmatch/auth-service:latest -f services/auth-service/Dockerfile . --quiet
	@eval $(minikube docker-env) && docker build -t petmatch/user-service:latest -f services/user-service/Dockerfile . --quiet
	@eval $(minikube docker-env) && docker build -t petmatch/match-service:latest -f services/match-service/Dockerfile . --quiet
	@eval $(minikube docker-env) && docker build -t petmatch/api-gateway:latest -f services/api-gateway/Dockerfile . --quiet
	@echo "$(GREEN)OK 全イメージビルド完了$(NC)"

_wait-for-ready:
	@echo "$(YELLOW)⏳ Redis & MinIO起動待ち（最大120秒）...$(NC)"
	@kubectl wait --for=condition=Ready pod -l app=redis -n petmatch --timeout=60s 2>/dev/null || true
	@kubectl wait --for=condition=Ready pod -l app=minio -n petmatch --timeout=60s 2>/dev/null || true
	@echo "$(YELLOW)⏳ 全Pod起動待ち（最大120秒）...$(NC)"
	@kubectl wait --for=condition=Ready pods --all -n petmatch --timeout=120s 2>/dev/null || true
	@echo "$(CYAN)STATS 最終状況:$(NC)"
	@kubectl get pods -n petmatch

# API Gateway 専用修復
fix-gateway:
	@echo "$(RED)FIX API Gateway 修復開始$(NC)"
	@eval $(minikube docker-env) && docker build -t petmatch/api-gateway:latest -f services/api-gateway/Dockerfile .
	@kubectl rollout restart deployment/api-gateway -n petmatch
	@kubectl rollout status deployment/api-gateway -n petmatch --timeout=60s
	@echo "$(GREEN)OK API Gateway 修復完了$(NC)"

_setup-minikube:
	@echo "$(CYAN)Minikube 確認中...$(NC)"
	@if ! minikube status >/dev/null 2>&1; then \
		echo "$(YELLOW)Minikube起動中...$(NC)"; \
		minikube start; \
	fi
	@echo "$(GREEN)OK Minikube 準備完了$(NC)"



# サンプルデータ生成 (デフォルト30匹)
sample-data:
	@echo "$(CYAN)PET PetMatch サンプルデータ生成$(NC)"
	@echo "$(WHITE)===============================$(NC)"
	@$(MAKE) --no-print-directory _ensure-sample-data-script
	@$(MAKE) --no-print-directory _check-api-ready
	@$(MAKE) --no-print-directory _show-existing-data
	@echo ""
	@echo "$(CYAN)30匹のペットサンプルデータを生成します$(NC)"
	@chmod +x scripts/generate-sample-data-working.sh
	@./scripts/generate-sample-data-working.sh "http://localhost:8083" "http://localhost:18091" 30
	@echo ""
	@$(MAKE) --no-print-directory _show-final-stats

sample-data-quick:
	@echo "$(CYAN)PET クイックサンプルデータ生成 (10匹)$(NC)"
	@$(MAKE) --no-print-directory _ensure-sample-data-script
	@$(MAKE) --no-print-directory _check-api-ready
	@chmod +x scripts/generate-sample-data-working.sh
	@./scripts/generate-sample-data-working.sh "http://localhost:8083" "http://localhost:18091" 10
	@$(MAKE) --no-print-directory _show-final-stats

sample-data-full:
	@echo "$(CYAN)PET 大量サンプルデータ生成 (100匹)$(NC)"
	@echo "$(YELLOW)WARNING  100匹の生成には時間がかかります$(NC)"
	@echo "$(YELLOW)続行しますか? [y/N]$(NC)"
	@read -p "" confirm && [ "$confirm" = "y" ] || [ "$confirm" = "Y" ] || ( echo "$(YELLOW)キャンセルしました$(NC)" && exit 1 )
	@$(MAKE) --no-print-directory _ensure-sample-data-script
	@$(MAKE) --no-print-directory _check-api-ready
	@chmod +x scripts/generate-sample-data-working.sh
	@./scripts/generate-sample-data-working.sh "http://localhost:8083" "http://localhost:18091" 100
	@$(MAKE) --no-print-directory _show-final-stats

sample-data-status:
	@echo "$(BLUE)STATS PetMatch データ状況$(NC)"
	@echo "$(WHITE)=====================$(NC)"
	@$(MAKE) --no-print-directory _check-api-ready-silent
	@echo ""
	@echo "$(CYAN)データ統計:$(NC)"
	@total=$(curl -s "http://localhost:8083/pets" 2>/dev/null | jq '.total // 0' 2>/dev/null || echo "0"); \
	echo "PET 総ペット数: $total 匹"
	@echo ""
	@echo "$(CYAN)種類別集計:$(NC)"
	@for species in dog cat bird rabbit hamster; do \
		count=$(curl -s "http://localhost:8083/pets?species=$species" 2>/dev/null | jq '.total // 0' 2>/dev/null || echo "0"); \
		case $species in \
			dog) emoji="dog" ;; \
			cat) emoji="cat" ;; \
			bird) emoji="bird" ;; \
			rabbit) emoji="rabbit" ;; \
			hamster) emoji="hamster" ;; \
		esac; \
		printf "  %s %-8s: %2d匹\n" "$emoji" "$species" "$count"; \
	done
	@echo ""
	@echo "$(CYAN)最新5匹:$(NC)"
	@curl -s "http://localhost:8083/pets?limit=5&sort=created_at:desc" 2>/dev/null | \
		jq -r '.pets[]? | "  • \(.name) (\(.species) - \(.breed))"' 2>/dev/null || \
		echo "$(YELLOW)  データ取得エラー$(NC)"

# デバッグ・テスト用
sample-data-debug:
	@echo "$(CYAN)DEBUG 認証デバッグテスト$(NC)"
	@chmod +x scripts/debug-auth-sample-data.sh
	@./scripts/debug-auth-sample-data.sh "http://localhost:8083" "http://localhost:18091" 5

auth-debug:
	@echo "$(CYAN)DEBUG 簡易認証デバッグ$(NC)"
	@chmod +x scripts/simple-auth-debug.sh
	@./scripts/simple-auth-debug.sh

sample-data-clean:
	@echo "$(RED)DELETE  サンプルデータ削除$(NC)"
	@echo "$(RED)警告: 全てのペットデータが削除されます$(NC)"
	@echo "$(RED)本当に削除しますか? [y/N]$(NC)"
	@read -p "" confirm && [ "$confirm" = "y" ] || [ "$confirm" = "Y" ] || ( echo "$(YELLOW)削除をキャンセルしました$(NC)" && exit 1 )
	@echo "$(YELLOW)Redis データ削除中...$(NC)"
	@kubectl exec deployment/redis -n petmatch -- redis-cli EVAL "for _,k in ipairs(redis.call('KEYS','pet:*')) do redis.call('DEL',k) end" 0 2>/dev/null || \
		echo "$(RED)Redis削除エラー$(NC)"
	@echo "$(GREEN)OK サンプルデータ削除完了$(NC)"

demo-ready:
	@echo "$(CYAN)LAUNCH PetMatch デモ環境完全セットアップ$(NC)"
	@echo "$(WHITE)======================================$(NC)"
	@echo ""
	@echo "$(CYAN)Step 1 システム起動確認...$(NC)"
	@if ! $(MAKE) --no-print-directory _check-system-ready 2>/dev/null; then \
		echo "$(YELLOW)システムを起動します...$(NC)"; \
		$(MAKE) --no-print-directory start; \
	else \
		echo "$(GREEN)OK システム稼働中$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Step 2 サンプルデータ生成...$(NC)"
	@$(MAKE) --no-print-directory sample-data
	@echo ""
	@echo "$(CYAN)Step 3 アクセス情報表示...$(NC)"
	@$(MAKE) --no-print-directory _show-demo-access-info
	@echo ""
	@echo "$(GREEN)SUCCESS デモ環境準備完了！$(NC)"

# ===============================
# サンプルデータ用内部ヘルパー
# ===============================

_ensure-sample-data-script:
	@if [ ! -f "scripts/generate-improved-sample-data.sh" ]; then \
		echo "$(RED)FAIL scripts/generate-improved-sample-data.sh が見つかりません$(NC)"; \
		echo "$(YELLOW)スクリプトを作成してください$(NC)"; \
		exit 1; \
	fi

_check-api-ready:
	@echo "$(CYAN)API API接続確認中...$(NC)"
	@if ! curl -s "http://localhost:8083/health" >/dev/null 2>&1; then \
		echo "$(RED)FAIL Pet Service (8083) に接続できません$(NC)"; \
		echo ""; \
		echo "$(YELLOW)FIX 解決手順:$(NC)"; \
		echo "  1. make status    - システム状況確認"; \
		echo "  2. make start     - システム起動"; \
		echo "  3. make logs-pet  - ログ確認"; \
		echo ""; \
		exit 1; \
	fi
	@echo "$(GREEN)OK API接続成功$(NC)"

_check-api-ready-silent:
	@curl -s "http://localhost:8083/health" >/dev/null 2>&1 || \
		( echo "$(RED)FAIL API未接続 - make start で起動してください$(NC)" && exit 1 )

_show-existing-data:
	@echo "$(CYAN)STATS 既存データ確認...$(NC)"
	@bash -c 'existing_pets=$$(curl -s "http://localhost:8083/pets" 2>/dev/null | jq ".total // 0" 2>/dev/null || echo "0"); \
	echo "PET 現在のペット数: $$existing_pets 匹"'

_show-final-stats:
	@echo ""
	@echo "$(GREEN)STATS 最終データ統計$(NC)"
	@echo "$(WHITE)==================$(NC)"
	@bash -c 'total=$$(curl -s "http://localhost:8083/pets" 2>/dev/null | jq ".total // 0" 2>/dev/null || echo "0"); \
	echo "PET 総ペット数: $$total 匹"'
	@echo ""
	@echo "$(CYAN)DEBUG 確認方法:$(NC)"
	@echo "  • データ状況: make sample-data-status"
	@echo "  • API直接: curl 'http://localhost:8083/pets'"
	@echo "  • Web UI: $(shell minikube service web-app-nodeport -n petmatch --url 2>/dev/null || echo 'N/A')"



_check-system-ready:
	@curl -s "http://localhost:8083/health" >/dev/null 2>&1

_show-demo-access-info:
	@echo "$(WHITE)WEB アクセス情報:$(NC)"
	@echo "  • Pet API: http://localhost:8083/pets"
	@echo "  • API Gateway: http://localhost:8080/api/pets"
	@web_url=$(minikube service web-app-nodeport -n petmatch --url 2>/dev/null || echo ""); \
	if [ -n "$web_url" ]; then \
		echo "  • Web App: $web_url"; \
	else \
		echo "  • Web App: N/A (make start で起動)"; \
	fi
	@echo "  • Docs Service: http://localhost:8090/ (make start で自動起動)"
	@echo ""
	@echo "$(WHITE)FIX 管理コマンド:$(NC)"
	@echo "  • データ確認: make sample-data-status"
	@echo "  • データ追加: make sample-data"
	@echo "  • データ削除: make sample-data-clean"
	@echo "  • システム停止: make stop"

# ===============================
# MinIO ストレージ機能
# ===============================

minio-deploy:
	@echo "$(PURPLE)STORAGE MinIO デプロイ$(NC)"
	@kubectl apply -f k8s/minio/minio.yaml
	@echo "$(YELLOW)WAIT MinIO Pod起動待ち...$(NC)"
	@kubectl wait --for=condition=Ready pod -l app=minio -n petmatch --timeout=120s
	@echo "$(GREEN)OK MinIO デプロイ完了$(NC)"

minio-setup:
	@echo "$(PURPLE)FIX MinIO セットアップ$(NC)"
	@kubectl delete job minio-setup -n petmatch 2>/dev/null || true
	@kubectl apply -f k8s/minio/minio-setup.yaml
	@echo "$(YELLOW)WAIT セットアップ完了待ち...$(NC)"
	@kubectl wait --for=condition=Complete job/minio-setup -n petmatch --timeout=60s
	@echo "$(CYAN)STATS セットアップログ:$(NC)"
	@kubectl logs job/minio-setup -n petmatch
	@echo "$(GREEN)OK MinIO セットアップ完了$(NC)"

minio-console:
	@echo "$(CYAN)CONSOLE MinIO コンソールアクセス$(NC)"
	@echo "$(WHITE)URL: $(shell minikube service minio-console -n petmatch --url 2>/dev/null || echo 'N/A')$(NC)"
	@echo "$(WHITE)クレデンシャル:$(NC)"
	@echo "  Username: minioadmin"
	@echo "  Password: minioadmin"
	@echo ""
	@echo "$(YELLOW)ブラウザで上記URLを開いてアクセスしてください$(NC)"

minio-logs:
	@echo "$(YELLOW)MinIO ログ$(NC)"
	@kubectl logs -f deployment/minio -n petmatch

# ===============================
# 内部ヘルパー関数（MinIO確認）
# ===============================

_ensure-minio-running:
	@echo "$(CYAN)MinIO状況確認中...$(NC)"
	@if ! kubectl get pod -l app=minio -n petmatch >/dev/null 2>&1; then \
		echo "$(YELLOW)MinIOが見つかりません。デプロイ中...$(NC)"; \
		kubectl apply -f k8s/minio/minio.yaml; \
		echo "$(YELLOW)MinIO起動待ち...$(NC)"; \
		kubectl wait --for=condition=Ready pod -l app=minio -n petmatch --timeout=120s 2>/dev/null || true; \
	else \
		if ! kubectl get pod -l app=minio -n petmatch | grep -q "Running"; then \
			echo "$(YELLOW)MinIO起動待ち...$(NC)"; \
			kubectl wait --for=condition=Ready pod -l app=minio -n petmatch --timeout=120s 2>/dev/null || true; \
		else \
			echo "$(GREEN)MinIO 稼働中$(NC)"; \
		fi; \
	fi

_ensure-dependencies-ready:
	@echo "$(CYAN)依存関係確認中...$(NC)"
	@echo "$(BLUE)Redis確認...$(NC)"
	@kubectl wait --for=condition=Ready pod -l app=redis -n petmatch --timeout=60s 2>/dev/null || \
		(echo "$(RED)Redis起動失敗$(NC)" && exit 1)
	@echo "$(BLUE)MinIO確認...$(NC)"
	@kubectl wait --for=condition=Ready pod -l app=minio -n petmatch --timeout=60s 2>/dev/null || \
		(echo "$(RED)MinIO起動失敗$(NC)" && exit 1)
	@echo "$(GREEN)依存関係準備完了$(NC)"

_restart-pet-service-safe:
	@echo "$(PURPLE)Pet Service安全再起動中...$(NC)"
	@$(MAKE) --no-print-directory _ensure-dependencies-ready
	@kubectl rollout restart deployment/pet-service -n petmatch
	@kubectl rollout status deployment/pet-service -n petmatch --timeout=120s
	@echo "$(GREEN)Pet Service安全再起動完了$(NC)"
