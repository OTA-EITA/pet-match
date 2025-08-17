#!/bin/bash

# Pet Service Status 000 緊急修復スクリプト
set -e

echo "🚨 Pet Service Status 000 緊急修復"
echo "================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 1. 現状診断
echo -e "${BLUE}📊 現状診断${NC}"
echo "Pod 状況:"
kubectl get pods -n petmatch | grep -E "(NAME|pet-service|redis)"

echo -e "\nService 状況:"
kubectl get svc -n petmatch | grep -E "(NAME|pet-service|redis)"

# 2. Pet Service ログ確認
echo -e "\n${BLUE}📝 Pet Service ログ確認${NC}"
echo "最新エラーログ:"
kubectl logs -n petmatch deployment/pet-service --tail=10 || echo "ログ取得失敗"

# 3. Redis 状況確認
echo -e "\n${BLUE}🔍 Redis 状況確認${NC}"
echo "Redis Pod 状況:"
kubectl get pods -n petmatch -l app=redis

echo "Redis 接続テスト:"
if kubectl exec -n petmatch deployment/redis -- redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✅ Redis 正常動作${NC}"
else
    echo -e "${RED}❌ Redis 接続失敗${NC}"
fi

# 4. Pet Service 強制修復
echo -e "\n${YELLOW}🔧 Pet Service 強制修復開始${NC}"

# Pet Service Pod 削除
echo "Pet Service Pod 削除中..."
kubectl delete pods -n petmatch -l app=pet-service --force --grace-period=0

# 新しい Pod の起動待ち
echo "新しい Pod 起動待ち..."
kubectl wait --for=condition=Ready pod -l app=pet-service -n petmatch --timeout=120s

# 5. Port-forward リセット
echo -e "\n${BLUE}🔄 Port-forward リセット${NC}"
# Pet Service port-forward 停止
pkill -f "kubectl port-forward.*pet-service" 2>/dev/null || true
rm -f .pet-service.pid 2>/dev/null || true

# Pet Service port-forward 再開
kubectl port-forward service/pet-service 8083:8083 -n petmatch >/dev/null 2>&1 &
PET_PID=$!
echo $PET_PID > .pet-service.pid
echo "Pet Service port-forward 再開 (PID: $PET_PID)"

# 接続待ち
echo "接続確立待ち..."
sleep 10

# 6. 修復確認
echo -e "\n${GREEN}✅ 修復確認${NC}"
echo "================================="

# Health check
printf "Pet Service Health: "
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8083/health" 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}OK (200)${NC}"
    
    # API テスト
    printf "Pets API Test: "
    if curl -s "http://localhost:8083/pets" 2>/dev/null | grep -q "pets"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}レスポンス確認必要${NC}"
    fi
    
    echo -e "\n${GREEN}🎉 Pet Service 修復成功！${NC}"
    
else
    echo -e "${RED}FAIL${NC}"
    echo -e "\n${RED}❌ 修復失敗 - 追加診断が必要${NC}"
    
    # 追加診断
    echo -e "\n${YELLOW}追加診断情報:${NC}"
    echo "Pod 詳細状況:"
    kubectl describe pod -n petmatch -l app=pet-service | grep -A 10 -B 5 "Events:"
    
    echo -e "\n最新ログ:"
    kubectl logs -n petmatch deployment/pet-service --tail=5
fi

echo -e "\n${CYAN}アクセス情報:${NC}"
echo "Pet Service: http://localhost:8083"
echo "Health Check: curl http://localhost:8083/health"
echo "Pets API: curl http://localhost:8083/pets"

echo -e "\n${CYAN}次のステップ:${NC}"
echo "1. 成功した場合: make sample-data でサンプルデータ投入"
echo "2. まだ失敗する場合: kubectl logs -n petmatch deployment/pet-service -f"
echo "3. 完全リセット: make clean-pods && make deploy-all"
