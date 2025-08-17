# Sample Data Generator Dockerfile
FROM alpine:3.18

# 必要なパッケージをインストール
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    coreutils

# 作業ディレクトリ設定
WORKDIR /app

# サンプルデータ生成スクリプトをコピー
COPY scripts/generate-sample-data-working.sh /app/generate-sample-data.sh

# 実行権限付与
RUN chmod +x /app/generate-sample-data.sh

# 環境変数設定
ENV PET_SERVICE_URL=http://pet-service:8083
ENV AUTH_SERVICE_URL=http://auth-service:8081
ENV NUM_PETS=30

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f $PET_SERVICE_URL/health || exit 1

# デフォルトコマンド
CMD ["/app/generate-sample-data.sh"]
