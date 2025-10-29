# Tourlicity Backend API Documentation

## Overview

This is the REST API for the Tourlicity tour management platform. The API provides endpoints for managing users, providers, tour templates, custom tours, registrations, calendar entries, and more.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Performance & Caching

The API implements a comprehensive Redis-based caching system for optimal performance:

### Cache Layers

- **API Response Caching**: GET endpoints cached for 5 minutes (configurable)
- **Database Query Caching**: Frequently accessed queries cached for 10 minutes
- **Session Caching**: User sessions cached for 24 hours
- **Rate Limiting**: Redis-based rate limiting with sliding windows

### Cache Headers

Cached responses include these headers:

- `X-Cache`: HIT or MISS indicating cache status
- `X-Cache-Key`: The cache key used (for debugging)
- `Cache-Control`: Standard HTTP cache control directives

### Automatic Invalidation

Cache is automatically invalidated when:

- Data is created, updated, or deleted
- Related data changes (e.g., tour updates invalidate registration cache)
- Manual invalidation via admin endpoints

### Performance Benefits

- **50-90% faster response times** for cached endpoints
- **60-80% reduction in database load** for frequently accessed data
- **2-3x increase in concurrent request capacity**

## User Roles

- `system_admin`: Full system access
- `provider_admin`: Manage their provider's tours and registrations
- `tourist`: Register for tours and manage personal profile

## Environment Configuration

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/tourlicity

# JWT Authentication
JWT_SECRET=your-jwt-secret-key

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# All media files (images and videos) are uploaded to S3

# Redis Cache (optional, improves performance)
REDIS_URL=redis://localhost:6379

# Cache Configuration (optional)
CACHE_DEFAULT_TTL=300
CACHE_API_TTL=300
CACHE_DB_TTL=600
CACHE_SESSION_TTL=86400
```

### Optional Features

- **Redis**: Enables caching and improved performance
- **Push Notifications**: Requires VAPID keys for web push notifications

## API Endpoints

### Authentication

| Method | Endpoint                     | Description                     | Access  |
| ------ | ---------------------------- | ------------------------------- | ------- |
| POST   | `/auth/google`               | Google OAuth login/register     | Public  |
| GET    | `/auth/profile`              | Get current user profile        | Private |
| PUT    | `/auth/profile`              | Update user profile             | Private |
| PUT    | `/auth/reset-google-picture` | Reset to Google profile picture | Private |
| POST   | `/auth/logout`               | Logout user                     | Private |

### Users

| Method | Endpoint           | Description             | Access       |
| ------ | ------------------ | ----------------------- | ------------ |
| GET    | `/users`           | Get all users           | System Admin |
| GET    | `/users/dashboard` | Get user dashboard data | Private      |
| GET    | `/users/:id`       | Get user by ID          | System Admin |
| PUT    | `/users/:id`       | Update user             | System Admin |
| DELETE | `/users/:id`       | Delete user             | System Admin |

### Providers

| Method | Endpoint                | Description             | Access                             |
| ------ | ----------------------- | ----------------------- | ---------------------------------- |
| GET    | `/providers`            | Get all providers       | System Admin, Provider Admin       |
| GET    | `/providers/:id`        | Get provider by ID      | System Admin, Provider Admin (own) |
| POST   | `/providers`            | Create new provider     | System Admin                       |
| PUT    | `/providers/:id`        | Update provider         | System Admin, Provider Admin (own) |
| PATCH  | `/providers/:id/status` | Toggle provider status  | System Admin                       |
| GET    | `/providers/:id/admins` | Get provider admins     | System Admin, Provider Admin (own) |
| GET    | `/providers/:id/stats`  | Get provider statistics | System Admin, Provider Admin (own) |

### Tour Templates

| Method | Endpoint                     | Description            | Access                       |
| ------ | ---------------------------- | ---------------------- | ---------------------------- |
| GET    | `/tour-templates`            | Get all tour templates | System Admin, Provider Admin |
| GET    | `/tour-templates/active`     | Get active templates   | System Admin, Provider Admin |
| GET    | `/tour-templates/:id`        | Get template by ID     | System Admin, Provider Admin |
| POST   | `/tour-templates`            | Create new template    | System Admin                 |
| PUT    | `/tour-templates/:id`        | Update template        | System Admin                 |
| PATCH  | `/tour-templates/:id/status` | Toggle template status | System Admin                 |
| DELETE | `/tour-templates/:id`        | Delete template        | System Admin                 |

### Custom Tours

| Method | Endpoint                          | Description              | Access                                                   |
| ------ | --------------------------------- | ------------------------ | -------------------------------------------------------- |
| GET    | `/custom-tours`                   | Get all custom tours     | System Admin, Provider Admin (own)                       |
| GET    | `/custom-tours/search/:join_code` | Search tour by join code | Tourist                                                  |
| GET    | `/custom-tours/:id`               | Get custom tour by ID    | System Admin, Provider Admin (own), Tourist (registered) |
| POST   | `/custom-tours`                   | Create new custom tour   | System Admin, Provider Admin                             |
| PUT    | `/custom-tours/:id`               | Update custom tour       | System Admin, Provider Admin (own)                       |
| PATCH  | `/custom-tours/:id/status`        | Update tour status       | System Admin, Provider Admin (own)                       |
| DELETE | `/custom-tours/:id`               | Delete custom tour       | System Admin, Provider Admin (own)                       |

#### Tour Visibility

Custom tours support two visibility modes via the `viewAccessibility` property:

- **`public`** (default): Tour is visible to all users and can be discovered through general tour listings
- **`private`**: Tour is only accessible to users who have the specific join code or are already registered

**Access Control:**

- Public tours: Visible in general listings, accessible to all users
- Private tours: Only accessible via join code search, not visible in general listings for tourists
- Provider admins and system admins can always see and manage their tours regardless of visibility

#### Media Upload Support

Tours and templates now support both image and video uploads for featured media:

- **Images**: Uploaded to AWS S3 (JPEG, PNG, GIF up to 5MB)
- **Videos**: Uploaded to AWS S3 (MP4, MOV, AVI, MKV, WebM up to 100MB)
- **Backward Compatibility**: `features_image` field maintained for existing integrations
- **New Field**: `features_media` object contains type and URL for S3-stored media

### Calendar Entries

| Method | Endpoint                        | Description                 | Access                       |
| ------ | ------------------------------- | --------------------------- | ---------------------------- |
| GET    | `/calendar`                     | Get calendar entries        | Private                      |
| GET    | `/calendar/default-activities`  | Get default activities      | System Admin, Provider Admin |
| GET    | `/calendar/:id`                 | Get calendar entry by ID    | Private                      |
| POST   | `/calendar`                     | Create calendar entry       | System Admin, Provider Admin |
| PUT    | `/calendar/:id`                 | Update calendar entry       | System Admin, Provider Admin |
| DELETE | `/calendar/:id`                 | Delete calendar entry       | System Admin, Provider Admin |
| POST   | `/calendar/:id/featured-image`  | Upload featured image       | System Admin, Provider Admin |
| DELETE | `/calendar/:id/featured-image`  | Delete featured image       | System Admin, Provider Admin |
| POST   | `/calendar/presigned-url`       | Get presigned URL           | System Admin, Provider Admin |
| PUT    | `/calendar/:id/presigned-image` | Update with presigned image | System Admin, Provider Admin |

### File Uploads

| Method | Endpoint                        | Description                 | Access                       |
| ------ | ------------------------------- | --------------------------- | ---------------------------- |
| POST   | `/uploads/profile-picture`      | Upload profile picture      | Private                      |
| POST   | `/uploads/tour-image`           | Upload tour image           | System Admin, Provider Admin |
| POST   | `/uploads/multiple-tour-images` | Upload multiple tour images | System Admin, Provider Admin |
| POST   | `/uploads/general`              | Upload general file         | Private                      |
| POST   | `/uploads/presigned-url`        | Get presigned URL for S3    | Private                      |
| DELETE | `/uploads/delete`               | Delete uploaded file        | Private                      |

### Default Activities

| Method | Endpoint                 | Description                  | Access                       |
| ------ | ------------------------ | ---------------------------- | ---------------------------- |
| GET    | `/activities`            | Get all default activities   | System Admin, Provider Admin |
| GET    | `/activities/selection`  | Get activities for selection | System Admin, Provider Admin |
| GET    | `/activities/categories` | Get activity categories      | System Admin, Provider Admin |
| GET    | `/activities/:id`        | Get default activity by ID   | System Admin, Provider Admin |
| POST   | `/activities`            | Create new default activity  | System Admin                 |
| PUT    | `/activities/:id`        | Update default activity      | System Admin                 |
| PATCH  | `/activities/:id/status` | Toggle activity status       | System Admin                 |
| DELETE | `/activities/:id`        | Delete default activity      | System Admin                 |

### Broadcasts

| Method | Endpoint                   | Description                            | Access                       |
| ------ | -------------------------- | -------------------------------------- | ---------------------------- |
| GET    | `/broadcasts`              | Get all broadcasts                     | System Admin, Provider Admin |
| GET    | `/broadcasts/tour/:tourId` | Get broadcasts for specific tour       | All users (registered)       |
| GET    | `/broadcasts/:id`          | Get broadcast by ID                    | System Admin, Provider Admin |
| POST   | `/broadcasts`              | Create new broadcast                   | System Admin, Provider Admin |
| PUT    | `/broadcasts/:id`          | Update broadcast                       | System Admin, Provider Admin |
| PATCH  | `/broadcasts/:id/publish`  | Publish broadcast (send notifications) | System Admin, Provider Admin |
| DELETE | `/broadcasts/:id`          | Delete broadcast                       | System Admin, Provider Admin |

### Registrations

| Method | Endpoint                    | Description                 | Access                             |
| ------ | --------------------------- | --------------------------- | ---------------------------------- |
| GET    | `/registrations`            | Get all registrations       | System Admin, Provider Admin (own) |
| GET    | `/registrations/my`         | Get user's registrations    | Tourist                            |
| GET    | `/registrations/stats`      | Get registration statistics | System Admin, Provider Admin       |
| POST   | `/registrations`            | Register for a tour         | Tourist                            |
| PUT    | `/registrations/:id/status` | Update registration status  | System Admin, Provider Admin       |
| DELETE | `/registrations/:id`        | Unregister from tour        | Tourist (own), System Admin        |

### Role Change Requests

| Method | Endpoint                            | Description                     | Access       |
| ------ | ----------------------------------- | ------------------------------- | ------------ |
| POST   | `/role-change-requests`             | Submit role change request      | Tourist      |
| GET    | `/role-change-requests`             | Get all role change requests    | System Admin |
| GET    | `/role-change-requests/my`          | Get user's role change requests | Tourist      |
| GET    | `/role-change-requests/:id`         | Get role change request by ID   | System Admin |
| PUT    | `/role-change-requests/:id/process` | Process role change request     | System Admin |
| DELETE | `/role-change-requests/:id/cancel`  | Cancel role change request      | Tourist      |

### QR Codes

| Method | Endpoint                           | Description                      | Access                       |
| ------ | ---------------------------------- | -------------------------------- | ---------------------------- |
| POST   | `/qr-codes/tours/:id/generate`     | Generate QR code for custom tour | System Admin, Provider Admin |
| POST   | `/qr-codes/templates/:id/generate` | Generate QR code for template    | System Admin                 |
| PUT    | `/qr-codes/tours/:id/regenerate`   | Regenerate QR code for tour      | System Admin, Provider Admin |
| POST   | `/qr-codes/tours/:id/share`        | Share QR code via email          | System Admin, Provider Admin |
| GET    | `/qr-codes/tours/:id`              | Get QR code information          | System Admin, Provider Admin |
| DELETE | `/qr-codes/tours/:id`              | Delete QR code                   | System Admin, Provider Admin |

### Notifications

| Method | Endpoint                           | Description                     | Access                       |
| ------ | ---------------------------------- | ------------------------------- | ---------------------------- |
| GET    | `/notifications/vapid-key`         | Get VAPID public key            | Public                       |
| POST   | `/notifications/subscribe`         | Subscribe to push notifications | Private                      |
| POST   | `/notifications/unsubscribe`       | Unsubscribe from push           | Private                      |
| GET    | `/notifications/subscriptions`     | Get user's subscriptions        | Private                      |
| POST   | `/notifications/test`              | Send test notification          | Private                      |
| POST   | `/notifications/send`              | Send notification to user       | System Admin, Provider Admin |
| POST   | `/notifications/send-bulk`         | Send bulk notifications         | System Admin                 |
| GET    | `/notifications/queue-stats`       | Get queue statistics            | System Admin                 |
| POST   | `/notifications/cleanup`           | Clean up notification queues    | System Admin                 |
| GET    | `/notifications/all-subscriptions` | Get all subscriptions           | System Admin                 |

### Cache Management

| Method | Endpoint                              | Description                       | Access                             |
| ------ | ------------------------------------- | --------------------------------- | ---------------------------------- |
| GET    | `/cache/stats`                        | Get cache statistics              | System Admin                       |
| DELETE | `/cache/clear`                        | Clear all cache                   | System Admin                       |
| DELETE | `/cache/invalidate/pattern`           | Invalidate cache by pattern       | System Admin                       |
| DELETE | `/cache/invalidate/model/{modelName}` | Invalidate cache for model        | System Admin                       |
| DELETE | `/cache/invalidate/user/{userId}`     | Invalidate cache for user         | System Admin, Provider Admin (own) |
| GET    | `/cache/key/{key}`                    | Get cache value by key            | System Admin                       |
| DELETE | `/cache/key/{key}`                    | Delete cache key                  | System Admin                       |
| POST   | `/cache/warmup`                       | Warm up cache with common queries | System Admin                       |

### Payments

| Method | Endpoint                  | Description            | Access                       |
| ------ | ------------------------- | ---------------------- | ---------------------------- |
| GET    | `/payments`               | Get payment history    | Private                      |
| POST   | `/payments/create-intent` | Create payment intent  | Private                      |
| POST   | `/payments/confirm`       | Confirm payment        | Private                      |
| POST   | `/payments/{id}/refund`   | Process refund         | System Admin, Provider Admin |
| POST   | `/payments/webhook`       | Stripe webhook handler | Public (Stripe)              |

### Reviews & Ratings

| Method | Endpoint                        | Description                 | Access            |
| ------ | ------------------------------- | --------------------------- | ----------------- |
| GET    | `/reviews`                      | Get reviews                 | Public            |
| POST   | `/reviews`                      | Create tour review          | Private (Tourist) |
| GET    | `/reviews/{id}`                 | Get review by ID            | Public            |
| PATCH  | `/reviews/{id}/moderate`        | Moderate review             | System Admin      |
| POST   | `/reviews/{id}/respond`         | Provider response to review | Provider Admin    |
| GET    | `/reviews/provider/{id}/rating` | Get provider rating summary | Public            |

### Bookings & Availability

| Method | Endpoint                  | Description           | Access                   |
| ------ | ------------------------- | --------------------- | ------------------------ |
| GET    | `/bookings`               | Get user bookings     | Private                  |
| POST   | `/bookings`               | Create new booking    | Private                  |
| GET    | `/bookings/{id}`          | Get booking by ID     | Private (Owner/Provider) |
| PATCH  | `/bookings/{id}/cancel`   | Cancel booking        | Private (Owner)          |
| PATCH  | `/bookings/{id}/check-in` | Check in booking      | Provider Admin           |
| GET    | `/bookings/availability`  | Get tour availability | Public                   |
| POST   | `/bookings/availability`  | Create availability   | Provider Admin           |

### Locations & Geography

| Method | Endpoint                    | Description            | Access                       |
| ------ | --------------------------- | ---------------------- | ---------------------------- |
| GET    | `/locations`                | Search locations       | Public                       |
| POST   | `/locations`                | Create location        | System Admin, Provider Admin |
| GET    | `/locations/{id}`           | Get location by ID     | Public                       |
| PUT    | `/locations/{id}`           | Update location        | System Admin, Provider Admin |
| GET    | `/locations/tours/{tourId}` | Get locations for tour | Public                       |
| POST   | `/locations/tours/{tourId}` | Add location to tour   | System Admin, Provider Admin |

### Tour Updates

| Method | Endpoint                     | Description                                    | Access                                |
| ------ | ---------------------------- | ---------------------------------------------- | ------------------------------------- |
| GET    | `/tour-updates`              | Get all tour updates with filtering/pagination | System Admin, Provider Admin          |
| GET    | `/tour-updates/tour/:tourId` | Get tour updates for specific tour             | Private (registered users)            |
| GET    | `/tour-updates/:id`          | Get single tour update by ID                   | Private (registered users)            |
| POST   | `/tour-updates`              | Create new tour update                         | System Admin, Provider Admin          |
| PUT    | `/tour-updates/:id`          | Update tour update                             | System Admin, Provider Admin, Creator |
| PATCH  | `/tour-updates/:id/publish`  | Publish tour update (send notifications)       | System Admin, Provider Admin, Creator |
| DELETE | `/tour-updates/:id`          | Delete tour update                             | System Admin, Provider Admin, Creator |

#### Tour Update Types

Tour updates support different types for better categorization:

- **`general`** (default): General information and announcements
- **`weather`**: Weather-related updates and adjustments
- **`schedule`**: Schedule changes and timing updates
- **`location`**: Location changes or meeting point updates
- **`emergency`**: Emergency notifications and urgent information
- **`reminder`**: Reminders about upcoming activities or requirements

#### Tour Update Features

- **Draft Mode**: Updates can be created as drafts (`is_published: false`) and published later
- **Automatic Notifications**: When published, notifications are automatically sent to all registered tour participants
- **Access Control**: Only tour providers and system admins can create/edit updates
- **Filtering & Search**: Support for filtering by type, publication status, and text search
- **Pagination**: All listing endpoints support pagination for better performance

### Health Check & Monitoring

| Method | Endpoint           | Description                                    | Access |
| ------ | ------------------ | ---------------------------------------------- | ------ |
| GET    | `/health`          | Basic health check with service status         | Public |
| GET    | `/health/detailed` | Detailed health check with performance metrics | Public |

### Admin & System Management

| Method | Endpoint              | Description                    | Access       |
| ------ | --------------------- | ------------------------------ | ------------ |
| POST   | `/admin/reconnect-db` | Manually reconnect to database | System Admin |

#### Health Check Features

The health check endpoints provide comprehensive monitoring capabilities:

**Basic Health Check (`/health`)**:

- Service status (database, Redis)
- Memory usage statistics
- System uptime
- Cache performance metrics
- Returns HTTP 200 for healthy, 503 for degraded/unhealthy

**Detailed Health Check (`/health/detailed`)**:

- All basic health check information
- Response time measurements for each service
- Detailed memory breakdown (RSS, heap, external)
- CPU usage statistics
- System information (platform, Node.js version, process ID)
- Performance metrics for the health check itself

**Status Levels**:

- **OK**: All services are functioning normally
- **DEGRADED**: Some services are unavailable but core functionality works
- **ERROR**: Critical failure in health check process

These endpoints are commonly used by load balancers, monitoring systems, and deployment pipelines to ensure service availability.

## Request/Response Examples

### Authentication

#### Google OAuth Login

```http
POST /api/auth/google
Content-Type: application/json

{
  "google_id": "123456789",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c"
}
```

Response:

```json
{
	"message": "Authentication successful",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"_id": "64a1b2c3d4e5f6789012345",
		"email": "user@example.com",
		"first_name": "John",
		"last_name": "Doe",
		"profile_picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
		"user_type": "tourist",
		"is_active": true
	},
	"redirect": "/my-tours"
}
```

#### Update User Profile

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "profile_picture": "https://example.com/profile.jpg",
  "date_of_birth": "1990-05-15",
  "country": "United States",
  "gender": "male",
  "passport_number": "A12345678"
}
```

Response:

```json
{
	"message": "Profile updated successfully",
	"user": {
		"_id": "64a1b2c3d4e5f6789012345",
		"email": "user@example.com",
		"first_name": "John",
		"last_name": "Doe",
		"phone_number": "+1234567890",
		"profile_picture": "https://example.com/profile.jpg",
		"date_of_birth": "1990-05-15T00:00:00.000Z",
		"country": "United States",
		"gender": "male",
		"passport_number": "A12345678",
		"user_type": "tourist",
		"is_active": true,
		"created_date": "2024-01-10T10:00:00.000Z",
		"updated_date": "2024-01-15T14:30:00.000Z"
	}
}
```

#### Reset Profile Picture to Google Picture

```http
PUT /api/auth/reset-google-picture
Authorization: Bearer <token>
Content-Type: application/json

{
  "google_picture_url": "https://lh3.googleusercontent.com/a/default-user=s96-c"
}
```

Response:

```json
{
	"message": "Profile picture reset to Google picture successfully",
	"user": {
		"_id": "64a1b2c3d4e5f6789012345",
		"email": "user@example.com",
		"first_name": "John",
		"last_name": "Doe",
		"profile_picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
		"user_type": "tourist",
		"is_active": true
	}
}
```

#### Profile Picture Behavior

**Google OAuth Profile Pictures:**

- When users authenticate with Google OAuth, their Google profile picture is automatically set if they don't have one
- If users already have a Google profile picture, it gets updated with the latest from Google
- Custom profile pictures (non-Google URLs) are **never** overwritten by Google OAuth
- Users can manually update their profile picture to any custom URL via the profile update endpoint
- Users can reset their profile picture back to their Google picture using the reset endpoint

### Create Custom Tour

```http
POST /api/custom-tours
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider_id": "64a1b2c3d4e5f6789012345",
  "tour_template_id": "64a1b2c3d4e5f6789012346",
  "tour_name": "Amazing Paris Adventure",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "viewAccessibility": "private",
  "max_tourists": 8,
  "group_chat_link": "https://chat.example.com/room123",
  "features_image": "https://example.com/paris-main.jpg",
  "teaser_images": [
    "https://example.com/paris-teaser1.jpg",
    "https://example.com/paris-teaser2.jpg",
    "https://example.com/paris-teaser3.jpg"
  ]
}
```

Response:

```json
{
	"message": "Custom tour created successfully",
	"tour": {
		"_id": "64a1b2c3d4e5f6789012347",
		"provider_id": {
			"_id": "64a1b2c3d4e5f6789012345",
			"provider_name": "Amazing Tours Co."
		},
		"tour_template_id": {
			"_id": "64a1b2c3d4e5f6789012346",
			"template_name": "Paris City Tour"
		},
		"tour_name": "Amazing Paris Adventure",
		"start_date": "2024-06-01T00:00:00.000Z",
		"end_date": "2024-06-07T00:00:00.000Z",
		"status": "draft",
		"viewAccessibility": "private",
		"join_code": "ABC123",
		"max_tourists": 8,
		"remaining_tourists": 8,
		"group_chat_link": "https://chat.example.com/room123",
		"features_image": "https://example.com/paris-main.jpg",
		"teaser_images": [
			"https://example.com/paris-teaser1.jpg",
			"https://example.com/paris-teaser2.jpg",
			"https://example.com/paris-teaser3.jpg"
		],
		"created_date": "2024-01-15T10:30:00.000Z"
	}
}
```

### Create Tour Template

```http
POST /api/tour-templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "template_name": "Paris City Tour",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "description": "Explore the beautiful city of Paris with guided tours to iconic landmarks.",
  "features_image": "https://example.com/paris-template-main.jpg",
  "teaser_images": [
    "https://example.com/eiffel-tower.jpg",
    "https://example.com/louvre.jpg",
    "https://example.com/notre-dame.jpg"
  ],
  "web_links": [
    {
      "url": "https://paristourism.com",
      "description": "Official Paris Tourism"
    }
  ]
}
```

Response:

```json
{
	"message": "Tour template created successfully",
	"template": {
		"_id": "64a1b2c3d4e5f6789012346",
		"template_name": "Paris City Tour",
		"start_date": "2024-06-01T00:00:00.000Z",
		"end_date": "2024-06-07T00:00:00.000Z",
		"description": "Explore the beautiful city of Paris with guided tours to iconic landmarks.",
		"duration_days": 7,
		"features_image": "https://example.com/paris-template-main.jpg",
		"teaser_images": [
			"https://example.com/eiffel-tower.jpg",
			"https://example.com/louvre.jpg",
			"https://example.com/notre-dame.jpg"
		],
		"web_links": [
			{
				"url": "https://paristourism.com",
				"description": "Official Paris Tourism"
			}
		],
		"is_active": true,
		"created_date": "2024-01-15T09:00:00.000Z"
	}
}
```

### Register for Tour

```http
POST /api/registrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "notes": "Looking forward to this tour!"
}
```

Response:

```json
{
	"message": "Registration submitted successfully",
	"registration": {
		"_id": "64a1b2c3d4e5f6789012348",
		"custom_tour_id": {
			"_id": "64a1b2c3d4e5f6789012347",
			"tour_name": "Amazing Paris Adventure",
			"start_date": "2024-06-01T00:00:00.000Z",
			"end_date": "2024-06-07T00:00:00.000Z"
		},
		"tourist_id": "64a1b2c3d4e5f6789012349",
		"provider_id": {
			"_id": "64a1b2c3d4e5f6789012345",
			"provider_name": "Amazing Tours Co."
		},
		"status": "pending",
		"notes": "Looking forward to this tour!",
		"created_date": "2024-01-15T11:00:00.000Z"
	}
}
```

### Apply to Become New Provider

```http
POST /api/role-change-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "request_type": "become_new_provider",
  "proposed_provider_data": {
    "provider_name": "Amazing Adventures Ltd",
    "country": "United States",
    "address": "123 Tourism Street, Adventure City, AC 12345",
    "phone_number": "+1-555-0123",
    "email_address": "contact@amazingadventures.com",
    "corporate_tax_id": "TAX123456789",
    "company_description": "We specialize in adventure tourism and cultural experiences.",
    "logo_url": "https://example.com/logo.png"
  },
  "request_message": "I have 5 years of experience in tourism and would like to start my own tour company."
}
```

Response:

```json
{
	"message": "Role change request submitted successfully",
	"request": {
		"_id": "64a1b2c3d4e5f6789012350",
		"request_type": "become_new_provider",
		"status": "pending",
		"created_date": "2024-01-15T12:00:00.000Z"
	}
}
```

### Apply to Join Existing Provider

```http
POST /api/role-change-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "request_type": "join_existing_provider",
  "provider_id": "64a1b2c3d4e5f6789012345",
  "request_message": "I would like to join your team as a provider administrator. I have experience in customer service and tour management."
}
```

Response:

```json
{
	"message": "Role change request submitted successfully",
	"request": {
		"_id": "64a1b2c3d4e5f6789012351",
		"request_type": "join_existing_provider",
		"status": "pending",
		"created_date": "2024-01-15T12:30:00.000Z"
	}
}
```

### Process Role Change Request (System Admin)

```http
PUT /api/role-change-requests/64a1b2c3d4e5f6789012350/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "admin_notes": "Application looks good. Welcome to the platform!"
}
```

Response:

```json
{
	"message": "Role change request approved successfully",
	"request": {
		"_id": "64a1b2c3d4e5f6789012350",
		"request_type": "become_new_provider",
		"status": "approved",
		"admin_notes": "Application looks good. Welcome to the platform!",
		"processed_date": "2024-01-16T09:00:00.000Z",
		"created_date": "2024-01-15T12:00:00.000Z"
	},
	"user": {
		"_id": "64a1b2c3d4e5f6789012349",
		"user_type": "provider_admin",
		"provider_id": "64a1b2c3d4e5f6789012352"
	}
}
```

### Tour Updates

#### Create Tour Update

```http
POST /api/tour-updates
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "update_title": "Important Weather Update",
  "update_content": "Due to expected rain tomorrow, we'll be providing umbrellas and adjusting our outdoor activities. The tour will still proceed as planned with some indoor alternatives.",
  "update_type": "weather",
  "is_published": false
}
```

Response:

```json
{
	"message": "Tour update created successfully",
	"tourUpdate": {
		"_id": "64a1b2c3d4e5f6789012353",
		"custom_tour_id": {
			"_id": "64a1b2c3d4e5f6789012347",
			"tour_name": "Amazing Paris Adventure"
		},
		"update_title": "Important Weather Update",
		"update_content": "Due to expected rain tomorrow, we'll be providing umbrellas and adjusting our outdoor activities. The tour will still proceed as planned with some indoor alternatives.",
		"update_type": "weather",
		"is_published": false,
		"created_by": {
			"_id": "64a1b2c3d4e5f6789012345",
			"first_name": "John",
			"last_name": "Provider"
		},
		"created_date": "2024-01-16T10:00:00.000Z",
		"updated_date": "2024-01-16T10:00:00.000Z"
	}
}
```

#### Get Tour Updates for Specific Tour

```http
GET /api/tour-updates/tour/64a1b2c3d4e5f6789012347?page=1&limit=10&is_published=true
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Tour updates retrieved successfully",
	"tourUpdates": [
		{
			"_id": "64a1b2c3d4e5f6789012353",
			"custom_tour_id": "64a1b2c3d4e5f6789012347",
			"update_title": "Important Weather Update",
			"update_content": "Due to expected rain tomorrow, we'll be providing umbrellas...",
			"update_type": "weather",
			"is_published": true,
			"created_by": {
				"_id": "64a1b2c3d4e5f6789012345",
				"first_name": "John",
				"last_name": "Provider"
			},
			"created_date": "2024-01-16T10:00:00.000Z",
			"published_date": "2024-01-16T11:00:00.000Z"
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 1,
		"totalItems": 1,
		"itemsPerPage": 10,
		"hasNextPage": false,
		"hasPrevPage": false
	}
}
```

#### Publish Tour Update

```http
PATCH /api/tour-updates/64a1b2c3d4e5f6789012353/publish
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Tour update published successfully and notifications sent",
	"tourUpdate": {
		"_id": "64a1b2c3d4e5f6789012353",
		"update_title": "Important Weather Update",
		"is_published": true,
		"published_date": "2024-01-16T11:00:00.000Z",
		"notifications_sent": 5
	}
}
```

### Health Check

#### Basic Health Check

```http
GET /health
```

Response:

```json
{
	"status": "OK",
	"timestamp": "2024-01-16T12:00:00.000Z",
	"uptime": 3600.5,
	"services": {
		"database": "connected",
		"redis": "connected"
	},
	"memory": {
		"used": "45 MB",
		"total": "128 MB"
	},
	"environment": "production",
	"cache": {
		"status": "available",
		"hitRate": "85.2%",
		"totalKeys": 1247
	}
}
```

#### Detailed Health Check

```http
GET /health/detailed
```

Response:

````json
{
	"status": "OK",
	"timestamp": "2024-01-16T12:00:00.000Z",
	"uptime": 3600.5,
	"version": "1.0.0",
	"services": {
		"database": {
			"status": "connected",
			"responseTime": "12ms",
			"readyState": 1
		},
		"redis": {
			"status": "connected",
			"responseTime": "3ms"
		}
	},
	"performance": {
		"totalResponseTime": "18ms",
		"memory": {
			"rss": "67 MB",
			"heapTotal": "45 MB",
			"heapUsed": "32 MB",
			"external": "2 MB"
		},
		"cpuUsage": {
			"user": 125000,
			"system": 45000
		}
	},
	"system": {
		"platform": "linux",
		"nodeVersion": "v18.17.0",
		"pid": 1234
	},
	"cache": {
		"status": "available",
		"hitRate": "85.2%",
		"totalKeys": 1247,
		"memoryUsage": "15.3 MB"
	}
}
```9012350",
		"tourist_id": {
			"_id": "64a1b2c3d4e5f6789012349",
			"first_name": "John",
			"last_name": "Doe",
			"email": "john@example.com"
		},
		"request_type": "become_new_provider",
		"status": "approved",
		"admin_notes": "Application looks good. Welcome to the platform!",
		"processed_date": "2024-01-15T14:00:00.000Z",
		"created_date": "2024-01-15T12:00:00.000Z"
	}
}
````

### Generate QR Code for Tour

```http
POST /api/qr-codes/tours/64a1b2c3d4e5f6789012347/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "generateJoinCode": true,
  "notify": true
}
```

Response:

```json
{
	"message": "QR code generated successfully",
	"qr_code_url": "https://s3.amazonaws.com/bucket/qr-codes/custom/64a1b2c3d4e5f6789012347-uuid.png",
	"join_qr_code_url": "https://s3.amazonaws.com/bucket/qr-codes/custom/join-ABC123-uuid.png",
	"generated_at": "2024-01-15T15:30:00.000Z"
}
```

### Share QR Code via Email

```http
POST /api/qr-codes/tours/64a1b2c3d4e5f6789012347/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipients": [
    "friend1@example.com",
    "friend2@example.com",
    "family@example.com"
  ],
  "message": "Check out this amazing tour I'm organizing!",
  "bulk": false
}
```

Response:

```json
{
	"message": "QR code shared successfully to 3 recipient(s)",
	"recipients_count": 3
}
```

### Get QR Code Information

```http
GET /api/qr-codes/tours/64a1b2c3d4e5f6789012347?type=custom
Authorization: Bearer <token>
```

Response:

```json
{
	"has_qr_code": true,
	"qr_code_url": "https://s3.amazonaws.com/bucket/qr-codes/custom/64a1b2c3d4e5f6789012347-uuid.png",
	"has_join_qr_code": true,
	"join_qr_code_url": "https://s3.amazonaws.com/bucket/qr-codes/custom/join-ABC123-uuid.png",
	"generated_at": "2024-01-15T15:30:00.000Z",
	"tour_name": "Amazing Paris Adventure",
	"tour_id": "64a1b2c3d4e5f6789012347",
	"join_code": "ABC123"
}
```

### Upload Featured Image for Calendar Entry

```http
POST /api/calendar/64a1b2c3d4e5f6789012348/featured-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

[Binary image data in form field 'featured_image']
```

Response:

```json
{
	"message": "Featured image uploaded successfully",
	"featured_image": "https://s3.amazonaws.com/bucket/calendar-images/1642248000000-uuid-activity.jpg",
	"uploaded_at": "2024-01-15T16:00:00.000Z"
}
```

### Get Presigned URL for Direct Upload

```http
POST /api/calendar/presigned-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileName": "activity-photo.jpg",
  "contentType": "image/jpeg"
}
```

Response:

```json
{
	"message": "Presigned URL generated successfully",
	"presignedUrl": "https://s3.amazonaws.com/bucket/calendar-images/key?AWSAccessKeyId=...",
	"publicUrl": "https://s3.amazonaws.com/bucket/calendar-images/1642248000000-uuid-activity-photo.jpg",
	"key": "calendar-images/1642248000000-uuid-activity-photo.jpg",
	"expiresIn": 3600
}
```

### Update Calendar Entry with Presigned Image

```http
PUT /api/calendar/64a1b2c3d4e5f6789012348/presigned-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "https://s3.amazonaws.com/bucket/calendar-images/1642248000000-uuid-activity-photo.jpg"
}
```

Response:

```json
{
	"message": "Featured image updated successfully",
	"featured_image": "https://s3.amazonaws.com/bucket/calendar-images/1642248000000-uuid-activity-photo.jpg",
	"uploaded_at": "2024-01-15T16:00:00.000Z"
}
```

## File Upload Examples

### Upload Profile Picture

```http
POST /api/uploads/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="profile_picture"; filename="my-avatar.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary--
```

Response:

```json
{
	"message": "Profile picture uploaded successfully",
	"fileUrl": "https://s3.amazonaws.com/bucket/profile-pictures/1642248000000-uuid-my-avatar.jpg",
	"fileName": "my-avatar.jpg",
	"fileSize": 245760,
	"uploadedAt": "2024-01-15T16:00:00.000Z",
	"user": {
		"_id": "64a1b2c3d4e5f6789012345",
		"email": "user@example.com",
		"first_name": "John",
		"last_name": "Doe",
		"profile_picture": "https://s3.amazonaws.com/bucket/profile-pictures/1642248000000-uuid-my-avatar.jpg"
	}
}
```

### Upload Tour Image

```http
POST /api/uploads/tour-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="tour_image"; filename="paris-tour.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary
Content-Disposition: form-data; name="image_type"

features
--boundary--
```

Response:

```json
{
	"message": "Tour features uploaded successfully",
	"fileUrl": "https://s3.amazonaws.com/bucket/tour-images/1642248000000-uuid-paris-tour.jpg",
	"fileName": "paris-tour.jpg",
	"fileSize": 512000,
	"imageType": "features",
	"uploadedAt": "2024-01-15T16:00:00.000Z"
}
```

### Get Presigned URL for Direct Upload

```http
POST /api/uploads/presigned-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileName": "large-tour-video.mp4",
  "fileType": "general",
  "contentType": "video/mp4"
}
```

Response:

```json
{
	"message": "Presigned URL generated successfully",
	"presignedUrl": "https://s3.amazonaws.com/bucket/general-uploads/key?AWSAccessKeyId=...",
	"publicUrl": "https://s3.amazonaws.com/bucket/general-uploads/1642248000000-uuid-large-tour-video.mp4",
	"key": "general-uploads/1642248000000-uuid-large-tour-video.mp4",
	"expiresIn": 3600
}
```

## Default Activities Examples

### Create Default Activity

```http
POST /api/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "activity_name": "Eiffel Tower Visit",
  "description": "Visit the iconic Eiffel Tower with guided tour and photo opportunities",
  "typical_duration_hours": 2.5,
  "category": "sightseeing",
  "is_active": true
}
```

Response:

```json
{
	"message": "Default activity created successfully",
	"activity": {
		"_id": "64a1b2c3d4e5f6789012350",
		"activity_name": "Eiffel Tower Visit",
		"description": "Visit the iconic Eiffel Tower with guided tour and photo opportunities",
		"typical_duration_hours": 2.5,
		"category": "sightseeing",
		"is_active": true,
		"created_by": {
			"_id": "64a1b2c3d4e5f6789012345",
			"first_name": "Admin",
			"last_name": "User",
			"email": "admin@example.com"
		},
		"created_date": "2024-01-15T10:00:00.000Z",
		"updated_date": "2024-01-15T10:00:00.000Z"
	}
}
```

### Get Activities for Selection

```http
GET /api/activities/selection?category=sightseeing&search=tower
Authorization: Bearer <token>
```

Response:

```json
{
	"activities": [
		{
			"_id": "64a1b2c3d4e5f6789012350",
			"activity_name": "Eiffel Tower Visit",
			"description": "Visit the iconic Eiffel Tower with guided tour and photo opportunities",
			"typical_duration_hours": 2.5,
			"category": "sightseeing",
			"is_active": true
		}
	],
	"total": 1,
	"categories": [
		"sightseeing",
		"dining",
		"entertainment",
		"transportation",
		"accommodation"
	]
}
```

## Cache Management Examples

### Get Cache Statistics

```http
GET /api/cache/stats
Authorization: Bearer <token>
```

Response:

```json
{
	"connected": true,
	"keys": 1247,
	"memory": "2.3MB",
	"hits": 8542,
	"misses": 1203,
	"hitRate": "87.6%",
	"uptime": "2 days, 14 hours",
	"timestamp": "2024-01-15T16:30:00.000Z"
}
```

### Clear All Cache

```http
DELETE /api/cache/clear
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Cache cleared successfully",
	"clearedKeys": 1247,
	"timestamp": "2024-01-15T16:35:00.000Z"
}
```

### Invalidate Cache by Pattern

```http
DELETE /api/cache/invalidate/pattern
Authorization: Bearer <token>
Content-Type: application/json

{
  "pattern": "tourlicity:api:users:*"
}
```

Response:

```json
{
	"message": "Cache pattern 'tourlicity:api:users:*' invalidated successfully",
	"deletedKeys": 23,
	"timestamp": "2024-01-15T16:40:00.000Z"
}
```

### Invalidate Model Cache

```http
DELETE /api/cache/invalidate/model/User
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Cache for model 'User' invalidated successfully",
	"deletedKeys": 45,
	"timestamp": "2024-01-15T16:45:00.000Z"
}
```

### Warm Up Cache

```http
POST /api/cache/warmup
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Cache warmup completed successfully",
	"warmedQueries": 6,
	"timestamp": "2024-01-15T16:50:00.000Z"
}
```

## Broadcast Examples

### Create Broadcast

```http
POST /api/broadcasts
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "message": "Welcome to our amazing Paris tour! Meeting point is at the Eiffel Tower at 9 AM.",
  "status": "draft"
}
```

Response:

```json
{
	"message": "Broadcast created successfully",
	"broadcast": {
		"_id": "64a1b2c3d4e5f6789012360",
		"custom_tour_id": {
			"_id": "64a1b2c3d4e5f6789012347",
			"tour_name": "Amazing Paris Adventure",
			"join_code": "ABC123"
		},
		"provider_id": {
			"_id": "64a1b2c3d4e5f6789012345",
			"provider_name": "Amazing Tours Co."
		},
		"message": "Welcome to our amazing Paris tour! Meeting point is at the Eiffel Tower at 9 AM.",
		"status": "draft",
		"created_by": {
			"_id": "64a1b2c3d4e5f6789012345",
			"first_name": "John",
			"last_name": "Provider",
			"email": "john@amazingtours.com"
		},
		"created_date": "2024-01-15T17:00:00.000Z",
		"updated_date": "2024-01-15T17:00:00.000Z"
	}
}
```

### Publish Broadcast

```http
PATCH /api/broadcasts/64a1b2c3d4e5f6789012360/publish
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Broadcast published successfully and notifications sent to 5 registered tourists",
	"broadcast": {
		"_id": "64a1b2c3d4e5f6789012360",
		"status": "published",
		"published_date": "2024-01-15T17:05:00.000Z",
		"notifications_sent": 5
	}
}
```

### Get Tour Broadcasts

```http
GET /api/broadcasts/tour/64a1b2c3d4e5f6789012347?status=published
Authorization: Bearer <token>
```

Response:

```json
{
	"data": [
		{
			"_id": "64a1b2c3d4e5f6789012360",
			"message": "Welcome to our amazing Paris tour! Meeting point is at the Eiffel Tower at 9 AM.",
			"status": "published",
			"created_date": "2024-01-15T17:00:00.000Z",
			"published_date": "2024-01-15T17:05:00.000Z"
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 1,
		"pages": 1
	}
}
```

## Push Notification Examples

### Subscribe to Push Notifications

```http
POST /api/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    "auth": "tBHItJI5svbpez7KI4CCXg"
  },
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "deviceType": "desktop",
  "browser": "Chrome"
}
```

Response:

```json
{
	"message": "Push subscription created successfully",
	"subscription": {
		"_id": "64a1b2c3d4e5f6789012370",
		"user_id": "64a1b2c3d4e5f6789012345",
		"endpoint": "https://fcm.googleapis.com/fcm/send/...",
		"device_type": "desktop",
		"browser": "Chrome",
		"is_active": true,
		"created_at": "2024-01-15T18:00:00.000Z"
	}
}
```

### Send Test Notification

```http
POST /api/notifications/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Notification",
  "body": "This is a test notification from Tourlicity!"
}
```

Response:

```json
{
	"message": "Test notifications queued successfully",
	"queued": 2,
	"subscriptions": 2,
	"timestamp": "2024-01-15T18:05:00.000Z"
}
```

### Send Bulk Notification

```http
POST /api/notifications/send-bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "System Maintenance",
  "body": "Scheduled maintenance will occur tonight from 2-4 AM EST.",
  "userType": "tourist",
  "type": "system",
  "includeEmail": true
}
```

Response:

```json
{
	"message": "Bulk notifications queued successfully",
	"queued": {
		"push": 156,
		"email": 156
	},
	"targetUsers": 156,
	"timestamp": "2024-01-15T18:10:00.000Z"
}
```

## Media Upload Examples

### Upload Tour Video

```http
POST /api/uploads/tour-media
Authorization: Bearer <token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="media_file"; filename="paris-tour-intro.mp4"
Content-Type: video/mp4

[binary video data]
--boundary
Content-Disposition: form-data; name="title"

Paris Tour Introduction
--boundary
Content-Disposition: form-data; name="description"

Welcome video for our amazing Paris adventure tour
--boundary
Content-Disposition: form-data; name="media_type"

features
--boundary--
```

Response:

```json
{
	"message": "Tour video uploaded successfully",
	"media": {
		"success": true,
		"type": "video",
		"url": "https://s3.amazonaws.com/bucket/tour-media/paris-tour-intro.mp4",
		"title": "Paris Tour Introduction",
		"description": "Welcome video for our amazing Paris adventure tour",
		"duration": "PT2M30S",
		"uploadedAt": "2024-01-15T19:00:00.000Z"
	},
	"fileName": "paris-tour-intro.mp4",
	"fileSize": 15728640,
	"mediaType": "features"
}
```

### Create Tour with Video

```http
POST /api/custom-tours
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider_id": "64a1b2c3d4e5f6789012345",
  "tour_template_id": "64a1b2c3d4e5f6789012346",
  "tour_name": "Amazing Paris Adventure",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "viewAccessibility": "public",
  "max_tourists": 8,
  "features_media": {
    "url": "https://s3.amazonaws.com/bucket/tour-media/paris-tour-intro.mp4",
    "type": "video"
  },
  "teaser_images": [
    "https://example.com/paris-teaser1.jpg",
    "https://example.com/paris-teaser2.jpg"
  ]
}
```

Response includes the new `features_media` object:

```json
{
	"message": "Custom tour created successfully",
	"tour": {
		"_id": "64a1b2c3d4e5f6789012380",
		"tour_name": "Amazing Paris Adventure",
		"features_media": {
			"url": "https://s3.amazonaws.com/bucket/tour-media/paris-tour-intro.mp4",
			"type": "video"
		},
		"features_image": "https://s3.amazonaws.com/bucket/tour-images/paris-main.jpg",
		"viewAccessibility": "public",
		"join_code": "XYZ789"
	}
}
```

## Payment Processing Examples

### Create Payment Intent

```http
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "registration_id": "64a1b2c3d4e5f6789012348",
  "amount": 299.99,
  "currency": "USD"
}
```

Response:

```json
{
	"message": "Payment intent created successfully",
	"client_secret": "pi_1234567890_secret_abcdef",
	"payment_id": "64a1b2c3d4e5f6789012400"
}
```

### Confirm Payment

```http
POST /api/payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_intent_id": "pi_1234567890"
}
```

Response:

```json
{
	"message": "Payment confirmed successfully",
	"payment": {
		"_id": "64a1b2c3d4e5f6789012400",
		"amount": 299.99,
		"currency": "USD",
		"payment_status": "completed",
		"payment_date": "2024-01-15T20:00:00.000Z",
		"transaction_id": "pi_1234567890"
	}
}
```

### Get Payment History

```http
GET /api/payments?page=1&limit=10&status=completed
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Payment history retrieved successfully",
	"payments": [
		{
			"_id": "64a1b2c3d4e5f6789012400",
			"amount": 299.99,
			"currency": "USD",
			"payment_status": "completed",
			"payment_date": "2024-01-15T20:00:00.000Z",
			"custom_tour_id": {
				"tour_name": "Amazing Paris Adventure",
				"start_date": "2024-06-01T00:00:00.000Z"
			},
			"provider_id": {
				"provider_name": "Amazing Tours Co."
			}
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 5,
		"pages": 1
	}
}
```

## Review System Examples

### Create Tour Review

```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "registration_id": "64a1b2c3d4e5f6789012348",
  "overall_rating": 5,
  "organization_rating": 5,
  "communication_rating": 4,
  "value_rating": 4,
  "experience_rating": 5,
  "title": "Absolutely Amazing Experience!",
  "review_text": "This tour exceeded all my expectations. The guide was knowledgeable, the locations were breathtaking, and everything was perfectly organized.",
  "pros": ["Excellent guide", "Beautiful locations", "Well organized"],
  "cons": ["Could use more free time"]
}
```

Response:

```json
{
	"message": "Review created successfully",
	"review": {
		"_id": "64a1b2c3d4e5f6789012410",
		"overall_rating": 5,
		"title": "Absolutely Amazing Experience!",
		"review_text": "This tour exceeded all my expectations...",
		"status": "pending",
		"tourist_name": "John Doe",
		"tour_name": "Amazing Paris Adventure",
		"created_date": "2024-01-15T21:00:00.000Z"
	}
}
```

### Get Provider Rating

```http
GET /api/reviews/provider/64a1b2c3d4e5f6789012345/rating
```

Response:

```json
{
	"message": "Provider rating retrieved successfully",
	"rating": {
		"provider_id": "64a1b2c3d4e5f6789012345",
		"total_reviews": 47,
		"average_rating": 4.6,
		"average_organization": 4.7,
		"average_communication": 4.5,
		"average_value": 4.4,
		"average_experience": 4.8,
		"rating_distribution": {
			"five_star": 32,
			"four_star": 12,
			"three_star": 2,
			"two_star": 1,
			"one_star": 0
		},
		"badges": ["top_rated", "excellent_communication"],
		"last_calculated": "2024-01-15T21:30:00.000Z"
	}
}
```

## Booking System Examples

### Create Booking

```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "availability_id": "64a1b2c3d4e5f6789012420",
  "number_of_participants": 2,
  "contact_email": "john@example.com",
  "contact_phone": "+1234567890",
  "special_requests": "Vegetarian meals please",
  "participants": [
    {
      "name": "John Doe",
      "age": 30,
      "dietary_requirements": ["vegetarian"]
    },
    {
      "name": "Jane Doe",
      "age": 28,
      "dietary_requirements": ["gluten-free"]
    }
  ]
}
```

Response:

```json
{
	"message": "Booking created successfully",
	"booking": {
		"_id": "64a1b2c3d4e5f6789012430",
		"booking_reference": "BK20240115ABC123",
		"tour_date": "2024-06-01T00:00:00.000Z",
		"number_of_participants": 2,
		"total_amount": 599.98,
		"status": "pending",
		"payment_status": "pending",
		"tour_name": "Paris City Tour"
	}
}
```

### Get Availability

```http
GET /api/bookings/availability?tour_template_id=64a1b2c3d4e5f6789012346&start_date=2024-06-01&end_date=2024-06-30
```

Response:

```json
{
	"message": "Availability retrieved successfully",
	"data": [
		{
			"_id": "64a1b2c3d4e5f6789012420",
			"date": "2024-06-01T00:00:00.000Z",
			"total_capacity": 12,
			"available_spots": 8,
			"base_price_per_person": 299.99,
			"tour_template_id": {
				"template_name": "Paris City Tour",
				"duration_days": 1
			},
			"time_slots": [
				{
					"start_time": "09:00",
					"end_time": "17:00",
					"max_capacity": 12,
					"current_bookings": 4,
					"price_per_person": 299.99
				}
			]
		}
	]
}
```

## Location Management Examples

### Search Locations

```http
GET /api/locations?search=eiffel tower&type=landmark&country=france&page=1&limit=10
```

Response:

```json
{
	"message": "Locations retrieved successfully",
	"data": [
		{
			"_id": "64a1b2c3d4e5f6789012440",
			"name": "Eiffel Tower",
			"description": "Iconic iron lattice tower and symbol of Paris",
			"type": "landmark",
			"coordinates": {
				"latitude": 48.8584,
				"longitude": 2.2945
			},
			"address": {
				"street_address": "Champ de Mars, 5 Avenue Anatole France",
				"city": "Paris",
				"country": "France"
			},
			"average_rating": 4.5,
			"categories": ["historical", "architectural", "tourist_attraction"],
			"operating_hours": [
				{
					"day_of_week": "monday",
					"open_time": "09:30",
					"close_time": "23:45"
				}
			]
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 1,
		"pages": 1
	}
}
```

### Add Location to Tour

```http
POST /api/locations/tours/64a1b2c3d4e5f6789012347
Authorization: Bearer <token>
Content-Type: application/json

{
  "location_id": "64a1b2c3d4e5f6789012440",
  "visit_order": 1,
  "day_number": 1,
  "activity_type": "visit",
  "planned_arrival_time": "10:00",
  "planned_departure_time": "12:00",
  "activity_description": "Guided tour of the Eiffel Tower with photo opportunities",
  "special_instructions": "Meet at the main entrance"
}
```

Response:

```json
{
	"message": "Location added to tour successfully",
	"tourLocation": {
		"_id": "64a1b2c3d4e5f6789012450",
		"custom_tour_id": "64a1b2c3d4e5f6789012347",
		"location_id": "64a1b2c3d4e5f6789012440",
		"visit_order": 1,
		"day_number": 1,
		"activity_type": "visit",
		"planned_arrival_time": "10:00",
		"planned_departure_time": "12:00",
		"location_name": "Eiffel Tower",
		"location_coordinates": {
			"latitude": 48.8584,
			"longitude": 2.2945
		}
	}
}
```

## Error Handling

### Standard HTTP Status Codes

| Code | Description           | Usage                                             |
| ---- | --------------------- | ------------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, PATCH requests               |
| 201  | Created               | Successful POST requests                          |
| 400  | Bad Request           | Validation errors, malformed requests             |
| 401  | Unauthorized          | Missing or invalid authentication token           |
| 403  | Forbidden             | Insufficient permissions for the requested action |
| 404  | Not Found             | Resource not found                                |
| 409  | Conflict              | Resource already exists or constraint violation   |
| 422  | Unprocessable Entity  | Business logic validation errors                  |
| 429  | Too Many Requests     | Rate limit exceeded                               |
| 500  | Internal Server Error | Server-side errors                                |
| 503  | Service Unavailable   | External service unavailable (Redis, S3, etc.)    |

### Error Response Format

All error responses follow this consistent format:

```json
{
	"error": "Error message describing what went wrong",
	"code": "ERROR_CODE",
	"details": {
		"field": "Additional error details",
		"timestamp": "2024-01-15T20:00:00.000Z"
	}
}
```

### Common Error Examples

#### Validation Error (400)

```json
{
	"error": "Validation failed",
	"code": "VALIDATION_ERROR",
	"details": {
		"tour_name": "Tour name is required",
		"start_date": "Start date must be in the future"
	}
}
```

#### Authentication Error (401)

```json
{
	"error": "Authentication required",
	"code": "AUTH_REQUIRED",
	"details": {
		"message": "Please provide a valid JWT token"
	}
}
```

#### Permission Error (403)

```json
{
	"error": "Insufficient permissions",
	"code": "FORBIDDEN",
	"details": {
		"required_role": "system_admin",
		"user_role": "tourist"
	}
}
```

#### Rate Limit Error (429)

```json
{
	"error": "Rate limit exceeded",
	"code": "RATE_LIMIT_EXCEEDED",
	"details": {
		"limit": 100,
		"window": "1 hour",
		"retry_after": 3600
	}
}
```

## API Versioning

The current API version is v1. Future versions will be supported through URL versioning:

- Current: `/api/endpoint`
- Future: `/api/v2/endpoint`

Breaking changes will result in a new API version, while backward-compatible changes will be added to the current version.

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

### Default Limits

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **File uploads**: 50 requests per hour
- **Admin operations**: 500 requests per hour

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Data Validation

### Input Validation Rules

#### User Data

- **Email**: Valid email format, unique across system
- **Names**: 1-50 characters, letters and spaces only
- **Phone**: Valid international format (E.164)
- **Passwords**: Minimum 8 characters (for local auth, if implemented)

#### Tour Data

- **Tour Name**: 3-100 characters
- **Dates**: Start date must be before end date, both in future
- **Max Tourists**: 1-50 participants
- **Join Code**: Auto-generated, 6 alphanumeric characters
- **Images**: JPEG/PNG/GIF, max 5MB each
- **Videos**: MP4/MOV/AVI/MKV/WebM, max 100MB

#### Broadcast Data

- **Message**: 1-150 characters
- **Status**: 'draft' or 'published'

### File Upload Validation

- **Profile Pictures**: Max 2MB, JPEG/PNG only
- **Tour Images**: Max 5MB each, JPEG/PNG/GIF
- **Tour Videos**: Max 100MB, MP4/MOV/AVI/MKV/WebM
- **General Files**: Max 10MB, various formats allowed

## Security Considerations

### Authentication & Authorization

- JWT tokens with configurable expiration
- Role-based access control (RBAC)
- Complete profile requirement for sensitive operations
- Provider-specific data isolation

### Data Protection

- Input sanitization and validation
- SQL injection prevention (using Mongoose ODM)
- XSS protection through proper encoding
- CORS configuration for cross-origin requests

### File Upload Security

- File type validation by MIME type and extension
- File size limits to prevent DoS attacks
- Virus scanning (recommended for production)
- Secure file storage with access controls

### API Security

- Rate limiting to prevent abuse
- Request logging for audit trails
- Error message sanitization
- HTTPS enforcement (recommended for production)ing"
  },
  {
  "\_id": "64a1b2c3d4e5f6789012351",
  "activity_name": "Tower Bridge Experience",
  "description": "Explore the famous Tower Bridge in London",
  "typical_duration_hours": 1.5,
  "category": "sightseeing"
  }
  ]
  }

````

### Get Activity Categories

```http
GET /api/activities/categories
Authorization: Bearer <token>
````

Response:

```json
{
	"categories": [
		{
			"name": "sightseeing",
			"count": 15
		},
		{
			"name": "cultural",
			"count": 8
		},
		{
			"name": "adventure",
			"count": 5
		},
		{
			"name": "dining",
			"count": 12
		},
		{
			"name": "transportation",
			"count": 3
		},
		{
			"name": "accommodation",
			"count": 2
		},
		{
			"name": "entertainment",
			"count": 7
		},
		{
			"name": "shopping",
			"count": 4
		},
		{
			"name": "educational",
			"count": 6
		},
		{
			"name": "religious",
			"count": 3
		},
		{
			"name": "nature",
			"count": 9
		},
		{
			"name": "other",
			"count": 2
		}
	]
}
```

## Broadcast Examples

### Create Broadcast

```http
POST /api/broadcasts
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "message": "Welcome to our Paris Adventure! Please meet at the hotel lobby at 8 AM tomorrow.",
  "status": "draft"
}
```

Response:

```json
{
	"message": "Broadcast created successfully",
	"broadcast": {
		"_id": "64a1b2c3d4e5f6789012360",
		"custom_tour_id": {
			"_id": "64a1b2c3d4e5f6789012347",
			"tour_name": "Amazing Paris Adventure",
			"start_date": "2024-06-01T00:00:00.000Z",
			"end_date": "2024-06-07T00:00:00.000Z",
			"join_code": "ABC123"
		},
		"provider_id": {
			"_id": "64a1b2c3d4e5f6789012345",
			"provider_name": "Amazing Tours Co."
		},
		"message": "Welcome to our Paris Adventure! Please meet at the hotel lobby at 8 AM tomorrow.",
		"status": "draft",
		"created_by": {
			"_id": "64a1b2c3d4e5f6789012346",
			"first_name": "Provider",
			"last_name": "Admin",
			"email": "provider@example.com"
		},
		"created_date": "2024-01-15T10:00:00.000Z",
		"updated_date": "2024-01-15T10:00:00.000Z"
	}
}
```

### Publish Broadcast (Send to Tourists)

```http
PATCH /api/broadcasts/64a1b2c3d4e5f6789012360/publish
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Broadcast published successfully",
	"broadcast": {
		"_id": "64a1b2c3d4e5f6789012360",
		"custom_tour_id": {
			"_id": "64a1b2c3d4e5f6789012347",
			"tour_name": "Amazing Paris Adventure"
		},
		"message": "Welcome to our Paris Adventure! Please meet at the hotel lobby at 8 AM tomorrow.",
		"status": "published",
		"created_date": "2024-01-15T10:00:00.000Z",
		"updated_date": "2024-01-15T10:05:00.000Z"
	}
}
```

### Get Broadcasts for Tour (Tourist View)

```http
GET /api/broadcasts/tour/64a1b2c3d4e5f6789012347
Authorization: Bearer <tourist_token>
```

Response:

```json
{
	"data": [
		{
			"_id": "64a1b2c3d4e5f6789012360",
			"custom_tour_id": {
				"_id": "64a1b2c3d4e5f6789012347",
				"tour_name": "Amazing Paris Adventure",
				"start_date": "2024-06-01T00:00:00.000Z",
				"end_date": "2024-06-07T00:00:00.000Z"
			},
			"provider_id": {
				"_id": "64a1b2c3d4e5f6789012345",
				"provider_name": "Amazing Tours Co."
			},
			"message": "Welcome to our Paris Adventure! Please meet at the hotel lobby at 8 AM tomorrow.",
			"status": "published",
			"created_by": {
				"_id": "64a1b2c3d4e5f6789012346",
				"first_name": "Provider",
				"last_name": "Admin"
			},
			"created_date": "2024-01-15T10:00:00.000Z"
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 1,
		"items_per_page": 10,
		"has_next": false,
		"has_prev": false
	}
}
```

### Subscribe to Push Notifications

```http
POST /api/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    "auth": "tBHItJI5svbpez7KI4CCXg"
  },
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "deviceType": "desktop",
  "browser": "Chrome"
}
```

Response:

```json
{
	"message": "Push subscription created successfully",
	"subscription_id": "64a1b2c3d4e5f6789012350"
}
```

### Send Notification to Specific User

```http
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6789012349",
  "title": "Tour Update",
  "body": "Your tour schedule has been updated. Please check the latest itinerary.",
  "type": "tour_update",
  "includeEmail": true
}
```

Response:

```json
{
	"message": "Notification queued successfully",
	"recipient": {
		"id": "64a1b2c3d4e5f6789012349",
		"name": "John Doe",
		"email": "john@example.com"
	},
	"jobs": [
		{
			"type": "push",
			"job_id": "1"
		},
		{
			"type": "email",
			"job_id": "2"
		}
	]
}
```

### Send Bulk Notifications

```http
POST /api/notifications/send-bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "userType": "tourist",
  "title": "System Maintenance",
  "body": "The system will be under maintenance from 2 AM to 4 AM UTC. Please plan accordingly.",
  "type": "system_announcement",
  "includeEmail": true
}
```

Response:

```json
{
	"message": "Bulk notifications queued successfully",
	"recipient_count": 150,
	"jobs": [
		{
			"type": "push",
			"count": 150
		},
		{
			"type": "email",
			"job_id": "3"
		}
	]
}
```

### Get Queue Statistics

```http
GET /api/notifications/queue-stats
Authorization: Bearer <token>
```

Response:

```json
{
	"message": "Queue statistics retrieved successfully",
	"stats": {
		"email": {
			"waiting": 5,
			"active": 2,
			"completed": 1250,
			"failed": 3
		},
		"push": {
			"waiting": 12,
			"active": 8,
			"completed": 2100,
			"failed": 15
		}
	},
	"timestamp": "2024-01-15T18:30:00.000Z"
}
```

## Error Responses

### 400 Bad Request

```json
{
	"error": "Validation error",
	"details": ["first_name is required", "email must be a valid email"]
}
```

### 401 Unauthorized

```json
{
	"error": "Access denied. No token provided."
}
```

### 403 Forbidden

```json
{
	"error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found

```json
{
	"error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
	"error": "Internal server error"
}
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

Response format:

```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

## Search and Filtering

Many endpoints support search and filtering:

- `search`: Text search in relevant fields
- `status`: Filter by status
- `is_active`: Filter by active status
- `provider_id`: Filter by provider (System Admin only)

Example:

```
GET /api/custom-tours?search=paris&status=published&page=1&limit=20
```

## Environment Variables

Required environment variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tourlicity
REDIS_URL=redis://localhost:6379

# Cache Configuration (Optional)
CACHE_DEFAULT_TTL=300
CACHE_API_TTL=300
CACHE_DB_TTL=600
CACHE_SESSION_TTL=86400
JWT_SECRET=your-super-secret-jwt-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=tourlicity-documents
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Rate Limiting

API requests are rate-limited to 100 requests per 15-minute window per IP address.

## File Uploads

File uploads are handled via AWS S3. Supported file types include documents, images, and other common formats up to 10MB per file.

## Email Notifications

The system automatically sends email notifications for:

- New tour registrations
- Registration status changes
- Document uploads
- Role change requests

## Redis Caching

Redis is used for comprehensive caching to improve performance:

### Cache Types

1. **API Response Caching**: GET requests are cached with configurable TTL
2. **Database Query Caching**: MongoDB query results are cached to reduce database load
3. **Session Caching**: User sessions and authentication data
4. **Job Queues**: Background processing for notifications

### Cache Features

- **Automatic Invalidation**: Cache is automatically invalidated when data changes
- **Pattern-based Invalidation**: Bulk cache invalidation using Redis patterns
- **Configurable TTL**: Different cache durations for different data types
- **Cache Statistics**: Monitor cache hit rates and performance
- **Graceful Degradation**: System works without Redis, with reduced performance

### Cache Management API

The system provides admin endpoints for cache management:

- `GET /api/cache/stats` - Get cache statistics
- `DELETE /api/cache/clear` - Clear all cache
- `DELETE /api/cache/invalidate/pattern` - Invalidate by pattern
- `DELETE /api/cache/invalidate/model/{modelName}` - Invalidate model cache
- `DELETE /api/cache/invalidate/user/{userId}` - Invalidate user cache
- `POST /api/cache/warmup` - Warm up cache with common queries

### Cache Headers

API responses include cache-related headers:

- `X-Cache: HIT|MISS` - Indicates cache hit or miss
- `X-Cache-Key` - The cache key used
- `Cache-Control` - Browser caching directives

### Cache TTL Configuration

Default cache durations:

- API responses: 5 minutes
- Database queries: 10 minutes
- User sessions: 24 hours
- Static data (categories): 30 minutes

## Health Check

The API provides comprehensive health monitoring endpoints for system status and performance monitoring.

### Basic Health Check

```http
GET /health
```

Response (Healthy):

```json
{
	"status": "OK",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"uptime": 3600.5,
	"services": {
		"database": "connected",
		"redis": "connected"
	},
	"memory": {
		"used": "45 MB",
		"total": "128 MB"
	},
	"environment": "development"
}
```

Response (Degraded - HTTP 503):

```json
{
	"status": "DEGRADED",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"uptime": 3600.5,
	"services": {
		"database": "connected",
		"redis": "disconnected"
	},
	"memory": {
		"used": "45 MB",
		"total": "128 MB"
	},
	"environment": "development"
}
```

### Detailed Health Check

```http
GET /health/detailed
```

Response:

```json
{
	"status": "OK",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"uptime": 3600.5,
	"version": "1.0.0",
	"services": {
		"database": {
			"status": "connected",
			"responseTime": "15ms",
			"readyState": 1
		},
		"redis": {
			"status": "connected",
			"responseTime": "8ms"
		}
	},
	"performance": {
		"totalResponseTime": "25ms",
		"memory": {
			"rss": "89 MB",
			"heapTotal": "128 MB",
			"heapUsed": "45 MB",
			"external": "12 MB"
		},
		"cpuUsage": {
			"user": 125000,
			"system": 50000
		}
	},
	"system": {
		"platform": "win32",
		"nodeVersion": "v22.17.0",
		"pid": 12345
	}
}
```

### Health Check Status Codes

- **200 OK**: All services are healthy
- **503 Service Unavailable**: One or more services are degraded or unavailable

### Health Check Usage

These endpoints are designed for:

- **Load Balancers**: Use `/health` for simple up/down checks
- **Monitoring Tools**: Use `/health/detailed` for comprehensive metrics
- **Container Orchestration**: Both endpoints work with Docker, Kubernetes health checks
- **CI/CD Pipelines**: Verify deployment health before traffic routing

## Recent Updates & Improvements

### Version 1.2.0 - Tour Visibility & AWS SDK Migration

#### 🆕 New Features

**Custom Tour Visibility Control**

- Added `viewAccessibility` property to CustomTour model
- **Public tours**: Visible to all users in general listings
- **Private tours**: Only accessible via join code
- Enhanced access control for better privacy management

**API Changes:**

- `POST /api/custom-tours` now accepts `viewAccessibility` parameter
- `GET /api/custom-tours` filters results based on user type and tour visibility
- `GET /api/custom-tours/search/:join_code` returns `access_method` field
- Tourist users can only see public tours in general listings

#### 🔧 Technical Improvements

**AWS SDK Migration (v2 → v3)**

- Migrated from `aws-sdk` v2 to `@aws-sdk/client-s3` v3
- Improved performance and reduced bundle size
- Better error handling and modern async/await patterns
- Removed deprecated ACL parameters for S3 security compliance

**Image Upload Enhancements**

- Fixed MIME type validation (removed invalid `image/jpg` type)
- Resolved S3 ACL compatibility issues
- Enhanced error handling for upload failures
- Support for both local and S3 storage fallback

**Database & Caching**

- Improved MongoDB connection stability
- Enhanced Redis integration for caching
- Better error handling for database disconnections
- Optimized query performance

#### 🛡️ Security & Compliance

**S3 Security Updates**

- Removed ACL parameters to comply with modern S3 security settings
- Compatible with "Block public ACLs" bucket configuration
- Supports bucket policy-based public access control
- Enhanced file upload security validation

**Access Control Improvements**

- Enhanced tour visibility controls
- Better user role-based access restrictions
- Improved authentication middleware
- Secure join code-based access for private tours

#### 📋 Migration Notes

**For Existing Tours:**

- All existing tours default to `viewAccessibility: 'public'`
- No breaking changes to existing API endpoints
- Backward compatible with existing client implementations

**For S3 Configuration:**

- Remove individual file ACLs in favor of bucket policies
- Update bucket permissions for public read access if needed
- No changes required for existing uploaded files

#### 🔍 Validation Updates

**Enhanced Input Validation:**

- Added `viewAccessibility` validation (accepts only 'public' or 'private')
- Improved file type validation for image uploads
- Better error messages for validation failures

**Example Usage:**

```javascript
// Create a private tour
POST /api/custom-tours
{
  "tour_name": "Exclusive VIP Experience",
  "viewAccessibility": "private",
  // ... other fields
}

// Search for private tour by join code
GET /api/custom-tours/search/ABC123
// Returns: { "tour": {...}, "access_method": "join_code" }
```

#### 🚀 Performance Improvements

- **AWS SDK v3**: Faster S3 operations with modern SDK
- **Optimized Queries**: Better database query performance
- **Enhanced Caching**: Improved Redis integration
- **Error Handling**: More robust error recovery mechanisms

---

_For technical support or questions about these updates, please refer to the implementation documentation or contact the development team._

## Missing Endpoints Documentation

### Tour Updates

| Method | Endpoint                     | Description                   | Access  |
| ------ | ---------------------------- | ----------------------------- | ------- |
| GET    | `/tour-updates`              | Get all tour updates          | Private |
| GET    | `/tour-updates/tour/:tourId` | Get updates for specific tour | Private |
| GET    | `/tour-updates/:id`          | Get tour update by ID         | Private |
| POST   | `/tour-updates`              | Create new tour update        | Private |
| PUT    | `/tour-updates/:id`          | Update tour update            | Private |
| PATCH  | `/tour-updates/:id/publish`  | Publish tour update           | Private |
| DELETE | `/tour-updates/:id`          | Delete tour update            | Private |

### Bookings & Availability (Extended)

| Method | Endpoint                 | Description           | Access                   |
| ------ | ------------------------ | --------------------- | ------------------------ |
| GET    | `/bookings`              | Get user bookings     | Private                  |
| POST   | `/bookings`              | Create new booking    | Private                  |
| GET    | `/bookings/:id`          | Get booking by ID     | Private (Owner/Provider) |
| PATCH  | `/bookings/:id/cancel`   | Cancel booking        | Private (Owner)          |
| PATCH  | `/bookings/:id/check-in` | Check in booking      | Provider Admin           |
| GET    | `/bookings/availability` | Get tour availability | Public                   |
| POST   | `/bookings/availability` | Create availability   | Provider Admin           |

### Reviews & Ratings (Extended)

| Method | Endpoint                       | Description                 | Access            |
| ------ | ------------------------------ | --------------------------- | ----------------- |
| GET    | `/reviews`                     | Get reviews                 | Public            |
| POST   | `/reviews`                     | Create tour review          | Private (Tourist) |
| GET    | `/reviews/:id`                 | Get review by ID            | Public            |
| PATCH  | `/reviews/:id/moderate`        | Moderate review             | System Admin      |
| POST   | `/reviews/:id/respond`         | Provider response to review | Provider Admin    |
| GET    | `/reviews/provider/:id/rating` | Get provider rating summary | Public            |

### Locations & Geography (Extended)

| Method | Endpoint                   | Description            | Access                       |
| ------ | -------------------------- | ---------------------- | ---------------------------- |
| GET    | `/locations`               | Search locations       | Public                       |
| POST   | `/locations`               | Create location        | System Admin, Provider Admin |
| GET    | `/locations/:id`           | Get location by ID     | Public                       |
| PUT    | `/locations/:id`           | Update location        | System Admin, Provider Admin |
| GET    | `/locations/tours/:tourId` | Get locations for tour | Public                       |
| POST   | `/locations/tours/:tourId` | Add location to tour   | System Admin, Provider Admin |

## Request/Response Examples for Missing Endpoints

### Tour Updates

#### Create Tour Update

```http
POST /api/tour-updates
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "update_type": "itinerary_change",
  "title": "Schedule Update",
  "content": "The meeting time has been changed to 9:00 AM",
  "is_published": false
}
```

Response:

```json
{
	"message": "Tour update created successfully",
	"tourUpdate": {
		"_id": "64a1b2c3d4e5f6789012500",
		"custom_tour_id": "64a1b2c3d4e5f6789012347",
		"update_type": "itinerary_change",
		"title": "Schedule Update",
		"content": "The meeting time has been changed to 9:00 AM",
		"is_published": false,
		"created_by": "64a1b2c3d4e5f6789012345",
		"created_date": "2024-01-15T10:00:00.000Z"
	}
}
```

#### Get Tour Updates for Specific Tour

```http
GET /api/tour-updates/tour/64a1b2c3d4e5f6789012347?is_published=true
Authorization: Bearer <token>
```

Response:

```json
{
	"data": [
		{
			"_id": "64a1b2c3d4e5f6789012500",
			"title": "Schedule Update",
			"content": "The meeting time has been changed to 9:00 AM",
			"update_type": "itinerary_change",
			"is_published": true,
			"created_date": "2024-01-15T10:00:00.000Z"
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 1,
		"items_per_page": 10
	}
}
```

### Bookings

#### Create Booking

```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "availability_id": "64a1b2c3d4e5f6789012420",
  "number_of_participants": 2,
  "contact_email": "john@example.com",
  "contact_phone": "+1234567890",
  "special_requests": "Vegetarian meals please",
  "participants": [
    {
      "name": "John Doe",
      "age": 30,
      "dietary_requirements": ["vegetarian"]
    },
    {
      "name": "Jane Doe",
      "age": 28,
      "dietary_requirements": ["gluten-free"]
    }
  ]
}
```

Response:

```json
{
	"message": "Booking created successfully",
	"booking": {
		"_id": "64a1b2c3d4e5f6789012430",
		"booking_reference": "BK20240115ABC123",
		"tour_date": "2024-06-01T00:00:00.000Z",
		"number_of_participants": 2,
		"total_amount": 599.98,
		"status": "pending",
		"payment_status": "pending",
		"tour_name": "Paris City Tour"
	}
}
```

### Reviews

#### Create Tour Review

```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "custom_tour_id": "64a1b2c3d4e5f6789012347",
  "registration_id": "64a1b2c3d4e5f6789012348",
  "overall_rating": 5,
  "organization_rating": 5,
  "communication_rating": 4,
  "value_rating": 4,
  "experience_rating": 5,
  "title": "Absolutely Amazing Experience!",
  "review_text": "This tour exceeded all my expectations. The guide was knowledgeable, the locations were breathtaking, and everything was perfectly organized.",
  "pros": ["Excellent guide", "Beautiful locations", "Well organized"],
  "cons": ["Could use more free time"]
}
```

Response:

```json
{
	"message": "Review created successfully",
	"review": {
		"_id": "64a1b2c3d4e5f6789012410",
		"overall_rating": 5,
		"title": "Absolutely Amazing Experience!",
		"review_text": "This tour exceeded all my expectations...",
		"status": "pending",
		"tourist_name": "John Doe",
		"tour_name": "Amazing Paris Adventure",
		"created_date": "2024-01-15T21:00:00.000Z"
	}
}
```

### Locations

#### Search Locations

```http
GET /api/locations?search=eiffel tower&type=landmark&country=france&page=1&limit=10
```

Response:

```json
{
	"message": "Locations retrieved successfully",
	"data": [
		{
			"_id": "64a1b2c3d4e5f6789012440",
			"name": "Eiffel Tower",
			"description": "Iconic iron lattice tower and symbol of Paris",
			"type": "landmark",
			"coordinates": {
				"latitude": 48.8584,
				"longitude": 2.2945
			},
			"address": {
				"street_address": "Champ de Mars, 5 Avenue Anatole France",
				"city": "Paris",
				"country": "France"
			},
			"average_rating": 4.5,
			"categories": ["historical", "architectural", "tourist_attraction"],
			"operating_hours": [
				{
					"day_of_week": "monday",
					"open_time": "09:30",
					"close_time": "23:45"
				}
			]
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 1,
		"pages": 1
	}
}
```

## Updated File Upload Documentation

### File Upload Endpoints (Corrected)

| Method | Endpoint                        | Description                 | Access                       | Field Name        |
| ------ | ------------------------------- | --------------------------- | ---------------------------- | ----------------- |
| POST   | `/uploads/profile-picture`      | Upload profile picture      | Private                      | `profile_picture` |
| POST   | `/uploads/tour-image`           | Upload tour image/video     | System Admin, Provider Admin | `tour_image`      |
| POST   | `/uploads/multiple-tour-images` | Upload multiple tour images | System Admin, Provider Admin | `tour_images`     |
| POST   | `/uploads/general`              | Upload general file         | Private                      | `file`            |
| POST   | `/uploads/presigned-url`        | Get presigned URL for S3    | Private                      | N/A               |
| DELETE | `/uploads/delete`               | Delete uploaded file        | Private                      | N/A               |

### File Upload Response Format (Corrected)

All file upload endpoints now return both `file_url` and `fileUrl` for compatibility:

```json
{
	"message": "File uploaded successfully",
	"file_url": "https://s3.amazonaws.com/bucket/path/filename.jpg",
	"fileUrl": "https://s3.amazonaws.com/bucket/path/filename.jpg",
	"fileName": "filename.jpg",
	"fileSize": 245760,
	"uploadedAt": "2024-01-15T16:00:00.000Z"
}
```

## Access Control Updates

### Current User Role Issues

- **Tourist users** cannot access provider/admin endpoints (403 Forbidden)
- **Role change requests** must be approved by system admins
- **File uploads** for tour content require provider/admin permissions

### Role Upgrade Process

1. Tourist submits role change request via `/api/role-change-requests`
2. System admin reviews and approves via `/api/role-change-requests/:id/process`
3. User gains provider/admin permissions
4. User can then access restricted endpoints and upload tour content

## Validation Schema Updates

### Tour Template Validation (Updated)

```javascript
{
  template_name: "string (required)",
  start_date: "date (required)",
  end_date: "date (required)",
  description: "string (optional, can be empty)",
  is_active: "boolean (optional)",
  duration_days: "number (optional)",
  features_image: "string uri (optional, can be empty)",
  features_media: {
    url: "string uri (optional, can be empty)",
    type: "string enum ['image', 'video'] (optional)",
    video_id: "string (optional)",
    duration: "number (optional)",
    embed_url: "string uri (optional)"
  },
  teaser_images: "array of string uris (optional)",
  qr_code_url: "string uri (optional)",
  qr_code_generated_at: "date (optional)",
  web_links: [
    {
      url: "string uri (required)",
      description: "string max 24 chars (optional, can be empty)"
    }
  ],
  created_by: "string ObjectId (optional)"
}
```

### Role Change Request Validation (Updated)

```javascript
{
  request_type: "string enum ['join_existing_provider', 'become_new_provider'] (required)",
  provider_id: "string ObjectId (required if joining existing)",
  proposed_provider_data: {
    provider_name: "string (required if becoming new)",
    country: "string (required if becoming new)",
    address: "string (required if becoming new)",
    phone_number: "string (required if becoming new)",
    email_address: "string email (required if becoming new)",
    corporate_tax_id: "string (optional, can be empty)",
    company_description: "string (optional, can be empty)",
    logo_url: "string uri (optional, can be empty)"
  },
  request_message: "string (optional)"
}
```
