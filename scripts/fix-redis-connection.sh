#!/bin/bash

# Redis 接続問題修復スクリプト
set -e

echo "🔧 Redis 接続問題修復開始..."
echo "=================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Redis Pod 状況確認
echo -e "${BLUE}1. Redis Pod 状況確認${NC}"
kubectl get pods -n petmatch -l app=redis || {
    echo -e "${RED}❌ Redis Pod が見つかりません${NC}"
    echo "Redis をデプロイします..."
    kubectl apply -f k8s/redis/
    kubectl wait --for=condition=Ready pod -l app=redis -n petmatch --timeout=60s
}

# 2. Redis 接続テスト
echo -e "\n${BLUE}2. Redis 接続テスト${NC}"
if kubectl exec -n petmatch deployment/redis -- redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✅ Redis 正常動作中${NC}"
else
    echo -e "${RED}❌ Redis 接続エラー${NC}"
    echo "Redis Pod のログ:"
    kubectl logs -n petmatch deployment/redis --tail=10
    exit 1
fi

# 3. Redis port-forward セットアップ
echo -e "\n${BLUE}3. Redis Port-forward セットアップ${NC}"

# 既存のport-forwardを停止
pkill -f "kubectl port-forward.*redis" 2>/dev/null || true

# Redis port-forward 開始
kubectl port-forward service/redis 6379:6379 -n petmatch >/dev/null 2>&1 &
REDIS_PID=$!
echo $REDIS_PID > .redis-port-forward.pid
echo "Redis port-forward 開始 (PID: $REDIS_PID)"

# 接続待ち
sleep 3

# 4. ローカル Redis 接続テスト
echo -e "\n${BLUE}4. ローカル Redis 接続テスト${NC}"
if redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✅ ローカル Redis 接続成功${NC}"
else
    echo -e "${YELLOW}⚠️ redis-cli がインストールされていないか、接続に失敗${NC}"
    echo "curl でテスト中..."
    if nc -z localhost 6379 2>/dev/null; then
        echo -e "${GREEN}✅ Redis ポート接続確認${NC}"
    else
        echo -e "${RED}❌ Redis ポート接続失敗${NC}"
    fi
fi

# 5. Pet Service 環境設定確認
echo -e "\n${BLUE}5. Pet Service 環境設定確認${NC}"
echo "現在の .env 設定:"
grep -E "REDIS_HOST|REDIS_PORT|REDIS_PASSWORD" .env || echo "Redis 設定が見つかりません"

echo -e "\n${BLUE}6. Pet Service テスト${NC}"
echo "Pet Service ディレクトリに移動してテスト実行..."

cd services/pet-service

# 環境変数設定してテスト
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=""
export PORT=8083

echo "環境変数設定:"
echo "  REDIS_HOST=$REDIS_HOST"
echo "  REDIS_PORT=$REDIS_PORT"
echo "  PORT=$PORT"

echo -e "\n${YELLOW}Pet Service を起動テスト中... (Ctrl+C で停止)${NC}"
echo "別のターミナルで以下を実行してください:"
echo "  cd /Users/ota-eita/Documents/work/pet-match/services/pet-service"
echo "  export REDIS_HOST=localhost && export REDIS_PORT=6379 && export PORT=8083"
echo "  go run main.go"

cd ../..

echo -e "\n${GREEN}Redis 接続修復完了${NC}"
echo "=================================="
echo ""
echo -e "${CYAN}次のステップ:${NC}"
echo "1. 新しいターミナルでPet Serviceを起動:"
echo "   cd services/pet-service"
echo "   export REDIS_HOST=localhost && export REDIS_PORT=6379 && export PORT=8083"
echo "   go run main.go"
echo ""
echo "2. または、Kubernetes環境で起動:"
echo "   make build-pet"
echo "   make deploy-pet"
echo "   make start"
echo ""
echo -e "${YELLOW}注意: Redis port-forward (PID: $REDIS_PID) が実行中です${NC}"
echo "停止する場合: kill $REDIS_PID"
