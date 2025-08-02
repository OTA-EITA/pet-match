#!/bin/bash

# PetMatch Kubernetes Deploy Script
set -e

NAMESPACE="petmatch"
SERVICE_NAME=${1:-"pet-service"}
ACTION=${2:-"deploy"}

echo "PetMatch Kubernetes Deployment"
echo "Namespace: $NAMESPACE"
echo "Service: $SERVICE_NAME"
echo "Action: $ACTION"

# Change to project root
cd "$(dirname "$0")/.."

case $ACTION in
  "deploy")
    echo "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Apply ConfigMap and Secrets
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    
    # Deploy Redis
    kubectl apply -f k8s/redis/
    
    # Wait for Redis to be ready
    echo "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis,role=master -n $NAMESPACE --timeout=60s
    
    # Setup Redis indexes
    echo "Setting up Redis search indexes..."
    kubectl exec -n $NAMESPACE deployment/redis-master -- redis-cli -a petmatch123 FT.CREATE pet-index ON JSON PREFIX 1 pet: SCHEMA $.species AS species TEXT SORTABLE $.breed AS breed TEXT SORTABLE $.age AS age NUMERIC SORTABLE $.location AS location GEO $.status AS status TAG SORTABLE $.gender AS gender TAG $.size AS size TAG
    kubectl exec -n $NAMESPACE deployment/redis-master -- redis-cli -a petmatch123 FT.CREATE user-index ON JSON PREFIX 1 user: SCHEMA $.type AS type TAG $.email AS email TEXT $.coordinates AS coordinates GEO $.verified AS verified TAG
    
    # Build and deploy service
    if [ "$SERVICE_NAME" = "all" ]; then
      echo "Deploying all services..."
      for service in pet-service; do
        ./scripts/build.sh $service
        kubectl apply -f k8s/services/$service.yaml
      done
    else
      echo "Deploying $SERVICE_NAME..."
      ./scripts/build.sh $SERVICE_NAME
      kubectl apply -f k8s/services/$SERVICE_NAME.yaml
    fi
    
    # Wait for deployment
    echo "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available deployment/$SERVICE_NAME -n $NAMESPACE --timeout=120s
    
    echo "Deployment completed successfully!"
    ;;
    
  "status")
    echo "Checking deployment status..."
    kubectl get all -n $NAMESPACE
    echo ""
    kubectl get pvc -n $NAMESPACE
    echo ""
    kubectl top pods -n $NAMESPACE || echo "Metrics server not available"
    ;;
    
  "logs")
    echo "Showing logs for $SERVICE_NAME..."
    kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME --tail=50 -f
    ;;
    
  "shell")
    echo "Opening shell in $SERVICE_NAME..."
    kubectl exec -it -n $NAMESPACE deployment/$SERVICE_NAME -- sh
    ;;
    
  "redis-cli")
    echo "Opening Redis CLI..."
    kubectl exec -it -n $NAMESPACE deployment/redis-master -- redis-cli -a petmatch123
    ;;
    
  "port-forward")
    PORT=${3:-8083}
    echo "Port forwarding $SERVICE_NAME:$PORT..."
    kubectl port-forward -n $NAMESPACE service/$SERVICE_NAME $PORT:$PORT
    ;;
    
  "delete")
    echo "Deleting $SERVICE_NAME..."
    kubectl delete -f k8s/services/$SERVICE_NAME.yaml || true
    if [ "$SERVICE_NAME" = "all" ]; then
      kubectl delete namespace $NAMESPACE
    fi
    ;;
    
  "reset")
    echo "Resetting entire PetMatch deployment..."
    kubectl delete namespace $NAMESPACE || true
    echo "Reset completed. Run 'deploy' to reinstall."
    ;;
    
  *)
    echo "ERROR: Unknown action: $ACTION"
    echo ""
    echo "Usage:"
    echo "  $0 [service] [action]"
    echo ""
    echo "Services: pet-service, auth-service, all"
    echo "Actions:"
    echo "  deploy        - Deploy service(s)"
    echo "  status        - Show deployment status"
    echo "  logs          - Show service logs"
    echo "  shell         - Open shell in service pod"
    echo "  redis-cli     - Open Redis CLI"
    echo "  port-forward  - Port forward service (default: 8083)"
    echo "  delete        - Delete service"
    echo "  reset         - Reset entire deployment"
    echo ""
    echo "Examples:"
    echo "  $0 pet-service deploy"
    echo "  $0 pet-service port-forward 8083"
    echo "  $0 all status"
    exit 1
    ;;
esac
