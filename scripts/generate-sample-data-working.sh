#!/bin/bash

# PetMatch Sample Data Generator - Working Version
# Based on successful debug script
set -e

API_BASE_URL=${1:-"http://localhost:8083"}
AUTH_SERVICE_URL=${2:-"http://localhost:18091"}
NUM_PETS=${3:-30}

echo "🐾 PetMatch サンプルデータ生成開始（動作確認済み版）"
echo "Pet Service: $API_BASE_URL"
echo "Auth Service: $AUTH_SERVICE_URL"
echo "ペット数: $NUM_PETS"
echo "================================"

# サンプルデータ配列
SPECIES=("dog" "cat" "bird" "rabbit" "hamster")
DOG_BREEDS=("柴犬" "チワワ" "トイプードル" "ゴールデンレトリーバー" "ラブラドール" "ダックスフンド" "ポメラニアン" "ボーダーコリー" "フレンチブルドッグ")
CAT_BREEDS=("アメリカンショートヘア" "ペルシャ" "ラグドール" "スコティッシュフォールド" "ロシアンブルー" "メインクーン" "ノルウェージャンフォレストキャット")
BIRD_BREEDS=("セキセイインコ" "カナリア" "文鳥" "コザクラインコ" "オカメインコ" "ボタンインコ")
RABBIT_BREEDS=("ホーランドロップ" "ネザーランドドワーフ" "ライオンヘッド" "アンゴラ" "ミニウサギ")
HAMSTER_BREEDS=("ゴールデンハムスター" "ジャンガリアンハムスター" "チャイニーズハムスター" "ロボロフスキーハムスター")

NAMES=("ポチ" "タマ" "ココ" "モモ" "チョコ" "ミルク" "クッキー" "マロン" "レオ" "ルナ" "ソラ" "ハナ" "サクラ" "コテツ" "シロ" "クロ" "アカ" "ベル" "ラック" "ピコ" "ナナ" "ミミ" "ララ" "ポポ")
GENDERS=("male" "female")
SIZES=("small" "medium" "large")
COLORS=("茶色" "黒" "白" "グレー" "三毛" "茶白" "黒白" "シルバー" "ゴールド" "クリーム")
PERSONALITIES=("活発" "人懐っこい" "おとなしい" "甘えん坊" "好奇心旺盛" "警戒心が強い" "遊び好き" "マイペース" "社交的" "独立心旺盛")

# 東京エリアの座標 (緯度,経度)
LOCATIONS=("35.6762,139.6503" "35.6895,139.6917" "35.6586,139.7454" "35.6785,139.6823" "35.6938,139.7036" "35.7090,139.7319" "35.6580,139.7016")

# ランダム選択関数
get_random() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

# 種類に応じた品種取得
get_breed() {
  local species=$1
  case $species in
    "dog") get_random "${DOG_BREEDS[@]}" ;;
    "cat") get_random "${CAT_BREEDS[@]}" ;;
    "bird") get_random "${BIRD_BREEDS[@]}" ;;
    "rabbit") get_random "${RABBIT_BREEDS[@]}" ;;
    "hamster") get_random "${HAMSTER_BREEDS[@]}" ;;
    *) echo "ミックス" ;;
  esac
}

# 種類に応じたサイズ取得
get_size() {
  local species=$1
  case $species in
    "dog") get_random "small" "medium" "large" ;;
    "cat") get_random "small" "medium" ;;
    "bird") echo "small" ;;
    "rabbit") get_random "small" "medium" ;;
    "hamster") echo "small" ;;
    *) echo "medium" ;;
  esac
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

echo "✅ API接続成功"

# 認証トークン取得（デバッグスクリプトと同じロジック）
echo "🔐 認証トークン取得中..."

register_data='{
  "name": "Sample User",
  "email": "sample@petmatch.com", 
  "password": "sample123",
  "phone": "090-1234-5678",
  "address": "東京都渋谷区",
  "type": "adopter"
}'

login_data='{
  "email": "sample@petmatch.com",
  "password": "sample123"
}'

# ユーザー登録
echo "👤 ユーザー登録..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$register_data" \
  "$AUTH_SERVICE_URL/auth/register" > /dev/null 2>&1 || true

# ログイン
echo "🔑 ログイン..."
login_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$login_data" \
  "$AUTH_SERVICE_URL/auth/login")

# トークン抽出
if command -v jq >/dev/null 2>&1; then
  TOKEN=$(echo "$login_response" | jq -r '.tokens.access_token')
else
  TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 認証トークン取得失敗"
  echo "ログインレスポンス: $login_response"
  exit 1
fi

echo "✅ 認証トークン取得成功: ${TOKEN:0:50}..."

# サンプルペット生成
echo ""
echo "🐾 $NUM_PETS 匹のペットデータ生成中..."
echo ""

success_count=0
error_count=0

for i in $(seq 1 $NUM_PETS); do
  # ランダムデータ生成
  species=$(get_random "${SPECIES[@]}")
  breed=$(get_breed "$species")
  name=$(get_random "${NAMES[@]}")
  gender=$(get_random "${GENDERS[@]}")
  size=$(get_size "$species")
  color=$(get_random "${COLORS[@]}")
  
  # 年齢生成
  age_years=$((RANDOM % 10 + 1))  # 1-10歳
  age_months=$((RANDOM % 12))     # 0-11ヶ月
  is_estimated=$([ $((RANDOM % 2)) -eq 0 ] && echo "false" || echo "true")
  
  location=$(get_random "${LOCATIONS[@]}")
  
  # 性格特性（1-2個）
  personality1=$(get_random "${PERSONALITIES[@]}")
  personality2=$(get_random "${PERSONALITIES[@]}")
  
  # 説明文生成
  gender_jp=$([ "$gender" = "male" ] && echo "オス" || echo "メス")
  description="${name}は${age_years}歳の${gender_jp}の${breed}です。${personality1}で${personality2}な性格をしています。新しい家族を探しています。"
  
  # JSONデータ作成（デバッグスクリプトと同じ形式）
  neutered=$([ $((RANDOM % 3)) -eq 0 ] && echo "true" || echo "false")
  
  pet_data=$(cat <<EOF
{
  "name": "$name",
  "species": "$species",
  "breed": "$breed",
  "age_years": $age_years,
  "age_months": $age_months,
  "is_estimated": $is_estimated,
  "gender": "$gender",
  "size": "$size",
  "color": "$color",
  "personality": ["$personality1", "$personality2"],
  "medical_info": {
    "vaccinated": true,
    "neutered": $neutered,
    "health_issues": [],
    "last_checkup": "",
    "medications": []
  },
  "location": "$location",
  "description": "$description"
}
EOF
)

  printf "%-3d. %-8s %-20s %-15s... " "$i" "$species" "$name" "$breed"
  
  # API経由でペット作成
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$pet_data" \
    "$API_BASE_URL/pets")
  
  # レスポンス分析
  http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
  
  if [ "$http_status" = "201" ] || [ "$http_status" = "200" ]; then
    echo "✅ 成功"
    ((success_count++))
  else
    echo "❌ 失敗 (HTTP $http_status)"
    ((error_count++))
    if [ $error_count -le 3 ]; then
      echo "     エラー詳細: $(echo "$response_body" | head -c 100)..."
    fi
  fi
  
  # API負荷軽減
  sleep 0.1
done

echo ""
echo "📊 生成結果"
echo "================================"
echo "✅ 成功: $success_count 匹"
echo "❌ 失敗: $error_count 匹"
echo "📊 成功率: $(( success_count * 100 / NUM_PETS ))%"

if [ $success_count -gt 0 ]; then
  echo ""
  echo "🔍 データ確認方法:"
  echo "  • 全ペット: curl '$API_BASE_URL/pets'"
  echo "  • 犬のみ: curl '$API_BASE_URL/pets?species=dog'"
  echo "  • 猫のみ: curl '$API_BASE_URL/pets?species=cat'"
  echo "  • データ状況確認: make sample-data-status"
  echo ""
  echo "🌐 Web UIアクセス:"
  echo "  • API Gateway: http://localhost:8080/api/pets"
  if command -v minikube >/dev/null 2>&1; then
    web_url=$(minikube service web-app-nodeport -n petmatch --url 2>/dev/null || echo "")
    if [ -n "$web_url" ]; then
      echo "  • Web App: $web_url"
    fi
  fi
fi

if [ $error_count -gt 0 ]; then
  echo ""
  echo "🔧 トラブルシューティング:"
  echo "  • ログ確認: make logs-pet"
  echo "  • サービス状況: make status"
fi

echo ""
echo "🎉 サンプルデータ生成完了！"
