// Debug endpoint to check environment variables in Vercel
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Check environment variables (masked for security)
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    MONGODB_URI: process.env.MONGODB_URI ? 
      `${process.env.MONGODB_URI.substring(0, 20)}...${process.env.MONGODB_URI.substring(process.env.MONGODB_URI.length - 10)}` : 
      'NOT_SET',
    REDIS_URL: process.env.REDIS_URL ? 
      `${process.env.REDIS_URL.substring(0, 15)}...${process.env.REDIS_URL.substring(process.env.REDIS_URL.length - 10)}` : 
      'NOT_SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT_SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
    
    // Additional checks
    totalEnvVars: Object.keys(process.env).length,
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    
    // Connection string validation
    mongoUriValid: process.env.MONGODB_URI ? process.env.MONGODB_URI.startsWith('mongodb') : false,
    redisUrlValid: process.env.REDIS_URL ? process.env.REDIS_URL.startsWith('redis://') : false,
  };

  res.status(200).json({
    message: 'Environment Variables Debug',
    environment: envCheck,
    recommendations: {
      mongodb: !process.env.MONGODB_URI ? 'Set MONGODB_URI environment variable' : 
               !envCheck.mongoUriValid ? 'MONGODB_URI format appears invalid' : 'OK',
      redis: !process.env.REDIS_URL ? 'Set REDIS_URL environment variable' : 
             !envCheck.redisUrlValid ? 'REDIS_URL format appears invalid' : 'OK'
    }
  });
};