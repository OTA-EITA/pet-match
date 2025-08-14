#!/bin/bash

echo "🚀 Match Service初回デプロイスクリプト"
echo "=================================="

# Minikube環境確認
echo "1. Minikube環境確認..."
if ! minikube status >/dev/null 2>&1; then
    echo "❌ Minikube が起動していません"
    echo "起動コマンド: minikube start"
    exit 1
fi
echo "✅ Minikube 起動中"

# Namespace確認
echo "2. Namespace確認..."
if ! kubectl get namespace petmatch >/dev/null 2>&1; then
    echo "❌ Namespace 'petmatch' が存在しません"
    echo "セットアップコマンド: make k8s-apply"
    exit 1
fi
echo "✅ Namespace 'petmatch' 存在"

# ConfigMap確認
echo "3. ConfigMap確認..."
if ! kubectl get configmap petmatch-config -n petmatch >/dev/null 2>&1; then
    echo "❌ ConfigMap 'petmatch-config' が存在しません"
    echo "セットアップコマンド: make k8s-apply"
    exit 1
fi
echo "✅ ConfigMap 存在"

# Secrets確認
echo "4. Secrets確認..."
if ! kubectl get secret petmatch-secrets -n petmatch >/dev/null 2>&1; then
    echo "❌ Secret 'petmatch-secrets' が存在しません"
    echo "セットアップコマンド: make k8s-apply"
    exit 1
fi
echo "✅ Secrets 存在"

# Docker環境設定
echo "5. Docker環境設定..."
eval $(minikube docker-env)
echo "✅ Docker環境設定完了"

# Match Serviceビルド
echo "6. Match Service ビルド..."
if docker build -t petmatch/match-service:latest -f services/match-service/Dockerfile . --quiet; then
    echo "✅ Match Service ビルド完了"
else
    echo "❌ Match Service ビルド失敗"
    exit 1
fi

# Match Serviceデプロイ
echo "7. Match Service デプロイ..."
if kubectl apply -f k8s/services/match-service.yaml; then
    echo "✅ Match Service デプロイ完了"
else
    echo "❌ Match Service デプロイ失敗"
    exit 1
fi

# Pod起動待ち
echo "8. Pod起動待ち..."
kubectl wait --for=condition=Ready pod -l app=match-service -n petmatch --timeout=120s

# 最終状況確認
echo "9. 最終状況確認..."
echo "Pod状況:"
kubectl get pods -n petmatch -l app=match-service

echo "Service状況:"
kubectl get service -n petmatch match-service

echo ""
echo "🎉 Match Service デプロイ完了！"
echo ""
echo "次のコマンドでログを確認できます:"
echo "  kubectl logs -f deployment/match-service -n petmatch"
echo ""
echo "ヘルスチェック（ポートフォワード後）:"
echo "  curl http://localhost:8084/health"
