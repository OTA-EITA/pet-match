#!/bin/bash

# PetMatch Sample Data Generator
set -e

API_BASE_URL=${1:-"http://localhost:8083"}
NUM_PETS=${2:-10}

echo "Generating sample data for PetMatch"
echo "API URL: $API_BASE_URL"
echo "Number of pets: $NUM_PETS"

# Sample data arrays
SPECIES=("dog" "cat" "bird" "rabbit" "hamster")
DOG_BREEDS=("柴犬" "チワワ" "トイプードル" "ゴールデンレトリーバー" "ラブラドール" "ダックスフンド" "ポメラニアン")
CAT_BREEDS=("アメリカンショートヘア" "ペルシャ" "ラグドール" "スコティッシュフォールド" "ロシアンブルー" "メインクーン")
BIRD_BREEDS=("セキセイインコ" "カナリア" "文鳥" "コザクラインコ" "オカメインコ")
RABBIT_BREEDS=("ホーランドロップ" "ネザーランドドワーフ" "ライオンヘッド" "アンゴラ")
HAMSTER_BREEDS=("ゴールデンハムスター" "ジャンガリアンハムスター" "チャイニーズハムスター")

NAMES=("ポチ" "タマ" "ココ" "モモ" "チョコ" "ミルク" "クッキー" "マロン" "レオ" "ルナ" "ソラ" "ハナ" "サクラ" "コテツ" "シロ")
GENDERS=("male" "female")
SIZES=("small" "medium" "large")
COLORS=("茶色" "黒" "白" "グレー" "三毛" "茶白" "黒白" "シルバー" "ゴールド")
PERSONALITIES=("活発" "人懐っこい" "おとなしい" "甘えん坊" "好奇心旺盛" "警戒心が強い" "遊び好き" "マイペース")

# Tokyo area coordinates (lat,lng)
LOCATIONS=("35.6762,139.6503" "35.6895,139.6917" "35.6586,139.7454" "35.6785,139.6823" "35.6938,139.7036")

# Function to get random element from array
get_random() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

# Function to get breed based on species
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

# Function to get size based on species
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

# Check if API is accessible
echo "Checking API connectivity..."
if ! curl -s "$API_BASE_URL/health" > /dev/null; then
  echo "ERROR: API is not accessible at $API_BASE_URL"
  echo "Please make sure the pet-service is running:"
  echo "  • Local: cd services/pet-service && go run ."
  echo "  • Docker: docker-compose -f docker/docker-compose.dev.yml up pet-service"
  echo "  • K8s: ./scripts/k8s-deploy.sh pet-service port-forward"
  exit 1
fi
echo "API is accessible"

# Generate sample pets
echo "Generating $NUM_PETS sample pets..."

for i in $(seq 1 $NUM_PETS); do
  species=$(get_random "${SPECIES[@]}")
  breed=$(get_breed "$species")
  name=$(get_random "${NAMES[@]}")
  gender=$(get_random "${GENDERS[@]}")
  size=$(get_size "$species")
  color=$(get_random "${COLORS[@]}")
  age=$((RANDOM % 12 + 1))  # 1-12 years
  location=$(get_random "${LOCATIONS[@]}")
  
  # Random personality traits (1-3 traits)
  personality1=$(get_random "${PERSONALITIES[@]}")
  personality2=$(get_random "${PERSONALITIES[@]}")
  
  # Generate description
  description="${name}は${age}歳の${gender}の${breed}です。${personality1}で${personality2}な性格をしています。新しい家族を探しています。"
  
  # Generate a UUID for the pet
  pet_id=$(uuidgen 2>/dev/null || echo "pet-$(date +%s)-$i")
  
  # Add timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Create JSON directly with printf
  neutered=$([ $((RANDOM % 2)) -eq 0 ] && echo "true" || echo "false")
  owner_id="sample-owner-$((RANDOM % 3 + 1))"
  
  json_data=$(printf '{
  "id": "%s",
  "name": "%s",
  "species": "%s",
  "breed": "%s",
  "age": %d,
  "gender": "%s",
  "size": "%s",
  "color": "%s",
  "personality": ["%s", "%s"],
  "medical_info": {
    "vaccinated": true,
    "neutered": %s,
    "health_issues": [],
    "last_checkup": "",
    "medications": []
  },
  "owner_id": "%s",
  "status": "available",
  "location": "%s",
  "images": [],
  "description": "%s",
  "created_at": "%s",
  "updated_at": "%s"
}' "$pet_id" "$name" "$species" "$breed" "$age" "$gender" "$size" "$color" "$personality1" "$personality2" "$neutered" "$owner_id" "$location" "$description" "$timestamp" "$timestamp")

  echo "Creating pet $i: $name ($species - $breed)"
  
  # Try to insert directly via Redis (if accessible)
  if command -v redis-cli >/dev/null 2>&1; then
    echo "$json_data" | redis-cli -h localhost -p 6379 -a petmatch123 -x SET "pet:$pet_id" >/dev/null 2>&1 || true
  fi
  
  # Also try via Docker Redis
  if command -v docker >/dev/null 2>&1; then
    echo "$json_data" | docker exec -i petmatch-redis redis-cli -a petmatch123 -x SET "pet:$pet_id" >/dev/null 2>&1 || true
  fi
  
  sleep 0.1  # Small delay to avoid overwhelming the system
done

echo "Sample data generation completed!"
echo ""
echo "Verify the data:"
echo "  • API: curl '$API_BASE_URL/pets'"
echo "  • Redis CLI: redis-cli -a petmatch123 KEYS 'pet:*'"
echo "  • Docker Redis: docker exec petmatch-redis redis-cli -a petmatch123 KEYS 'pet:*'"
echo ""
echo "Test search:"
echo "  • Dogs: curl '$API_BASE_URL/pets?species=dog'"
echo "  • Cats: curl '$API_BASE_URL/pets?species=cat'" 
echo "  • Small pets: curl '$API_BASE_URL/pets?size=small'"
echo "  • Young pets: curl '$API_BASE_URL/pets?age_max=3'"
