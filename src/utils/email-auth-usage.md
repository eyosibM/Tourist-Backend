# Authentication Email Service Usage

This document describes how to use the authentication email templates and helper functions.

## Available Templates

### 1. Email Verification
```javascript
const { authEmailService } = require('../utils/email');

// Send email verification
await authEmailService.sendEmailVerification(
  'user@example.com',
  'John Doe',
  'verification-token-123'
);
```

### 2. Password Reset
```javascript
// Send password reset email
await authEmailService.sendPasswordReset(
  'user@example.com',
  'John Doe',
  'reset-token-456'
);
```

### 3. Password Reset Confirmation
```javascript
// Send password reset confirmation
await authEmailService.sendPasswordResetConfirmation(
  'user@example.com',
  'John Doe'
);
```

### 4. Account Locked Notification
```javascript
// Send account locked notification (default 30 minutes)
await authEmailService.sendAccountLocked(
  'user@example.com',
  'John Doe',
  30 // lock duration in minutes
);
```

### 5. Login Alert
```javascript
// Send login alert notification
await authEmailService.sendLoginAlert(
  'user@example.com',
  'John Doe',
  '192.168.1.1', // IP address
  'Mozilla/5.0...', // User agent
  'New York, USA' // Location (optional)
);
```

### 6. Resend Email Verification
```javascript
// Resend email verification with new token
await authEmailService.resendEmailVerification(
  'user@example.com',
  'John Doe',
  'new-verification-token-789'
);
```

## Direct Template Usage

You can also use templates directly:

```javascript
const { emailTemplates, sendEmail } = require('../utils/email');

// Generate template content
const emailContent = emailTemplates.emailVerification('John Doe', 'token123');

// Send using the general sendEmail function
await sendEmail('user@example.com', 'emailVerification', 'John Doe', 'token123');
```

## Security Features

All authentication email templates include:

- **Secure Links**: Use environment variables for frontend URL
- **Expiration Times**: Clear indication of token expiration (24h for email verification, 1h for password reset)
- **Security Warnings**: Appropriate security notices and instructions
- **Professional Styling**: Consistent HTML formatting with Tourlicity branding
- **Responsive Design**: Mobile-friendly email layouts

## Environment Variables Required

Make sure these environment variables are set:

```env
FRONTEND_URL=https://yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Error Handling

All email functions return `true` on success and `false` on failure:

```javascript
const success = await authEmailService.sendEmailVerification(
  'user@example.com',
  'John Doe',
  'token123'
);

if (!success) {
  console.error('Failed to send verification email');
  // Handle error appropriately
}
```