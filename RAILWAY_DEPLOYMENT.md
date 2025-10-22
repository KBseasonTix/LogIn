# Railway Deployment Guide - Security Hardening Update

## ⚠️ CRITICAL: Required Before Deployment

This security update requires a new environment variable to be set in Railway **before** deployment. If not set, the application will fail to start.

---

## Required Environment Variables

### 1. Generate JWT_SECRET

Run this command to generate a secure JWT secret:

```bash
cd server
node scripts/generate-jwt-secret.js
```

Or manually generate:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Add to Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project (LogIn)
3. Click on your service
4. Go to **Variables** tab
5. Click **New Variable**
6. Add the following:

```
JWT_SECRET=<paste-the-generated-secret-here>
```

Example (DO NOT use this exact value - generate your own):
```
JWT_SECRET=47cadb034554257155b867e40f74b8d2dbe2c5c9bd3337bcc41761fd3a3c2fd68352ca3852f272f84093144e809d13b35c79a4c66f160001f151ee9e0a339f4f
```

### 3. Verify All Required Variables

Make sure these variables are set in Railway:

```bash
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-generated-jwt-secret>  # NEW - REQUIRED
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
NODE_ENV=production
CLIENT_URL=<your-frontend-url>
```

---

## Deployment Steps

### Step 1: Verify Environment Variables
- [ ] Log into Railway Dashboard
- [ ] Navigate to your project
- [ ] Click on Variables tab
- [ ] Verify all required variables are set
- [ ] **Especially verify JWT_SECRET is set**

### Step 2: Deploy to Railway
```bash
git add .
git commit -m "🔒 Security hardening - Add JWT auth, bcrypt, validation, rate limiting"
git push origin claude/security-hardening-011CUNZjReWXuGfQui1oyY3q
```

### Step 3: Verify Deployment
Railway will automatically deploy from the pushed branch. Check the logs:

1. Go to Railway Dashboard
2. Click on your service
3. Click on **Deployments** tab
4. View the latest deployment logs

**Expected log output**:
```
Environment check:
NODE_ENV: production
RAILWAY_ENVIRONMENT: YES
MONGODB_URI: SET ✓
JWT_SECRET: SET ✓
PORT: 3000
✅ MongoDB connected successfully
✅ Server running on port 3000
```

**If you see this error**:
```
❌ Missing required environment variables: JWT_SECRET
```
Then JWT_SECRET is not set in Railway. Go back to Step 2 and add it.

---

## ⚠️ Breaking Changes - Frontend Updates Required

### Authentication Flow Changes

The frontend **MUST** be updated to work with the new authentication system:

#### 1. Update Login/Register Flow

**Old (insecure)**:
```javascript
// Login returned user object
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { user } = await response.json();
```

**New (secure)**:
```javascript
// Login now returns JWT token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await response.json();

// Store token in AsyncStorage
await AsyncStorage.setItem('authToken', token);
```

#### 2. Update API Calls to Include Token

**Old (insecure - no auth)**:
```javascript
fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ userId, content, communityId })
})
```

**New (secure - with JWT)**:
```javascript
const token = await AsyncStorage.getItem('authToken');

fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ content, communityId }) // userId removed
})
```

#### 3. Key Frontend Changes Needed

- **Remove userId from request bodies** (extracted from JWT now)
- **Add Authorization header to all API calls**
- **Store JWT token securely** (AsyncStorage or SecureStore)
- **Handle 401 Unauthorized** (redirect to login)
- **Handle 403 Forbidden** (token expired, refresh or re-login)
- **Update password validation** (min 8 chars, uppercase, lowercase, number)

---

## Migration Strategy for Existing Users

### Option 1: Fresh Start (Recommended for Development)
```bash
# In MongoDB, drop the users collection
db.users.drop()
```
All users will need to re-register with secure passwords.

### Option 2: Require Password Reset
Keep user data but force password reset on first login (requires implementing password reset flow).

### Option 3: Migration Script
Create a one-time script to hash existing plain text passwords (NOT RECOMMENDED - plain text passwords should never have existed).

---

## Testing Checklist

After deployment, test these scenarios:

- [ ] **Health Check**: Visit `https://your-app.railway.app/health`
  - Should return: `{"status":"healthy",...}`

- [ ] **Register New User**:
  ```bash
  curl -X POST https://your-app.railway.app/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","email":"test@example.com","password":"Test1234"}'
  ```
  - Should return: token and user object

- [ ] **Login**:
  ```bash
  curl -X POST https://your-app.railway.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234"}'
  ```
  - Should return: token and user object

- [ ] **Protected Endpoint (with token)**:
  ```bash
  curl https://your-app.railway.app/api/communities \
    -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
  ```
  - Should return: list of communities

- [ ] **Protected Endpoint (without token)**:
  ```bash
  curl https://your-app.railway.app/api/communities
  ```
  - Should return: `401 Unauthorized`

- [ ] **Rate Limiting**:
  - Try 6 login attempts rapidly
  - Should get: `429 Too Many Requests` after 5 attempts

---

## Rollback Plan

If deployment fails or causes issues:

### Emergency Rollback Steps:
1. Go to Railway Dashboard
2. Click on **Deployments** tab
3. Find the previous working deployment
4. Click **...** (three dots) on the previous deployment
5. Click **Redeploy**

### Or revert the git commit:
```bash
git revert HEAD
git push origin claude/security-hardening-011CUNZjReWXuGfQui1oyY3q
```

---

## Monitoring After Deployment

### Watch for these in Railway logs:

**Good Signs**:
```
✅ MongoDB connected successfully
✅ Server running on port 3000
JWT_SECRET: SET ✓
```

**Bad Signs**:
```
❌ Missing required environment variables
❌ MongoDB connection failed
Error: JWT_SECRET is not defined
```

### Check application health:
```bash
curl https://your-app.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T...",
  "uptime": 123.45
}
```

---

## Support

If you encounter issues:

1. **Check Railway logs** - Most issues show up here
2. **Verify environment variables** - Missing JWT_SECRET is most common issue
3. **Review SECURITY.md** - Contains detailed security information
4. **Check client-side changes** - Frontend must be updated for new auth flow

---

## Summary

**Before pushing to Railway**:
1. ✅ Generate JWT_SECRET
2. ✅ Add JWT_SECRET to Railway environment variables
3. ✅ Verify all other environment variables are set
4. ✅ Update frontend code for JWT authentication
5. ✅ Test locally if possible

**After deployment**:
1. ✅ Check Railway logs for successful startup
2. ✅ Test health endpoint
3. ✅ Test registration
4. ✅ Test login
5. ✅ Test protected endpoints
6. ✅ Verify rate limiting works

---

**Last Updated**: 2025-10-22
**Status**: Ready for deployment (after environment variables are set)
