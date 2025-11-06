# Quick Email Verification Fix

## 🚨 Issue
Email verification emails are not being sent after user registration.

## 🔍 Most Likely Causes
1. Missing `FROM_EMAIL` environment variable
2. Incorrect Gmail App Password
3. Gmail 2FA not enabled
4. SMTP configuration mismatch

## 🛠️ Quick Fix Steps

### Step 1: Check Current Configuration
```bash
ssh -i tourlicity-key.pem ubuntu@51.20.34.93
cd Tourist-Backend

# Check email environment variables
docker exec tourlicity-api env | grep -E "(SMTP|EMAIL|FROM)"
```

### Step 2: Add Missing FROM_EMAIL Variable
```bash
# Add FROM_EMAIL to .env file (should match SMTP_USER)
echo "FROM_EMAIL=tourlicity@gmail.com" >> .env

# Alternative variable name that the code might use
echo "EMAIL_FROM=tourlicity@gmail.com" >> .env
```

### Step 3: Verify Gmail Configuration
Make sure your .env file has these exact settings:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tourlicity@gmail.com
SMTP_PASS=yuyx nqzn vltb xokb
FROM_EMAIL=tourlicity@gmail.com
EMAIL_FROM=tourlicity@gmail.com
```

### Step 4: Restart API Container
```bash
docker-compose -f docker-compose.https.yml restart api
sleep 10
```

### Step 5: Test Email Verification
```bash
# Test with your real email
curl -X POST https://api.tourlicity.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### Step 6: Check API Logs
```bash
# Check for email-related errors
docker logs tourlicity-api --tail=50 | grep -i -E "(email|smtp|error)"
```

## 🔧 Gmail App Password Setup

If the Gmail App Password is the issue:

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate new app password for "Mail"
   - Use the 16-character password (no spaces)

3. **Update .env file**:
   ```bash
   sed -i 's|SMTP_PASS=.*|SMTP_PASS=your-new-app-password|' .env
   ```

## 🧪 Test Commands

### Test Registration + Email
```bash
# Register a new user
curl -X POST https://api.tourlicity.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Test Email Resend
```bash
# Resend verification email
curl -X POST https://api.tourlicity.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Check Email Service Status
```bash
# Check if nodemailer is working
docker exec tourlicity-api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error);
  } else {
    console.log('✅ SMTP Server is ready');
  }
});
"
```

## ✅ Success Indicators

You'll know it's working when:
- ✅ Registration returns success message
- ✅ API logs show "Email sent to [email]"
- ✅ No SMTP errors in logs
- ✅ Verification email arrives in inbox
- ✅ Email verification link works

## 🚨 Troubleshooting

### If emails still don't work:
1. **Check spam folder**
2. **Verify Gmail App Password** (16 characters, no spaces)
3. **Ensure 2FA is enabled** on Gmail
4. **Try different email provider** for testing
5. **Check Gmail security settings** - allow less secure apps if needed

### Common Error Messages:
- `Invalid login` → Wrong Gmail credentials
- `Authentication failed` → App password issue
- `Connection timeout` → Network/firewall issue
- `No recipients defined` → FROM_EMAIL not set

---

**Quick One-Liner Fix:**
```bash
ssh -i tourlicity-key.pem ubuntu@51.20.34.93 "cd Tourist-Backend && echo 'FROM_EMAIL=tourlicity@gmail.com' >> .env && docker-compose -f docker-compose.https.yml restart api"
```