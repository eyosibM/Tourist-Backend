const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const TourTemplate = require('../models/TourTemplate');

class BookingController {
  /**
   * Get user bookings
   */
  static async getUserBookings(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query = { tourist_id: req.user._id };
      
      if (status) query.status = status;

      const bookings = await Booking.find(query)
        .populate('tour_template_id', 'template_name description')
        .populate('custom_tour_id', 'tour_name start_date end_date')
        .populate('provider_id', 'provider_name')
        .sort({ booking_date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments(query);

      res.json({
        message: 'Bookings retrieved successfully',
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ error: 'Failed to retrieve bookings' });
    }
  }

  /**
   * Create new booking
   */
  static async createBooking(req, res) {
    try {
      const {
        availability_id,
        number_of_participants,
        contact_email,
        contact_phone,
        special_requests,
        participants
      } = req.body;

      // Get availability
      const availability = await Availability.findById(availability_id)
        .populate('tour_template_id');

      if (!availability) {
        return res.status(404).json({ error: 'Availability not found' });
      }

      if (!availability.is_available) {
        return res.status(400).json({ error: 'Tour is not available' });
      }

      if (availability.available_spots < number_of_participants) {
        return res.status(400).json({ error: 'Not enough available spots' });
      }

      // Calculate price
      const price_per_person = availability.calculatePrice(
        number_of_participants, 
        new Date()
      );
      const total_amount = price_per_person * number_of_participants;

      // Create booking
      const booking = new Booking({
        availability_id,
        tour_template_id: availability.tour_template_id._id,
        tourist_id: req.user._id,
        provider_id: availability.provider_id,
        booking_date: new Date(),
        tour_date: availability.date,
        number_of_participants,
        participants: participants || [],
        price_per_person,
        total_amount,
        contact_email,
        contact_phone,
        special_requests,
        // Denormalized fields
        tourist_name: `${req.user.first_name} ${req.user.last_name}`,
        tourist_email: req.user.email,
        tour_name: availability.tour_template_id.template_name,
        created_by: req.user._id
      });

      await booking.save();

      // Reserve spots in availability
      await availability.reserveSpots(number_of_participants);

      res.status(201).json({
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id)
        .populate('tour_template_id')
        .populate('custom_tour_id')
        .populate('provider_id', 'provider_name contact_email');

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check access permissions
      const isOwner = booking.tourist_id.toString() === req.user._id.toString();
      const isProvider = req.user.user_type === 'provider_admin' && 
                        booking.provider_id._id.toString() === req.user.provider_id.toString();
      const isAdmin = req.user.user_type === 'system_admin';

      if (!isOwner && !isProvider && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized to view this booking' });
      }

      res.json({
        message: 'Booking retrieved successfully',
        booking
      });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ error: 'Failed to retrieve booking' });
    }
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if user can cancel this booking
      if (booking.tourist_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to cancel this booking' });
      }

      if (['cancelled', 'completed', 'refunded'].includes(booking.status)) {
        return res.status(400).json({ error: 'Cannot cancel booking in current status' });
      }

      // Cancel booking
      await booking.cancel(req.user._id, reason);

      // Release spots in availability
      const availability = await Availability.findById(booking.availability_id);
      if (availability) {
        await availability.releaseSpots(booking.number_of_participants);
      }

      res.json({
        message: 'Booking cancelled successfully',
        booking
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  }

  /**
   * Check in booking (Provider only)
   */
  static async checkInBooking(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if provider owns this booking
      if (req.user.user_type === 'provider_admin' && 
          booking.provider_id.toString() !== req.user.provider_id.toString()) {
        return res.status(403).json({ error: 'Not authorized to check in this booking' });
      }

      if (booking.status !== 'confirmed' && booking.status !== 'paid') {
        return res.status(400).json({ error: 'Booking must be confirmed or paid to check in' });
      }

      await booking.checkIn(req.user._id);

      res.json({
        message: 'Booking checked in successfully',
        booking
      });
    } catch (error) {
      console.error('Check in booking error:', error);
      res.status(500).json({ error: 'Failed to check in booking' });
    }
  }

  /**
   * Get availability
   */
  static async getAvailability(req, res) {
    try {
      const { 
        tour_template_id, 
        provider_id, 
        start_date, 
        end_date 
      } = req.query;

      const query = { is_available: true };
      
      if (tour_template_id) query.tour_template_id = tour_template_id;
      if (provider_id) query.provider_id = provider_id;
      
      if (start_date || end_date) {
        query.date = {};
        if (start_date) query.date.$gte = new Date(start_date);
        if (end_date) query.date.$lte = new Date(end_date);
      }

      const availability = await Availability.find(query)
        .populate('tour_template_id', 'template_name description duration_days')
        .populate('provider_id', 'provider_name')
        .sort({ date: 1 });

      res.json({
        message: 'Availability retrieved successfully',
        data: availability
      });
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ error: 'Failed to retrieve availability' });
    }
  }

  /**
   * Create availability (Provider only)
   */
  static async createAvailability(req, res) {
    try {
      const {
        tour_template_id,
        date,
        total_capacity,
        base_price_per_person,
        time_slots,
        minimum_participants,
        maximum_participants,
        advance_booking_required_hours
      } = req.body;

      // Verify tour template exists and belongs to provider
      const tourTemplate = await TourTemplate.findById(tour_template_id);
      if (!tourTemplate) {
        return res.status(404).json({ error: 'Tour template not found' });
      }

      // Check if availability already exists for this date
      const existingAvailability = await Availability.findOne({
        tour_template_id,
        date: new Date(date)
      });

      if (existingAvailability) {
        return res.status(409).json({ error: 'Availability already exists for this date' });
      }

      const availability = new Availability({
        tour_template_id,
        provider_id: req.user.provider_id,
        date: new Date(date),
        day_of_week: new Date(date).toLocaleLowerCase().slice(0, 3) + 'day',
        total_capacity,
        available_spots: total_capacity,
        base_price_per_person,
        time_slots: time_slots || [],
        minimum_participants,
        maximum_participants,
        advance_booking_required_hours,
        // Denormalized fields
        tour_template_name: tourTemplate.template_name,
        created_by: req.user._id
      });

      await availability.save();

      res.status(201).json({
        message: 'Availability created successfully',
        availability
      });
    } catch (error) {
      console.error('Create availability error:', error);
      res.status(500).json({ error: 'Failed to create availability' });
    }
  }
}

module.exports = BookingController;