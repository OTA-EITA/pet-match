#!/bin/bash

# Pet Service Status 000 修復スクリプト
set -e

echo "🔧 Pet Service 修復開始..."
echo "================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 現在の状況確認
echo -e "${BLUE}1. 現在の状況確認${NC}"
echo "Pod 状況:"
kubectl get pods -n petmatch -l app=pet-service || echo "Pod 取得エラー"

echo -e "\nService 状況:"
kubectl get svc -n petmatch pet-service || echo "Service 取得エラー"

echo -e "\nPort-forward プロセス:"
ps aux | grep "kubectl port-forward.*pet-service" | grep -v grep || echo "Port-forward プロセスなし"

# 2. ログ確認
echo -e "\n${BLUE}2. エラーログ確認${NC}"
echo "最新ログ（直近10行）:"
kubectl logs -n petmatch deployment/pet-service --tail=10 || echo "ログ取得エラー"

# 3. Pod 詳細状況
echo -e "\n${BLUE}3. Pod 詳細状況${NC}"
kubectl describe pod -n petmatch -l app=pet-service | grep -A 5 -B 5 "Ready\|State\|Restart\|Event" || echo "Pod詳細取得エラー"

# 4. 修復開始
echo -e "\n${YELLOW}4. 修復処理開始${NC}"

# Port-forward 停止
echo "Port-forward プロセス停止中..."
pkill -f "kubectl port-forward.*pet-service" 2>/dev/null || true
rm -f .pet-service.pid 2>/dev/null || true

# Pod 再起動
echo "Pet Service Pod 再起動中..."
kubectl rollout restart deployment/pet-service -n petmatch

# 起動待ち
echo "Pod 起動待ち（最大60秒）..."
kubectl rollout status deployment/pet-service -n petmatch --timeout=60s

# 5. Port-forward 再開
echo -e "\n${BLUE}5. Port-forward 再開${NC}"
kubectl port-forward service/pet-service 8083:8083 -n petmatch >/dev/null 2>&1 &
PID=$!
echo $PID > .pet-service.pid
echo "Port-forward 起動 (PID: $PID)"

# 接続テスト待ち
sleep 5

# 6. ヘルスチェック
echo -e "\n${BLUE}6. 修復確認${NC}"
if curl -s "http://localhost:8083/health" >/dev/null 2>&1; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8083/health")
    echo -e "${GREEN}✅ Pet Service 復旧成功！ Status: $STATUS${NC}"
    
    # API テスト
    echo "API 接続テスト:"
    PETS_RESPONSE=$(curl -s "http://localhost:8083/pets?limit=1" 2>/dev/null)
    if echo "$PETS_RESPONSE" | grep -q "pets"; then
        echo -e "${GREEN}✅ Pets API 正常動作${NC}"
    else
        echo -e "${YELLOW}⚠️ Pets API レスポンス要確認${NC}"
        echo "Response: $PETS_RESPONSE"
    fi
else
    echo -e "${RED}❌ Pet Service まだ接続できません${NC}"
    echo "追加デバッグ情報:"
    kubectl get pods -n petmatch -l app=pet-service
    kubectl logs -n petmatch deployment/pet-service --tail=5
fi

echo -e "\n${BLUE}修復完了${NC}"
echo "================================="
echo "Pet Service: http://localhost:8083"
echo "Health Check: curl http://localhost:8083/health"
echo "Pets API: curl http://localhost:8083/pets"
