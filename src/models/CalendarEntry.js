const mongoose = require('mongoose');

const calendarEntrySchema = new mongoose.Schema({
    tour_template_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TourTemplate'
    },
    custom_tour_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomTour'
    },
    entry_date: {
        type: String, // Store as YYYY-MM-DD string to avoid timezone issues
        required: true
    },
    activity: {
        type: String,
        required: true
    },
    activity_description: String,
    activity_details: String,
    features_media: {
        url: {
            type: String, // URL to the media (S3 for all media files)
            default: null
        },
        type: {
            type: String,
            enum: ['image', 'video'],
            default: 'image'
        },
        duration: {
            type: Number, // Video duration in seconds (only for videos)
            default: null
        }
    },
    // Keep legacy field for backward compatibility
    featured_image: {
        type: String, // URL to featured image in S3 (deprecated - use features_media)
        default: null
    },
    featured_image_uploaded_at: {
        type: Date,
        default: null
    },
    web_links: [String],
    start_time: String, // HH:MM format
    end_time: String,   // HH:MM format
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

module.exports = mongoose.model('CalendarEntry', calendarEntrySchema);