const { sendEmail, emailTemplates } = require('../utils/email');
const NotificationQueueService = require('./notificationQueueService');
const User = require('../models/User');
const Registration = require('../models/Registration');

class NotificationService {
  /**
   * Send QR code generated notification to provider admins
   * @param {Object} tour - Tour object
   * @param {string} qrCodeUrl - URL of generated QR code
   * @param {string} tourType - 'template' or 'custom'
   */
  static async notifyQRCodeGenerated(tour, qrCodeUrl, tourType = 'custom') {
    try {
      // Get provider admins
      const providerAdmins = await User.find({
        provider_id: tour.provider_id,
        user_type: 'provider_admin',
        is_active: true
      });

      const tourName = tour.tour_name || tour.template_name;
      
      for (const admin of providerAdmins) {
        // Queue email notification
        await NotificationQueueService.queueEmailTemplate(
          admin.email,
          'qrCodeGenerated',
          [admin.first_name, tourName, qrCodeUrl, tourType]
        );

        // Queue push notification
        await NotificationQueueService.queuePushNotification(
          admin._id.toString(),
          'QR Code Generated',
          `QR code has been generated for ${tourName}`,
          {
            data: { 
              type: 'qr_code_generated', 
              tourId: tour._id.toString(),
              tourType 
            }
          }
        );
      }

      console.log(`QR code generation notifications sent for ${tourType} tour: ${tour._id}`);
    } catch (error) {
      console.error('Error sending QR code generation notifications:', error);
    }
  }

  /**
   * Send QR code to registered tourists
   * @param {string} tourId - Tour ID
   * @param {string} qrCodeUrl - URL of QR code
   * @param {string} joinQrCodeUrl - URL of join QR code
   */
  static async sendQRCodeToTourists(tourId, qrCodeUrl, joinQrCodeUrl) {
    try {
      // Get all approved registrations for this tour
      const registrations = await Registration.find({
        custom_tour_id: tourId,
        status: 'approved'
      }).populate('tourist_id').populate('custom_tour_id');

      for (const registration of registrations) {
        const tourist = registration.tourist_id;
        const tour = registration.custom_tour_id;

        if (tourist && tourist.is_active) {
          // Queue email notification
          await NotificationQueueService.queueEmailTemplate(
            tourist.email,
            'tourQRCode',
            [tourist.first_name, tour.tour_name, tour.join_code, qrCodeUrl, joinQrCodeUrl, tour.start_date, tour.end_date]
          );

          // Queue push notification
          await NotificationQueueService.queuePushNotification(
            tourist._id.toString(),
            'Your Tour QR Code',
            `QR code for ${tour.tour_name} is ready!`,
            {
              data: { 
                type: 'tour_qr_code', 
                tourId: tourId,
                qrCodeUrl,
                joinQrCodeUrl 
              }
            }
          );
        }
      }

      console.log(`QR codes sent to tourists for tour: ${tourId}`);
    } catch (error) {
      console.error('Error sending QR codes to tourists:', error);
    }
  }

  /**
   * Send tour update notification with new QR code
   * @param {Object} tour - Updated tour object
   * @param {string} qrCodeUrl - URL of updated QR code
   * @param {Array} changes - Array of changed fields
   */
  static async notifyTourUpdate(tour, qrCodeUrl, changes = []) {
    try {
      // Get all approved registrations
      const registrations = await Registration.find({
        custom_tour_id: tour._id,
        status: 'approved'
      }).populate('tourist_id');

      // Get provider admins
      const providerAdmins = await User.find({
        provider_id: tour.provider_id,
        user_type: 'provider_admin',
        is_active: true
      });

      const changesList = changes.join(', ');

      // Notify tourists
      for (const registration of registrations) {
        const tourist = registration.tourist_id;
        if (tourist && tourist.is_active) {
          const emailData = emailTemplates.tourUpdateNotification(
            tourist.first_name,
            tour.tour_name,
            changesList,
            qrCodeUrl,
            tour.start_date,
            tour.end_date
          );

          await sendEmail(tourist.email, emailData.subject, emailData.html);
        }
      }

      // Notify provider admins
      for (const admin of providerAdmins) {
        const emailData = emailTemplates.tourUpdateAdminNotification(
          admin.first_name,
          tour.tour_name,
          changesList,
          registrations.length,
          qrCodeUrl
        );

        await sendEmail(admin.email, emailData.subject, emailData.html);
      }

      console.log(`Tour update notifications sent for tour: ${tour._id}`);
    } catch (error) {
      console.error('Error sending tour update notifications:', error);
    }
  }

  /**
   * Send QR code sharing notification
   * @param {string} senderEmail - Email of person sharing
   * @param {string} recipientEmail - Email of recipient
   * @param {Object} tour - Tour object
   * @param {string} qrCodeUrl - QR code URL
   * @param {string} message - Optional message
   */
  static async sendSharedQRCode(senderEmail, recipientEmail, tour, qrCodeUrl, message = '') {
    try {
      const emailData = emailTemplates.sharedQRCode(
        senderEmail,
        tour.tour_name,
        tour.join_code,
        qrCodeUrl,
        message,
        tour.start_date,
        tour.end_date
      );

      await sendEmail(recipientEmail, emailData.subject, emailData.html);
      console.log(`QR code shared from ${senderEmail} to ${recipientEmail} for tour: ${tour._id}`);
    } catch (error) {
      console.error('Error sending shared QR code:', error);
    }
  }

  /**
   * Send bulk QR code notifications to multiple recipients
   * @param {Array} recipients - Array of email addresses
   * @param {Object} tour - Tour object
   * @param {string} qrCodeUrl - QR code URL
   * @param {string} senderName - Name of sender
   */
  static async sendBulkQRCode(recipients, tour, qrCodeUrl, senderName) {
    try {
      const promises = recipients.map(email => {
        const emailData = emailTemplates.bulkQRCodeShare(
          senderName,
          tour.tour_name,
          tour.join_code,
          qrCodeUrl,
          tour.start_date,
          tour.end_date
        );

        return sendEmail(email, emailData.subject, emailData.html);
      });

      await Promise.all(promises);
      console.log(`Bulk QR codes sent to ${recipients.length} recipients for tour: ${tour._id}`);
    } catch (error) {
      console.error('Error sending bulk QR codes:', error);
    }
  }

  /**
   * Send notifications to multiple users (for broadcasts)
   * @param {Array} userIds - Array of user IDs to send notifications to
   * @param {Object} notificationData - Notification content
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type
   * @param {Object} notificationData.data - Additional data
   */
  static async sendNotificationToUsers(userIds, notificationData) {
    try {
      if (!userIds || userIds.length === 0) {
        console.log('No users to send notifications to');
        return;
      }

      const { title, message, type, data } = notificationData;

      // Send push notifications to all users
      const pushPromises = userIds.map(userId => 
        NotificationQueueService.queuePushNotification(
          userId.toString(),
          title,
          message,
          { data: { ...data, type } }
        )
      );

      await Promise.all(pushPromises);

      // Optionally send email notifications for important broadcasts
      if (type === 'broadcast' && data.broadcast_id) {
        const users = await User.find({ 
          _id: { $in: userIds },
          is_active: true 
        });

        const emailPromises = users.map(user => {
          if (user.email) {
            const emailData = emailTemplates.broadcastNotification(
              user.first_name,
              data.tour_name,
              message,
              data.custom_tour_id
            );

            return sendEmail(user.email, emailData.subject, emailData.html);
          }
        }).filter(Boolean);

        await Promise.all(emailPromises);
      }

      console.log(`Notifications sent to ${userIds.length} users for ${type}`);
    } catch (error) {
      console.error('Error sending notifications to users:', error);
      throw error;
    }
  }

  /**
   * Send broadcast notification to tour participants
   * @param {Object} broadcast - Broadcast object with populated fields
   */
  static async sendBroadcastNotification(broadcast) {
    try {
      // Get all approved registrations for this tour
      const registrations = await Registration.find({
        custom_tour_id: broadcast.custom_tour_id._id,
        status: 'approved'
      }).populate('tourist_id', '_id first_name email');

      if (registrations.length === 0) {
        console.log('No registered tourists found for broadcast notification');
        return;
      }

      const touristIds = registrations.map(reg => reg.tourist_id._id);
      
      // Send in-app notifications
      const notificationData = {
        title: `New message for ${broadcast.custom_tour_id.tour_name}`,
        message: broadcast.message,
        type: 'broadcast',
        data: {
          broadcast_id: broadcast._id,
          custom_tour_id: broadcast.custom_tour_id._id,
          tour_name: broadcast.custom_tour_id.tour_name,
          provider_name: broadcast.provider_id.provider_name
        }
      };

      await this.sendNotificationToUsers(touristIds, notificationData);
      
      // Send email notifications to all registered tourists
      const emailPromises = registrations.map(async (registration) => {
        const tourist = registration.tourist_id;
        if (tourist && tourist.email) {
          try {
            await sendEmail(
              tourist.email,
              'broadcastNotification',
              tourist.first_name,
              broadcast.custom_tour_id.tour_name,
              broadcast.message,
              broadcast.custom_tour_id._id
            );
            console.log(`📧 Broadcast email sent to ${tourist.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send broadcast email to ${tourist.email}:`, emailError);
          }
        }
      });

      await Promise.all(emailPromises);
      
      console.log(`📢 Broadcast notifications sent to ${touristIds.length} tourists (in-app + email)`);
    } catch (error) {
      console.error('Error sending broadcast notifications:', error);
    }
  }

  /**
   * Create an in-app notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.userId - Recipient user ID
   * @param {string} notificationData.senderId - Sender user ID (optional)
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} notificationData.relatedEntities - Related entities (optional)
   * @param {string} notificationData.priority - Priority level (optional)
   * @param {string} notificationData.actionUrl - Action URL (optional)
   * @param {string} notificationData.actionText - Action button text (optional)
   * @param {Object} notificationData.channels - Delivery channels (optional)
   */
  static async createNotification(notificationData) {
    try {
      const Notification = require('../models/Notification');
      
      const {
        userId,
        senderId,
        type,
        title,
        message,
        relatedEntities = {},
        priority = 'normal',
        actionUrl,
        actionText,
        channels = { push: true, email: false, sms: false, in_app: true }
      } = notificationData;

      // Create the notification
      const notification = new Notification({
        recipient_id: userId,
        sender_id: senderId,
        type,
        title,
        message,
        priority,
        action_url: actionUrl,
        action_text: actionText,
        channels,
        related_entities: relatedEntities
      });

      await notification.save();

      // Queue push notification if enabled
      if (channels.push) {
        await NotificationQueueService.queuePushNotification(
          userId,
          title,
          message,
          {
            data: {
              type,
              notificationId: notification._id.toString(),
              actionUrl,
              ...relatedEntities
            }
          }
        );
      }

      console.log(`In-app notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create registration-related notifications
   */
  static async createRegistrationNotification(registration, type, additionalData = {}) {
    try {
      const notificationMap = {
        'tour_registration': {
          // Notify provider when tourist registers
          recipient: 'provider',
          title: 'New Tour Registration',
          message: `${registration.tourist_id.first_name} ${registration.tourist_id.last_name} has registered for ${registration.custom_tour_id.tour_name}`,
          actionUrl: `/tourregistrations?tour=${registration.custom_tour_id._id}`,
          actionText: 'View Registration'
        },
        'registration_approved': {
          // Notify tourist when registration is approved
          recipient: 'tourist',
          title: 'Registration Approved!',
          message: `Your registration for ${registration.custom_tour_id.tour_name} has been approved`,
          actionUrl: `/mytours`,
          actionText: 'View Tour'
        },
        'registration_rejected': {
          // Notify tourist when registration is rejected
          recipient: 'tourist',
          title: 'Registration Update',
          message: `Your registration for ${registration.custom_tour_id.tour_name} has been rejected`,
          actionUrl: `/find-tours`,
          actionText: 'Find Other Tours'
        }
      };

      const config = notificationMap[type];
      if (!config) {
        console.warn(`Unknown registration notification type: ${type}`);
        return;
      }

      // Determine recipient
      let recipientId;
      if (config.recipient === 'tourist') {
        recipientId = registration.tourist_id._id || registration.tourist_id;
      } else if (config.recipient === 'provider') {
        // Get provider admins
        const providerAdmins = await User.find({
          provider_id: registration.custom_tour_id.provider_id,
          user_type: 'provider_admin',
          is_active: true
        });

        // Create notification for each provider admin
        for (const admin of providerAdmins) {
          await this.createNotification({
            userId: admin._id.toString(),
            type,
            title: config.title,
            message: config.message,
            actionUrl: config.actionUrl,
            actionText: config.actionText,
            priority: 'high',
            relatedEntities: {
              custom_tour_id: registration.custom_tour_id._id,
              registration_id: registration._id
            },
            channels: { push: true, email: true, in_app: true }
          });
        }
        return;
      }

      if (recipientId) {
        await this.createNotification({
          userId: recipientId.toString(),
          type,
          title: config.title,
          message: config.message,
          actionUrl: config.actionUrl,
          actionText: config.actionText,
          priority: type === 'registration_approved' ? 'high' : 'normal',
          relatedEntities: {
            custom_tour_id: registration.custom_tour_id._id,
            registration_id: registration._id
          },
          channels: { push: true, email: true, in_app: true }
        });
      }
    } catch (error) {
      console.error('Error creating registration notification:', error);
    }
  }
}

module.exports = NotificationService;