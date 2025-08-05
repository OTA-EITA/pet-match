# Pet Service Dockerfile - Fixed
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy root go mod files (for shared modules)
COPY go.mod go.sum ./

# Copy shared modules
COPY shared/ ./shared/

# Copy service source code
COPY services/pet-service/ ./services/pet-service/

# Download dependencies
RUN go mod download

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o pet-service ./services/pet-service

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/pet-service .

# Create uploads directory with proper permissions
RUN mkdir -p uploads/pets && chmod -R 755 uploads/

EXPOSE 8083

ENV PORT=8083
ENV APP_ENV=production

CMD ["./pet-service"]
