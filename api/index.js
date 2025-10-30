// Vercel serverless function for root route
const packageJson = require('../package.json');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only handle GET requests for root
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('🚀 Vercel API Root Route Hit:', req.method, req.url);

  // Return welcome message
  res.status(200).json({
    message: 'Welcome to Tourlicity API Backend',
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    status: 'ONLINE',
    platform: 'Vercel Serverless',
    documentation: '/api-docs',
    health: '/health',
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      health: '/health',
      documentation: '/api-docs',
      swagger: '/api-docs',
      api: '/api/*'
    }
  });
};