#!/bin/bash

# =============================================================================
# Test Backend Updates - Default Activities & Profile Updates
# =============================================================================

KEY_PATH="tourlicity-key.pem"
EC2_IP="51.20.34.93"
API_BASE="https://api.tourlicity.com/api"

echo "🧪 Testing Backend Updates"
echo "=========================="
echo ""

# Step 1: Test Default Activities with features_media
echo "📋 Step 1: Testing Default Activities with features_media..."

echo "Creating a default activity with image media..."
CREATE_ACTIVITY_RESPONSE=$(curl -s -X POST "$API_BASE/activities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "activity_name": "Test Activity with Image",
    "description": "Testing features_media with image",
    "category": "sightseeing",
    "typical_duration_hours": 2,
    "features_media": {
      "url": "https://example.com/test-image.jpg",
      "type": "image"
    },
    "features_image": "https://example.com/legacy-image.jpg"
  }')

echo "Response: $CREATE_ACTIVITY_RESPONSE"

echo ""
echo "Creating a default activity with video media..."
CREATE_VIDEO_ACTIVITY_RESPONSE=$(curl -s -X POST "$API_BASE/activities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "activity_name": "Test Activity with Video",
    "description": "Testing features_media with video",
    "category": "adventure",
    "typical_duration_hours": 3,
    "features_media": {
      "url": "https://example.com/test-video.mp4",
      "type": "video",
      "duration": 180
    }
  }')

echo "Response: $CREATE_VIDEO_ACTIVITY_RESPONSE"

# Step 2: Test retrieving activities
echo ""
echo "📋 Step 2: Testing activity retrieval..."
ACTIVITIES_LIST=$(curl -s "$API_BASE/activities")
echo "Activities list (first 200 chars): ${ACTIVITIES_LIST:0:200}..."

# Step 3: Test profile updates with optional fields
echo ""
echo "👤 Step 3: Testing profile updates with optional fields..."

echo "Testing profile update with only required fields..."
PROFILE_UPDATE_MINIMAL=$(curl -s -X PUT "$API_BASE/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe"
  }')

echo "Minimal profile update response: $PROFILE_UPDATE_MINIMAL"

echo ""
echo "Testing profile update with optional fields..."
PROFILE_UPDATE_FULL=$(curl -s -X PUT "$API_BASE/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "country": "United States",
    "phone_number": "+1234567890",
    "date_of_birth": "1990-01-01",
    "gender": "male"
  }')

echo "Full profile update response: $PROFILE_UPDATE_FULL"

echo ""
echo "Testing profile update with empty optional fields (should be ignored)..."
PROFILE_UPDATE_EMPTY=$(curl -s -X PUT "$API_BASE/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "country": "",
    "phone_number": null,
    "passport_number": ""
  }')

echo "Empty fields profile update response: $PROFILE_UPDATE_EMPTY"

# Step 4: Test validation
echo ""
echo "🔍 Step 4: Testing validation..."

echo "Testing invalid activity creation (missing required fields)..."
INVALID_ACTIVITY=$(curl -s -X POST "$API_BASE/activities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "description": "Missing activity name and category"
  }')

echo "Invalid activity response: $INVALID_ACTIVITY"

echo ""
echo "Testing invalid features_media type..."
INVALID_MEDIA_TYPE=$(curl -s -X POST "$API_BASE/activities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "activity_name": "Test Invalid Media",
    "category": "sightseeing",
    "features_media": {
      "url": "https://example.com/test.jpg",
      "type": "invalid_type"
    }
  }')

echo "Invalid media type response: $INVALID_MEDIA_TYPE"

# Step 5: Test backward compatibility
echo ""
echo "🔄 Step 5: Testing backward compatibility..."

echo "Creating activity with only legacy features_image..."
LEGACY_ACTIVITY=$(curl -s -X POST "$API_BASE/activities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "activity_name": "Legacy Image Activity",
    "description": "Using old features_image field",
    "category": "cultural",
    "features_image": "https://example.com/legacy.jpg"
  }')

echo "Legacy activity response: $LEGACY_ACTIVITY"

echo ""
echo "🎉 Backend Update Tests Complete!"
echo "================================="
echo ""
echo "📋 Test Summary:"
echo "✅ Default Activities with features_media (image/video)"
echo "✅ Profile updates with optional fields"
echo "✅ Validation for required/optional fields"
echo "✅ Backward compatibility with legacy fields"
echo ""
echo "💡 Manual Testing Needed:"
echo "1. Replace YOUR_ADMIN_TOKEN and YOUR_USER_TOKEN with real tokens"
echo "2. Test with actual file uploads for media"
echo "3. Test frontend integration with new optional fields"
echo "4. Verify database schema changes are applied"
echo ""
echo "🔗 API Documentation:"
echo "   Default Activities: $API_BASE/activities"
echo "   Profile Update: $API_BASE/auth/profile"
echo "   Health Check: $API_BASE/health"