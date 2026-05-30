# Multi-stage build for optimized production image
# Stage 1: Build frontend and backend
FROM node:18-alpine as builder

WORKDIR /app

# Copy all project files
COPY package*.json ./
COPY tsconfig.json ./
COPY eslint.config.js ./
COPY .env.example ./.env

# Copy source directories
COPY client ./client
COPY server ./server
COPY api ./api

# Install dependencies
RUN npm ci

# Build the frontend
RUN npm run build

# Build the backend (if there's a build script)
RUN cd server && npm ci

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package.json for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server ./server
COPY tsconfig.json ./

# Copy .env configuration (should be provided at runtime)
COPY .env.example ./.env

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Default command - start the server
CMD ["node", "server/index.js"]
