# API仕様書

## 概要

OnlyCats APIはRESTful設計に基づいており、JSON形式でデータをやり取りします。

## ベースURL

- 開発環境: `http://localhost:8080`
- API Gateway経由: `http://localhost:8080/api/v1`

## 認証

Bearer Token認証を使用します。

```
Authorization: Bearer <access_token>
```

## エンドポイント一覧

### 認証 (Auth Service - Port 8081)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/v1/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/v1/auth/login` | ログイン | 不要 |
| POST | `/api/v1/auth/refresh` | トークン更新 | 不要 |
| POST | `/api/v1/auth/logout` | ログアウト | 必要 |
| GET | `/api/v1/auth/profile` | プロフィール取得 | 必要 |
| PUT | `/api/v1/auth/profile` | プロフィール更新 | 必要 |
| PUT | `/api/v1/auth/password` | パスワード変更 | 必要 |
| GET | `/api/v1/auth/verify` | トークン検証 | 必要 |

### ペット (Pet Service - Port 8083)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/v1/pets` | ペット一覧取得 | 不要 |
| GET | `/api/v1/pets/:id` | ペット詳細取得 | 不要 |
| POST | `/api/v1/pets` | ペット登録 | 必要(shelter) |
| PUT | `/api/v1/pets/:id` | ペット更新 | 必要(owner) |
| DELETE | `/api/v1/pets/:id` | ペット削除 | 必要(owner) |

### お気に入り

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/v1/favorites` | お気に入り一覧 | 必要 |
| POST | `/api/v1/favorites` | お気に入り追加 | 必要 |
| DELETE | `/api/v1/favorites/:pet_id` | お気に入り削除 | 必要 |

### 問い合わせ (Inquiry Service - Port 8086)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/v1/inquiries` | 問い合わせ一覧 | 必要 |
| POST | `/api/v1/inquiries` | 問い合わせ作成 | 必要 |
| GET | `/api/v1/inquiries/:id` | 問い合わせ詳細 | 必要 |
| PUT | `/api/v1/inquiries/:id/status` | ステータス更新 | 必要 |

### 応募 (Application)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/v1/applications` | 応募一覧 | 必要 |
| POST | `/api/v1/applications` | 応募作成 | 必要 |
| GET | `/api/v1/applications/:id` | 応募詳細 | 必要 |
| PUT | `/api/v1/applications/:id/status` | ステータス更新 | 必要 |

## リクエスト/レスポンス例

### ユーザー登録

**リクエスト**
```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "山田太郎",
  "type": "adopter"
}
```

**レスポンス**
```json
{
  "user": {
    "id": "uuid-xxxx",
    "email": "user@example.com",
    "name": "山田太郎",
    "type": "adopter",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### ペット一覧取得

**リクエスト**
```
GET /api/v1/pets?limit=20&offset=0
```

**レスポンス**
```json
{
  "pets": [
    {
      "id": "uuid-xxxx",
      "name": "ミケ",
      "species": "cat",
      "breed": "三毛猫",
      "age_info": {
        "years": 2,
        "months": 6,
        "is_estimated": false
      },
      "gender": "female",
      "size": "medium",
      "images": ["https://..."],
      "status": "available",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

## エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": {
      "email": "メールアドレスの形式が正しくありません"
    },
    "request_id": "uuid-xxxx"
  }
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_ERROR | 400 | バリデーションエラー |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | 権限エラー |
| NOT_FOUND | 404 | リソースが見つからない |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバーエラー |

## Swagger UI

各サービスのSwagger UIにアクセス可能：

- Auth Service: http://localhost:8081/swagger/
- Pet Service: http://localhost:8083/swagger/
- Match Service: http://localhost:8084/swagger/
