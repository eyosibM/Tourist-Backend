const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tourlicity Backend API',
            version: '2.0.0',
            description: `
# Tourlicity Enterprise Tour Management API

A comprehensive REST API for managing tours, bookings, activities, and user interactions in the Tourlicity platform.

## 🚀 Key Features

- **120+ REST API endpoints** for complete tour management
- **Enterprise Redis caching** for 50-90% faster response times
- **Advanced file management** with S3 integration
- **Multi-channel notifications** (push, email, SMS)
- **QR code generation** for tours and activities
- **Geospatial services** for location-based features
- **Review and rating system** with analytics
- **Comprehensive booking management**
- **Role-based access control** with JWT authentication

## 🎯 New Features (v2.0.0)

### Default Activities System
- Full CRUD operations for activity templates
- Advanced media support (images and videos)
- Dynamic category management
- Optimized selection endpoints for frontend integration

### Enhanced Performance
- Redis caching with smart invalidation
- 2-3x increase in concurrent request capacity
- Optimized database queries
- Real-time health monitoring

### Security Enhancements
- Role-based endpoint protection
- Enhanced input validation
- Rate limiting for production environments
- Comprehensive error handling

## 📊 Performance Metrics

- **Response Time**: 50-90% improvement with caching
- **Concurrent Users**: 2-3x capacity increase
- **Database Load**: 60-80% reduction through intelligent caching
- **Memory Usage**: Optimized to ~48MB

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 🌐 Base URLs

- **Production**: https://api.tourlicity.com
- **Development**: http://localhost:5000

## 📈 Health Monitoring

- **Basic Health**: \`GET /health\`
- **Detailed Health**: \`GET /health/detailed\`
- **System Status**: Real-time monitoring with performance metrics
            `,
            contact: {
                name: 'Tourlicity Development Team',
                email: 'dev@tourlicity.com',
                url: 'https://tourlicity.com'
            },
            license: {
                name: 'Proprietary',
                url: 'https://tourlicity.com/license'
            },
            termsOfService: 'https://tourlicity.com/terms'
        },
        servers: [
            {
                url: 'https://api.tourlicity.com',
                description: 'Production server'
            },
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
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from /api/auth/login endpoint'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        code: {
                            type: 'string',
                            description: 'Error code for programmatic handling'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the error occurred'
                        },
                        path: {
                            type: 'string',
                            description: 'API endpoint that generated the error'
                        }
                    }
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['OK', 'DEGRADED', 'ERROR'],
                            description: 'Overall system health status'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        uptime: {
                            type: 'number',
                            description: 'Server uptime in seconds'
                        },
                        services: {
                            type: 'object',
                            properties: {
                                database: {
                                    type: 'string',
                                    enum: ['connected', 'disconnected', 'unknown']
                                },
                                redis: {
                                    type: 'string',
                                    enum: ['connected', 'disconnected', 'unknown']
                                }
                            }
                        },
                        memory: {
                            type: 'object',
                            properties: {
                                used: {
                                    type: 'string',
                                    description: 'Memory usage in MB'
                                },
                                total: {
                                    type: 'string',
                                    description: 'Total memory in MB'
                                }
                            }
                        },
                        environment: {
                            type: 'string',
                            description: 'Current environment (development/production)'
                        },
                        cache: {
                            type: 'object',
                            properties: {
                                connected: {
                                    type: 'boolean'
                                },
                                keys: {
                                    type: 'number',
                                    description: 'Number of cached keys'
                                },
                                memory: {
                                    type: 'string',
                                    description: 'Cache memory usage'
                                },
                                hits: {
                                    type: 'number',
                                    description: 'Cache hit count'
                                },
                                misses: {
                                    type: 'number',
                                    description: 'Cache miss count'
                                },
                                hitRate: {
                                    type: 'string',
                                    description: 'Cache hit rate percentage'
                                }
                            }
                        }
                    }
                },
                MediaObject: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            format: 'uri',
                            description: 'URL to the media file (S3 or local storage)'
                        },
                        type: {
                            type: 'string',
                            enum: ['image', 'video'],
                            description: 'Type of media content'
                        },
                        duration: {
                            type: 'number',
                            description: 'Duration in seconds (for videos only)',
                            nullable: true
                        }
                    }
                },
                PaginationMeta: {
                    type: 'object',
                    properties: {
                        currentPage: {
                            type: 'number',
                            description: 'Current page number'
                        },
                        totalPages: {
                            type: 'number',
                            description: 'Total number of pages'
                        },
                        totalItems: {
                            type: 'number',
                            description: 'Total number of items'
                        },
                        itemsPerPage: {
                            type: 'number',
                            description: 'Number of items per page'
                        },
                        hasNextPage: {
                            type: 'boolean',
                            description: 'Whether there is a next page'
                        },
                        hasPrevPage: {
                            type: 'boolean',
                            description: 'Whether there is a previous page'
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication required',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/Error' },
                                    {
                                        properties: {
                                            code: {
                                                example: 'AUTH_001'
                                            },
                                            error: {
                                                example: 'Access denied. No token provided.'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/Error' },
                                    {
                                        properties: {
                                            code: {
                                                example: 'AUTH_002'
                                            },
                                            error: {
                                                example: 'Access denied. Insufficient permissions.'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/Error' },
                                    {
                                        properties: {
                                            error: {
                                                example: 'Resource not found'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/Error' },
                                    {
                                        properties: {
                                            error: {
                                                example: 'Validation failed'
                                            },
                                            details: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        field: {
                                                            type: 'string'
                                                        },
                                                        message: {
                                                            type: 'string'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            parameters: {
                PageParam: {
                    name: 'page',
                    in: 'query',
                    description: 'Page number for pagination',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        default: 1
                    }
                },
                LimitParam: {
                    name: 'limit',
                    in: 'query',
                    description: 'Number of items per page',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 10
                    }
                },
                SearchParam: {
                    name: 'search',
                    in: 'query',
                    description: 'Search term for filtering results',
                    schema: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 100
                    }
                }
            }
        },
        tags: [
            {
                name: 'Health Check',
                description: 'System health and monitoring endpoints'
            },
            {
                name: 'Authentication',
                description: 'User authentication and authorization'
            },
            {
                name: 'Default Activities',
                description: 'Manage default activity templates with media support'
            },
            {
                name: 'Users',
                description: 'User management and profile operations'
            },
            {
                name: 'Providers',
                description: 'Tour provider management'
            },
            {
                name: 'Tours',
                description: 'Tour template and custom tour management'
            },
            {
                name: 'Bookings',
                description: 'Booking management and processing'
            },
            {
                name: 'Calendar',
                description: 'Calendar and scheduling operations'
            },
            {
                name: 'Notifications',
                description: 'Multi-channel notification system'
            },
            {
                name: 'File Management',
                description: 'File upload and media management'
            },
            {
                name: 'QR Codes',
                description: 'QR code generation and management'
            },
            {
                name: 'Reviews',
                description: 'Review and rating system'
            },
            {
                name: 'Payments',
                description: 'Payment processing and management'
            },
            {
                name: 'Locations',
                description: 'Geospatial and location services'
            },
            {
                name: 'Cache Management',
                description: 'Cache operations and performance optimization'
            },
            {
                name: 'Broadcasting',
                description: 'System-wide message broadcasting'
            }
        ],
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js', './src/server.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

// Enhanced Swagger UI options with custom styling
const swaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { 
            color: #3b4151; 
            font-size: 2.5em; 
            margin-bottom: 10px;
        }
        .swagger-ui .info .description { 
            font-size: 1.1em; 
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .swagger-ui .scheme-container { 
            background: #f7f7f7; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
        }
        .swagger-ui .info .base-url { 
            font-weight: bold; 
            color: #3b4151;
        }
        .swagger-ui .opblock.opblock-get { border-color: #61affe; }
        .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
        .swagger-ui .opblock.opblock-put { border-color: #fca130; }
        .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; }
        .swagger-ui .opblock.opblock-patch { border-color: #50e3c2; }
        .swagger-ui .btn.authorize { 
            background-color: #4990e2; 
            border-color: #4990e2;
        }
        .swagger-ui .btn.authorize:hover { 
            background-color: #357abd; 
            border-color: #357abd;
        }
        .swagger-ui .model-box { 
            background: #f8f8f8; 
            border-radius: 5px; 
            padding: 10px;
        }
        .swagger-ui .response-col_status { font-weight: bold; }
        .swagger-ui .opblock-summary-description { 
            font-size: 1.1em; 
            font-weight: 500;
        }
        .swagger-ui .parameter__name { font-weight: bold; }
        .swagger-ui .parameter__type { 
            color: #3b4151; 
            font-weight: 600;
        }
        .swagger-ui .tab li button.tablinks { 
            background: #f7f7f7; 
            border: 1px solid #d3d3d3;
        }
        .swagger-ui .tab li button.tablinks.active { 
            background: #fff; 
            border-bottom: 1px solid #fff;
        }
    `,
    customSiteTitle: 'Tourlicity API Documentation v2.0',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        defaultModelRendering: 'example',
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: (request) => {
            // Add custom headers or modify requests if needed
            request.headers['X-API-Version'] = '2.0.0';
            return request;
        },
        responseInterceptor: (response) => {
            // Log API responses for debugging
            if (process.env.NODE_ENV === 'development') {
                console.log('API Response:', response.status, response.url);
            }
            return response;
        },
        presets: [
            'SwaggerUIBundle.presets.apis',
            'SwaggerUIStandalonePreset'
        ],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        validatorUrl: null // Disable online validator
    }
};

module.exports = {
    swaggerUi,
    specs,
    swaggerUiOptions
};