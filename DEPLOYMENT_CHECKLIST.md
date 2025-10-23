# Deployment Checklist

A comprehensive checklist to ensure safe and successful deployments of the Fitness Goal Tracker application.

## Pre-Deployment Checklist

### 🔍 Code Quality

- [ ] All linting errors fixed (`npm run lint`)
- [ ] All code formatted (`npm run format:check`)
- [ ] No console.log statements in production code (except allowed files)
- [ ] Code reviewed by at least one other developer (if team)
- [ ] All TODO comments addressed or tracked

### ✅ Testing

- [ ] All unit tests passing (`npm test`)
- [ ] Test coverage meets threshold (60%+)
- [ ] Manual testing completed for new features
- [ ] Edge cases tested
- [ ] Error handling tested
- [ ] Authentication flows tested

### 🔒 Security

- [ ] No secrets/API keys in code (check `.env.example` only)
- [ ] Environment variables properly configured
- [ ] JWT_SECRET is strong and unique (use `npm run generate-secret`)
- [ ] Database connection string uses authentication
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled and tested
- [ ] Input validation comprehensive
- [ ] Helmet security headers configured

### 📦 Dependencies

- [ ] All dependencies up to date (`npm outdated`)
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Package-lock.json committed
- [ ] Dev dependencies separated from production

### 🗄️ Database

- [ ] Database backups configured
- [ ] Migration scripts tested (if applicable)
- [ ] Indexes created for performance
- [ ] Connection pooling configured
- [ ] Replica set/clustering configured (production)

### 📝 Documentation

- [ ] README.md updated
- [ ] API documentation current (Swagger at `/api-docs`)
- [ ] CHANGELOG.md updated with new version
- [ ] Environment variables documented
- [ ] Deployment steps documented

---

## Deployment Steps

### Railway Deployment (Recommended)

#### 1. Pre-Deploy Preparation

```bash
# Ensure on correct branch
git checkout main

# Pull latest changes
git pull origin main

# Run full test suite
cd server && npm test

# Check build
npm run lint && npm run format:check
```

#### 2. Environment Variables

Verify all required variables in Railway dashboard:

**Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Strong random secret (256+ bits)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NODE_ENV` - Set to `production`

**Optional:**
- `PORT` - Auto-assigned by Railway (default: 3000)
- `LOG_LEVEL` - Set to `info` or `warn` in production
- `CLIENT_URL` - Frontend URL for CORS

#### 3. Deploy to Railway

```bash
# Option 1: Push to main (auto-deploy)
git push origin main

# Option 2: Manual deploy via Railway CLI
railway up

# Option 3: Deploy via Railway dashboard
# Use "Deploy Now" button
```

#### 4. Post-Deploy Verification

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Check detailed health
curl https://your-app.railway.app/health/detailed

# Test authentication
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"TestPass123"}'

# View API documentation
open https://your-app.railway.app/api-docs
```

#### 5. Monitor Deployment

- [ ] Check Railway logs for errors
- [ ] Verify MongoDB connection successful
- [ ] Test 2-3 critical user flows
- [ ] Monitor error rates (first 15 minutes)
- [ ] Check response times
- [ ] Verify SSL certificate active

---

## Rollback Procedure

If deployment fails or critical issues arise:

### Immediate Rollback

```bash
# Option 1: Redeploy previous commit
git revert HEAD
git push origin main

# Option 2: Railway dashboard
# Go to Deployments → Select previous successful deployment → Redeploy
```

### Database Rollback (if needed)

```bash
# Restore from backup
mongorestore --uri="MONGODB_URI" --drop /path/to/backup

# Or rollback specific migration
npm run migrate:rollback
```

---

## Post-Deployment Checklist

### ✅ Immediate (0-15 minutes)

- [ ] All health checks passing
- [ ] No error spikes in logs
- [ ] Authentication working
- [ ] Database operations functional
- [ ] Stripe integration working (test mode)

### ✅ Short-term (1-24 hours)

- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify scheduled jobs running
- [ ] Test all major features
- [ ] Monitor memory usage
- [ ] Check database query performance

### ✅ Long-term (1-7 days)

- [ ] Analyze user feedback
- [ ] Monitor business metrics
- [ ] Review error tracking (Sentry, etc.)
- [ ] Assess API response times
- [ ] Check for memory leaks
- [ ] Verify backup schedule working

---

## Emergency Contacts

**Development Team:**
- Lead Developer: [Email/Phone]
- DevOps: [Email/Phone]
- On-call Engineer: [Email/Phone]

**Services:**
- Railway Support: support@railway.app
- MongoDB Atlas: support@mongodb.com
- Stripe Support: support@stripe.com

---

## Common Issues & Solutions

### Issue: MongoDB Connection Timeout

**Symptoms:** `MONGODB_URI` connection errors in logs

**Solution:**
```bash
# Check IP whitelist in MongoDB Atlas
# Verify connection string format
# Test connection locally first
```

### Issue: Environment Variables Not Loading

**Symptoms:** "Missing environment variables" error

**Solution:**
- Verify all variables set in Railway dashboard
- Check variable names match exactly (case-sensitive)
- Restart deployment after setting variables

### Issue: High Memory Usage

**Symptoms:** App crashes, slow responses

**Solution:**
```bash
# Check memory limits in Railway
# Review MongoDB query efficiency
# Check for memory leaks (heap snapshots)
# Consider upgrading plan
```

### Issue: Stripe Webhooks Failing

**Symptoms:** Subscription status not updating

**Solution:**
- Verify webhook endpoint URL in Stripe dashboard
- Check webhook secret matches environment variable
- Review webhook logs in Stripe dashboard

---

## Performance Optimization

### Before Each Release

- [ ] Database queries optimized (use `.lean()`, select specific fields)
- [ ] Indexes created for frequent queries
- [ ] Large responses paginated
- [ ] Caching implemented for static data
- [ ] Image optimization (if applicable)
- [ ] Gzip compression enabled

### Monitoring Tools

- **Railway Metrics**: CPU, Memory, Network
- **MongoDB Atlas**: Slow queries, connections
- **Application Logs**: Winston logs in `logs/` directory
- **Health Checks**: `/health/detailed` endpoint

---

## Version Management

### Semantic Versioning

Follow SemVer: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Git Tags

```bash
# Create release tag
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# List tags
git tag -l
```

---

## Deployment Frequency

**Recommended Schedule:**
- **Hotfixes**: As needed (critical bugs)
- **Patches**: Weekly (Friday afternoon)
- **Minor**: Bi-weekly (planned features)
- **Major**: Quarterly (breaking changes)

**Best Practices:**
- Deploy early in the day (not Friday evening)
- Avoid deployments during peak usage
- Have rollback plan ready
- Monitor closely for first hour

---

## Final Pre-Deploy Command

Run this comprehensive check before every deployment:

```bash
#!/bin/bash
echo "🔍 Running pre-deploy checks..."

# Code quality
npm run lint || exit 1
npm run format:check || exit 1

# Tests
npm test || exit 1

# Build verification
echo "✅ All checks passed! Ready to deploy."
```

Save as `scripts/pre-deploy.sh` and run:
```bash
chmod +x scripts/pre-deploy.sh
./scripts/pre-deploy.sh
```

---

## Success Criteria

Deployment is successful when:

✅ All health checks return 200 OK
✅ Zero critical errors in first hour
✅ API response times < 500ms (p95)
✅ Database operations functional
✅ Authentication flows working
✅ Critical user journeys tested
✅ Monitoring and logging active

---

**Last Updated:** 2025-10-23
**Document Version:** 1.0.0
