#!/bin/bash

# Pet Service ローカル起動スクリプト
set -e

echo "🚀 Pet Service ローカル起動"
echo "============================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Redis port-forward 確認・開始
echo -e "${BLUE}1. Redis 接続確認${NC}"

# Redis port-forward が動いているかチェック
if ! pgrep -f "kubectl port-forward.*redis" >/dev/null; then
    echo "Redis port-forward を開始中..."
    kubectl port-forward service/redis 6379:6379 -n petmatch >/dev/null 2>&1 &
    REDIS_PID=$!
    echo $REDIS_PID > .redis-port-forward.pid
    echo "Redis port-forward 開始 (PID: $REDIS_PID)"
    sleep 3
else
    echo -e "${GREEN}✅ Redis port-forward 既に実行中${NC}"
fi

# Redis 接続テスト
if nc -z localhost 6379 2>/dev/null; then
    echo -e "${GREEN}✅ Redis 接続確認完了${NC}"
else
    echo -e "${RED}❌ Redis 接続失敗${NC}"
    echo "make start を実行してKubernetes環境を起動してください"
    exit 1
fi

# 2. Pet Service ディレクトリに移動
echo -e "\n${BLUE}2. Pet Service 起動準備${NC}"
cd services/pet-service

# 3. 環境変数設定
echo "環境変数設定中..."
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=""
export PORT=8083
export APP_ENV=development

# MinIO 設定（オプション）
export MINIO_ENDPOINT=localhost:9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin

echo "設定完了:"
echo "  REDIS_HOST=$REDIS_HOST"
echo "  REDIS_PORT=$REDIS_PORT"
echo "  PORT=$PORT"
echo "  APP_ENV=$APP_ENV"

# 4. Pet Service 起動
echo -e "\n${BLUE}3. Pet Service 起動${NC}"
echo -e "${YELLOW}Pet Service を起動しています...${NC}"
echo -e "${YELLOW}停止する場合は Ctrl+C を押してください${NC}"
echo ""

# Go依存関係の確認
if [ ! -f "go.mod" ]; then
    echo -e "${RED}❌ go.mod が見つかりません${NC}"
    echo "プロジェクトルートディレクトリから実行してください"
    exit 1
fi

# Pet Service 起動
go run main.go
