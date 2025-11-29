# OnlyCats (PetMatch)

猫の里親マッチング＆猫好きSNSプラットフォーム

## 概要

OnlyCatsは、保護猫・ブリーダー猫との出会いと、猫好きのためのコミュニティを提供するマイクロサービスベースのプラットフォームです。

### 主な機能

- 猫の里親募集・検索
- お気に入り機能
- 問い合わせ・応募機能
- 猫図鑑（品種情報）
- コミュニティ機能
- シェルター向け管理機能

### 技術スタック

- **Backend**: Go 1.24 + Gin Framework
- **Web App**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Mobile App**: React Native + Expo SDK
- **Database**: PostgreSQL 15, Redis 7
- **Storage**: MinIO (S3互換)
- **Container**: Docker, Kubernetes
- **CI/CD**: GitHub Actions

### アーキテクチャ

```
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │
┌──────▼──────────┐
│  API Gateway    │
│  (Port: 8080)   │
└────┬────┬───┬───┘
     │    │   │
┌────▼─┐ ┌▼──┐ ┌▼────┐
│Auth  │ │Pet│ │Match│ ...
│8081  │ │8083│ │8084 │
└──────┘ └───┘ └─────┘
```

## セットアップ

### 必要な環境

- Go 1.21以上
- Node.js 18以上
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- MinIO

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/pet-match.git
cd pet-match
```

### 2. 環境変数の設定

**重要**: 安全なシークレットを生成してください

```bash
# 自動生成スクリプトを実行
./scripts/generate-secrets.sh
```

これにより、強力なランダムシークレットを含む `.env.local` が作成されます。

手動で設定する場合：

```bash
# .env.exampleをコピー
cp .env.example .env.local

# シークレットを生成
openssl rand -base64 32  # JWT_ACCESS_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
openssl rand -base64 32  # JWT_SECRET

# .env.localを編集して上記のシークレットを設定
```

### 3. 依存関係のインストール

#### バックエンド
```bash
# 各サービスのディレクトリで実行
cd services/auth-service && go mod download
cd ../pet-service && go mod download
# ... 他のサービスも同様
```

#### Web App (Next.js)
```bash
cd web-app
npm install
```

#### Mobile App (React Native)
```bash
cd frontend
npm install
```

### 4. データベースのセットアップ

```bash
# Docker Composeでローカル環境を起動
make start

# または手動で
docker-compose up -d postgres redis minio
```

### 5. サービスの起動

#### 開発環境
```bash
# すべてのサービスを起動
make dev

# 個別にサービスを起動
cd services/api-gateway && go run main.go
cd services/auth-service && go run main.go
cd services/pet-service && go run main.go
```

#### Web App
```bash
cd web-app
npm run dev
```
アクセス: http://localhost:3000

#### Mobile App
```bash
cd frontend
npm run start
```

## 開発ガイド

### プロジェクト構成

```
pet-match/
├── services/              # バックエンドサービス
│   ├── api-gateway/      # APIゲートウェイ (8080)
│   ├── auth-service/     # 認証サービス (8081)
│   ├── pet-service/      # ペット管理 (8083)
│   ├── user-service/     # ユーザー管理 (8082)
│   ├── match-service/    # マッチング (8084)
│   ├── inquiry-service/  # 問い合わせ (8086)
│   └── docs-service/     # ドキュメント (8087)
├── shared/               # 共有ライブラリ
│   ├── config/          # 設定
│   ├── middleware/      # ミドルウェア
│   ├── errors/          # エラー定義
│   ├── logger/          # ロギング
│   └── validator/       # バリデーション
├── web-app/              # Next.js Webアプリ
├── frontend/             # React Native モバイルアプリ
├── k8s/                  # Kubernetes設定
├── scripts/              # 便利スクリプト
└── docs/                 # ドキュメント
```

### コーディング規約

- Go: `gofmt`, `golint`
- TypeScript: ESLint + Prettier
- コミットメッセージ: Conventional Commits

### テスト

```bash
# Goのテスト
cd services/auth-service
go test ./...

# フロントエンドのテスト
cd frontend
npm test
```

## デプロイ

### Kubernetes

```bash
# MinikubeでのローカルKubernetes
make k8s-deploy

# 本番環境
kubectl apply -f k8s/production/
```

詳細は [DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照してください。

## セキュリティ

セキュリティポリシーと脆弱性報告については [SECURITY.md](SECURITY.md) を参照してください。

**重要な注意事項**:
- `.env.local` は絶対にコミットしないでください
- 本番環境では Kubernetes Secrets を使用してください
- シークレットは定期的にローテーションしてください

## API ドキュメント

Swagger UI: http://localhost:8080/swagger/index.html

各サービスのエンドポイント:
- Auth Service: http://localhost:8081/swagger/
- Pet Service: http://localhost:8083/swagger/
- Match Service: http://localhost:8084/swagger/

## トラブルシューティング

### よくある問題

1. **ポート衝突**
   ```bash
   # 使用中のポートを確認
   lsof -i :8080
   ```

2. **Redis接続エラー**
   ```bash
   # Redisが起動しているか確認
   docker ps | grep redis
   ```

3. **JWTトークンエラー**
   - `.env.local` のシークレットが正しく設定されているか確認
   - 各サービスで同じシークレットを使用しているか確認

## コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## お問い合わせ

- Issues: https://github.com/yourusername/pet-match/issues
- Email: support@petmatch.example.com
