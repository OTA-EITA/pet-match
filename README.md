# PetMatch: 里親マッチングアプリ 🐾

ペットと里親をマッチングするマイクロサービス型プラットフォーム

## アーキテクチャ

- **Backend**: Go + Gin Framework (マイクロサービス)
- **Database**: Redis (高速データアクセス + 検索)
- **Container**: Docker + Kubernetes
- **Frontend**: React Native (予定)

## サービス構成

| Service | Port | 責任範囲 | 状態 |
|---------|------|----------|------|
| pet-service | 8083 | ペット管理・検索 | ✅ 完了 |
| auth-service | 8081 | 認証・認可 | 🚧 実装予定 |
| user-service | 8082 | ユーザー管理 | 🚧 実装予定 |
| match-service | 8084 | マッチング | 🚧 実装予定 |
| chat-service | 8085 | リアルタイムチャット | 🚧 実装予定 |

## クイックスタート

### 1. 環境準備
```bash
# 必要なツール
- Docker & Docker Compose
- Go 1.21+
- kubectl (Kubernetes実行時)

# リポジトリクローン
git clone git@github.com:OTA-EITA/pet-match.git
cd pet-match
```

### 2. 開発環境セットアップ
```bash
# 自動セットアップスクリプト実行
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# または手動で
docker-compose -f docker/docker-compose.dev.yml up -d
```

### 3. Pet Service 起動
```bash
# Go dependencies
go mod tidy

# Pet Service 起動
cd services/pet-service
go run .
```

### 4. 動作確認
```bash
# ヘルスチェック
curl http://localhost:8083/health

# ペット一覧取得（初期は空）
curl http://localhost:8083/pets
```

## API使用例

### ペット検索（認証不要）
```bash
# 全ペット一覧
curl "http://localhost:8083/pets"

# 犬のみ検索
curl "http://localhost:8083/pets?species=dog"

# 年齢・サイズフィルター
curl "http://localhost:8083/pets?species=cat&age_min=1&age_max=3&size=small"

# ページネーション
curl "http://localhost:8083/pets?limit=5&offset=10"
```

### ペット詳細取得
```bash
curl "http://localhost:8083/pets/{pet_id}"
```

### ペット登録（認証必要 - 今後実装）
```bash
curl -X POST http://localhost:8083/pets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "ポチ",
    "species": "dog", 
    "breed": "柴犬",
    "age": 3,
    "gender": "male",
    "size": "medium",
    "color": "茶色",
    "personality": ["活発", "人懐っこい"],
    "medical_info": {
      "vaccinated": true,
      "neutered": false,
      "health_issues": [],
      "last_checkup": "2024-01-15"
    },
    "description": "とても元気な柴犬です",
    "location": "35.6762,139.6503"
  }'
```

## 開発ツール

### Redis 管理
```bash
# Redis CLI接続
docker exec -it petmatch-redis redis-cli -a petmatch123

# データ確認
127.0.0.1:6379> KEYS pet:*
127.0.0.1:6379> GET pet:{id}
127.0.0.1:6379> JSON.GET pet:{id}

# 検索インデックス確認
127.0.0.1:6379> FT.INFO pet-index
127.0.0.1:6379> FT.SEARCH pet-index "@species:dog"
```

### Docker管理
```bash
# 全サービス起動
docker-compose -f docker/docker-compose.dev.yml up -d

# ログ表示
docker-compose -f docker/docker-compose.dev.yml logs -f redis

# サービス停止・データ削除
docker-compose -f docker/docker-compose.dev.yml down -v
```

### コード品質チェック
```bash
# Lint実行
make lint

# 自動修正
make lint-fix

# テスト実行（今後実装）
make test

# ビルド
make build
```

## プロジェクト構造

```
pet-match/
├── services/           # マイクロサービス群
│   ├── pet-service/    # ✅ ペット管理 (完了)
│   ├── auth-service/   # 🚧 認証 (実装予定)
│   ├── user-service/   # 🚧 ユーザー管理 (実装予定) 
│   ├── match-service/  # 🚧 マッチング (実装予定)
│   └── chat-service/   # 🚧 チャット (実装予定)
├── shared/             # 共通ライブラリ
│   ├── config/         # 設定管理
│   ├── models/         # データモデル定義
│   ├── middleware/     # 認証・CORS等
│   └── utils/          # Redis・JWT・共通関数
├── docker/             # Docker設定
├── scripts/            # ビルド・セットアップ自動化
├── k8s/               # Kubernetes マニフェスト
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── redis/
│   └── services/
└── docs/              # 仕様書・API文書 (予定)
```

## Kubernetes デプロイ

```bash
# Namespace作成
kubectl apply -f k8s/namespace.yaml

# ConfigMap & Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Redis
kubectl apply -f k8s/redis/

# Pet Service
kubectl apply -f k8s/services/pet-service.yaml

# 確認
kubectl get pods -n petmatch
kubectl get services -n petmatch
```

## 機能仕様

### Pet Service
- ✅ ペット一覧取得（フィルタリング・ページネーション）
- ✅ ペット詳細取得
- ✅ ペット登録（認証要）
- ✅ ペット更新（所有者のみ）
- ✅ ペット削除（所有者のみ）
- ✅ Redis検索インデックス
- 🚧 画像アップロード（File Serviceと連携予定）

### 今後実装予定
- **Auth Service**: JWT認証・ユーザー登録・ログイン
- **User Service**: プロフィール管理・里親申請履歴
- **Match Service**: 推薦アルゴリズム・マッチングロジック
- **Chat Service**: WebSocketリアルタイムチャット
- **File Service**: 画像アップロード・ストレージ管理
- **Notification Service**: プッシュ通知・メール通知

## トラブルシューティング

### Redis接続エラー
```bash
# Redis起動確認
docker ps | grep redis

# Redis再起動
docker-compose -f docker/docker-compose.dev.yml restart redis

# 接続テスト
docker exec -it petmatch-redis redis-cli ping
```

### Go dependencies エラー
```bash
# モジュール修復
go mod tidy
go mod download

# キャッシュクリア
go clean -modcache
```

### ポート競合
```bash
# ポート使用状況確認  
lsof -i :8083  # Pet Service
lsof -i :6379  # Redis

# プロセス終了
kill -9 $(lsof -t -i:8083)
```

### Kubernetes トラブル
```bash
# Pod状態確認
kubectl describe pod -n petmatch

# ログ確認
kubectl logs -f deployment/pet-service -n petmatch

# サービス削除・再作成
kubectl delete -f k8s/services/pet-service.yaml
kubectl apply -f k8s/services/pet-service.yaml
```

## コントリビューション

1. Issueを作成して機能・バグを報告
2. Branchを作成: `git checkout -b feature/new-feature`
3. コミット: `git commit -m 'Add new feature'`
4. Push: `git push origin feature/new-feature`
5. Pull Request作成

### コードスタイル
- `make lint` でLintエラーを解消
- 関数・構造体にコメント追加
- テストコード作成（今後）

## ライセンス

MIT License

---

## ロードマップ

### Phase 1: Core Services (Current)
- [x] Pet Service基本機能
- [ ] Auth Service実装
- [ ] User Service実装
- [ ] API Gateway実装

### Phase 2: Advanced Features
- [ ] Match Service (推薦エンジン)
- [ ] Chat Service (WebSocket)
- [ ] File Service (画像管理)
- [ ] Notification Service

### Phase 3: Production Ready
- [ ] Kubernetes完全対応
- [ ] CI/CD パイプライン
- [ ] モニタリング・ロギング
- [ ] React Native アプリ

### Phase 4: Scale & Optimize
- [ ] 負荷分散・スケーリング
- [ ] データ分析・BI
- [ ] 機械学習マッチング
- [ ] 地理的展開

**現在のフォーカス**: Auth Service + User Service実装
**次回目標**: 基本的なマッチング機能完成
