#!/bin/bash

echo "Building API Gateway..."

cd /home/eitafeir/src/works/pet-match

# API Gatewayをビルド
cd services/api-gateway
echo "Installing dependencies..."
go mod download

echo "Building binary..."
go build -o ../../bin/api-gateway .

if [ $? -eq 0 ]; then
    echo "API Gateway built successfully!"
    echo "Binary: /home/eitafeir/src/works/pet-match/bin/api-gateway"
else
    echo "API Gateway build failed"
    exit 1
fi

echo ""
echo "Ready to test API Gateway:"
echo "1. Start Pet Service: make run (in one terminal)"
echo "2. Start API Gateway: make run-gateway (in another terminal)"
echo "3. Test: curl http://localhost:8080/health"
