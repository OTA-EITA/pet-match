#!/bin/bash
set -e

echo "🚀 PetMatch Kubernetes開発環境を起動します..."

# 1. Kubernetes確認
echo "📊 Kubernetes状況確認..."
if ! kubectl get pods -n petmatch >/dev/null 2>&1; then
    echo "❌ Kubernetes petmatch namespace not found"
    echo "先にKubernetesクラスターをデプロイしてください:"
    echo "  make k8s-deploy"
    exit 1
fi

kubectl get pods -n petmatch

# 2. Port-forwarding確認・開始
echo ""
echo "🔗 Port-forwarding設定..."

# 既存のport-forwardを停止
pkill -f "kubectl port-forward.*api-gateway" 2>/dev/null || true
sleep 1

# API Gateway port-forward
echo "  API Gateway: localhost:18081 → api-gateway:8080"
kubectl port-forward service/api-gateway 18081:8080 -n petmatch &
PF_PID=$!

# 3. API疎通確認
echo ""
echo "⏳ API Gateway接続待機..."
for i in {1..10}; do
    if curl -s http://localhost:18081/health >/dev/null 2>&1; then
        echo "✅ API Gateway Ready: http://localhost:18081"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ API Gateway接続タイムアウト"
        echo "手動確認: kubectl logs -l app=api-gateway -n petmatch"
        exit 1
    fi
    sleep 2
done

# 4. API テスト
echo ""
echo "🧪 API疎通テスト..."
HEALTH_RESPONSE=$(curl -s http://localhost:18081/health)
echo "Health Check: $HEALTH_RESPONSE"

PETS_COUNT=$(curl -s http://localhost:18081/api/v1/pets | jq -r '.pets | length' 2>/dev/null || echo "0")
echo "Available Pets: $PETS_COUNT"

echo ""
echo "🎉 Kubernetes開発環境準備完了!"
echo ""
echo "📊 接続情報:"
echo "  🔗 API Gateway: http://localhost:18081"
echo "  📋 Health Check: http://localhost:18081/health"
echo "  🐾 Pets API: http://localhost:18081/api/v1/pets"
echo ""
echo "📱 React Native起動コマンド:"
echo "  cd frontend"
echo "  npm install  # 初回のみ"
echo "  npm start    # 開発サーバー起動"
echo ""
echo "🛑 停止する場合:"
echo "  Ctrl+C または kill $PF_PID"
echo ""

# Cleanup on exit
trap "echo '🛑 Port-forwarding停止中...'; kill $PF_PID 2>/dev/null || true" EXIT

# Keep running
echo "Port-forwarding実行中... (Ctrl+Cで停止)"
wait $PF_PID