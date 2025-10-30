# Vercel MongoDB Connection Troubleshooting

## 🚨 Current Issue
- Status: DEGRADED
- Database: disconnected
- Redis: ✅ connected

## 🔍 Likely Causes & Solutions

### 1. **Environment Variable Issues (Most Common)**

**Check in Vercel Dashboard:**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Verify `MONGODB_URI` is set exactly as:

```
MONGODB_URI=mongodb+srv://abisoyemudasiru_db_user:zttVg6eeKF5tclUa@cluster0.fudbdiq.mongodb.net/tourlicity?retryWrites=true&w=majority
```

**Important Notes:**
- No spaces before/after the equals sign
- Include the database name `/tourlicity`
- Add `?retryWrites=true&w=majority` parameters

### 2. **Alternative Connection String Formats**

Try these variations in Vercel environment variables:

**Option A (with explicit database):**
```
mongodb+srv://abisoyemudasiru_db_user:zttVg6eeKF5tclUa@cluster0.fudbdiq.mongodb.net/tourlicity?retryWrites=true&w=majority&appName=Cluster0
```

**Option B (with additional parameters):**
```
mongodb+srv://abisoyemudasiru_db_user:zttVg6eeKF5tclUa@cluster0.fudbdiq.mongodb.net/tourlicity?retryWrites=true&w=majority&maxPoolSize=2&serverSelectionTimeoutMS=15000
```

### 3. **MongoDB Atlas User Permissions**

Verify in MongoDB Atlas:
1. Go to "Database Access"
2. Check user `abisoyemudasiru_db_user` has:
   - **Database User Privileges**: `Atlas admin` or `Read and write to any database`
   - **Built-in Role**: `readWriteAnyDatabase`

### 4. **MongoDB Atlas Cluster Status**

Check in MongoDB Atlas:
1. Go to "Clusters"
2. Ensure cluster status is "Active" (green)
3. Check if there are any maintenance windows

### 5. **Vercel Function Timeout**

The issue might be Vercel's 10-second function timeout. Let's add this to `vercel.json`:

```json
{
  "functions": {
    "src/server.js": {
      "maxDuration": 30
    },
    "api/index.js": {
      "maxDuration": 10
    }
  }
}
```

## 🧪 Testing Steps

### Step 1: Update Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `MONGODB_URI` with one of the connection strings above
3. **Important**: Redeploy after changing environment variables

### Step 2: Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the latest deployment
3. Look for MongoDB connection error details

### Step 3: Test Connection
After redeployment, test:
```bash
curl https://your-app.vercel.app/health
```

## 🔧 Quick Fix Commands

### Update and Redeploy:
```bash
# Commit the database config changes
git add .
git commit -m "fix: improve MongoDB connection for Vercel serverless"
git push origin main

# Redeploy to Vercel
vercel --prod
```

## 📊 Expected Results After Fix

**Health Check Should Show:**
```json
{
  "status": "OK",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "cache": {
    "connected": true,
    "hitRate": "improving..."
  }
}
```

## 🚨 Emergency Fallback

If MongoDB connection continues to fail, the API will still work with Redis cache for:
- Authentication (cached sessions)
- Static data (cached responses)
- File uploads (S3 direct)

But these features will be limited:
- User registration/login
- Data persistence
- Real-time updates

## 📞 Next Steps

1. **Update MONGODB_URI** in Vercel with the improved connection string
2. **Redeploy** the application
3. **Check function logs** in Vercel dashboard
4. **Test health endpoint** again
5. **Monitor cache hit rate** improvement

The Redis integration is working perfectly - once MongoDB connects, you'll have a fully optimized system! 🚀