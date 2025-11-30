# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy shared modules
COPY shared/ ./shared/

# Copy docs service
COPY services/docs-service/ ./services/docs-service/

# Build the docs service
RUN cd services/docs-service && go build -o /app/docs-service .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary
COPY --from=builder /app/docs-service .

# Expose port
EXPOSE 8090

# Run the docs service
CMD ["./docs-service"]
