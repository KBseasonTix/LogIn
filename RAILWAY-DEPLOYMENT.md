# 🚀 Railway Deployment Guide for LogIn App

## Step 1: Install MongoDB Driver (Already Done ✅)
Your MongoDB connection is configured with:
```
mongodb+srv://kylebilzz_db_user:VBvRlaBO0NtSAdqG@logincluster.ce1urpt.mongodb.net/
```

## Step 2: Deploy to Railway

### Option A: Deploy via GitHub (Recommended)
1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with your GitHub account
3. **Click "Deploy from GitHub repo"**
4. **Select your repository**: `KBseasonTix/LogIn`
5. **Select service**: Choose the `server` folder
6. **Configure build settings**:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Root Directory: `server`

### Option B: Deploy via Railway CLI
```bash
# Navigate to server directory
cd /Users/kyle/Desktop/LogIn/server

# Login to Railway (opens browser)
npx @railway/cli login

# Initialize Railway project
npx @railway/cli init

# Deploy
npx @railway/cli up
```

## Step 3: Configure Environment Variables in Railway

In your Railway dashboard, add these environment variables:

### Required Variables:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://kylebilzz_db_user:VBvRlaBO0NtSAdqG@logincluster.ce1urpt.mongodb.net/?retryWrites=true&w=majority&appName=LogInCluster
JWT_SECRET=your-super-secret-jwt-key-256-bits-long
PORT=3000
```

### Stripe Variables (add when ready):
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### AdMob Variables (add when ready):
```bash
ADMOB_APP_ID_IOS=ca-app-pub-your-actual-id~your-app-id
ADMOB_APP_ID_ANDROID=ca-app-pub-your-actual-id~your-app-id
# ... other AdMob IDs
```

## Step 4: Test Your Deployment

Once deployed, Railway will give you a URL like:
`https://your-app-name.railway.app`

Test these endpoints:
- `GET /health` - Should return server status
- `GET /api/users` - Should return user data
- `POST /api/auth/login` - Should handle login

## Step 5: Update Mobile App

Update your client app to use the Railway URL:

### In `client/src/context/AuthContext.jsx`:
```javascript
const API_BASE_URL = 'https://your-app-name.railway.app/api';
```

### In `client/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app-name.railway.app/api"
    }
  }
}
```

## Troubleshooting

### Common Issues:
1. **Build fails**: Make sure `package.json` is in server directory
2. **Database connection fails**: Verify MongoDB URI is correct
3. **Environment variables not loading**: Check Railway dashboard variables
4. **CORS errors**: Update CORS origins in your server code

### Check Logs:
```bash
npx @railway/cli logs
```

## Production Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] All environment variables configured in Railway
- [ ] API endpoints responding correctly
- [ ] Mobile app updated with production URL
- [ ] Stripe keys added (for payments)
- [ ] AdMob IDs added (for ads)

## Next Steps

1. **Test the deployment** with provided MongoDB credentials
2. **Set up custom domain** (optional): Add in Railway settings
3. **Configure Stripe** for payment processing
4. **Set up Google AdMob** for ad revenue
5. **Update mobile app** to use production API

Your LogIn app backend is now ready for production! 🎉