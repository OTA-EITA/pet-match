#!/bin/bash

# PetMatch システム全体診断・修復スクリプト
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 PetMatch システム診断開始${NC}"
echo "============================================"

# 関数定義
check_service() {
    local service_name=$1
    local port=$2
    local display_name=$3
    
    printf "%-20s: " "$display_name"
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" 2>/dev/null | grep -q "200"; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        return 1
    fi
}

# 1. Minikube 状況確認
echo -e "\n${BLUE}1. Minikube 状況${NC}"
if minikube status >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Minikube 起動中${NC}"
else
    echo -e "${RED}❌ Minikube 停止中${NC}"
    echo "修復: minikube start"
    exit 1
fi

# 2. Kubernetes Pods 確認
echo -e "\n${BLUE}2. Kubernetes Pods 状況${NC}"
kubectl get pods -n petmatch 2>/dev/null || {
    echo -e "${RED}❌ Namespace 'petmatch' が見つかりません${NC}"
    echo "修復: make k8s-apply"
    exit 1
}

# 3. Services 確認
echo -e "\n${BLUE}3. Kubernetes Services 状況${NC}"
kubectl get svc -n petmatch 2>/dev/null || {
    echo -e "${RED}❌ Services が見つかりません${NC}"
    exit 1
}

# 4. Port-forward プロセス確認
echo -e "\n${BLUE}4. Port-forward プロセス状況${NC}"
PORTFORWARD_COUNT=$(ps aux | grep -E "kubectl port-forward.*petmatch" | grep -v grep | wc -l)
echo "アクティブなport-forward: $PORTFORWARD_COUNT 個"

if [ "$PORTFORWARD_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Port-forward プロセスがありません${NC}"
    echo "修復: make start"
fi

# 5. 各サービスのヘルスチェック
echo -e "\n${BLUE}5. サービス ヘルスチェック${NC}"

failed_services=0

if ! check_service "pet-service" "8083" "Pet Service"; then
    ((failed_services++))
fi

if ! check_service "auth-service" "18091" "Auth Service"; then
    ((failed_services++))
fi

if ! check_service "user-service" "18092" "User Service"; then
    ((failed_services++))
fi

if ! check_service "api-gateway" "8080" "API Gateway"; then
    ((failed_services++))
fi

# 6. Redis 接続確認
echo -e "\n${BLUE}6. Redis 接続確認${NC}"
printf "Redis Connection: "
if kubectl exec -n petmatch deployment/redis -- redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    ((failed_services++))
fi

# 7. 診断結果とレコメンデーション
echo -e "\n${BLUE}7. 診断結果${NC}"
echo "============================================"

if [ $failed_services -eq 0 ]; then
    echo -e "${GREEN}✅ 全システム正常動作中${NC}"
    echo ""
    echo "アクセス情報:"
    echo "  • Pet Service: http://localhost:8083"
    echo "  • Auth Service: http://localhost:18091"
    echo "  • User Service: http://localhost:18092"
    echo "  • API Gateway: http://localhost:8080"
    echo ""
    echo "サンプルデータ確認: make sample-data-status"
else
    echo -e "${RED}❌ $failed_services 個のサービスに問題があります${NC}"
    echo ""
    echo -e "${YELLOW}修復手順:${NC}"
    
    if ! check_service "pet-service" "8083" "Pet Service" >/dev/null 2>&1; then
        echo "  1. Pet Service 修復: ./scripts/fix-pet-service.sh"
    fi
    
    if [ $failed_services -gt 1 ]; then
        echo "  2. 全サービス再起動: make stop && make start"
        echo "  3. 完全リセット: make clean-pods && make deploy-all"
    fi
    
    echo ""
    echo -e "${YELLOW}ログ確認コマンド:${NC}"
    echo "  • Pet Service: make logs-pet"
    echo "  • Auth Service: make logs-auth"
    echo "  • API Gateway: make logs-gateway"
    echo ""
    echo -e "${YELLOW}個別修復コマンド:${NC}"
    echo "  • make build-pet && make deploy-pet"
    echo "  • make build-auth && make deploy-auth"
    echo "  • make build-gateway && make deploy-gateway"
fi

# 8. 自動修復オプション
if [ $failed_services -gt 0 ]; then
    echo ""
    echo -e "${CYAN}自動修復を実行しますか? [y/N]${NC}"
    read -p "" confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo -e "\n${YELLOW}🔧 自動修復開始...${NC}"
        
        # Port-forward リセット
        echo "1. Port-forward リセット..."
        pkill -f "kubectl port-forward.*petmatch" 2>/dev/null || true
        rm -f .*.pid 2>/dev/null || true
        
        # 問題のあるサービス再起動
        if ! check_service "pet-service" "8083" "Pet Service" >/dev/null 2>&1; then
            echo "2. Pet Service 再起動..."
            kubectl rollout restart deployment/pet-service -n petmatch
        fi
        
        if ! check_service "auth-service" "18091" "Auth Service" >/dev/null 2>&1; then
            echo "3. Auth Service 再起動..."
            kubectl rollout restart deployment/auth-service -n petmatch
        fi
        
        if ! check_service "user-service" "18092" "User Service" >/dev/null 2>&1; then
            echo "4. User Service 再起動..."
            kubectl rollout restart deployment/user-service -n petmatch
        fi
        
        if ! check_service "api-gateway" "8080" "API Gateway" >/dev/null 2>&1; then
            echo "5. API Gateway 再起動..."
            kubectl rollout restart deployment/api-gateway -n petmatch
        fi
        
        # 起動待ち
        echo "6. サービス起動待ち..."
        kubectl wait --for=condition=Ready pods --all -n petmatch --timeout=120s
        
        # Port-forward 再開
        echo "7. Port-forward 再開..."
        make start >/dev/null 2>&1 &
        sleep 10
        
        # 再チェック
        echo -e "\n${BLUE}修復結果確認:${NC}"
        check_service "pet-service" "8083" "Pet Service"
        check_service "auth-service" "18091" "Auth Service"
        check_service "user-service" "18092" "User Service"
        check_service "api-gateway" "8080" "API Gateway"
        
        echo -e "\n${GREEN}自動修復完了${NC}"
    else
        echo -e "${YELLOW}自動修復をスキップしました${NC}"
    fi
fi

echo ""
echo -e "${CYAN}診断完了${NC}"
