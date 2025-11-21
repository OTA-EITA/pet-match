# Database Migrations

このディレクトリにはPetMatchアプリケーションのデータベースマイグレーションスクリプトが含まれています。

## マイグレーションファイル

- `001_create_pets_table.sql` - Petsテーブルの作成
- `001_create_pets_table.down.sql` - Petsテーブルのロールバック

## マイグレーション実行方法

### 前提条件

PostgreSQLがインストールされ、実行されていることを確認してください。

```bash
# PostgreSQL起動確認
psql --version
```

### データベース作成

```bash
# データベース作成
createdb petmatch

# または psqlから
psql -U postgres
CREATE DATABASE petmatch;
\q
```

### マイグレーション実行

```bash
# マイグレーション実行
psql -U postgres -d petmatch -f migrations/001_create_pets_table.sql

# 成功確認
psql -U postgres -d petmatch -c "\dt"
psql -U postgres -d petmatch -c "\d pets"
```

### ロールバック

```bash
# ロールバック実行
psql -U postgres -d petmatch -f migrations/001_create_pets_table.down.sql
```

## 環境変数設定

Pet Serviceが PostgreSQL に接続するための環境変数:

```bash
export DATABASE_URL="postgres://postgres:password@localhost:5432/petmatch?sslmode=disable"
# または
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="password"
export POSTGRES_DB="petmatch"
```

## Docker Compose での実行

```bash
# docker-compose.ymlにPostgreSQLサービスが定義されている場合
docker-compose up -d postgres

# マイグレーション実行
docker-compose exec postgres psql -U postgres -d petmatch -f /migrations/001_create_pets_table.sql
```

## マイグレーションツール (将来の拡張)

現在は手動でSQLファイルを実行していますが、将来的には以下のようなマイグレーションツールの導入を検討:

- [golang-migrate/migrate](https://github.com/golang-migrate/migrate)
- [pressly/goose](https://github.com/pressly/goose)
- [rubenv/sql-migrate](https://github.com/rubenv/sql-migrate)

## トラブルシューティング

### PostgreSQLに接続できない

```bash
# PostgreSQLの状態確認
pg_isready -h localhost -p 5432

# 接続テスト
psql -U postgres -h localhost -p 5432 -d petmatch
```

### マイグレーションが失敗する

```bash
# 既存のテーブルを確認
psql -U postgres -d petmatch -c "\dt"

# 必要に応じてロールバック
psql -U postgres -d petmatch -f migrations/001_create_pets_table.down.sql
```
