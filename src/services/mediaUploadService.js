const ImageUploadService = require('./imageUploadService');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MediaUploadService {
    /**
     * Create multer middleware for media upload (images and videos)
     * @param {string} folder - Upload folder
     * @param {Object} options - Upload options
     * @returns {Object} - Multer middleware
     */
    static createMediaUploadMiddleware(folder = 'media', options = {}) {
        const {
            allowImages = true,
            allowVideos = true,
            allowDocuments = false,
            maxImageSize = 5 * 1024 * 1024, // 5MB
            maxVideoSize = 100 * 1024 * 1024, // 100MB
            maxDocumentSize = 10 * 1024 * 1024, // 10MB
            imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            videoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'],
            documentTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        } = options;

        const allowedTypes = [];
        if (allowImages) allowedTypes.push(...imageTypes);
        if (allowVideos) allowedTypes.push(...videoTypes);
        if (allowDocuments) allowedTypes.push(...documentTypes);

        const upload = multer({
            storage: multer.memoryStorage(),
            fileFilter: function (req, file, cb) {
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
                }
            },
            limits: {
                fileSize: Math.max(maxImageSize, maxVideoSize, maxDocumentSize || 0)
            }
        });

        return upload;
    }

    /**
     * Upload media file (images and videos to S3)
     * @param {Object} file - Multer file object
     * @param {Object} metadata - Media metadata
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} - Upload result
     */
    static async uploadMedia(file, metadata = {}, options = {}) {
        try {
            const { title, description, folder = 'media' } = metadata;

            // Determine if file is image, video, or document
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            const isDocument = file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/');

            if (isImage) {
                return await this.uploadImage(file, { title, description, folder });
            } else if (isVideo) {
                // Upload video to S3
                return await this.uploadVideoToS3(file, { title, description, folder });
            } else if (isDocument) {
                // Upload document to S3
                return await this.uploadDocumentToS3(file, { title, description, folder });
            } else {
                throw new Error('Unsupported file type');
            }
        } catch (error) {
            console.error('Media upload error:', error);
            throw error;
        }
    }

    /**
     * Upload image to S3
     * @param {Object} file - Multer file object
     * @param {Object} metadata - Image metadata
     * @returns {Promise<Object>} - Upload result
     */
    static async uploadImage(file, metadata = {}) {
        try {
            const { title, description, folder = 'images' } = metadata;

            // Validate image
            const validation = ImageUploadService.validateImage(file);
            if (!validation.isValid) {
                throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
            }

            // Upload to S3
            const imageUrl = await ImageUploadService.uploadImageBuffer(
                file.buffer,
                file.originalname,
                folder,
                file.mimetype
            );

            return {
                success: true,
                type: 'image',
                url: imageUrl,
                title: title || file.originalname,
                description: description || '',
                size: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }



    /**
     * Upload video to S3
     * @param {Object} file - Multer file object
     * @param {Object} metadata - Video metadata
     * @returns {Promise<Object>} - Upload result
     */
    static async uploadVideoToS3(file, metadata = {}) {
        try {
            const { title, description, folder = 'videos' } = metadata;

            // Upload video file to S3
            const videoUrl = await ImageUploadService.uploadImageBuffer(
                file.buffer,
                file.originalname,
                folder,
                file.mimetype
            );

            return {
                success: true,
                type: 'video',
                url: videoUrl,
                title: title || file.originalname,
                description: description || '',
                size: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Video S3 upload error:', error);
            throw error;
        }
    }

    /**
     * Upload document to S3
     * @param {Object} file - Multer file object
     * @param {Object} metadata - Document metadata
     * @returns {Promise<Object>} - Upload result
     */
    static async uploadDocumentToS3(file, metadata = {}) {
        try {
            const { title, description, folder = 'documents' } = metadata;

            // Upload document file to S3
            const documentUrl = await ImageUploadService.uploadImageBuffer(
                file.buffer,
                file.originalname,
                folder,
                file.mimetype
            );

            return {
                success: true,
                type: 'document',
                url: documentUrl,
                title: title || file.originalname,
                description: description || '',
                size: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Document S3 upload error:', error);
            throw error;
        }
    }

    /**
     * Delete media (images and videos from S3)
     * @param {Object} mediaInfo - Media information
     * @returns {Promise<boolean>} - Success status
     */
    static async deleteMedia(mediaInfo) {
        try {
            if (!mediaInfo || !mediaInfo.url) {
                return false;
            }

            // All media (images and videos) are stored in S3
            return await ImageUploadService.deleteImage(mediaInfo.url);
        } catch (error) {
            console.error('Media deletion error:', error);
            return false;
        }
    }

    /**
     * Update features media for tour/template
     * @param {Object} model - Mongoose model instance
     * @param {Object} uploadResult - Upload result from uploadMedia
     * @returns {Object} - Updated model
     */
    static updateFeaturesMedia(model, uploadResult) {
        if (!uploadResult || !uploadResult.success) {
            return model;
        }

        // Update features_media object
        model.features_media = {
            url: uploadResult.url,
            type: uploadResult.type
        };

        // Keep backward compatibility with features_image
        if (uploadResult.type === 'image') {
            model.features_image = uploadResult.url;
        }

        return model;
    }

    /**
     * Get media preview URL for display
     * @param {Object} featuresMedia - Features media object
     * @returns {string} - Preview URL
     */
    static getPreviewUrl(featuresMedia) {
        if (!featuresMedia || !featuresMedia.url) {
            return null;
        }

        // Return the S3 URL directly for both images and videos
        return featuresMedia.url;
    }

    /**
     * Get embed HTML for media
     * @param {Object} featuresMedia - Features media object
     * @param {Object} options - Embed options
     * @returns {string} - HTML embed code
     */
    static getEmbedHtml(featuresMedia, options = {}) {
        if (!featuresMedia || !featuresMedia.url) {
            return '';
        }

        const { width = 560, height = 315, autoplay = false } = options;

        if (featuresMedia.type === 'video') {
            const autoplayAttr = autoplay ? 'autoplay' : '';
            return `<video width="${width}" height="${height}" controls ${autoplayAttr}>
                <source src="${featuresMedia.url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>`;
        } else if (featuresMedia.type === 'image') {
            return `<img src="${featuresMedia.url}" alt="Featured media" style="max-width: ${width}px; max-height: ${height}px;" />`;
        }

        return '';
    }

    /**
     * Validate media file before upload
     * @param {Object} file - Multer file object
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    static validateMediaFile(file, options = {}) {
        const {
            allowImages = true,
            allowVideos = true,
            allowDocuments = false,
            maxImageSize = 5 * 1024 * 1024, // 5MB
            maxVideoSize = 100 * 1024 * 1024, // 100MB
            maxDocumentSize = 10 * 1024 * 1024, // 10MB
            imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            videoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'],
            documentTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        } = options;

        const errors = [];
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        const isDocument = file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/');

        // Check file type
        if (isImage && !allowImages) {
            errors.push('Image uploads are not allowed');
        } else if (isVideo && !allowVideos) {
            errors.push('Video uploads are not allowed');
        } else if (isDocument && !allowDocuments) {
            errors.push('Document uploads are not allowed');
        } else if (isImage && !imageTypes.includes(file.mimetype)) {
            errors.push(`Invalid image type. Allowed types: ${imageTypes.join(', ')}`);
        } else if (isVideo && !videoTypes.includes(file.mimetype)) {
            errors.push(`Invalid video type. Allowed types: ${videoTypes.join(', ')}`);
        } else if (isDocument && !documentTypes.includes(file.mimetype)) {
            errors.push(`Invalid document type. Allowed types: ${documentTypes.join(', ')}`);
        } else if (!isImage && !isVideo && !isDocument) {
            errors.push('File must be an image, video, or document');
        }

        // Check file size
        if (isImage && file.size > maxImageSize) {
            errors.push(`Image too large. Maximum size: ${maxImageSize / (1024 * 1024)}MB`);
        } else if (isVideo && file.size > maxVideoSize) {
            errors.push(`Video too large. Maximum size: ${maxVideoSize / (1024 * 1024)}MB`);
        } else if (isDocument && file.size > maxDocumentSize) {
            errors.push(`Document too large. Maximum size: ${maxDocumentSize / (1024 * 1024)}MB`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            type: isImage ? 'image' : isVideo ? 'video' : isDocument ? 'document' : 'unknown'
        };
    }
}

module.exports = MediaUploadService;