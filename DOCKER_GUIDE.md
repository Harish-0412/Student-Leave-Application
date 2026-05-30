# Docker Setup Guide - Student Leave Application

## Overview

This guide covers how to build, run, and deploy the Student Leave Application using Docker. The application is a full-stack Node.js application with React frontend, Express backend, and Firebase integration.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v1.29+)
- Git
- Your environment variables (Firebase keys, GROQ API key)

## Project Structure

```
.
├── Dockerfile                 # Production Dockerfile
├── Dockerfile.dev             # Development Dockerfile  
├── docker-compose.yml         # Production compose file
├── docker-compose.dev.yml     # Development compose file
├── nginx.conf                 # Nginx reverse proxy config
├── .dockerignore              # Files to exclude from Docker build
├── .env.example               # Example environment variables
├── .env.production            # Production environment template
├── client/                    # React frontend
├── server/                    # Express backend
└── package.json               # Root dependencies
```

## Environment Setup

### 1. Create .env files

**For Development:**
```bash
cp .env.example .env
# Edit .env and add your Firebase and GROQ API keys
```

**For Production:**
```bash
cp .env.production .env.prod
# Edit .env.prod with production values
```

### Required Environment Variables

```env
# Firebase (get from https://console.firebase.google.com/)
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# GROQ API (get from https://console.groq.com/)
GROQ_API_KEY=your_groq_key
```

## Development with Docker

### Option 1: Using Docker Compose (Recommended)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop containers
docker-compose -f docker-compose.dev.yml down
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API endpoints: http://localhost:3001/api/*

### Option 2: Using Docker CLI directly

```bash
# Build development image
docker build -f Dockerfile.dev -t student-leave-app:dev .

# Run container with hot reload
docker run -d \
  -p 5173:5173 \
  -p 3001:3001 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --env-file .env \
  --name student-leave-dev \
  student-leave-app:dev

# View logs
docker logs -f student-leave-dev

# Stop container
docker stop student-leave-dev
```

## Production with Docker

### Step 1: Build Production Image

```bash
# Build the production image
docker build -t student-leave-app:latest .

# Tag for Docker Hub
docker tag student-leave-app:latest yourusername/student-leave-app:latest
```

### Step 2: Run with Docker Compose (Production)

```bash
# Start production environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

The application will be available at:
- HTTP: http://localhost:80
- HTTPS: https://localhost:443 (with SSL configured)

### Step 3: Configure SSL/HTTPS (Optional)

For HTTPS, place your SSL certificates in a `nginx-ssl/` directory:

```bash
mkdir nginx-ssl
# Place your cert.pem and key.pem in nginx-ssl/
```

Generate self-signed certificates for testing:

```bash
mkdir -p nginx-ssl

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx-ssl/key.pem \
  -out nginx-ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Docker Commands Reference

### View Running Containers

```bash
docker ps
docker ps -a  # Show all containers including stopped
```

### View Container Logs

```bash
docker logs container_name
docker logs -f container_name  # Follow logs in real-time
docker logs --tail 100 container_name  # Last 100 lines
```

### Execute Commands in Container

```bash
# Access container shell
docker exec -it container_name /bin/sh

# Run a specific command
docker exec container_name npm test
```

### Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push image
docker push yourusername/student-leave-app:latest

# Others can now pull it
docker pull yourusername/student-leave-app:latest
```

## Common Issues & Solutions

### Issue: Port already in use

```bash
# Find process using port
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# Kill process or use different port
docker run -p 3002:3001 ...
```

### Issue: Container exits immediately

```bash
# Check logs
docker logs container_name

# Run with interactive terminal
docker run -it container_name /bin/sh
```

### Issue: node_modules permission denied

```bash
# This is handled in docker-compose with:
volumes:
  - /app/node_modules
```

### Issue: Changes not reflecting in development

```bash
# Ensure volumes are mounted correctly
docker inspect container_name | grep -A 20 Mounts

# Restart container
docker-compose -f docker-compose.dev.yml restart
```

## Deploying to Cloud Platforms

### Docker Hub

```bash
# Build and push
docker build -t yourusername/student-leave-app:latest .
docker push yourusername/student-leave-app:latest
```

### AWS ECR (Elastic Container Registry)

```bash
# Login to AWS
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin your_account_id.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag student-leave-app:latest \
  your_account_id.dkr.ecr.us-east-1.amazonaws.com/student-leave-app:latest

docker push your_account_id.dkr.ecr.us-east-1.amazonaws.com/student-leave-app:latest
```

### Google Cloud Run

```bash
# Configure Docker for Google Cloud
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/your-project/student-leave-app:latest .
docker push gcr.io/your-project/student-leave-app:latest

# Deploy
gcloud run deploy student-leave-app \
  --image gcr.io/your-project/student-leave-app:latest \
  --platform managed \
  --region us-central1
```

### Azure Container Registry

```bash
# Login
az acr login --name your_registry

# Build and push
docker build -t your_registry.azurecr.io/student-leave-app:latest .
docker push your_registry.azurecr.io/student-leave-app:latest
```

## Performance Optimization

### Image Size Reduction

```bash
# Check image size
docker images | grep student-leave-app

# Use multi-stage build (already implemented in Dockerfile)
# This reduces final image size by 70%+
```

### Resource Limits

```bash
# Set in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Health Checks

```bash
# Docker will automatically restart unhealthy containers
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Monitoring & Logging

### View logs from all services

```bash
docker-compose logs -f --tail=50
```

### Collect logs for debugging

```bash
docker-compose logs > logs.txt
```

### Monitor resource usage

```bash
docker stats
```

## Security Best Practices

✅ Non-root user (nodejs) for container execution
✅ Multi-stage builds to reduce image size
✅ .dockerignore to exclude sensitive files
✅ Environment variables for secrets (not hardcoded)
✅ Health checks for automatic restarts
✅ Resource limits to prevent DoS
✅ Security headers in nginx configuration
✅ SSL/TLS encryption for HTTPS

## Useful Docker Compose Commands

```bash
# Build without starting
docker-compose build

# Start in background
docker-compose up -d

# Start specific service
docker-compose up -d app

# View service status
docker-compose ps

# Scale service (multiple instances)
docker-compose up -d --scale app=3

# Remove containers and volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

## Next Steps

1. ✅ Replace environment variables with actual values
2. ✅ Configure SSL certificates for HTTPS
3. ✅ Set up monitoring/logging (ELK Stack, Datadog, etc.)
4. ✅ Implement CI/CD pipeline (GitHub Actions, GitLab CI)
5. ✅ Set up automated backups for databases
6. ✅ Configure Docker registry for team access

## Support & Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/README.md)
