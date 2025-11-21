#!/bin/bash

# PetMatch - Secure Secrets Generator
# このスクリプトは開発環境用の強力なシークレットを生成します

set -e

echo "🔐 Generating secure secrets for PetMatch..."
echo ""

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 32バイト（256bit）のランダムな秘密鍵を生成
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_API_GATEWAY_SECRET=$(openssl rand -base64 32)
MINIO_ACCESS_KEY=$(openssl rand -hex 16)
MINIO_SECRET_KEY=$(openssl rand -base64 32)

echo -e "${GREEN}✓ Generated JWT_ACCESS_SECRET${NC}"
echo -e "${GREEN}✓ Generated JWT_REFRESH_SECRET${NC}"
echo -e "${GREEN}✓ Generated JWT_SECRET (API Gateway)${NC}"
echo -e "${GREEN}✓ Generated MINIO_ACCESS_KEY${NC}"
echo -e "${GREEN}✓ Generated MINIO_SECRET_KEY${NC}"
echo ""

# .env.localファイルのパス
ENV_LOCAL_FILE=".env.local"

# 既存の.env.localがある場合は警告
if [ -f "$ENV_LOCAL_FILE" ]; then
    echo -e "${YELLOW}⚠️  Warning: $ENV_LOCAL_FILE already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Your secrets are shown below (save them securely):"
        echo ""
        echo "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"
        echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
        echo "JWT_SECRET=$JWT_API_GATEWAY_SECRET"
        echo "MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY"
        echo "MINIO_SECRET_KEY=$MINIO_SECRET_KEY"
        exit 0
    fi
    # バックアップを作成
    cp "$ENV_LOCAL_FILE" "$ENV_LOCAL_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✓ Created backup of existing .env.local"
fi

# .env.exampleをベースに.env.localを作成
cp .env.example "$ENV_LOCAL_FILE"

# シークレットを置換（macOSとLinuxの両方に対応）
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET|g" "$ENV_LOCAL_FILE"
    sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" "$ENV_LOCAL_FILE"
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_API_GATEWAY_SECRET|g" "$ENV_LOCAL_FILE"
    sed -i '' "s|MINIO_ACCESS_KEY=.*|MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY|g" "$ENV_LOCAL_FILE"
    sed -i '' "s|MINIO_SECRET_KEY=.*|MINIO_SECRET_KEY=$MINIO_SECRET_KEY|g" "$ENV_LOCAL_FILE"
else
    # Linux
    sed -i "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET|g" "$ENV_LOCAL_FILE"
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" "$ENV_LOCAL_FILE"
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_API_GATEWAY_SECRET|g" "$ENV_LOCAL_FILE"
    sed -i "s|MINIO_ACCESS_KEY=.*|MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY|g" "$ENV_LOCAL_FILE"
    sed -i "s|MINIO_SECRET_KEY=.*|MINIO_SECRET_KEY=$MINIO_SECRET_KEY|g" "$ENV_LOCAL_FILE"
fi

echo ""
echo -e "${GREEN}✅ Success! Secrets have been generated and saved to $ENV_LOCAL_FILE${NC}"
echo ""
echo "Next steps:"
echo "1. Review $ENV_LOCAL_FILE and adjust other settings as needed"
echo "2. Make sure $ENV_LOCAL_FILE is in .gitignore (already done)"
echo "3. For production, use Kubernetes Secrets or a secrets manager"
echo ""
echo -e "${YELLOW}⚠️  Never commit $ENV_LOCAL_FILE to version control!${NC}"
