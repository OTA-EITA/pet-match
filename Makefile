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

sample-data: ## Generate sample data
	@./scripts/generate-sample-data.sh

run: ## Run pet service locally
	@cd services/pet-service && go run .

# Quality checks
check: lint test ## Run all quality checks
