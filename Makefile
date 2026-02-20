# NodeJS Monolith Development Commands

.PHONY: help install test lint format docker-up docker-down docker-logs build start dev clean

# Default target
help: ## Show this help message
	@echo "NodeJS Monolith 2.0 - Available commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and setup
install: ## Install dependencies and setup environment
	npm install
	cp .env.example .env 2>/dev/null || true

# Development commands
dev: ## Start development server with hot reload
	npm run start:dev

start: ## Start production server
	npm start

build: ## Build TypeScript to JavaScript
	npm run build

# Testing
test: ## Run all tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Generate test coverage report
	npm run test:coverage

# Code quality
lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix ESLint issues automatically
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

# Docker operations
docker-up: ## Start all Docker services (PostgreSQL, Redis, PgAdmin)
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-logs: ## View Docker container logs
	docker compose logs -f

docker-restart: ## Restart Docker services
	docker compose restart

# Database operations
db-migrate: ## Run database migrations
	npm run migration:run

db-migrate-undo: ## Undo last database migration
	npm run migration:undo

# Utility commands
clean: ## Clean build artifacts and node_modules
	rm -rf dist node_modules logs/*.log

setup: install docker-up ## Complete project setup (install + docker)
	@echo "✅ Project setup complete!"
	@echo "🔗 PgAdmin: http://localhost:8080"
	@echo "🗄️ Database: localhost:5432"
	@echo "🚀 Ready for development!"

health-check: ## Check if all services are running
	@echo "Checking application health..."
	@curl -f http://localhost:3000/health 2>/dev/null || echo "❌ Application not running"
	@docker-compose ps

# Quality assurance
qa: lint test ## Run full quality assurance (lint + test)
	@echo "✅ Quality assurance passed!"

ci-test: ## Run CI pipeline locally
	npm run tsc -- --noEmit
	npm run lint
	npm run format:check
	npm run test:coverage

ci-setup: ## Setup CI environment
	docker compose up -d postgres redis
	sleep 5
	@echo "✅ CI environment ready!"

audit: ## Run security audit
	npm audit --audit-level info || echo "Audit completed"
	npm audit --audit-level high

# Development workflow
prepare: format lint test build ## Prepare for commit (format + lint + test + build)
	@echo "✅ Ready for commit!"

# Production deployment preparation
production-ready: clean install qa build ## Prepare for production deployment
	@echo "🚀 Production build ready!"