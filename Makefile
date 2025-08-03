.PHONY: help build test lint clean dev-setup docker-build

# PetMatch Makefile

# Check if golangci-lint is in PATH, otherwise use GOPATH
GOLANGCI_LINT := $(shell which golangci-lint 2>/dev/null || echo "$(shell go env GOPATH)/bin/golangci-lint")

help: ## Show help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-setup: ## Setup development environment
	@./scripts/dev-setup.sh

build: ## Build all services
	@echo "Building Pet Service..."
	@cd services/pet-service && go build -o ../../bin/pet-service .
	@echo "Building API Gateway..."
	@cd services/api-gateway && go build -o ../../bin/api-gateway .

test: ## Run tests
	@go test ./... -v

lint: ## Run golangci-lint
	@$(GOLANGCI_LINT) run ./...

lint-fix: ## Run golangci-lint with auto-fix
	@$(GOLANGCI_LINT) run --fix ./...

clean: ## Clean build artifacts
	@rm -rf bin/
	@docker-compose -f docker/docker-compose.dev.yml down -v || true

docker-build: ## Build Docker images
	@./scripts/build.sh pet-service
	@echo "Building API Gateway Docker image..."
	@cd services/api-gateway && docker build -t petmatch/api-gateway:latest .

sample-data: ## Generate sample data
	@./scripts/generate-sample-data.sh

run: ## Run pet service locally
	@cd services/pet-service && go run .

run-gateway: ## Run API Gateway locally
	@cd services/api-gateway && go run .

run-all: ## Run all services locally (requires tmux)
	@echo "Starting Pet Service and API Gateway..."
	@tmux new-session -d -s petmatch-dev 'cd services/pet-service && go run .' \; \
		split-window -h 'cd services/api-gateway && go run .' \; \
		select-layout even-horizontal \; \
		attach-session -t petmatch-dev

# Kubernetes
k8s-deploy: docker-build ## Build and deploy to Kubernetes
	@echo "Deploying to Kubernetes..."
	@kubectl apply -f k8s/namespace.yaml
	@kubectl apply -f k8s/configmap.yaml
	@kubectl apply -f k8s/secrets.yaml
	@kubectl apply -f k8s/redis/
	@kubectl apply -f k8s/services/
	@echo "Waiting for deployments..."
	@kubectl rollout status deployment/pet-service -n petmatch --timeout=60s
	@kubectl rollout status deployment/api-gateway -n petmatch --timeout=60s

k8s-status: ## Check Kubernetes status
	@echo "=== Kubernetes Status ==="
	@kubectl get pods -n petmatch
	@echo ""
	@kubectl get services -n petmatch
	@echo ""
	@kubectl get ingress -n petmatch

k8s-logs: ## Show API Gateway logs
	@kubectl logs -l app=api-gateway -n petmatch --tail=50 -f

# Testing
test-gateway: ## Test API Gateway
	@chmod +x test-complete.sh && ./test-complete.sh

test-all: build test-gateway ## Build and test all components

dev: ## Start development environment
	@echo "Starting development environment..."
	@echo "Use Ctrl+C to stop all services"
	@make run-all

# React Native
frontend-install: ## Install React Native dependencies
	@cd frontend && npm install

frontend-start: ## Start React Native development server
	@cd frontend && npm start

frontend-ios: ## Start iOS simulator
	@cd frontend && npm run ios

frontend-android: ## Start Android emulator
	@cd frontend && npm run android

frontend-web: ## Start web browser
	@cd frontend && npm run web

# Development Environment
dev-full: ## Start full development environment
	@echo "Starting full PetMatch development environment..."
	@echo "1. API Gateway: http://localhost:8080"
	@echo "2. React Native: http://localhost:19006"
	@tmux new-session -d -s petmatch-full \
		'kubectl port-forward service/api-gateway 8080:8080 -n petmatch' \; \
		split-window -h 'cd frontend && npm start' \; \
		select-layout even-horizontal \; \
		attach-session -t petmatch-full

# Quality checks
check: lint test ## Run all quality checks
