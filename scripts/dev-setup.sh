#!/bin/bash

# PetMatch Development Setup Script with golangci-lint
set -e

echo "PetMatch development environment setup starting..."

# Change to project root
cd "$(dirname "$0")/.."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Please start Docker first."
  exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "ERROR: Go is not installed"
    echo "Install Go from: https://golang.org/dl/"
    exit 1
fi

# Install golangci-lint if not present
if ! command -v golangci-lint &> /dev/null; then
    echo "Installing golangci-lint..."
    curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.55.2
    echo "golangci-lint installed"
else
    echo "golangci-lint already installed: $(golangci-lint version)"
fi

# Setup Git hooks
echo "Setting up Git hooks..."
if [ -d ".git" ]; then
    chmod +x .githooks/pre-commit
    git config core.hooksPath .githooks
    echo "Git hooks configured"
else
    echo "WARNING: Not a Git repository, skipping Git hooks setup"
fi

# Initialize Go modules
echo "Initializing Go modules..."
if [ ! -f "go.sum" ]; then
  go mod tidy
  echo "Go modules initialized"
else
  echo "Go modules already initialized"
fi

# Create bin directory
mkdir -p bin

# Start Redis
echo "Starting Redis..."
docker-compose -f docker/docker-compose.dev.yml up redis -d

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
sleep 3

# Test Redis connection
if docker exec petmatch-redis redis-cli -a petmatch123 ping | grep -q "PONG"; then
  echo "Redis is ready"
else
  echo "ERROR: Redis connection failed"
  exit 1
fi

# Setup Redis indexes
echo "Setting up Redis search indexes..."
docker exec petmatch-redis redis-cli -a petmatch123 FT.CREATE pet-index ON JSON PREFIX 1 pet: SCHEMA $.species AS species TEXT SORTABLE $.breed AS breed TEXT SORTABLE $.age AS age NUMERIC SORTABLE $.location AS location GEO $.status AS status TAG SORTABLE $.gender AS gender TAG $.size AS size TAG
docker exec petmatch-redis redis-cli -a petmatch123 FT.CREATE user-index ON JSON PREFIX 1 user: SCHEMA $.type AS type TAG $.email AS email TEXT $.coordinates AS coordinates GEO $.verified AS verified TAG
echo "Redis indexes created"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "# PetMatch Development Environment" > .env
  echo "APP_ENV=development" >> .env
  echo "PORT=8083" >> .env
  echo "" >> .env
  echo "# Redis" >> .env
  echo "REDIS_HOST=localhost" >> .env
  echo "REDIS_PORT=6379" >> .env
  echo "REDIS_PASSWORD=petmatch123" >> .env
  echo "REDIS_DB=0" >> .env
  echo "" >> .env
  echo "# JWT Secrets" >> .env
  echo "JWT_ACCESS_SECRET=dev-access-secret-key-please-change-in-production" >> .env
  echo "JWT_REFRESH_SECRET=dev-refresh-secret-key-please-change-in-production" >> .env
  echo "JWT_ACCESS_TTL=900" >> .env
  echo "JWT_REFRESH_TTL=604800" >> .env
  echo "" >> .env
  echo "# Service URLs" >> .env
  echo "AUTH_SERVICE_URL=http://localhost:8081" >> .env
  echo "USER_SERVICE_URL=http://localhost:8082" >> .env
  echo "PET_SERVICE_URL=http://localhost:8083" >> .env
  echo "MATCH_SERVICE_URL=http://localhost:8084" >> .env
  echo "CHAT_SERVICE_URL=http://localhost:8085" >> .env
  echo "" >> .env
  echo "# External Services" >> .env
  echo "MINIO_ENDPOINT=localhost:9000" >> .env
  echo "MINIO_ACCESS_KEY=minioadmin" >> .env
  echo "MINIO_SECRET_KEY=minioadmin" >> .env
  echo ".env file created"
else
  echo ".env file already exists"
fi

# Run initial lint check
echo "Running initial code quality check..."
if command -v golangci-lint &> /dev/null; then
    if ! golangci-lint run ./...; then
        echo "WARNING: Code quality issues found. Run 'make lint-fix' to auto-fix some issues."
    else
        echo "Code quality check passed"
    fi
fi

echo ""
echo "Development environment setup complete!"
echo ""
echo "Available commands:"
echo "   make help              - Show all available commands"
echo "   make run               - Start pet service"
echo "   make lint              - Run code quality checks"
echo "   make test              - Run tests"
echo "   make build             - Build all services"
echo ""
echo "Direct commands:"
echo "   golangci-lint run ./...      - Run linter"
echo "   go test ./...                - Run tests"
echo "   go run ./services/pet-service - Start service"
