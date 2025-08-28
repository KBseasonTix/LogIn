#!/bin/bash

# Production Deployment Script for LogIn App
# Usage: ./deploy-production.sh [backend|mobile|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_TYPE="${1:-all}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
    command -v npx >/dev/null 2>&1 || { log_error "NPX is required but not installed."; exit 1; }
    
    # Check if environment variables are set
    if [[ "$DEPLOY_TYPE" == "backend" || "$DEPLOY_TYPE" == "all" ]]; then
        [[ -z "$MONGODB_URI" ]] && log_error "MONGODB_URI environment variable is required" && exit 1
        [[ -z "$JWT_SECRET" ]] && log_error "JWT_SECRET environment variable is required" && exit 1
        [[ -z "$STRIPE_SECRET_KEY" ]] && log_error "STRIPE_SECRET_KEY environment variable is required" && exit 1
    fi
    
    if [[ "$DEPLOY_TYPE" == "mobile" || "$DEPLOY_TYPE" == "all" ]]; then
        [[ -z "$EXPO_TOKEN" ]] && log_error "EXPO_TOKEN environment variable is required" && exit 1
    fi
    
    log_info "Prerequisites check passed"
}

deploy_backend() {
    log_info "Starting backend deployment..."
    
    cd "$PROJECT_ROOT/server"
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm ci --only=production
    
    # Run security audit
    log_info "Running security audit..."
    npm audit --audit-level high || log_warn "Security audit found issues"
    
    # Build and deploy with Docker
    log_info "Building Docker image..."
    cd "$PROJECT_ROOT"
    docker-compose -f deployment-config/docker/docker-compose.prod.yml build login-backend
    
    # Deploy to production
    log_info "Deploying to production..."
    docker-compose -f deployment-config/docker/docker-compose.prod.yml up -d
    
    # Health check
    log_info "Performing health check..."
    sleep 30
    if curl -f https://your-domain.com/health >/dev/null 2>&1; then
        log_info "Backend deployment successful - health check passed"
    else
        log_error "Backend deployment failed - health check failed"
        exit 1
    fi
}

deploy_mobile() {
    log_info "Starting mobile app deployment..."
    
    cd "$PROJECT_ROOT/client"
    
    # Install dependencies
    log_info "Installing mobile app dependencies..."
    npm ci
    
    # Install EAS CLI if not present
    if ! command -v eas &> /dev/null; then
        log_info "Installing EAS CLI..."
        npm install -g eas-cli
    fi
    
    # Verify configuration
    log_info "Verifying Expo configuration..."
    npx expo config --type public >/dev/null
    
    # Build for production
    log_info "Building production apps..."
    eas build --platform all --profile production --non-interactive
    
    # Submit to stores (optional - only if credentials are configured)
    log_info "Attempting to submit to app stores..."
    if eas submit --platform ios --profile production --non-interactive 2>/dev/null; then
        log_info "iOS submission successful"
    else
        log_warn "iOS submission skipped - ensure Apple credentials are configured"
    fi
    
    if eas submit --platform android --profile production --non-interactive 2>/dev/null; then
        log_info "Android submission successful"
    else
        log_warn "Android submission skipped - ensure Google Play credentials are configured"
    fi
}

cleanup() {
    log_info "Performing cleanup..."
    docker system prune -f >/dev/null 2>&1 || true
}

main() {
    log_info "Starting deployment process for: $DEPLOY_TYPE"
    
    check_prerequisites
    
    case "$DEPLOY_TYPE" in
        "backend")
            deploy_backend
            ;;
        "mobile")
            deploy_mobile
            ;;
        "all")
            deploy_backend
            deploy_mobile
            ;;
        *)
            log_error "Invalid deployment type. Use: backend, mobile, or all"
            exit 1
            ;;
    esac
    
    cleanup
    log_info "Deployment completed successfully!"
}

# Trap to ensure cleanup runs on exit
trap cleanup EXIT

main "$@"