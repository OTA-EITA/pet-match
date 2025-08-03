FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod file first
COPY go.mod ./

# Download dependencies (this will create go.sum)
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api-gateway .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/api-gateway .

# Expose port
EXPOSE 8080

CMD ["./api-gateway"]
