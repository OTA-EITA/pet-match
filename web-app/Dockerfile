# Web App Dockerfile - CI optimized
FROM node:20-alpine AS base

# Build argument for CI isolation
ARG BUILD_ID=default
ENV BUILD_ID=${BUILD_ID}

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Verify package-lock.json and install dependencies
RUN if [ ! -f package-lock.json ]; then \
        echo "package-lock.json not found, generating..."; \
        npm install --package-lock-only; \
    elif ! npm ci --dry-run > /dev/null 2>&1; then \
        echo "package.json and package-lock.json are out of sync, regenerating..."; \
        rm package-lock.json; \
        npm install --package-lock-only; \
    fi && \
    npm ci --prefer-offline --no-audit --progress=false && \
    npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build with unique cache busting
RUN echo "Building with ID: ${BUILD_ID}" && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --only=production --prefer-offline && \
    npm cache clean --force

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_ID=${BUILD_ID}

# Create system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy Next.js built files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create public directory
RUN mkdir -p public && chown nextjs:nodejs public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
