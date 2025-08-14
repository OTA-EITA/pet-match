#!/bin/bash

echo "🔧 Redis Search インデックス設定スクリプト"
echo "=================================="

# Redis Pod確認
echo "1. Redis Pod確認..."
if ! kubectl get pod redis-master-0 -n petmatch >/dev/null 2>&1; then
    echo "❌ redis-master-0 pod が見つかりません"
    echo "Podを確認してください: kubectl get pods -n petmatch -l app=redis"
    exit 1
fi

echo "✅ redis-master-0 pod 確認"

# Redis接続テスト
echo "2. Redis接続テスト..."
if kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis接続成功"
else
    echo "❌ Redis接続失敗"
    exit 1
fi

# インデックス作成
echo "3. Pet Search インデックス作成..."
kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli FT.CREATE pet-index ON JSON PREFIX 1 pet: SCHEMA \
  '$.species' AS species TEXT SORTABLE \
  '$.breed' AS breed TEXT SORTABLE \
  '$.age' AS age NUMERIC SORTABLE \
  '$.status' AS status TAG SORTABLE \
  '$.size' AS size TAG \
  '$.gender' AS gender TAG 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ インデックス作成成功"
else
    echo "⚠️  インデックス作成失敗（既存の可能性）"
fi

# インデックス確認
echo "4. インデックス確認..."
kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli FT.INFO pet-index

# サンプルデータ追加
echo "5. サンプルペットデータ追加..."
kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli JSON.SET pet:sample1 '$' '{
  "id": "sample1",
  "name": "ポチ",
  "species": "dog",
  "breed": "柴犬", 
  "age": 2,
  "size": "medium",
  "gender": "male",
  "status": "available",
  "location": "35.6762,139.6503",
  "good_with_kids": true,
  "personality": ["friendly", "active"]
}'

kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli JSON.SET pet:sample2 '$' '{
  "id": "sample2", 
  "name": "ミケ",
  "species": "cat",
  "breed": "三毛猫",
  "age": 1,
  "size": "small", 
  "gender": "female",
  "status": "available",
  "location": "35.6762,139.6503",
  "good_with_kids": true,
  "personality": ["calm", "gentle"]
}'

echo "✅ サンプルデータ追加完了"

# データ確認
echo "6. データ確認..."
kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli JSON.GET pet:sample1
kubectl exec redis-master-0 -n petmatch -c redis -- redis-cli JSON.GET pet:sample2

echo ""
echo "🎉 Redis Search設定完了！"
echo ""
echo "次のコマンドでMatch Serviceをテストできます:"
echo "curl -X GET \"http://localhost:8084/matches/recommendations?limit=3\" -H \"Authorization: Bearer \$JWT_TOKEN\""
