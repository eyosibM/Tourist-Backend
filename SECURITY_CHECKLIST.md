# Security Checklist

## ⚠️ IMPORTANT: Before Committing to Git

Always run this checklist before pushing code to prevent credential exposure:

### 1. Environment Files
- [ ] `.env` contains only placeholder values (no real credentials)
- [ ] `.env.docker` contains only placeholder values
- [ ] No `.env.local`, `.env.production`, or similar files with real credentials
- [ ] All environment files are in `.gitignore`

### 2. AWS Credentials
- [ ] No AWS Access Keys in any files
- [ ] No AWS Secret Keys in any files
- [ ] AWS credentials only in environment variables or AWS credentials file

### 3. Database Credentials
- [ ] No MongoDB connection strings with real passwords
- [ ] No Redis URLs with real passwords
- [ ] Database credentials only in environment variables

### 4. API Keys & Secrets
- [ ] No Google OAuth client secrets in code
- [ ] No JWT secrets in code
- [ ] No email passwords in code
- [ ] No VAPID private keys in code

### 5. Personal Information
- [ ] No personal email addresses in code
- [ ] No real names in test data
- [ ] No phone numbers in code

### 6. Files to Never Commit
- [ ] Remove all `test-*.js` files before committing
- [ ] Remove all `debug-*.js` files before committing
- [ ] Remove all `create-test-*.js` files before committing
- [ ] Remove temporary configuration files

## Quick Security Scan Commands

```bash
# Search for potential AWS keys
grep -r "AKIA" . --exclude-dir=node_modules
grep -r "AWS_ACCESS_KEY_ID=" . --exclude-dir=node_modules

# Search for potential secrets
grep -r "@gmail.com" . --exclude-dir=node_modules
grep -r "mongodb+srv://" . --exclude-dir=node_modules
grep -r "redis://" . --exclude-dir=node_modules
```

## If Credentials Are Exposed

1. **Immediately revoke/rotate all exposed credentials**
2. **Remove credentials from all files**
3. **Force push to overwrite git history if necessary**
4. **Update all deployment environments with new credentials**

## Best Practices

- Use environment variables for all sensitive data
- Never commit real credentials to version control
- Use placeholder values in example files
- Regularly audit code for sensitive information
- Use tools like GitGuardian to monitor for exposed secrets