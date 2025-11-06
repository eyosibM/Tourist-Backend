#!/bin/bash

# =============================================================================
# Fix Email Verification Issues
# =============================================================================

KEY_PATH="tourlicity-key.pem"
EC2_IP="51.20.34.93"

echo "🔧 Diagnosing Email Verification Issues"
echo "======================================"
echo ""

# Step 1: Check current email configuration
echo "📧 Step 1: Checking email configuration..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Current email environment variables:"
docker exec tourlicity-api env | grep -E "(SMTP|EMAIL|FROM)" | sort
echo ""
EOF

# Step 2: Check API logs for email errors
echo "📋 Step 2: Checking API logs for email errors..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Recent email-related logs:"
docker logs tourlicity-api --tail=50 | grep -i -E "(email|smtp|mail|nodemailer)" || echo "No email-related logs found"
echo ""
EOF

# Step 3: Test email configuration
echo "🧪 Step 3: Testing email service..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Testing email verification resend..."
curl -s -X POST https://api.tourlicity.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' | jq . || echo "Failed to test email service"
echo ""
EOF

# Step 4: Check if FROM_EMAIL is set correctly
echo "⚙️  Step 4: Checking FROM_EMAIL configuration..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Checking if FROM_EMAIL is set..."
if docker exec tourlicity-api env | grep -q "FROM_EMAIL"; then
    echo "✅ FROM_EMAIL is set"
    docker exec tourlicity-api env | grep "FROM_EMAIL"
else
    echo "❌ FROM_EMAIL is not set - this might be the issue!"
    echo "Setting FROM_EMAIL to match SMTP_USER..."
    
    # Get SMTP_USER value
    SMTP_USER=$(docker exec tourlicity-api env | grep "SMTP_USER=" | cut -d'=' -f2)
    if [ -n "$SMTP_USER" ]; then
        echo "Adding FROM_EMAIL=$SMTP_USER to .env file..."
        echo "FROM_EMAIL=$SMTP_USER" >> .env
        echo "✅ FROM_EMAIL added to .env file"
    else
        echo "❌ SMTP_USER is also not set!"
    fi
fi
echo ""
EOF

# Step 5: Update email configuration if needed
echo "🔄 Step 5: Updating email configuration..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend

# Check if we need to add missing email variables
NEEDS_RESTART=false

# Check and add FROM_EMAIL if missing
if ! grep -q "FROM_EMAIL=" .env; then
    SMTP_USER=$(grep "SMTP_USER=" .env | cut -d'=' -f2)
    if [ -n "$SMTP_USER" ]; then
        echo "FROM_EMAIL=$SMTP_USER" >> .env
        echo "✅ Added FROM_EMAIL to .env"
        NEEDS_RESTART=true
    fi
fi

# Check and add EMAIL_FROM if missing (alternative variable name)
if ! grep -q "EMAIL_FROM=" .env; then
    SMTP_USER=$(grep "SMTP_USER=" .env | cut -d'=' -f2)
    if [ -n "$SMTP_USER" ]; then
        echo "EMAIL_FROM=$SMTP_USER" >> .env
        echo "✅ Added EMAIL_FROM to .env"
        NEEDS_RESTART=true
    fi
fi

# Restart containers if configuration was updated
if [ "$NEEDS_RESTART" = true ]; then
    echo "🔄 Restarting containers to apply email configuration..."
    docker-compose -f docker-compose.https.yml restart api
    echo "✅ API container restarted"
    sleep 10
else
    echo "ℹ️  No configuration changes needed"
fi
EOF

# Step 6: Test email after configuration update
echo "🧪 Step 6: Testing email after configuration update..."
ssh -i $KEY_PATH ubuntu@$EC2_IP << 'EOF'
cd Tourist-Backend
echo "Testing email configuration again..."
sleep 5

# Test with a real email address
echo "Enter your email address to test verification email:"
read -p "Email: " TEST_EMAIL

if [ -n "$TEST_EMAIL" ]; then
    echo "Sending test verification email to $TEST_EMAIL..."
    RESPONSE=$(curl -s -X POST https://api.tourlicity.com/api/auth/resend-verification \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$TEST_EMAIL\"}")
    
    echo "Response: $RESPONSE"
    
    # Check if email was sent successfully
    if echo "$RESPONSE" | grep -q "success\|sent"; then
        echo "✅ Email verification test successful!"
        echo "📧 Check your inbox for the verification email"
    else
        echo "❌ Email verification test failed"
        echo "Checking API logs for errors..."
        docker logs tourlicity-api --tail=20 | grep -i -E "(error|email|smtp)"
    fi
else
    echo "No email provided for testing"
fi
EOF

echo ""
echo "🎉 Email Verification Diagnosis Complete!"
echo "========================================"
echo ""
echo "💡 Next Steps:"
echo "1. Check your email inbox for verification emails"
echo "2. If still not working, verify Gmail App Password is correct"
echo "3. Check that Gmail 2FA is enabled and App Password is generated"
echo "4. Ensure SMTP settings match your Gmail configuration"
echo ""
echo "📧 Gmail SMTP Settings Should Be:"
echo "   SMTP_HOST=smtp.gmail.com"
echo "   SMTP_PORT=587"
echo "   SMTP_USER=your-gmail@gmail.com"
echo "   SMTP_PASS=your-16-character-app-password"
echo "   FROM_EMAIL=your-gmail@gmail.com"