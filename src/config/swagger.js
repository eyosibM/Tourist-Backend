const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tourlicity Backend API',
            version: '1.0.0',
            description: 'REST API for the Tourlicity tour management platform',
            contact: {
                name: 'Tourlicity Team',
                email: 'support@tourlicity.com'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js', './src/server.js']
};

const specs = swaggerJsdoc(options);

// Swagger UI options - HTTP compatible
const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tourlicity API Documentation',
    swaggerOptions: {
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        presets: [
            'SwaggerUIBundle.presets.apis',
            'SwaggerUIStandalonePreset'
        ],
        layout: 'StandaloneLayout'
    }
    // Removed external CDN links to avoid mixed content issues
};

module.exports = {
    swaggerUi,
    specs,
    swaggerUiOptions
};