# API Gateway Dockerfile
FROM golang:1.21-alpine AS builder

# Build argument for CI isolation
ARG BUILD_ID=default
ENV BUILD_ID=${BUILD_ID}

RUN apk add --no-cache git

WORKDIR /app

# Copy go mod files from project root
COPY go.mod go.sum ./
RUN go mod download

# Copy entire project (needed for shared modules)
COPY . .

# Build the API Gateway service
WORKDIR /app/services/api-gateway
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api-gateway .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder stage
COPY --from=builder /app/services/api-gateway/api-gateway .

EXPOSE 8080

ENV PORT=8080
ENV APP_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./api-gateway"]
