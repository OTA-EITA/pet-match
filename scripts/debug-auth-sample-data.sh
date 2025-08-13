#!/bin/bash

# PetMatch Enhanced Sample Data Generator with Authentication - Debug Version
# API経由でのみデータ生成（認証対応・デバッグ版）
# set -e を削除してエラー詳細を確認

API_BASE_URL=${1:-"http://localhost:8083"}
AUTH_SERVICE_URL=${2:-"http://localhost:18091"}
NUM_PETS=${3:-30}

echo "🐾 PetMatch サンプルデータ生成開始（デバッグ版）"
echo "Pet Service: $API_BASE_URL"
echo "Auth Service: $AUTH_SERVICE_URL"
echo "ペット数: $NUM_PETS"
echo "================================"

# 認証トークン取得
get_auth_token() {
  echo "🔐 認証トークン取得中..."
  
  # まずAuth Serviceの状態確認
  echo "📡 Auth Service接続確認..."
  if ! curl -s "$AUTH_SERVICE_URL/health" >/dev/null 2>&1; then
    echo "❌ Auth Serviceに接続できません: $AUTH_SERVICE_URL"
    return 1
  fi
  echo "✅ Auth Service接続成功"
  
  # サンプルユーザーでログイン
  local login_data='{
    "email": "sample@petmatch.com",
    "password": "sample123"
  }'
  
  # まずユーザーを作成（既に存在する場合はスキップ）
  local register_data='{
    "name": "Sample User",
    "email": "sample@petmatch.com", 
    "password": "sample123",
    "phone": "090-1234-5678",
    "address": "東京都渋谷区",
    "user_type": "adopter"
  }'
  
  echo "👤 サンプルユーザー登録を試行..."
  local register_temp=$(mktemp)
  local register_code=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$register_data" \
    -o "$register_temp" \
    "$AUTH_SERVICE_URL/register" 2>/dev/null)
  
  echo "📝 ユーザー登録レスポンス: HTTP $register_code"
  if [ -f "$register_temp" ]; then
    echo "📄 登録レスポンス内容:"
    cat "$register_temp" | head -c 200
    echo ""
  fi
  rm -f "$register_temp"
  
  # ログインしてトークン取得
  echo "🔑 ログイン試行..."
  local temp_file=$(mktemp)
  local http_code=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    -o "$temp_file" \
    "$AUTH_SERVICE_URL/login" 2>/dev/null)
  
  echo "📝 ログインレスポンス: HTTP $http_code"
  
  if [ -f "$temp_file" ]; then
    echo "📄 ログインレスポンス内容:"
    cat "$temp_file"
    echo ""
  fi
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    # jqがある場合はjqを使用、ない場合は単純な文字列処理
    if command -v jq >/dev/null 2>&1; then
      local token=$(cat "$temp_file" | jq -r '.access_token // .token // empty' 2>/dev/null)
      echo "🔍 jqで抽出したトークン: '$token'"
    else
      # jqがない場合の簡易JSON解析
      echo "🔍 jqなし - 簡易JSON解析を使用"
      local token=$(cat "$temp_file" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
      if [ -z "$token" ]; then
        token=$(cat "$temp_file" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
      fi
      echo "🔍 簡易解析で抽出したトークン: '$token'"
    fi
    
    rm -f "$temp_file"
    
    if [ -n "$token" ] && [ "$token" != "null" ] && [ "$token" != "" ]; then
      echo "✅ 認証トークン取得成功"
      echo "🎫 トークンの最初の20文字: ${token:0:20}..."
      echo "$token"
      return 0
    else
      echo "❌ 認証トークン取得失敗: レスポンスにtokenが含まれていません"
      return 1
    fi
  else
    echo "❌ ログイン失敗 (HTTP $http_code)"
    rm -f "$temp_file"
    return 1
  fi
}

# API接続確認
echo "📡 API接続確認中..."
if ! curl -s "$API_BASE_URL/health" > /dev/null 2>&1; then
  echo "❌ Pet Serviceに接続できません: $API_BASE_URL"
  exit 1
fi

if ! curl -s "$AUTH_SERVICE_URL/health" > /dev/null 2>&1; then
  echo "❌ Auth Serviceに接続できません: $AUTH_SERVICE_URL"
  exit 1
fi

echo "✅ 両方のAPI接続成功"

# 認証トークン取得
AUTH_TOKEN=$(get_auth_token)
auth_result=$?

if [ $auth_result -ne 0 ] || [ -z "$AUTH_TOKEN" ]; then
  echo ""
  echo "🚫 認証トークンの取得に失敗しました"
  echo "Auth Serviceの詳細ログを確認してください:"
  echo "  make logs-auth"
  exit 1
fi

echo ""
echo "🎉 認証成功！データ生成をスキップしてテスト完了"
echo "🔑 取得したトークン: ${AUTH_TOKEN:0:50}..."

echo ""
echo "🧪 認証トークンテスト"
echo "==================="

# 認証が必要なエンドポイントでテスト
echo "📝 認証テスト用ペットデータ作成を試行..."

test_pet_data='{
  "name": "テストペット",
  "species": "dog",
  "breed": "テスト犬",
  "age": 3,
  "gender": "male",
  "size": "medium",
  "color": "茶色",
  "personality": ["テスト用"],
  "medical_info": {
    "vaccinated": true,
    "neutered": true,
    "health_issues": [],
    "last_checkup": "",
    "medications": []
  },
  "owner_id": "test-owner",
  "status": "available",
  "location": "35.6762,139.6503",
  "images": [],
  "description": "認証テスト用のペットです"
}'

temp_test_file=$(mktemp)
test_http_code=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$test_pet_data" \
  -o "$temp_test_file" \
  "$API_BASE_URL/pets" 2>/dev/null)

echo "📝 テストペット作成: HTTP $test_http_code"
if [ -f "$temp_test_file" ]; then
  echo "📄 レスポンス:"
  cat "$temp_test_file"
  echo ""
fi

if [ "$test_http_code" = "201" ] || [ "$test_http_code" = "200" ]; then
  echo "✅ 認証テスト成功！"
  echo "🚀 実際のサンプルデータ生成の準備が整いました"
  
  # テストペットを削除（任意）
  if command -v jq >/dev/null 2>&1; then
    test_pet_id=$(cat "$temp_test_file" | jq -r '.id // .pet_id // empty' 2>/dev/null)
    if [ -n "$test_pet_id" ] && [ "$test_pet_id" != "null" ]; then
      echo "🧹 テストペット削除中..."
      curl -s -X DELETE \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_BASE_URL/pets/$test_pet_id" >/dev/null 2>&1 || true
      echo "✅ テストペット削除完了"
    fi
  fi
else
  echo "❌ 認証テスト失敗"
  echo "🔧 次の手順で確認してください:"
  echo "  1. make logs-pet   - Pet Serviceログ"
  echo "  2. make logs-auth  - Auth Serviceログ"
  echo "  3. make status     - システム状況"
fi

rm -f "$temp_test_file"

echo ""
echo "🎯 次のステップ:"
echo "  1. 認証が成功した場合:"
echo "     make sample-data  # 通常のサンプルデータ生成"
echo "  2. 問題がある場合:"
echo "     make logs-auth    # Auth Serviceログ確認"
echo "     make logs-pet     # Pet Serviceログ確認"
