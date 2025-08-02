#!/bin/bash

# PetMatch Build Script
set -e

SERVICE_NAME=${1:-"pet-service"}
VERSION=${2:-"v1.0.0"}

echo "Building PetMatch service: $SERVICE_NAME"

# Change to project root
cd "$(dirname "$0")/.."

# Build Docker image
docker build \
  -f docker/Dockerfile \
  --build-arg SERVICE_NAME=$SERVICE_NAME \
  -t petmatch/$SERVICE_NAME:$VERSION \
  -t petmatch/$SERVICE_NAME:latest \
  .

echo "Successfully built petmatch/$SERVICE_NAME:$VERSION"

# Optional: Push to registry
if [ "$3" = "push" ]; then
  echo "Pushing to registry..."
  docker push petmatch/$SERVICE_NAME:$VERSION
  docker push petmatch/$SERVICE_NAME:latest
  echo "Pushed to registry"
fi
