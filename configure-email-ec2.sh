#!/bin/bash

# Configure Email on EC2 for Tourlicity
echo "📧 Configuring email settings..."

cd ~/Tourist-Backend

# Prompt for Gmail app password
echo "📝 You need a Gmail App Password (not your regular password)"
echo "🔗 Get it from: https://myaccount.google.com/apppasswords"
echo ""
read -p "Enter your Gmail App Password: " gmail_app_password

# Update email configuration
echo "⚙️ Updating email configuration..."
sed -i "s|EMAIL_USER=.*|EMAIL_USER=opeyemioladejobi@gmail.com|" .env
sed -i "s|EMAIL_FROM=.*|EMAIL_FROM=opeyemioladejobi@gmail.com|" .env
sed -i "s|EMAIL_PASS=.*|EMAIL_PASS=$gmail_app_password|" .env
sed -i "s|SMTP_USER=.*|SMTP_USER=opeyemioladejobi@gmail.com|" .env
sed -i "s|SMTP_PASS=.*|SMTP_PASS=$gmail_app_password|" .env

# Restart API to apply email configuration
echo "🔄 Restarting API with new email configuration..."
docker-compose -f docker-compose.freetier.yml restart api

# Wait for API to restart
echo "⏳ Waiting for API to restart..."
sleep 15

# Test email configuration
echo "🧪 Testing email configuration..."
curl -X POST https://tourlicity.duckdns.org/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "opeyemioladejobi@gmail.com"}' \
  -v

echo ""
echo "✅ Email configuration complete!"
echo "📧 Check your email for the verification link"
echo "🔗 Or manually verify using the MongoDB command"