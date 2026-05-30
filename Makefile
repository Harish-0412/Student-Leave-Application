# Makefile for Student Leave Application Docker Commands
# Usage: make [command]

.PHONY: help dev prod build push logs clean restart health

# Variables
IMAGE_NAME := student-leave-app
REGISTRY := yourusername
TAG := latest
DOCKER_COMPOSE_DEV := docker-compose.dev.yml
DOCKER_COMPOSE_PROD := docker-compose.yml

help:
	@echo "Student Leave Application - Docker Commands"
	@echo "=============================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development environment with hot reload"
	@echo "  make dev-build    - Build development image"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-stop     - Stop development environment"
	@echo "  make dev-shell    - Access development container shell"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build production image"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-stop    - Stop production environment"
	@echo ""
	@echo "Docker Hub Commands:"
	@echo "  make push         - Push image to Docker Hub"
	@echo "  make pull         - Pull image from Docker Hub"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean        - Remove all containers and volumes"
	@echo "  make logs         - View current logs"
	@echo "  make ps           - List running containers"
	@echo "  make health       - Check container health status"
	@echo "  make restart      - Restart current environment"
	@echo "  make env          - Create .env file from example"

# Development targets
dev:
	@echo "Starting development environment..."
	docker-compose -f $(DOCKER_COMPOSE_DEV) up -d
	@echo "✓ Development environment started"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3001"

dev-build:
	@echo "Building development image..."
	docker build -f Dockerfile.dev -t $(IMAGE_NAME):dev .
	@echo "✓ Development image built"

dev-logs:
	docker-compose -f $(DOCKER_COMPOSE_DEV) logs -f

dev-stop:
	@echo "Stopping development environment..."
	docker-compose -f $(DOCKER_COMPOSE_DEV) down
	@echo "✓ Development environment stopped"

dev-shell:
	@echo "Accessing development container shell..."
	docker-compose -f $(DOCKER_COMPOSE_DEV) exec app-dev /bin/sh

# Production targets
prod:
	@echo "Starting production environment..."
	docker-compose -f $(DOCKER_COMPOSE_PROD) up -d
	@echo "✓ Production environment started"
	@echo "HTTP: http://localhost:80"
	@echo "HTTPS: https://localhost:443"

prod-build:
	@echo "Building production image..."
	docker build -t $(IMAGE_NAME):$(TAG) .
	@echo "✓ Production image built"

prod-logs:
	docker-compose -f $(DOCKER_COMPOSE_PROD) logs -f

prod-stop:
	@echo "Stopping production environment..."
	docker-compose -f $(DOCKER_COMPOSE_PROD) down
	@echo "✓ Production environment stopped"

# Docker Hub targets
push: prod-build
	@echo "Pushing image to Docker Hub..."
	docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo "✓ Image pushed to Docker Hub"

pull:
	@echo "Pulling image from Docker Hub..."
	docker pull $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo "✓ Image pulled from Docker Hub"

# Utility targets
build: prod-build dev-build
	@echo "✓ All images built"

logs:
	docker-compose logs -f

ps:
	docker-compose ps

health:
	@echo "Checking container health..."
	docker-compose ps
	@echo ""
	@echo "Container Stats:"
	docker stats --no-stream

restart:
	@echo "Restarting containers..."
	docker-compose restart
	@echo "✓ Containers restarted"

clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v
	docker-compose -f $(DOCKER_COMPOSE_DEV) down -v
	docker system prune -f
	@echo "✓ Cleanup complete"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ .env file created from example"; \
		echo "⚠ Please edit .env with your actual credentials"; \
	else \
		echo ".env file already exists"; \
	fi

# Build and test locally
test:
	@echo "Running tests..."
	docker-compose -f $(DOCKER_COMPOSE_DEV) exec app-dev npm test

lint:
	@echo "Running linter..."
	docker-compose -f $(DOCKER_COMPOSE_DEV) exec app-dev npm run lint

# Development quick start
quickstart: env dev
	@echo ""
	@echo "=============================================="
	@echo "✓ Development environment is ready!"
	@echo "=============================================="
	@echo ""
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:3001"
	@echo ""
	@echo "View logs: make dev-logs"
	@echo "Stop:      make dev-stop"
	@echo ""

# Production quick start
quickstart-prod: prod
	@echo ""
	@echo "=============================================="
	@echo "✓ Production environment is ready!"
	@echo "=============================================="
	@echo ""
	@echo "HTTP:  http://localhost:80"
	@echo "HTTPS: https://localhost:443"
	@echo ""
	@echo "View logs: make prod-logs"
	@echo "Stop:      make prod-stop"
	@echo ""

# Default target
.DEFAULT_GOAL := help
