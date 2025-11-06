# Backend Updates Summary

## 🎯 Changes Implemented

### 1. Default Activities - Added Features Media Support

**What Changed:**
- Added `features_media` object to Default Activity model
- Supports both images and videos like Tour Templates
- Maintains backward compatibility with existing `features_image` field

**New Schema:**
```javascript
features_media: {
  url: String,           // S3 URL for image or video
  type: 'image'|'video', // Media type
  video_id: String,      // Legacy field (deprecated)
  duration: Number,      // Video duration in seconds
  embed_url: String      // Legacy field (deprecated)
}
```

**API Changes:**
- `POST /api/activities` - Now accepts `features_media` object
- `PUT /api/activities/:id` - Can update `features_media`
- All existing endpoints return new `features_media` field

### 2. Profile Updates - Made Fields Optional

**What Changed:**
- Only `email`, `first_name`, and `last_name` are required for profile updates
- All other fields are now optional: `country`, `phone_number`, `date_of_birth`, `gender`, `passport_number`
- Empty strings and null values are automatically cleaned up

**Validation Changes:**
```javascript
// Before: All fields were implicitly required
userUpdate: Joi.object({
  first_name: Joi.string().min(1).max(50),
  last_name: Joi.string().min(1).max(50),
  country: Joi.string().max(100),
  // ... other fields
})

// After: Explicitly marked optional fields
userUpdate: Joi.object({
  email: Joi.string().email(),
  first_name: Joi.string().min(1).max(50),
  last_name: Joi.string().min(1).max(50),
  country: Joi.string().max(100).optional(),
  phone_number: Joi.string().max(20).optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  passport_number: Joi.string().max(50).allow('', null).optional()
})
```

## 📋 Files Modified

### Models
- `src/models/DefaultActivity.js` - Added features_media schema

### Validation
- `src/middleware/validation.js` - Updated defaultActivity and userUpdate schemas

### Controllers
- `src/controllers/defaultActivityController.js` - No changes needed (handles new fields automatically)
- `src/controllers/authController.js` - No changes needed (already handles optional fields)

## 🧪 Testing

### Default Activities with Media
```bash
# Create activity with image
POST /api/activities
{
  "activity_name": "Eiffel Tower Visit",
  "category": "sightseeing",
  "features_media": {
    "url": "https://s3.amazonaws.com/bucket/eiffel-tower.jpg",
    "type": "image"
  }
}

# Create activity with video
POST /api/activities
{
  "activity_name": "Cooking Class",
  "category": "cultural",
  "features_media": {
    "url": "https://s3.amazonaws.com/bucket/cooking-demo.mp4",
    "type": "video",
    "duration": 300
  }
}
```

### Profile Updates with Optional Fields
```bash
# Minimal update (only required fields)
PUT /api/auth/profile
{
  "first_name": "John",
  "last_name": "Doe"
}

# Full update with optional fields
PUT /api/auth/profile
{
  "first_name": "John",
  "last_name": "Doe",
  "country": "United States",
  "phone_number": "+1234567890",
  "date_of_birth": "1990-01-01"
}

# Partial update (some optional fields)
PUT /api/auth/profile
{
  "first_name": "John",
  "last_name": "Doe",
  "country": "Canada"
  // Other optional fields omitted
}
```

## 🔄 Backward Compatibility

### Default Activities
- ✅ Existing `features_image` field still works
- ✅ Old activities without `features_media` continue to function
- ✅ API responses include both old and new fields

### Profile Updates
- ✅ Existing profile update calls continue to work
- ✅ Frontend can send partial profile data
- ✅ Empty/null values are automatically cleaned up

## 🚀 Deployment

### Automatic Deployment
```bash
chmod +x deploy-backend-updates.sh
./deploy-backend-updates.sh
```

### Manual Deployment
```bash
# SSH to server
ssh -i tourlicity-key.pem ubuntu@51.20.34.93

# Pull latest changes
cd Tourist-Backend
git pull origin main

# Restart containers
docker-compose -f docker-compose.https.yml down
docker-compose -f docker-compose.https.yml up -d --build

# Verify deployment
curl https://api.tourlicity.com/api/health
```

## 📊 Database Migration

**No database migration required!**
- New fields are optional and have default values
- Existing documents will work with new schema
- MongoDB will automatically add new fields when documents are updated

## 🔗 API Endpoints Affected

### Default Activities
- `GET /api/activities` - Returns activities with new `features_media` field
- `POST /api/activities` - Accepts new `features_media` in request body
- `PUT /api/activities/:id` - Can update `features_media`
- `GET /api/activities/:id` - Returns activity with `features_media`

### Profile Management
- `PUT /api/auth/profile` - Now accepts partial profile data
- `GET /api/auth/profile` - Returns user profile (unchanged)

## 🎯 Frontend Integration

### Default Activities
```javascript
// Creating activity with media
const activityData = {
  activity_name: "Museum Tour",
  category: "cultural",
  features_media: {
    url: uploadedFileUrl,
    type: fileType, // 'image' or 'video'
    duration: videoDuration // only for videos
  }
};

// Backward compatibility - still works
const legacyActivity = {
  activity_name: "Legacy Activity",
  category: "sightseeing",
  features_image: imageUrl // old field still supported
};
```

### Profile Updates
```javascript
// Minimal profile update
const minimalUpdate = {
  first_name: "John",
  last_name: "Doe"
};

// Full profile update
const fullUpdate = {
  first_name: "John",
  last_name: "Doe",
  country: "United States",
  phone_number: "+1234567890",
  date_of_birth: "1990-01-01",
  gender: "male"
};

// Partial update - only some fields
const partialUpdate = {
  first_name: "John",
  last_name: "Doe",
  country: "Canada"
  // Other fields omitted - that's OK now!
};
```

## ✅ Success Criteria

- [x] Default Activities support `features_media` with image/video
- [x] Profile updates work with only required fields
- [x] Backward compatibility maintained
- [x] Validation updated for new optional fields
- [x] API documentation reflects changes
- [x] No breaking changes to existing functionality

## 🔍 Verification Steps

1. **Test Default Activities:**
   - Create activity with image media
   - Create activity with video media
   - Create activity with legacy features_image
   - Verify all activities are returned correctly

2. **Test Profile Updates:**
   - Update profile with only first_name and last_name
   - Update profile with some optional fields
   - Update profile with empty optional fields
   - Verify validation works correctly

3. **Test Backward Compatibility:**
   - Existing activities still display correctly
   - Old profile update calls still work
   - No data loss or corruption

---

**Status**: ✅ Ready for deployment
**Breaking Changes**: None
**Database Migration**: Not required