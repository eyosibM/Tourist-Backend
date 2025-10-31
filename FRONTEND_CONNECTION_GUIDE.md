# 🔗 Connect Frontend to EC2 Backend

## Quick Setup

Your new API endpoint is: **http://51.20.34.93:5000**

## Method 1: Update Environment Variables (Recommended)

### For Vercel Deployment:

1. **Go to your Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your frontend project

2. **Update Environment Variables**
   - Go to Settings → Environment Variables
   - Update these variables:

```env
NEXT_PUBLIC_API_URL=http://51.20.34.93:5000
REACT_APP_API_URL=http://51.20.34.93:5000
VITE_API_URL=http://51.20.34.93:5000
API_BASE_URL=http://51.20.34.93:5000
```

3. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on your latest deployment

### For Local Development:

Update your `.env.local` or `.env` file:

```env
NEXT_PUBLIC_API_URL=http://51.20.34.93:5000
REACT_APP_API_URL=http://51.20.34.93:5000
VITE_API_URL=http://51.20.34.93:5000
```

## Method 2: Update Configuration Files

### Next.js (next.config.js):
```javascript
module.exports = {
  env: {
    API_URL: 'http://51.20.34.93:5000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://51.20.34.93:5000/:path*',
      },
    ];
  },
};
```

### React/Vite (src/config/api.js):
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.VITE_API_URL || 
                     'http://51.20.34.93:5000';

export default API_BASE_URL;
```

### Vue.js (src/config/api.js):
```javascript
export const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://51.20.34.93:5000';
```

## Method 3: Direct Code Update

Find your API configuration file and update the base URL:

```javascript
// Before
const API_URL = 'https://your-old-api.vercel.app';

// After  
const API_URL = 'http://51.20.34.93:5000';
```

## Common File Locations to Check:

- `src/config/api.js`
- `src/utils/api.js` 
- `src/services/api.js`
- `src/lib/api.js`
- `next.config.js`
- `.env.local`
- `.env.production`

## Testing the Connection

After updating, test these endpoints:

```bash
# Health check
curl http://51.20.34.93:5000/health

# API docs
curl http://51.20.34.93:5000/api-docs/

# Your specific endpoints
curl http://51.20.34.93:5000/api/auth/health
```

## CORS Configuration

Your EC2 API is already configured to accept requests from:
- `https://tourist-frontend-c8ji.vercel.app`
- `http://localhost:3000`
- `http://localhost:3001` 
- `http://localhost:5173`

If your frontend domain is different, let me know and I'll update the CORS settings.

## Troubleshooting

### Mixed Content Issues (HTTPS → HTTP):
If your frontend is on HTTPS and can't connect to HTTP backend:

1. **Option A**: Use HTTPS proxy (recommended for production)
2. **Option B**: Allow mixed content in browser (development only)
3. **Option C**: Deploy frontend on HTTP temporarily

### Network Issues:
- Ensure EC2 security group allows inbound traffic on port 5000
- Check if your network/firewall blocks the connection
- Try accessing the API directly in browser first

## Quick Verification Steps:

1. ✅ Update environment variables in Vercel
2. ✅ Redeploy your frontend
3. ✅ Test API connection in browser console
4. ✅ Check network tab for successful API calls
5. ✅ Verify authentication flows work

Your frontend should now be connected to your EC2 backend!