#!/bin/bash

# Production Environment Setup Script for LogIn App
# This script helps set up all production environment variables and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Create .env.production template
create_env_template() {
    log_step "Creating production environment template..."
    
    cat > .env.production.template << 'EOF'
# Production Environment Configuration for LogIn App
# Copy this file to .env.production and fill in your actual values

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/login_production?retryWrites=true&w=majority
DATABASE_NAME=login_production

# Server Configuration
NODE_ENV=production
PORT=3000
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits-long
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AdMob Configuration
ADMOB_APP_ID_IOS=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
ADMOB_APP_ID_ANDROID=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
ADMOB_BANNER_ID_IOS=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
ADMOB_BANNER_ID_ANDROID=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
ADMOB_INTERSTITIAL_ID_IOS=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
ADMOB_INTERSTITIAL_ID_ANDROID=ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345678

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Configuration (optional, for caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Monitoring and Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/app/uploads

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

EOF

    log_info "Created .env.production.template - copy and customize this file"
}

# Create Docker environment file
create_docker_env() {
    log_step "Creating Docker environment template..."
    
    cat > .env.docker.template << 'EOF'
# Docker Compose Environment Variables
COMPOSE_PROJECT_NAME=login-app
DOCKER_REGISTRY=your-registry.com
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# Production Server Configuration
PROD_HOST=your-production-server.com
PROD_USERNAME=ubuntu
PROD_SSH_KEY=~/.ssh/production-key

# Database URL for Docker
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/login_production

# Secrets for production
JWT_SECRET=your-jwt-secret-here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

EOF

    log_info "Created .env.docker.template for Docker deployment"
}

# Create GitHub Actions secrets template
create_github_secrets_template() {
    log_step "Creating GitHub Actions secrets template..."
    
    cat > github-secrets-setup.md << 'EOF'
# GitHub Actions Secrets Setup

Add these secrets to your GitHub repository settings (Settings > Secrets and variables > Actions):

## Repository Secrets

### Docker and Deployment
- `DOCKER_REGISTRY`: your-registry.com (e.g., ghcr.io)
- `DOCKER_USERNAME`: your-docker-username
- `DOCKER_PASSWORD`: your-docker-password or token
- `PROD_HOST`: your-production-server.com
- `PROD_USERNAME`: ubuntu (or your server username)
- `PROD_SSH_KEY`: Your private SSH key for production server

### Backend Environment Variables
- `MONGODB_URI`: mongodb+srv://username:password@cluster.mongodb.net/login_production
- `JWT_SECRET`: your-super-secret-jwt-key
- `STRIPE_SECRET_KEY`: your_stripe_secret_key_here
- `STRIPE_WEBHOOK_SECRET`: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

### Expo/EAS Configuration
- `EXPO_TOKEN`: Your Expo access token (from expo.dev)
- `EXPO_APPLE_ID`: your-apple-id@example.com
- `EXPO_APPLE_APP_SPECIFIC_PASSWORD`: Your app-specific password
- `EXPO_APPLE_TEAM_ID`: Your Apple Developer Team ID

### Google Play Configuration
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Contents of your Google Service Account JSON file

## Environment Variables (for EAS builds)
These are set in your eas.json file and pulled from GitHub secrets:

- `EXPO_PUBLIC_API_URL`: https://your-domain.com/api
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- `EXPO_PUBLIC_ADMOB_APP_ID_IOS`: ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
- `EXPO_PUBLIC_ADMOB_APP_ID_ANDROID`: ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
- And all other AdMob unit IDs...

## Setup Commands

1. Add repository secrets through GitHub web interface
2. Update eas.json with your actual project ID
3. Configure app.json with your actual bundle identifiers
4. Run the deployment pipeline

EOF

    log_info "Created github-secrets-setup.md with all required secrets"
}

# Create production readiness checklist
create_readiness_checklist() {
    log_step "Creating production readiness checklist..."
    
    cat > production-readiness-checklist.md << 'EOF'
# Production Readiness Checklist

## Infrastructure Requirements

### Domain and SSL
- [ ] Domain name purchased and configured
- [ ] DNS records pointing to production server
- [ ] SSL certificates installed and auto-renewal configured
- [ ] HTTPS redirect configured
- [ ] Security headers configured (HSTS, CSP, etc.)

### Server Setup
- [ ] Production server provisioned (minimum 2GB RAM, 2 CPU cores)
- [ ] Docker and Docker Compose installed
- [ ] SSH access configured with key-based authentication
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Automatic security updates enabled
- [ ] Log rotation configured
- [ ] Backup strategy implemented

### Database
- [ ] MongoDB Atlas cluster created (M10 or higher for production)
- [ ] Database user created with appropriate permissions
- [ ] IP whitelist configured for production server
- [ ] Backups enabled and tested
- [ ] Monitoring and alerting configured
- [ ] Connection pooling optimized

## Application Configuration

### Backend API
- [ ] All environment variables configured in production
- [ ] Rate limiting configured and tested
- [ ] CORS settings configured for production domains
- [ ] Error handling and logging implemented
- [ ] Health check endpoint responding correctly
- [ ] Graceful shutdown handling implemented
- [ ] Database migrations run successfully

### Third-Party Services
- [ ] Stripe production account configured
- [ ] Stripe webhooks configured and tested
- [ ] Google AdMob production app IDs configured
- [ ] Firebase production project configured
- [ ] Push notification credentials configured
- [ ] Email service configured (if applicable)

### Mobile App Configuration
- [ ] Production API URLs configured
- [ ] Production Stripe publishable key configured
- [ ] Production AdMob unit IDs configured
- [ ] App icons and splash screens optimized
- [ ] Bundle identifiers match registered app IDs
- [ ] Version numbers set correctly
- [ ] App signing certificates configured

## Security Checklist

### Server Security
- [ ] SSH password authentication disabled
- [ ] Fail2ban or similar intrusion prevention configured
- [ ] Regular security updates scheduled
- [ ] Non-root user for application processes
- [ ] File permissions properly restricted
- [ ] Database access restricted to application only

### Application Security
- [ ] All secrets stored in environment variables
- [ ] JWT secret is cryptographically secure
- [ ] Password hashing implemented (bcrypt)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention measures implemented
- [ ] CSRF protection enabled

### Data Protection
- [ ] Data encryption at rest (database)
- [ ] Data encryption in transit (HTTPS/TLS)
- [ ] User data anonymization where possible
- [ ] Data retention policies implemented
- [ ] GDPR compliance measures (if applicable)

## Monitoring and Alerting

### Application Monitoring
- [ ] Application Performance Monitoring (APM) configured
- [ ] Error tracking and crash reporting enabled
- [ ] Custom metrics and dashboards created
- [ ] Log aggregation and search configured
- [ ] Performance benchmarks established

### Infrastructure Monitoring
- [ ] Server resource monitoring (CPU, memory, disk)
- [ ] Database performance monitoring
- [ ] Network and connectivity monitoring
- [ ] SSL certificate expiration monitoring
- [ ] Backup success/failure monitoring

### Alerting
- [ ] High-priority alerts configured (downtime, critical errors)
- [ ] Medium-priority alerts configured (performance degradation)
- [ ] Alert escalation procedures documented
- [ ] On-call rotation established (if applicable)
- [ ] Alert fatigue prevention measures in place

## Performance Optimization

### Backend Performance
- [ ] Database queries optimized and indexed
- [ ] Caching strategy implemented (Redis if needed)
- [ ] Connection pooling configured
- [ ] Response compression enabled (gzip)
- [ ] CDN configured for static assets (if applicable)

### Mobile App Performance
- [ ] Image optimization and lazy loading
- [ ] Bundle size optimization
- [ ] Network request optimization
- [ ] Offline functionality implemented
- [ ] Performance testing on low-end devices

### Load Testing
- [ ] API endpoints load tested
- [ ] Database performance under load tested
- [ ] Auto-scaling configuration tested
- [ ] Disaster recovery procedures tested

## Compliance and Legal

### App Store Requirements
- [ ] App Store review guidelines compliance verified
- [ ] Google Play policy compliance verified
- [ ] Age rating and content declarations completed
- [ ] In-app purchase policies followed
- [ ] Subscription terms clearly stated

### Legal Requirements
- [ ] Privacy policy published and accessible
- [ ] Terms of service published and accessible
- [ ] Cookie policy (if applicable)
- [ ] Data processing agreements in place
- [ ] Compliance with local regulations

## Launch Preparation

### Support Infrastructure
- [ ] Customer support system configured
- [ ] Help documentation created
- [ ] FAQ section prepared
- [ ] Contact information publicly available
- [ ] Support team trained on common issues

### Marketing and Analytics
- [ ] Analytics tracking implemented
- [ ] Conversion tracking configured
- [ ] A/B testing framework ready (if applicable)
- [ ] Marketing attribution configured
- [ ] Social media accounts prepared

### Emergency Procedures
- [ ] Rollback procedures documented and tested
- [ ] Emergency contacts list maintained
- [ ] Incident response plan documented
- [ ] Communication plan for outages
- [ ] Escalation procedures defined

## Final Validation

### Pre-Launch Testing
- [ ] End-to-end testing in production environment
- [ ] Payment flow testing with real transactions
- [ ] Ad serving and monetization testing
- [ ] Cross-platform compatibility verified
- [ ] Performance testing under realistic load

### Launch Day Preparation
- [ ] Monitoring dashboards prepared
- [ ] Support team on standby
- [ ] Marketing campaigns ready
- [ ] Success metrics defined and tracked
- [ ] Post-launch improvement plan prepared

This checklist ensures your LogIn app is production-ready and can handle real users reliably and securely.

EOF

    log_info "Created production-readiness-checklist.md"
}

# Main setup function
main() {
    log_info "Setting up production environment for LogIn App..."
    
    # Create directories
    mkdir -p deployment-config/environments
    mkdir -p scripts
    mkdir -p docs
    
    # Create all templates and documentation
    create_env_template
    create_docker_env
    create_github_secrets_template
    create_readiness_checklist
    
    log_info "Production environment setup completed!"
    echo
    log_warn "Next Steps:"
    echo "1. Copy .env.production.template to .env.production and fill in your values"
    echo "2. Copy .env.docker.template to .env.docker and customize"
    echo "3. Follow github-secrets-setup.md to configure GitHub Actions"
    echo "4. Use production-readiness-checklist.md before going live"
    echo
    log_info "All templates and documentation are ready for customization"
}

main "$@"