#!/bin/bash

# Simple Auth Debug Script
echo "🔍 PetMatch 認証デバッグ"
echo "========================"

AUTH_SERVICE_URL="http://localhost:18091"

echo "📡 Auth Service 接続テスト..."
if curl -s "$AUTH_SERVICE_URL/health" >/dev/null 2>&1; then
    echo "✅ Auth Service 接続成功"
else
    echo "❌ Auth Service 接続失敗"
    exit 1
fi

echo ""
echo "🔍 Auth Service エンドポイント確認..."
echo "Health エンドポイント:"
curl -s "$AUTH_SERVICE_URL/health" | head -c 200
echo ""

echo ""
echo "📝 ユーザー登録テスト..."
register_data='{
  "name": "Test User",
  "email": "test@petmatch.com", 
  "password": "test123",
  "phone": "090-1234-5678",
  "address": "東京都渋谷区",
  "type": "adopter"
}'

echo "送信データ:"
echo "$register_data"
echo ""

echo "レスポンス:"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$register_data" \
  "$AUTH_SERVICE_URL/auth/register" | head -c 500
echo ""

echo ""
echo "🔑 ログインテスト..."
login_data='{
  "email": "test@petmatch.com",
  "password": "test123"
}'

echo "送信データ:"
echo "$login_data"
echo ""

echo "レスポンス:"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$login_data" \
  "$AUTH_SERVICE_URL/auth/login" | head -c 500
echo ""

echo ""
echo "🔍 利用可能なエンドポイント確認..."
echo "OPTIONS /*:"
curl -s -X OPTIONS "$AUTH_SERVICE_URL/" | head -c 200
echo ""

echo ""
echo "🎯 次のステップ:"
echo "1. 上記のレスポンスを確認"
echo "2. Auth Service ログ: make logs-auth"
echo "3. エンドポイントパスの確認"
