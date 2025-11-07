# API Documentation Summary

Generated: 2025-11-06T20:19:38.257Z

## 📊 Overview

- **API Title**: Tourlicity Backend API
- **Version**: 1.0.0
- **Base URL**: https://api.tourlicity.com
- **Total Endpoints**: 153
- **Total Schemas**: 45

## 🔗 Endpoints by Method

- **POST**: 50 endpoints\n- **GET**: 58 endpoints\n- **PUT**: 14 endpoints\n- **PATCH**: 11 endpoints\n- **DELETE**: 20 endpoints

## 🏷️ Endpoints by Category

- **Notifications**: 19 endpoints\n- **Authentication**: 11 endpoints\n- **Cache Management**: 8 endpoints\n- **Default Activities**: 8 endpoints\n- **Bookings**: 7 endpoints\n- **Broadcasts**: 7 endpoints\n- **Custom Tours**: 7 endpoints\n- **Document Types**: 7 endpoints\n- **Tour Template Documents**: 7 endpoints\n- **Tour Templates**: 7 endpoints\n- **File Uploads**: 7 endpoints\n- **Locations**: 6 endpoints\n- **Payment Configs**: 6 endpoints\n- **QR Codes**: 6 endpoints\n- **Registrations**: 6 endpoints\n- **Reviews**: 6 endpoints\n- **Role Change Requests**: 6 endpoints\n- **Payments**: 5 endpoints\n- **Tourist Documents**: 5 endpoints\n- **Calendar**: 3 endpoints\n- **Document Activities**: 2 endpoints\n- **Testing**: 2 endpoints\n- **User Tour Update Views**: 2 endpoints\n- **Health Check**: 2 endpoints\n- **General**: 1 endpoints

## 🔐 Security

- **Authentication Schemes**: bearerAuth
- **Global Security**: Enabled

## 📋 Available Schemas

- AuthLoginRequest\n- AuthRegistrationRequest\n- Availability\n- Booking\n- Broadcast\n- BroadcastRequest\n- BulkNotificationRequest\n- CacheStats\n- CalendarEntry\n- CustomTour\n- CustomTourRequest\n- DefaultActivity\n- DefaultActivityRequest\n- DocumentActivity\n- DocumentType\n- DocumentTypeRequest\n- EmailVerificationRequest\n- GoogleAuthRequest\n- Location\n- NotificationRequest\n- PasswordResetCompletion\n- PasswordResetRequest\n- Payment\n- PaymentConfig\n- PresignedUrlResponse\n- PushSubscription\n- PushSubscriptionRequest\n- QRCodeGeneration\n- QRCodeInfo\n- QRCodeShare\n- Registration\n- RegistrationRequest\n- RegistrationStatusUpdate\n- ResendVerificationRequest\n- RoleChangeRequest\n- RoleChangeRequestSubmission\n- TourDocument\n- TourReview\n- TourTemplate\n- TourTemplateDocument\n- TourTemplateRequest\n- TouristDocument\n- UploadResponse\n- User\n- UserTourUpdateView

## 🚀 Key Features

- ✅ **Default Activities System** - Complete CRUD with media support
- ✅ **Enhanced Performance** - Redis caching for 50-90% speed improvement
- ✅ **Health Monitoring** - Real-time system status and metrics
- ✅ **Role-based Security** - JWT authentication with granular permissions
- ✅ **Comprehensive Documentation** - Interactive Swagger UI with examples
- ✅ **Error Handling** - Standardized error responses with codes
- ✅ **Pagination Support** - Consistent pagination across all list endpoints
- ✅ **Media Management** - Advanced file upload and media handling

## 📖 Documentation Links

- **Interactive API Docs**: [https://api.tourlicity.com/api-docs](https://api.tourlicity.com/api-docs)
- **OpenAPI Spec**: [https://api.tourlicity.com/api-docs/swagger.json](https://api.tourlicity.com/api-docs/swagger.json)
- **Health Check**: [https://api.tourlicity.com/health](https://api.tourlicity.com/health)

## 🔧 Usage Examples

### Authentication
```bash
# Login to get JWT token
curl -X POST "https://api.tourlicity.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://api.tourlicity.com/api/activities"
```

### Default Activities
```bash
# Get all activities (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://api.tourlicity.com/api/activities"

# Get activities for selection
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://api.tourlicity.com/api/activities/selection?category=sightseeing"

# Get activity categories
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://api.tourlicity.com/api/activities/categories"
```

### Health Monitoring
```bash
# Basic health check
curl "https://api.tourlicity.com/health"

# Detailed system status
curl "https://api.tourlicity.com/health/detailed"
```
