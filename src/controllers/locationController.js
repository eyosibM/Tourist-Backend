const Location = require('../models/Location');
const TourLocation = require('../models/TourLocation');
const TourTemplate = require('../models/TourTemplate');
const CustomTour = require('../models/CustomTour');

class LocationController {
  /**
   * Search locations with various filters
   */
  static async searchLocations(req, res) {
    try {
      const {
        search,
        type,
        country,
        lat,
        lng,
        radius = 10,
        page = 1,
        limit = 20
      } = req.query;

      let query = { is_active: true };

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Type filter
      if (type) {
        query.type = type;
      }

      // Country filter
      if (country) {
        query['address.country'] = new RegExp(country, 'i');
      }

      // Nearby search
      if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusInRadians = parseFloat(radius) / 6371; // Earth radius in km

        query['coordinates.latitude'] = {
          $gte: latitude - radiusInRadians,
          $lte: latitude + radiusInRadians
        };
        query['coordinates.longitude'] = {
          $gte: longitude - radiusInRadians,
          $lte: longitude + radiusInRadians
        };
      }

      const locations = await Location.find(query)
        .select('-google_place_id -foursquare_id -tripadvisor_id')
        .sort(search ? { score: { $meta: 'textScore' } } : { popularity_score: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Location.countDocuments(query);

      res.json({
        message: 'Locations retrieved successfully',
        data: locations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Search locations error:', error);
      res.status(500).json({ error: 'Failed to search locations' });
    }
  }

  /**
   * Create new location
   */
  static async createLocation(req, res) {
    try {
      const {
        name,
        description,
        type,
        coordinates,
        address,
        contact,
        operating_hours,
        pricing,
        images,
        categories,
        tags
      } = req.body;

      const location = new Location({
        name,
        description,
        type,
        coordinates,
        address,
        contact,
        operating_hours,
        pricing,
        images: images || [],
        categories: categories || [],
        tags: tags || [],
        created_by: req.user._id
      });

      await location.save();

      res.status(201).json({
        message: 'Location created successfully',
        location
      });
    } catch (error) {
      console.error('Create location error:', error);
      res.status(500).json({ error: 'Failed to create location' });
    }
  }

  /**
   * Get location by ID
   */
  static async getLocationById(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findById(id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      // Increment visit count
      location.visit_count += 1;
      await location.save();

      res.json({
        message: 'Location retrieved successfully',
        location
      });
    } catch (error) {
      console.error('Get location error:', error);
      res.status(500).json({ error: 'Failed to retrieve location' });
    }
  }

  /**
   * Update location
   */
  static async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const location = await Location.findByIdAndUpdate(
        id,
        { ...updates, updated_date: new Date() },
        { new: true, runValidators: true }
      );

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({
        message: 'Location updated successfully',
        location
      });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  }

  /**
   * Get locations for a tour
   */
  static async getTourLocations(req, res) {
    try {
      const { tourId } = req.params;
      const { type = 'custom' } = req.query;

      const query = type === 'template' 
        ? { tour_template_id: tourId }
        : { custom_tour_id: tourId };

      const tourLocations = await TourLocation.find(query)
        .populate('location_id')
        .sort({ day_number: 1, visit_order: 1 });

      res.json({
        message: 'Tour locations retrieved successfully',
        data: tourLocations
      });
    } catch (error) {
      console.error('Get tour locations error:', error);
      res.status(500).json({ error: 'Failed to retrieve tour locations' });
    }
  }

  /**
   * Add location to tour
   */
  static async addLocationToTour(req, res) {
    try {
      const { tourId } = req.params;
      const {
        location_id,
        visit_order,
        day_number,
        activity_type,
        planned_arrival_time,
        planned_departure_time,
        activity_description,
        special_instructions,
        tour_type = 'custom'
      } = req.body;

      // Verify tour exists and user has permission
      let tour;
      if (tour_type === 'template') {
        tour = await TourTemplate.findById(tourId);
      } else {
        tour = await CustomTour.findById(tourId);
        
        // Check if user owns this tour
        if (req.user.user_type === 'provider_admin' && 
            tour.provider_id.toString() !== req.user.provider_id.toString()) {
          return res.status(403).json({ error: 'Not authorized to modify this tour' });
        }
      }

      if (!tour) {
        return res.status(404).json({ error: 'Tour not found' });
      }

      // Verify location exists
      const location = await Location.findById(location_id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const tourLocation = new TourLocation({
        [tour_type === 'template' ? 'tour_template_id' : 'custom_tour_id']: tourId,
        location_id,
        visit_order,
        day_number,
        activity_type,
        planned_arrival_time,
        planned_departure_time,
        activity_description,
        special_instructions,
        // Denormalized fields
        location_name: location.name,
        location_address: location.address.formatted_address,
        location_coordinates: location.coordinates,
        created_by: req.user._id
      });

      await tourLocation.save();

      res.status(201).json({
        message: 'Location added to tour successfully',
        tourLocation
      });
    } catch (error) {
      console.error('Add location to tour error:', error);
      res.status(500).json({ error: 'Failed to add location to tour' });
    }
  }
}

module.exports = LocationController;