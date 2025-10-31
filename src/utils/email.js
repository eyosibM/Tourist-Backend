const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const emailTemplates = {
  registrationSubmitted: (providerName, tourName, touristName) => ({
    subject: `New Registration for ${tourName}`,
    html: `
      <h2>New Tour Registration</h2>
      <p>Dear ${providerName},</p>
      <p>A new registration has been submitted for your tour: <strong>${tourName}</strong></p>
      <p>Tourist: ${touristName}</p>
      <p>Please log in to your dashboard to review and approve/reject this registration.</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  registrationStatusUpdate: (touristName, tourName, status) => ({
    subject: `Registration ${status.charAt(0).toUpperCase() + status.slice(1)} - ${tourName}`,
    html: `
      <h2>Registration Status Update</h2>
      <p>Dear ${touristName},</p>
      <p>Your registration for <strong>${tourName}</strong> has been <strong>${status}</strong>.</p>
      ${status === 'approved' ? '<p>Welcome aboard! You will receive further details soon.</p>' : ''}
      ${status === 'rejected' ? '<p>Unfortunately, your registration was not approved. You may try registering for other tours.</p>' : ''}
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  documentUploaded: (recipientName, documentName, fileName, uploaderName) => ({
    subject: `Document Uploaded - ${documentName}`,
    html: `
      <h2>Document Upload Notification</h2>
      <p>Dear ${recipientName},</p>
      <p>A new document has been uploaded:</p>
      <ul>
        <li><strong>Document:</strong> ${documentName}</li>
        <li><strong>File:</strong> ${fileName}</li>
        <li><strong>Uploaded by:</strong> ${uploaderName}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>Please log in to your dashboard to view the document.</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  roleChangeRequest: (providerName, touristName, touristEmail, message) => ({
    subject: `Role Change Request from ${touristName}`,
    html: `
      <h2>Role Change Request</h2>
      <p>Dear ${providerName},</p>
      <p>A tourist has requested to become a Provider Administrator for your company:</p>
      <ul>
        <li><strong>Name:</strong> ${touristName}</li>
        <li><strong>Email:</strong> ${touristEmail}</li>
        <li><strong>Message:</strong> ${message || 'No message provided'}</li>
      </ul>
      <p>Please log in to your dashboard to review and approve/reject this request.</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  roleChangeDecision: (touristName, providerName, status, adminNotes) => ({
    subject: `Role Change Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <h2>Role Change Request Update</h2>
      <p>Dear ${touristName},</p>
      <p>Your request to become a Provider Administrator for <strong>${providerName}</strong> has been <strong>${status}</strong>.</p>
      ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
      ${status === 'approved' ? '<p>Welcome to the team! You now have provider administrator access.</p>' : ''}
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  newProviderApplication: (providerName, touristName, touristEmail, message) => ({
    subject: `New Provider Application from ${touristName}`,
    html: `
      <h2>New Provider Application</h2>
      <p>Dear System Administrator,</p>
      <p>A tourist has applied to become a new provider on the platform:</p>
      <ul>
        <li><strong>Applicant Name:</strong> ${touristName}</li>
        <li><strong>Applicant Email:</strong> ${touristEmail}</li>
        <li><strong>Proposed Company Name:</strong> ${providerName}</li>
        <li><strong>Message:</strong> ${message || 'No message provided'}</li>
      </ul>
      <p>Please log in to your admin dashboard to review the full application details and approve/reject this request.</p>
      <p>Best regards,<br>Tourlicity System</p>
    `
  }),

  qrCodeGenerated: (adminName, tourName, qrCodeUrl, tourType) => ({
    subject: `QR Code Generated for ${tourName}`,
    html: `
      <h2>QR Code Generated</h2>
      <p>Dear ${adminName},</p>
      <p>A QR code has been generated for your ${tourType} tour: <strong>${tourName}</strong></p>
      <div style="text-align: center; margin: 20px 0;">
        <img src="${qrCodeUrl}" alt="Tour QR Code" style="max-width: 300px; border: 1px solid #ddd; padding: 10px;">
      </div>
      <p>You can use this QR code to:</p>
      <ul>
        <li>Share tour information quickly</li>
        <li>Allow easy tour registration</li>
        <li>Print for marketing materials</li>
      </ul>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  tourQRCode: (touristName, tourName, joinCode, qrCodeUrl, joinQrCodeUrl, startDate, endDate) => ({
    subject: `Your QR Code for ${tourName}`,
    html: `
      <h2>Your Tour QR Code</h2>
      <p>Dear ${touristName},</p>
      <p>Here are your QR codes for the tour: <strong>${tourName}</strong></p>
      
      <div style="margin: 20px 0;">
        <h3>Tour Information QR Code:</h3>
        <div style="text-align: center; margin: 10px 0;">
          <img src="${qrCodeUrl}" alt="Tour QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;">
        </div>
      </div>

      ${joinQrCodeUrl ? `
      <div style="margin: 20px 0;">
        <h3>Quick Join QR Code:</h3>
        <div style="text-align: center; margin: 10px 0;">
          <img src="${joinQrCodeUrl}" alt="Join QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;">
        </div>
      </div>
      ` : ''}

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>Tour Details:</h3>
        <ul>
          <li><strong>Tour Name:</strong> ${tourName}</li>
          <li><strong>Join Code:</strong> ${joinCode}</li>
          <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
        </ul>
      </div>

      <p>Save these QR codes to your device for easy access during your tour!</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  tourUpdateNotification: (touristName, tourName, changes, qrCodeUrl, startDate, endDate) => ({
    subject: `Tour Update: ${tourName}`,
    html: `
      <h2>Tour Update Notification</h2>
      <p>Dear ${touristName},</p>
      <p>Your tour <strong>${tourName}</strong> has been updated.</p>
      
      <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
        <h3>Changes Made:</h3>
        <p>${changes}</p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <h3>Updated QR Code:</h3>
        <img src="${qrCodeUrl}" alt="Updated Tour QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;">
      </div>

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>Current Tour Details:</h3>
        <ul>
          <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
        </ul>
      </div>

      <p>Please save the updated QR code for your records.</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  tourUpdateAdminNotification: (adminName, tourName, changes, touristCount, qrCodeUrl) => ({
    subject: `Tour Updated: ${tourName}`,
    html: `
      <h2>Tour Update Confirmation</h2>
      <p>Dear ${adminName},</p>
      <p>Your tour <strong>${tourName}</strong> has been successfully updated.</p>
      
      <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
        <h3>Changes Made:</h3>
        <p>${changes}</p>
      </div>

      <p><strong>Notifications sent to:</strong> ${touristCount} registered tourists</p>

      <div style="text-align: center; margin: 20px 0;">
        <h3>Updated QR Code:</h3>
        <img src="${qrCodeUrl}" alt="Updated Tour QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;">
      </div>

      <p>All registered tourists have been notified of the changes and provided with the updated QR code.</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  sharedQRCode: (senderEmail, tourName, joinCode, qrCodeUrl, message, startDate, endDate) => ({
    subject: `${senderEmail} shared a tour with you: ${tourName}`,
    html: `
      <h2>Tour Shared With You</h2>
      <p>Hello!</p>
      <p><strong>${senderEmail}</strong> has shared a tour with you: <strong>${tourName}</strong></p>
      
      ${message ? `
      <div style="background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196f3;">
        <h3>Personal Message:</h3>
        <p><em>"${message}"</em></p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 20px 0;">
        <h3>Tour QR Code:</h3>
        <img src="${qrCodeUrl}" alt="Tour QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;">
      </div>

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>Tour Details:</h3>
        <ul>
          <li><strong>Tour Name:</strong> ${tourName}</li>
          <li><strong>Join Code:</strong> ${joinCode}</li>
          <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
        </ul>
      </div>

      <p>Scan the QR code or use the join code to learn more about this tour!</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  bulkQRCodeShare: (senderName, tourName, joinCode, qrCodeUrl, startDate, endDate) => ({
    subject: `${senderName} invited you to join: ${tourName}`,
    html: `
      <h2>Tour Invitation</h2>
      <p>Hello!</p>
      <p><strong>${senderName}</strong> has invited you to join an exciting tour: <strong>${tourName}</strong></p>

      <div style="text-align: center; margin: 20px 0;">
        <h3>Tour QR Code:</h3>
        <img src="${qrCodeUrl}" alt="Tour QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;">
      </div>

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>Tour Details:</h3>
        <ul>
          <li><strong>Tour Name:</strong> ${tourName}</li>
          <li><strong>Join Code:</strong> ${joinCode}</li>
          <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/join/${joinCode}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Join Tour Now
        </a>
      </div>

      <p>Scan the QR code or click the button above to join this amazing tour!</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  broadcastNotification: (touristName, tourName, message, tourId) => ({
    subject: `New Message - ${tourName}`,
    html: `
      <h2>New Tour Message</h2>
      <p>Dear ${touristName},</p>
      <p>You have received a new message for your tour: <strong>${tourName}</strong></p>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">"${message}"</p>
      </div>
      <p>This message was sent by your tour provider. Please check your tour details for any updates or instructions.</p>
      <p>Best regards,<br>Tourlicity Team</p>
    `
  }),

  // Authentication email templates
  emailVerification: (userName, verificationToken) => ({
    subject: 'Verify Your Email Address - Tourlicity',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #007bff; text-align: center;">Welcome to Tourlicity!</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for registering with Tourlicity. To complete your account setup and ensure the security of your account, please verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/verify-email?token=${verificationToken}" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
          ${process.env.FRONTEND_URL || 'https://tourlicity.com'}/verify-email?token=${verificationToken}
        </p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
        </div>
        
        <p>If you didn't create an account with Tourlicity, please ignore this email.</p>
        <p>Best regards,<br>The Tourlicity Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  }),

  passwordReset: (userName, resetToken) => ({
    subject: 'Reset Your Password - Tourlicity',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #dc3545; text-align: center;">Password Reset Request</h2>
        <p>Dear ${userName},</p>
        <p>We received a request to reset the password for your Tourlicity account. If you made this request, please click the button below to reset your password.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/reset-password?token=${resetToken}" 
             style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
          ${process.env.FRONTEND_URL || 'https://tourlicity.com'}/reset-password?token=${resetToken}
        </p>
        
        <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p style="margin: 0;"><strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.</p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
          <p style="margin: 0;"><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        
        <p>For your security, we recommend:</p>
        <ul>
          <li>Using a strong, unique password</li>
          <li>Not sharing your password with anyone</li>
          <li>Logging out of shared devices</li>
        </ul>
        
        <p>Best regards,<br>The Tourlicity Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  }),

  passwordResetConfirmation: (userName) => ({
    subject: 'Password Successfully Reset - Tourlicity',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #28a745; text-align: center;">Password Reset Successful</h2>
        <p>Dear ${userName},</p>
        <p>Your password has been successfully reset for your Tourlicity account.</p>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <p style="margin: 0;"><strong>Confirmation:</strong> Your password was changed on ${new Date().toLocaleString()}.</p>
        </div>
        
        <p>You can now log in to your account using your new password. For your security, all existing login sessions have been terminated.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/login" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Log In Now
          </a>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Security Alert:</strong> If you didn't reset your password, please contact our support team immediately.</p>
        </div>
        
        <p>To keep your account secure:</p>
        <ul>
          <li>Don't share your password with anyone</li>
          <li>Use a unique password for your Tourlicity account</li>
          <li>Log out when using shared or public devices</li>
          <li>Contact us if you notice any suspicious activity</li>
        </ul>
        
        <p>Best regards,<br>The Tourlicity Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  }),

  accountLocked: (userName, lockDuration) => ({
    subject: 'Account Temporarily Locked - Tourlicity',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #dc3545; text-align: center;">Account Security Alert</h2>
        <p>Dear ${userName},</p>
        <p>Your Tourlicity account has been temporarily locked due to multiple failed login attempts.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p style="margin: 0;"><strong>Account Status:</strong> Temporarily locked for ${lockDuration} minutes for your security.</p>
        </div>
        
        <p><strong>What happened?</strong></p>
        <p>We detected multiple unsuccessful login attempts on your account. To protect your account from unauthorized access, we've temporarily locked it.</p>
        
        <p><strong>What you can do:</strong></p>
        <ul>
          <li>Wait ${lockDuration} minutes for the lock to automatically expire</li>
          <li>Try logging in again after the lock period</li>
          <li>If you forgot your password, use the "Forgot Password" option</li>
          <li>Contact support if you believe this was an error</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/forgot-password" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
          <p style="margin: 0;"><strong>Security Tip:</strong> If this wasn't you, someone may be trying to access your account. Consider changing your password once the lock expires.</p>
        </div>
        
        <p>Your account security is important to us. This temporary lock helps protect your personal information and tour bookings.</p>
        
        <p>Best regards,<br>The Tourlicity Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated security message. Please do not reply to this email.
        </p>
      </div>
    `
  }),

  loginAlert: (userName, ipAddress, userAgent, location) => ({
    subject: 'New Login to Your Account - Tourlicity',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #17a2b8; text-align: center;">Login Notification</h2>
        <p>Dear ${userName},</p>
        <p>We're writing to let you know that there was a successful login to your Tourlicity account.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #dee2e6;">
          <h3 style="margin-top: 0; color: #495057;">Login Details:</h3>
          <ul style="margin-bottom: 0;">
            <li><strong>Date & Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>IP Address:</strong> ${ipAddress}</li>
            <li><strong>Device/Browser:</strong> ${userAgent}</li>
            ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
          </ul>
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <p style="margin: 0;"><strong>Was this you?</strong> If you recognize this login, no action is needed.</p>
        </div>
        
        <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p style="margin: 0;"><strong>Suspicious activity?</strong> If you don't recognize this login, please secure your account immediately.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/forgot-password" 
             style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-right: 10px;">
            Change Password
          </a>
          <a href="${process.env.FRONTEND_URL || 'https://tourlicity.com'}/profile" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Account
          </a>
        </div>
        
        <p><strong>To keep your account secure:</strong></p>
        <ul>
          <li>Use a strong, unique password</li>
          <li>Don't share your login credentials</li>
          <li>Log out from shared or public devices</li>
          <li>Enable two-factor authentication if available</li>
        </ul>
        
        <p>Best regards,<br>The Tourlicity Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated security message. Please do not reply to this email.
        </p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, ...args) => {
  try {
    const emailContent = emailTemplates[template](...args);
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@tourlicity.com',
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${emailContent.subject}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Authentication-specific email helper functions
const authEmailService = {
  // Send email verification
  async sendEmailVerification(userEmail, userName, verificationToken) {
    return await sendEmail(userEmail, 'emailVerification', userName, verificationToken);
  },

  // Send password reset email
  async sendPasswordReset(userEmail, userName, resetToken) {
    return await sendEmail(userEmail, 'passwordReset', userName, resetToken);
  },

  // Send password reset confirmation
  async sendPasswordResetConfirmation(userEmail, userName) {
    return await sendEmail(userEmail, 'passwordResetConfirmation', userName);
  },

  // Send account locked notification
  async sendAccountLocked(userEmail, userName, lockDuration = 30) {
    return await sendEmail(userEmail, 'accountLocked', userName, lockDuration);
  },

  // Send login alert notification
  async sendLoginAlert(userEmail, userName, ipAddress, userAgent, location = null) {
    return await sendEmail(userEmail, 'loginAlert', userName, ipAddress, userAgent, location);
  },

  // Resend email verification (generates new token)
  async resendEmailVerification(userEmail, userName, newVerificationToken) {
    return await sendEmail(userEmail, 'emailVerification', userName, newVerificationToken);
  }
};

module.exports = { sendEmail, emailTemplates, authEmailService };