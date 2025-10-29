const TourReview = require('../models/TourReview');
const ProviderRating = require('../models/ProviderRating');
const Registration = require('../models/Registration');
const CustomTour = require('../models/CustomTour');

class ReviewController {
  /**
   * Get reviews with filtering and pagination
   */
  static async getReviews(req, res) {
    try {
      const { 
        tour_id, 
        provider_id, 
        page = 1, 
        limit = 10,
        status = 'approved'
      } = req.query;

      const query = { status };
      
      if (tour_id) query.custom_tour_id = tour_id;
      if (provider_id) query.provider_id = provider_id;

      const reviews = await TourReview.find(query)
        .populate('tourist_id', 'first_name last_name profile_picture')
        .populate('custom_tour_id', 'tour_name start_date end_date')
        .populate('provider_id', 'provider_name')
        .sort({ created_date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await TourReview.countDocuments(query);

      res.json({
        message: 'Reviews retrieved successfully',
        data: reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ error: 'Failed to retrieve reviews' });
    }
  }

  /**
   * Create a new review
   */
  static async createReview(req, res) {
    try {
      const {
        custom_tour_id,
        registration_id,
        overall_rating,
        organization_rating,
        communication_rating,
        value_rating,
        experience_rating,
        title,
        review_text,
        pros,
        cons
      } = req.body;

      // Verify registration belongs to user and tour is completed
      const registration = await Registration.findOne({
        _id: registration_id,
        tourist_id: req.user._id,
        custom_tour_id,
        status: 'approved'
      }).populate('custom_tour_id');

      if (!registration) {
        return res.status(404).json({ error: 'Valid registration not found' });
      }

      // Check if tour has ended
      const tour = registration.custom_tour_id;
      if (new Date() < tour.end_date) {
        return res.status(400).json({ error: 'Cannot review tour before it ends' });
      }

      // Check if review already exists
      const existingReview = await TourReview.findOne({
        custom_tour_id,
        tourist_id: req.user._id
      });

      if (existingReview) {
        return res.status(409).json({ error: 'Review already exists for this tour' });
      }

      const review = new TourReview({
        custom_tour_id,
        registration_id,
        tourist_id: req.user._id,
        provider_id: tour.provider_id,
        overall_rating,
        organization_rating,
        communication_rating,
        value_rating,
        experience_rating,
        title,
        review_text,
        pros: pros || [],
        cons: cons || [],
        // Denormalized fields
        tourist_name: `${req.user.first_name} ${req.user.last_name}`,
        tourist_profile_picture: req.user.profile_picture,
        tour_name: tour.tour_name,
        tour_start_date: tour.start_date,
        tour_end_date: tour.end_date,
        created_by: req.user._id
      });

      await review.save();

      // Update provider rating
      await this.updateProviderRating(tour.provider_id);

      res.status(201).json({
        message: 'Review created successfully',
        review
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }

  /**
   * Get review by ID
   */
  static async getReviewById(req, res) {
    try {
      const { id } = req.params;

      const review = await TourReview.findById(id)
        .populate('tourist_id', 'first_name last_name profile_picture')
        .populate('custom_tour_id', 'tour_name start_date end_date')
        .populate('provider_id', 'provider_name');

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({
        message: 'Review retrieved successfully',
        review
      });
    } catch (error) {
      console.error('Get review error:', error);
      res.status(500).json({ error: 'Failed to retrieve review' });
    }
  }

  /**
   * Moderate review (Admin only)
   */
  static async moderateReview(req, res) {
    try {
      const { id } = req.params;
      const { status, moderation_notes } = req.body;

      const review = await TourReview.findById(id);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      review.status = status;
      review.moderation_notes = moderation_notes;
      review.moderated_by = req.user._id;
      review.moderated_at = new Date();

      await review.save();

      // Update provider rating after moderation
      await this.updateProviderRating(review.provider_id);

      res.json({
        message: 'Review moderated successfully',
        review
      });
    } catch (error) {
      console.error('Moderate review error:', error);
      res.status(500).json({ error: 'Failed to moderate review' });
    }
  }

  /**
   * Provider response to review
   */
  static async respondToReview(req, res) {
    try {
      const { id } = req.params;
      const { response_text } = req.body;

      const review = await TourReview.findById(id);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check if provider owns this review
      if (review.provider_id.toString() !== req.user.provider_id.toString()) {
        return res.status(403).json({ error: 'Not authorized to respond to this review' });
      }

      review.provider_response = {
        response_text,
        responded_by: req.user._id,
        responded_at: new Date()
      };

      await review.save();

      res.json({
        message: 'Response added successfully',
        review
      });
    } catch (error) {
      console.error('Respond to review error:', error);
      res.status(500).json({ error: 'Failed to add response' });
    }
  }

  /**
   * Get provider rating summary
   */
  static async getProviderRating(req, res) {
    try {
      const { providerId } = req.params;

      let rating = await ProviderRating.findOne({ provider_id: providerId });
      
      if (!rating) {
        // Create initial rating record
        rating = new ProviderRating({
          provider_id: providerId,
          created_by: req.user?._id
        });
        await rating.save();
      }

      // Recalculate if data is stale (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (rating.last_calculated < oneHourAgo) {
        await rating.recalculateRatings();
      }

      res.json({
        message: 'Provider rating retrieved successfully',
        rating
      });
    } catch (error) {
      console.error('Get provider rating error:', error);
      res.status(500).json({ error: 'Failed to retrieve provider rating' });
    }
  }

  /**
   * Update provider rating (internal method)
   */
  static async updateProviderRating(providerId) {
    try {
      let rating = await ProviderRating.findOne({ provider_id: providerId });
      
      if (!rating) {
        rating = new ProviderRating({ provider_id: providerId });
      }

      await rating.recalculateRatings();
    } catch (error) {
      console.error('Update provider rating error:', error);
    }
  }
}

module.exports = ReviewController;