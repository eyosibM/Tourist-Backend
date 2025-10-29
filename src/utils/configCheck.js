/**
 * Configuration Check Utility
 * Validates that all required environment variables are set
 */

const requiredEnvVars = {
  // Database
  MONGODB_URI: 'MongoDB connection string',
  
  // JWT
  JWT_SECRET: 'JWT secret key',
  
  // AWS S3 (required for file uploads)
  AWS_ACCESS_KEY_ID: 'AWS access key ID',
  AWS_SECRET_ACCESS_KEY: 'AWS secret access key',
  AWS_REGION: 'AWS region (e.g., us-east-1)',
  S3_BUCKET_NAME: 'S3 bucket name for file storage',
  
  // Optional but recommended
  
  // Email (optional)
  EMAIL_HOST: 'SMTP host for email sending',
  EMAIL_PORT: 'SMTP port',
  EMAIL_USER: 'SMTP username',
  EMAIL_PASS: 'SMTP password',
  
  // Payment (optional)
  STRIPE_SECRET_KEY: 'Stripe secret key for payments',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  
  // Frontend URL
  FRONTEND_URL: 'Frontend application URL'
};

const optionalEnvVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

/**
 * Check if all required environment variables are set
 * @returns {Object} - Configuration status
 */
function checkConfiguration() {
  const missing = [];
  const warnings = [];
  const configured = [];

  Object.entries(requiredEnvVars).forEach(([key, description]) => {
    if (!process.env[key]) {
      if (optionalEnvVars.includes(key)) {
        warnings.push({ key, description, impact: getImpactMessage(key) });
      } else {
        missing.push({ key, description });
      }
    } else {
      configured.push({ key, description });
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    configured,
    summary: {
      total: Object.keys(requiredEnvVars).length,
      configured: configured.length,
      missing: missing.length,
      warnings: warnings.length
    }
  };
}

/**
 * Get impact message for missing optional variables
 * @param {string} key - Environment variable key
 * @returns {string} - Impact description
 */
function getImpactMessage(key) {
  const impacts = {
    EMAIL_HOST: 'Email notifications will be disabled',
    EMAIL_PORT: 'Email notifications will be disabled',
    EMAIL_USER: 'Email notifications will be disabled',
    EMAIL_PASS: 'Email notifications will be disabled',
    STRIPE_SECRET_KEY: 'Payment processing will be disabled',
    STRIPE_WEBHOOK_SECRET: 'Payment webhooks will not work'
  };
  
  return impacts[key] || 'Some features may not work correctly';
}

/**
 * Print configuration status to console
 */
function printConfigurationStatus() {
  const config = checkConfiguration();
  
  console.log('\n=== CONFIGURATION CHECK ===');
  console.log(`Status: ${config.isValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Configured: ${config.summary.configured}/${config.summary.total}`);
  
  if (config.missing.length > 0) {
    console.log('\n❌ MISSING REQUIRED VARIABLES:');
    config.missing.forEach(({ key, description }) => {
      console.log(`  - ${key}: ${description}`);
    });
  }
  
  if (config.warnings.length > 0) {
    console.log('\n⚠️  OPTIONAL VARIABLES (features may be limited):');
    config.warnings.forEach(({ key, description, impact }) => {
      console.log(`  - ${key}: ${description}`);
      console.log(`    Impact: ${impact}`);
    });
  }
  
  if (config.configured.length > 0) {
    console.log('\n✅ CONFIGURED VARIABLES:');
    config.configured.forEach(({ key }) => {
      console.log(`  - ${key}`);
    });
  }
  
  console.log('===============================\n');
  
  return config;
}

/**
 * Validate specific service configurations
 */
function validateServiceConfigurations() {
  const services = {
    s3: {
      name: 'AWS S3 File Storage',
      required: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'],
      status: 'unknown'
    },

    email: {
      name: 'Email Notifications',
      required: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'],
      status: 'unknown'
    },
    stripe: {
      name: 'Payment Processing',
      required: ['STRIPE_SECRET_KEY'],
      status: 'unknown'
    }
  };

  Object.entries(services).forEach(([key, service]) => {
    const hasAllRequired = service.required.every(envVar => process.env[envVar]);
    service.status = hasAllRequired ? 'enabled' : 'disabled';
    service.missingVars = service.required.filter(envVar => !process.env[envVar]);
  });

  return services;
}

module.exports = {
  checkConfiguration,
  printConfigurationStatus,
  validateServiceConfigurations,
  requiredEnvVars,
  optionalEnvVars
};