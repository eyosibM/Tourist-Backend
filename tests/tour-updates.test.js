const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Provider = require('../src/models/Provider');
const TourTemplate = require('../src/models/TourTemplate');
const CustomTour = require('../src/models/CustomTour');
const TourUpdate = require('../src/models/TourUpdate');
const Registration = require('../src/models/Registration');

describe('Tour Updates API', () => {
  let systemAdminToken, providerAdminToken, touristToken;
  let systemAdmin, providerAdmin, tourist;
  let provider, tourTemplate, customTour;

  beforeAll(async () => {
    // Create test users
    systemAdmin = await User.create({
      email: 'system@test.com',
      first_name: 'System',
      last_name: 'Admin',
      user_type: 'system_admin',
      is_active: true
    });

    provider = await Provider.create({
      provider_name: 'Test Provider',
      provider_code: 'TEST001',
      country: 'Test Country',
      is_active: true
    });

    providerAdmin = await User.create({
      email: 'provider@test.com',
      first_name: 'Provider',
      last_name: 'Admin',
      user_type: 'provider_admin',
      provider_id: provider._id,
      is_active: true
    });

    tourist = await User.create({
      email: 'tourist@test.com',
      first_name: 'Test',
      last_name: 'Tourist',
      user_type: 'tourist',
      is_active: true
    });

    // Create tour template and custom tour
    tourTemplate = await TourTemplate.create({
      template_name: 'Test Tour Template',
      provider_id: provider._id,
      duration_days: 5,
      max_participants: 20,
      is_active: true
    });

    customTour = await CustomTour.create({
      provider_id: provider._id,
      tour_template_id: tourTemplate._id,
      tour_name: 'Test Custom Tour',
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-06-05'),
      max_participants: 15,
      is_active: true
    });

    // Create registration for tourist
    await Registration.create({
      custom_tour_id: customTour._id,
      tourist_id: tourist._id,
      status: 'approved',
      registration_date: new Date()
    });

    // Generate tokens
    systemAdminToken = systemAdmin.generateAuthToken();
    providerAdminToken = providerAdmin.generateAuthToken();
    touristToken = tourist.generateAuthToken();
  });

  afterAll(async () => {
    // Clean up test data
    await TourUpdate.deleteMany({});
    await Registration.deleteMany({});
    await CustomTour.deleteMany({});
    await TourTemplate.deleteMany({});
    await Provider.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/tour-updates', () => {
    test('should create tour update as system admin', async () => {
      const updateData = {
        custom_tour_id: customTour._id.toString(),
        update_title: 'Important Tour Update',
        update_content: 'This is an important update about your tour.',
        update_type: 'announcement',
        is_published: false
      };

      const response = await request(app)
        .post('/api/tour-updates')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .send(updateData)
        .expect(201);

      expect(response.body.update).toBeDefined();
      expect(response.body.update.update_title).toBe(updateData.update_title);
      expect(response.body.update.update_content).toBe(updateData.update_content);
      expect(response.body.update.update_type).toBe(updateData.update_type);
      expect(response.body.update.is_published).toBe(false);
      expect(response.body.update.created_by.email).toBe(systemAdmin.email);
    });

    test('should create tour update as provider admin', async () => {
      const updateData = {
        custom_tour_id: customTour._id.toString(),
        update_title: 'Provider Update',
        update_content: 'Update from the tour provider.',
        update_type: 'itinerary_change',
        is_published: true
      };

      const response = await request(app)
        .post('/api/tour-updates')
        .set('Authorization', `Bearer ${providerAdminToken}`)
        .send(updateData)
        .expect(201);

      expect(response.body.update).toBeDefined();
      expect(response.body.update.update_title).toBe(updateData.update_title);
      expect(response.body.update.is_published).toBe(true);
      expect(response.body.update.published_date).toBeDefined();
    });

    test('should reject tour update creation by tourist', async () => {
      const updateData = {
        custom_tour_id: customTour._id.toString(),
        update_title: 'Tourist Update',
        update_content: 'This should not be allowed.',
        update_type: 'general'
      };

      await request(app)
        .post('/api/tour-updates')
        .set('Authorization', `Bearer ${touristToken}`)
        .send(updateData)
        .expect(403);
    });

    test('should reject tour update with missing required fields', async () => {
      const updateData = {
        custom_tour_id: customTour._id.toString(),
        update_title: 'Missing Content'
        // Missing update_content
      };

      await request(app)
        .post('/api/tour-updates')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('GET /api/tour-updates', () => {
    let tourUpdate1, tourUpdate2;

    beforeAll(async () => {
      // Create test tour updates
      tourUpdate1 = await TourUpdate.create({
        custom_tour_id: customTour._id,
        update_title: 'First Update',
        update_content: 'First update content',
        update_type: 'announcement',
        is_published: true,
        published_date: new Date(),
        created_by: systemAdmin._id
      });

      tourUpdate2 = await TourUpdate.create({
        custom_tour_id: customTour._id,
        update_title: 'Second Update',
        update_content: 'Second update content',
        update_type: 'itinerary_change',
        is_published: false,
        created_by: providerAdmin._id
      });
    });

    test('should get all tour updates', async () => {
      const response = await request(app)
        .get('/api/tour-updates')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.updates).toBeDefined();
      expect(Array.isArray(response.body.updates)).toBe(true);
      expect(response.body.updates.length).toBeGreaterThanOrEqual(2);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
    });

    test('should filter tour updates by tour ID', async () => {
      const response = await request(app)
        .get(`/api/tour-updates?custom_tour_id=${customTour._id}`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.updates).toBeDefined();
      expect(response.body.updates.every(update => 
        update.custom_tour_id._id === customTour._id.toString()
      )).toBe(true);
    });

    test('should filter tour updates by published status', async () => {
      const response = await request(app)
        .get('/api/tour-updates?is_published=true')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.updates).toBeDefined();
      expect(response.body.updates.every(update => update.is_published === true)).toBe(true);
    });

    test('should search tour updates by title', async () => {
      const response = await request(app)
        .get('/api/tour-updates?search=First')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.updates).toBeDefined();
      expect(response.body.updates.some(update => 
        update.update_title.includes('First')
      )).toBe(true);
    });
  });

  describe('GET /api/tour-updates/tour/:tourId', () => {
    test('should get tour updates for specific tour', async () => {
      const response = await request(app)
        .get(`/api/tour-updates/tour/${customTour._id}`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.updates).toBeDefined();
      expect(Array.isArray(response.body.updates)).toBe(true);
      expect(response.body.updates.every(update => 
        update.custom_tour_id._id === customTour._id.toString()
      )).toBe(true);
    });

    test('should return 404 for non-existent tour', async () => {
      const nonExistentTourId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/tour-updates/tour/${nonExistentTourId}`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/tour-updates/:id/publish', () => {
    let unpublishedUpdate;

    beforeEach(async () => {
      unpublishedUpdate = await TourUpdate.create({
        custom_tour_id: customTour._id,
        update_title: 'Unpublished Update',
        update_content: 'This update is not yet published',
        update_type: 'general',
        is_published: false,
        created_by: systemAdmin._id
      });
    });

    afterEach(async () => {
      await TourUpdate.findByIdAndDelete(unpublishedUpdate._id);
    });

    test('should publish tour update', async () => {
      const response = await request(app)
        .patch(`/api/tour-updates/${unpublishedUpdate._id}/publish`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.update).toBeDefined();
      expect(response.body.update.is_published).toBe(true);
      expect(response.body.update.published_date).toBeDefined();
    });

    test('should reject publishing already published update', async () => {
      // First publish the update
      await TourUpdate.findByIdAndUpdate(unpublishedUpdate._id, {
        is_published: true,
        published_date: new Date()
      });

      await request(app)
        .patch(`/api/tour-updates/${unpublishedUpdate._id}/publish`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/tour-updates/:id', () => {
    let updateToDelete;

    beforeEach(async () => {
      updateToDelete = await TourUpdate.create({
        custom_tour_id: customTour._id,
        update_title: 'Update to Delete',
        update_content: 'This update will be deleted',
        update_type: 'general',
        is_published: false,
        created_by: systemAdmin._id
      });
    });

    test('should delete tour update', async () => {
      await request(app)
        .delete(`/api/tour-updates/${updateToDelete._id}`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      // Verify update is deleted
      const deletedUpdate = await TourUpdate.findById(updateToDelete._id);
      expect(deletedUpdate).toBeNull();
    });

    test('should return 404 for non-existent update', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/tour-updates/${nonExistentId}`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(404);
    });
  });
});