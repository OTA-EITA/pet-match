# Base image for Go services
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy shared directory
COPY shared/ shared/

# Copy service source
ARG SERVICE_NAME
COPY services/${SERVICE_NAME}/ services/${SERVICE_NAME}/

# Build the service
WORKDIR /app/services/${SERVICE_NAME}
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary
ARG SERVICE_NAME
COPY --from=builder /app/services/${SERVICE_NAME}/main .

# Expose port
EXPOSE 8080

CMD ["./main"]
