# PetMatch Kubernetes Development Makefile

.PHONY: help start stop health build-all build-api build-pet build-web deploy-all logs clean

# Default target
help:
	@echo "🐾 PetMatch Kubernetes 開発コマンド"
	@echo "=================================="
	@echo ""
	@echo "🚀 開発環境:"
	@echo "  make start     - ポートフォワード起動 (API Gateway + Pet Service)"
	@echo "  make stop      - ポートフォワード停止"
	@echo "  make health    - システムヘルスチェック"
	@echo ""
	@echo "🏗️ ビルド・デプロイ:"
	@echo "  make build-all - 全サービスをビルド"
	@echo "  make build-api - API Gatewayをビルド"
	@echo "  make build-pet - Pet Serviceをビルド"
	@echo "  make build-web - Web Appをビルド"
	@echo "  make deploy    - 全サービスを再デプロイ"
	@echo ""
	@echo "🔍 監視・ログ:"
	@echo "  make logs      - 全サービスのログ表示"
	@echo "  make logs-api  - API Gatewayログ"
	@echo "  make logs-pet  - Pet Serviceログ"
	@echo "  make logs-web  - Web Appログ"
	@echo ""
	@echo "🧹 クリーンアップ:"
	@echo "  make clean     - 不要なリソースを削除"

# ポートフォワード起動
start:
	@echo "🚀 PetMatch ポートフォワード起動中..."
	@if ! minikube status > /dev/null 2>&1; then \
		echo "⚠️ Minikubeが起動していません"; \
		echo "起動コマンド: minikube start"; \
		exit 1; \
	fi
	@echo "📊 Pod状況確認中..."
	@kubectl get pods -n petmatch
	@echo ""
	@echo "🔗 ポートフォワード開始..."
	@echo "API Gateway (18081:8080) 起動中..."
	@kubectl port-forward service/api-gateway 18081:8080 -n petmatch > /dev/null 2>&1 & \
	echo $$! > .api-gateway.pid
	@echo "Pet Service (8083:8083) 起動中..."
	@kubectl port-forward service/pet-service 8083:8083 -n petmatch > /dev/null 2>&1 & \
	echo $$! > .pet-service.pid
	@sleep 3
	@echo ""
	@echo "🏥 ヘルスチェック..."
	@curl -s -o /dev/null -w "API Gateway: %{http_code}\n" "http://localhost:18081/health" || echo "API Gateway: ❌ 失敗"
	@curl -s -o /dev/null -w "Pet Service: %{http_code}\n" "http://localhost:8083/health" || echo "Pet Service: ❌ 失敗"
	@echo ""
	@echo "✅ ポートフォワード起動完了"
	@echo "🌐 アクセスURL:"
	@echo "Web App: $$(minikube service web-app-nodeport -n petmatch --url 2>/dev/null)"
	@echo "API Gateway: http://localhost:18081"
	@echo "Pet Service: http://localhost:8083"
	@echo ""
	@echo "⏹️ 停止方法: make stop"

# ポートフォワード停止
stop:
	@echo "⏹️ PetMatch ポートフォワード停止中..."
	@if [ -f .api-gateway.pid ]; then \
		kill $$(cat .api-gateway.pid) 2>/dev/null && echo "✅ API Gateway ポートフォワード停止"; \
		rm -f .api-gateway.pid; \
	fi
	@if [ -f .pet-service.pid ]; then \
		kill $$(cat .pet-service.pid) 2>/dev/null && echo "✅ Pet Service ポートフォワード停止"; \
		rm -f .pet-service.pid; \
	fi
	@pkill -f "kubectl port-forward.*api-gateway.*18081" 2>/dev/null || true
	@pkill -f "kubectl port-forward.*pet-service.*8083" 2>/dev/null || true
	@echo "🏁 全てのポートフォワードを停止しました"

# ヘルスチェック
health:
	@echo "🏥 PetMatch システム ヘルスチェック"
	@echo "=================================="
	@echo ""
	@echo "🔧 Minikube状況:"
	@minikube status || echo "❌ Minikube停止中"
	@echo ""
	@echo "📊 Kubernetes Pod状況:"
	@kubectl get pods -n petmatch
	@echo ""
	@echo "🌐 サービス状況:"
	@kubectl get services -n petmatch
	@echo ""
	@echo "🔗 ポートフォワード確認:"
	@WEB_URL=$$(minikube service web-app-nodeport -n petmatch --url 2>/dev/null); \
	if [ ! -z "$$WEB_URL" ]; then \
		echo "Web App: $$WEB_URL"; \
		curl -s -o /dev/null -w "Status: %{http_code} " "$$WEB_URL" 2>/dev/null && echo "✅" || echo "❌"; \
	else \
		echo "Web App: ❌ URL取得失敗"; \
	fi
	@printf "API Gateway: http://localhost:18081 - "
	@curl -s -o /dev/null -w "Status: %{http_code} " "http://localhost:18081/health" 2>/dev/null && echo "✅" || echo "❌"
	@printf "Pet Service: http://localhost:8083 - "
	@curl -s -o /dev/null -w "Status: %{http_code} " "http://localhost:8083/health" 2>/dev/null && echo "✅" || echo "❌"
	@echo ""
	@echo "🗄️ Redis接続確認:"
	@kubectl exec deployment/redis -n petmatch -- redis-cli -a petmatch123 ping 2>/dev/null | grep -q PONG && echo "✅ Redis接続OK" || echo "❌ Redis接続失敗"
	@echo ""
	@echo "📸 画像アップロード機能確認:"
	@IMAGE_COUNT=$$(kubectl exec deployment/redis -n petmatch -- redis-cli -a petmatch123 KEYS "pet_image:*" 2>/dev/null | wc -l); \
	echo "アップロード済み画像: $$IMAGE_COUNT 件"

# Docker環境設定
docker-env:
	@eval $$(minikube docker-env)

# 全サービスビルド
build-all: docker-env build-api build-pet build-web

# API Gatewayビルド
build-api:
	@echo "🏗️ API Gateway ビルド中..."
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/api-gateway:latest -f services/api-gateway/Dockerfile .

# Pet Serviceビルド
build-pet:
	@echo "🏗️ Pet Service ビルド中..."
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/pet-service:latest -f services/pet-service/Dockerfile .

# Web Appビルド
build-web:
	@echo "🏗️ Web App ビルド中..."
	@eval $$(minikube docker-env) && \
	docker build -t petmatch/web-app:latest -f web-app/Dockerfile ./web-app

# 全サービス再デプロイ
deploy: deploy-api deploy-pet deploy-web

# API Gateway再デプロイ
deploy-api:
	@echo "🚀 API Gateway 再デプロイ中..."
	@kubectl rollout restart deployment/api-gateway -n petmatch
	@kubectl rollout status deployment/api-gateway -n petmatch

# Pet Service再デプロイ
deploy-pet:
	@echo "🚀 Pet Service 再デプロイ中..."
	@kubectl rollout restart deployment/pet-service -n petmatch
	@kubectl rollout status deployment/pet-service -n petmatch

# Web App再デプロイ
deploy-web:
	@echo "🚀 Web App 再デプロイ中..."
	@kubectl rollout restart deployment/web-app -n petmatch
	@kubectl rollout status deployment/web-app -n petmatch

# ログ表示
logs:
	@echo "📋 全サービスログ監視中... (Ctrl+C で停止)"
	@kubectl logs -f deployment/api-gateway -n petmatch --prefix=true &
	@kubectl logs -f deployment/pet-service -n petmatch --prefix=true &
	@kubectl logs -f deployment/web-app -n petmatch --prefix=true &
	@wait

# API Gatewayログ
logs-api:
	@kubectl logs -f deployment/api-gateway -n petmatch

# Pet Serviceログ
logs-pet:
	@kubectl logs -f deployment/pet-service -n petmatch

# Web Appログ
logs-web:
	@kubectl logs -f deployment/web-app -n petmatch

# Redis CLI
redis-cli:
	@kubectl exec -it deployment/redis -n petmatch -- redis-cli -a petmatch123

# クリーンアップ
clean:
	@echo "🧹 クリーンアップ中..."
	@rm -f .api-gateway.pid .pet-service.pid
	@docker image prune -f
	@echo "✅ クリーンアップ完了"

# 開発環境セットアップ
setup:
	@echo "🛠️ PetMatch 開発環境セットアップ"
	@echo "1. Minikube起動中..."
	@minikube start
	@echo "2. 必要なリソース適用中..."
	@kubectl apply -f k8s/ -R
	@echo "3. Pod起動待機中..."
	@kubectl wait --for=condition=ready pod --all -n petmatch --timeout=300s
	@echo "✅ セットアップ完了! 'make start' でポートフォワードを開始してください"

# 開発環境の完全リセット
reset:
	@echo "⚠️ 開発環境を完全リセットします"
	@read -p "続行しますか? [y/N]: " confirm && [ "$$confirm" = "y" ]
	@make stop
	@kubectl delete namespace petmatch --ignore-not-found=true
	@minikube stop
	@minikube delete
	@echo "🔄 リセット完了! 'make setup' で再セットアップしてください"
