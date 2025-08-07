# API Gateway Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files from root
COPY go.mod go.sum ./
RUN go mod download

# Copy shared packages
COPY shared/ ./shared/

# Copy api-gateway service files
COPY services/api-gateway/ ./services/api-gateway/

# Build the application
WORKDIR /app/services/api-gateway
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# Copy binary
COPY --from=builder /app/services/api-gateway/main .

# Copy .env file if exists (optional)
# Note: .env files are copied if they exist, ignored if they don't

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV APP_ENV=production
ENV GIN_MODE=release

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./main"]
