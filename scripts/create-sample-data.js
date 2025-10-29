/**
 * Create Sample Data Script
 * Creates sample providers, tour templates, and custom tours for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Provider = require('../src/models/Provider');
const TourTemplate = require('../src/models/TourTemplate');
const CustomTour = require('../src/models/CustomTour');
const User = require('../src/models/User');

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if sample data already exists
    const existingProviders = await Provider.countDocuments();
    if (existingProviders > 0) {
      console.log('📋 Sample data already exists. Skipping creation.');
      console.log(`   Found ${existingProviders} providers`);
      
      const tourTemplates = await TourTemplate.countDocuments();
      const customTours = await CustomTour.countDocuments();
      console.log(`   Found ${tourTemplates} tour templates`);
      console.log(`   Found ${customTours} custom tours`);
      
      process.exit(0);
    }

    console.log('🏗️  Creating sample data...');

    // Create sample providers
    const providers = await Provider.insertMany([
      {
        provider_name: 'Amazing Adventures Ltd',
        provider_code: 'AMAZAD01',
        country: 'United States',
        address: '123 Adventure Street, New York, NY 10001',
        phone_number: '+1-555-0123',
        email_address: 'contact@amazingadventures.com',
        company_description: 'We specialize in adventure tourism and cultural experiences.',
        is_active: true
      },
      {
        provider_name: 'European Tours Co',
        provider_code: 'EUROTO02',
        country: 'France',
        address: '456 Tourism Avenue, Paris, 75001',
        phone_number: '+33-1-23-45-67-89',
        email_address: 'info@europeantours.fr',
        company_description: 'Premium European cultural and historical tours.',
        is_active: true
      },
      {
        provider_name: 'Asia Explorer',
        provider_code: 'ASIAEX03',
        country: 'Japan',
        address: '789 Explorer Road, Tokyo, 100-0001',
        phone_number: '+81-3-1234-5678',
        email_address: 'hello@asiaexplorer.jp',
        company_description: 'Authentic Asian cultural immersion experiences.',
        is_active: true
      }
    ]);

    console.log(`✅ Created ${providers.length} providers`);

    // Create sample tour templates
    const templates = await TourTemplate.insertMany([
      {
        template_name: 'Paris City Explorer',
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-06-07'),
        description: 'Explore the beautiful city of Paris with guided tours to iconic landmarks including the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral.',
        features_image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800',
        teaser_images: [
          'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
          'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400',
          'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400'
        ],
        web_links: [
          { url: 'https://paristourism.com', description: 'Official Paris Tourism' },
          { url: 'https://louvre.fr', description: 'Louvre Museum' }
        ],
        is_active: true
      },
      {
        template_name: 'Tokyo Cultural Journey',
        start_date: new Date('2024-07-15'),
        end_date: new Date('2024-07-22'),
        description: 'Immerse yourself in Japanese culture with visits to traditional temples, modern districts, and authentic cultural experiences.',
        features_image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        teaser_images: [
          'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400',
          'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400',
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400'
        ],
        web_links: [
          { url: 'https://gotokyo.org', description: 'Go Tokyo Official' },
          { url: 'https://jnto.go.jp', description: 'Japan Tourism' }
        ],
        is_active: true
      },
      {
        template_name: 'New York City Highlights',
        start_date: new Date('2024-08-10'),
        end_date: new Date('2024-08-14'),
        description: 'Experience the best of NYC with visits to Times Square, Central Park, Statue of Liberty, and Broadway shows.',
        features_image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
        teaser_images: [
          'https://images.unsplash.com/photo-1485871981521-5b1fd3805b6d?w=400',
          'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400',
          'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400'
        ],
        web_links: [
          { url: 'https://nycgo.com', description: 'NYC Official Tourism' },
          { url: 'https://broadway.com', description: 'Broadway Shows' }
        ],
        is_active: true
      }
    ]);

    console.log(`✅ Created ${templates.length} tour templates`);

    // Create sample custom tours
    const customTours = [];
    
    // Create tours for each provider using different templates
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const template = templates[i];
      
      const tour = await CustomTour.create({
        provider_id: provider._id,
        tour_template_id: template._id,
        tour_name: `${template.template_name} - ${new Date().getFullYear()}`,
        start_date: template.start_date,
        end_date: template.end_date,
        status: i === 0 ? 'published' : 'draft', // First tour is published, others are draft
        viewAccessibility: i % 2 === 0 ? 'public' : 'private', // Alternate between public and private
        max_tourists: 8 + (i * 2), // 8, 10, 12 tourists
        remaining_tourists: 8 + (i * 2),
        group_chat_link: `https://chat.example.com/room${i + 1}`,
        features_image: template.features_image,
        teaser_images: template.teaser_images,
        web_links: template.web_links
      });
      
      customTours.push(tour);
    }

    console.log(`✅ Created ${customTours.length} custom tours`);

    // Display summary
    console.log('\n📊 Sample Data Summary:');
    console.log(`   Providers: ${providers.length}`);
    console.log(`   Tour Templates: ${templates.length}`);
    console.log(`   Custom Tours: ${customTours.length}`);
    
    console.log('\n🎯 Sample Tours Created:');
    customTours.forEach((tour, index) => {
      console.log(`   ${index + 1}. ${tour.tour_name} (${tour.status}, ${tour.viewAccessibility})`);
      console.log(`      Join Code: ${tour.join_code}`);
      console.log(`      Max Tourists: ${tour.max_tourists}`);
    });

    console.log('\n🎉 Sample data created successfully!');
    console.log('You can now test the frontend with this data.');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the script
createSampleData();