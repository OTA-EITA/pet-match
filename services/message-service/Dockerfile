FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy shared packages
COPY shared/ ./shared/

# Copy message service files
COPY services/message-service/ ./services/message-service/

# Build the application
WORKDIR /app/services/message-service
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# Copy binary
COPY --from=builder /app/services/message-service/main .

# Expose port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8088/health || exit 1

CMD ["./main"]
