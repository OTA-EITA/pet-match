#!/bin/bash

# PetMatch Enhanced Sample Data Generator with Authentication
# API経由でのみデータ生成（認証対応版）
set -e

API_BASE_URL=${1:-"http://localhost:8083"}
AUTH_SERVICE_URL=${2:-"http://localhost:18091"}
NUM_PETS=${3:-30}

echo "🐾 PetMatch サンプルデータ生成開始"
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

# 外部画像URL（実際のペット画像）
DOG_IMAGES=(
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400"
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400"
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"
  "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400"
)

CAT_IMAGES=(
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400"
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400"
  "https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=400"
  "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=400"
)

BIRD_IMAGES=(
  "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400"
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400"
  "https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=400"
)

RABBIT_IMAGES=(
  "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400"
  "https://images.unsplash.com/photo-1612169025016-84b59f7c8d8e?w=400"
  "https://images.unsplash.com/photo-1606644062848-a0b2d7e4399d?w=400"
)

HAMSTER_IMAGES=(
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400"
  "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400"
)

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

# 種類に応じた画像URL取得
get_image_url() {
  local species=$1
  case $species in
    "dog") get_random "${DOG_IMAGES[@]}" ;;
    "cat") get_random "${CAT_IMAGES[@]}" ;;
    "bird") get_random "${BIRD_IMAGES[@]}" ;;
    "rabbit") get_random "${RABBIT_IMAGES[@]}" ;;
    "hamster") get_random "${HAMSTER_IMAGES[@]}" ;;
    *) echo "" ;;
  esac
}

# 認証トークン取得
get_auth_token() {
  echo "🔐 認証トークン取得中..."
  
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
  
  # ユーザー登録を試行（既存ユーザーの場合は無視）
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$register_data" \
    "$AUTH_SERVICE_URL/register" >/dev/null 2>&1 || true
  
  # ログインしてトークン取得
  local temp_file=$(mktemp)
  local http_code=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    -o "$temp_file" \
    "$AUTH_SERVICE_URL/login" 2>/dev/null)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    # jqがある場合はjqを使用、ない場合は単純な文字列処理
    if command -v jq >/dev/null 2>&1; then
      local token=$(cat "$temp_file" | jq -r '.access_token // .token // empty' 2>/dev/null)
    else
      # jqがない場合の簡易JSON解析
      local token=$(cat "$temp_file" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
      if [ -z "$token" ]; then
        token=$(cat "$temp_file" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
      fi
    fi
    
    rm -f "$temp_file"
    
    if [ -n "$token" ] && [ "$token" != "null" ]; then
      echo "✅ 認証トークン取得成功"
      echo "$token"
      return 0
    else
      echo "❌ 認証トークン取得失敗: レスポンスにtokenが含まれていません"
      echo "レスポンス内容: $(cat "$temp_file" 2>/dev/null || echo 'ファイル読み取り失敗')"
      rm -f "$temp_file"
      return 1
    fi
  else
    echo "❌ 認証失敗 (HTTP $http_code)"
    echo "レスポンス: $(cat "$temp_file" 2>/dev/null || echo 'ファイル読み取り失敗')"
    rm -f "$temp_file"
    return 1
  fi
}

# API接続確認
echo "📡 API接続確認中..."
if ! curl -s "$API_BASE_URL/health" > /dev/null 2>&1; then
  echo "❌ Pet Serviceに接続できません: $API_BASE_URL"
  echo ""
  echo "📋 解決手順:"
  echo "1. システム起動: make start"
  echo "2. ポート確認: make port-check"
  echo "3. ログ確認: make logs-pet"
  echo ""
  exit 1
fi

if ! curl -s "$AUTH_SERVICE_URL/health" > /dev/null 2>&1; then
  echo "❌ Auth Serviceに接続できません: $AUTH_SERVICE_URL"
  echo ""
  echo "📋 解決手順:"
  echo "1. システム起動: make start"
  echo "2. ログ確認: make logs-auth"
  echo ""
  exit 1
fi

echo "✅ API接続成功"

# 認証トークン取得
AUTH_TOKEN=$(get_auth_token)
if [ $? -ne 0 ] || [ -z "$AUTH_TOKEN" ]; then
  echo ""
  echo "🚫 認証トークンの取得に失敗しました"
  echo "Auth Serviceの状態を確認してください"
  exit 1
fi

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
  age=$((RANDOM % 12 + 1))  # 1-12歳
  location=$(get_random "${LOCATIONS[@]}")
  image_url=$(get_image_url "$species")
  
  # 性格特性（1-3個）
  personality1=$(get_random "${PERSONALITIES[@]}")
  personality2=$(get_random "${PERSONALITIES[@]}")
  personality3=$(get_random "${PERSONALITIES[@]}")
  
  # 説明文生成
  gender_jp=$([ "$gender" = "male" ] && echo "オス" || echo "メス")
  description="${name}は${age}歳の${gender_jp}の${breed}です。${personality1}で${personality2}な性格をしています。新しい家族を探しています。健康で人懐っこく、きっと素晴らしい家族の一員になってくれるでしょう。"
  
  # タイムスタンプ
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # JSONデータ作成
  neutered=$([ $((RANDOM % 3)) -eq 0 ] && echo "true" || echo "false")
  owner_id="shelter-$(printf "%02d" $((RANDOM % 5 + 1)))"
  
  # 画像配列作成
  if [ -n "$image_url" ]; then
    images_json="[\"$image_url\"]"
  else
    images_json="[]"
  fi
  
  json_data=$(cat <<EOF
{
  "name": "$name",
  "species": "$species",
  "breed": "$breed",
  "age": $age,
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
  "owner_id": "$owner_id",
  "status": "available",
  "location": "$location",
  "images": $images_json,
  "description": "$description"
}
EOF
)

  printf "%-3d. %-8s %-20s %-15s... " "$i" "$species" "$name" "$breed"
  
  # 一時ファイルを使用してレスポンス処理
  temp_file=$(mktemp)
  
  # API経由でペット作成（認証ヘッダー付き）
  http_code=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$json_data" \
    -o "$temp_file" \
    "$API_BASE_URL/pets" 2>/dev/null)
  
  # レスポンス分析
  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ 成功"
    ((success_count++))
  else
    echo "❌ 失敗 (HTTP $http_code)"
    ((error_count++))
    if [ $error_count -le 3 ]; then
      response_body=$(cat "$temp_file" 2>/dev/null || echo "レスポンス読み取り失敗")
      echo "     エラー詳細: $response_body"
    fi
  fi
  
  # 一時ファイル削除
  rm -f "$temp_file"
  
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
  echo "  • 小型ペット: curl '$API_BASE_URL/pets?size=small'"
  echo "  • 若いペット: curl '$API_BASE_URL/pets?age_max=3'"
  echo ""
  echo "🌐 Web UIアクセス:"
  echo "  • API Gateway: http://localhost:8080"
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
  echo "  • 認証確認: make logs-auth"
  echo "  • サービス状況: make status"
  echo "  • 再起動: make restart"
fi

echo ""
echo "🎉 サンプルデータ生成完了！"
