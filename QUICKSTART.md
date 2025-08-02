# PetMatch クイックスタートガイド

## 1. 環境準備（2分）

```bash
# プロジェクトディレクトリに移動
cd /home/eitafeir/src/works/pet-match

# スクリプトを実行可能にする
chmod +x scripts/*.sh

# 開発環境セットアップ（Redis起動 + Go modules）
./scripts/dev-setup.sh
```

## 2. Pet Service起動（1分）

```bash
# Pet Serviceを起動
cd services/pet-service
go run .
```

**別ターミナルで:**
```bash
# ヘルスチェック
curl http://localhost:8083/health

# 期待するレスポンス:
# {"status":"healthy","service":"pet-service","version":"1.0.0"}
```

## 3. サンプルデータ投入（1分）

```bash
# プロジェクトルートに戻る
cd /home/eitafeir/src/works/pet-match

# サンプルペットデータを10件作成
./scripts/generate-sample-data.sh http://localhost:8083 10
```

## 4. API テスト（1分）

```bash
# ペット一覧取得
curl "http://localhost:8083/pets"

# 犬のみ検索
curl "http://localhost:8083/pets?species=dog"

# 年齢フィルター（1-3歳）
curl "http://localhost:8083/pets?age_min=1&age_max=3"

# 小型ペット検索
curl "http://localhost:8083/pets?size=small"
```

## 5. Kubernetes デプロイ（3分）

```bash
# Dockerイメージをビルド
./scripts/build.sh pet-service

# Kubernetesにデプロイ
./scripts/k8s-deploy.sh pet-service deploy

# ポートフォワード（別ターミナル）
./scripts/k8s-deploy.sh pet-service port-forward 8083

# K8s経由でテスト
curl "http://localhost:8083/pets"
```

## 6. CKAD練習問題（30分+）

```bash
# 練習問題ファイルを確認
cat /home/eitafeir/src/works/kubernetes_practice/petmatch-ckad-problems.md

# 問題1から順番にチャレンジ！
```

---

## 管理コマンド

### 開発環境
```bash
# Redis CLI接続
docker exec -it petmatch-redis redis-cli -a petmatch123

# Redis データ確認
KEYS pet:*
GET pet:12345

# Docker ログ確認
docker-compose -f docker/docker-compose.dev.yml logs -f
```

### Kubernetes環境
```bash
# デプロイ状況確認
./scripts/k8s-deploy.sh pet-service status

# ログ確認
./scripts/k8s-deploy.sh pet-service logs

# Redis CLI (K8s)
./scripts/k8s-deploy.sh pet-service redis-cli

# 環境リセット
./scripts/k8s-deploy.sh all reset
```


---

## トラブルシューティング

### Redis接続エラー
```bash
docker ps | grep redis
docker-compose -f docker/docker-compose.dev.yml restart redis
```

### Port already in use
```bash
lsof -i :8083  # プロセス確認
kill -9 PID    # プロセス終了
```

### Go dependencies
```bash
go mod tidy
go mod download
```

### Docker build error
```bash
docker system prune -f  # クリーンアップ
./scripts/build.sh pet-service  # 再ビルド
```

---

**準備完了！Welcome to Pet-match System!!**
