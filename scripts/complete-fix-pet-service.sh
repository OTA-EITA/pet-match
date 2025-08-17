#!/bin/bash

# Pet Service Redis 設定修正 & 完全修復
set -e

echo "🔧 Pet Service Redis設定 完全修復"
echo "=================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Kubernetes内でのRedis接続確認
echo -e "${BLUE}1. Kubernetes Redis 接続確認${NC}"

echo "Redis Service 確認:"
kubectl get svc -n petmatch redis

echo "Redis Endpoint 確認:"
kubectl get endpoints -n petmatch redis

# 2. Pet Service の環境変数確認
echo -e "\n${BLUE}2. Pet Service 環境変数確認${NC}"
echo "現在の ConfigMap:"
kubectl get configmap -n petmatch petmatch-config -o yaml | grep -A 5 -B 5 REDIS

# 3. Pet Service Pod内でのRedis接続テスト
echo -e "\n${BLUE}3. Pet Service Pod内 Redis接続テスト${NC}"
echo "Pod内から Redis サービスへの接続テスト:"

POD_NAME=$(kubectl get pods -n petmatch -l app=pet-service -o jsonpath='{.items[0].metadata.name}')
echo "Pet Service Pod: $POD_NAME"

if [ -n "$POD_NAME" ]; then
    echo "Pod内からの接続テスト:"
    kubectl exec -n petmatch $POD_NAME -- sh -c "echo 'PING' | nc redis 6379" 2>/dev/null || {
        echo -e "${RED}❌ Pod内からRedisに接続できません${NC}"
    }
else
    echo -e "${RED}❌ Pet Service Pod が見つかりません${NC}"
fi

# 4. ConfigMap 修正
echo -e "\n${BLUE}4. Redis設定 修正${NC}"

# ConfigMapでRedis設定を確実に修正
kubectl patch configmap petmatch-config -n petmatch --patch '
data:
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"
  REDIS_PASSWORD: ""
  REDIS_DB: "0"
'

echo -e "${GREEN}✅ ConfigMap 更新完了${NC}"

# 5. Pet Service 完全再ビルド & 再デプロイ
echo -e "\n${BLUE}5. Pet Service 完全再構築${NC}"

# Docker イメージ再ビルド
echo "Pet Service イメージ再ビルド中..."
eval $(minikube docker-env)
docker build -t petmatch/pet-service:latest -f services/pet-service/Dockerfile . --no-cache

# デプロイメント更新
echo "デプロイメント更新中..."
kubectl patch deployment pet-service -n petmatch -p '
{
  "spec": {
    "template": {
      "metadata": {
        "annotations": {
          "kubectl.kubernetes.io/restartedAt": "'$(date +%Y-%m-%dT%H:%M:%S)'"
        }
      },
      "spec": {
        "containers": [
          {
            "name": "pet-service",
            "env": [
              {"name": "REDIS_HOST", "value": "redis"},
              {"name": "REDIS_PORT", "value": "6379"}, 
              {"name": "REDIS_PASSWORD", "value": ""},
              {"name": "REDIS_DB", "value": "0"}
            ]
          }
        ]
      }
    }
  }
}'

# デプロイメント状況確認
echo "デプロイメント完了待ち..."
kubectl rollout status deployment/pet-service -n petmatch --timeout=120s

# 6. 新しいPort-forward設定
echo -e "\n${BLUE}6. Port-forward 再設定${NC}"

# 既存のport-forward停止
pkill -f "kubectl port-forward.*pet-service" 2>/dev/null || true
rm -f .pet-service.pid 2>/dev/null || true

# 新しいport-forward開始
kubectl port-forward service/pet-service 8083:8083 -n petmatch >/dev/null 2>&1 &
PET_PID=$!
echo $PET_PID > .pet-service.pid
echo "Pet Service port-forward 開始 (PID: $PET_PID)"

# 7. 最終確認
echo -e "\n${BLUE}7. 最終動作確認${NC}"
echo "Pod 起動完了待ち..."
sleep 15

# Health check
echo "Health Check 実行:"
for i in {1..5}; do
    printf "試行 $i: "
    if curl -s "http://localhost:8083/health" 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}成功！${NC}"
        
        echo -e "\n${GREEN}🎉 Pet Service 完全修復成功！${NC}"
        echo "=================================="
        echo "✅ Redis 接続: 正常"
        echo "✅ Health Check: 正常" 
        echo "✅ Port-forward: 正常"
        
        # API テスト
        echo -e "\n${CYAN}API 動作確認:${NC}"
        curl -s "http://localhost:8083/health" | head -3
        
        echo -e "\n${CYAN}次のステップ:${NC}"
        echo "make sample-data  # サンプルデータ投入"
        echo "curl http://localhost:8083/pets  # API確認"
        
        exit 0
    else
        echo -e "${YELLOW}待機中...${NC}"
        sleep 5
    fi
done

echo -e "\n${RED}❌ まだ接続できません${NC}"
echo "追加診断:"
kubectl logs -n petmatch deployment/pet-service --tail=10
