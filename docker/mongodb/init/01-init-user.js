// MongoDB initialization script
// This creates the application user and database

db = db.getSiblingDB('tourlicity');

// Create application user
db.createUser({
  user: 'tourlicity_user',
  pwd: 'tourlicity_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'tourlicity'
    }
  ]
});

// Create initial collections with indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ google_id: 1 }, { unique: true, sparse: true });

db.createCollection('tours');
db.tours.createIndex({ provider_id: 1 });
db.tours.createIndex({ status: 1 });

db.createCollection('bookings');
db.bookings.createIndex({ user_id: 1 });
db.bookings.createIndex({ tour_id: 1 });

db.createCollection('notifications');
db.notifications.createIndex({ user_id: 1 });
db.notifications.createIndex({ created_at: 1 });

print('Database and user created successfully');