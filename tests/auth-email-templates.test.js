const { emailTemplates, authEmailService } = require('../src/utils/email');

describe('Authentication Email Templates', () => {
  describe('Email Templates', () => {
    test('should generate email verification template', () => {
      const userName = 'John Doe';
      const verificationToken = 'test-verification-token-123';
      
      const template = emailTemplates.emailVerification(userName, verificationToken);
      
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template.subject).toContain('Verify Your Email Address');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(verificationToken);
      expect(template.html).toContain('verify-email?token=');
    });

    test('should generate password reset template', () => {
      const userName = 'Jane Smith';
      const resetToken = 'test-reset-token-456';
      
      const template = emailTemplates.passwordReset(userName, resetToken);
      
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template.subject).toContain('Reset Your Password');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(resetToken);
      expect(template.html).toContain('reset-password?token=');
    });

    test('should generate password reset confirmation template', () => {
      const userName = 'Bob Johnson';
      
      const template = emailTemplates.passwordResetConfirmation(userName);
      
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template.subject).toContain('Password Successfully Reset');
      expect(template.html).toContain(userName);
      expect(template.html).toContain('successfully reset');
    });

    test('should generate account locked template', () => {
      const userName = 'Alice Brown';
      const lockDuration = 30;
      
      const template = emailTemplates.accountLocked(userName, lockDuration);
      
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template.subject).toContain('Account Temporarily Locked');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(`${lockDuration} minutes`);
    });

    test('should generate login alert template', () => {
      const userName = 'Charlie Wilson';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const location = 'New York, USA';
      
      const template = emailTemplates.loginAlert(userName, ipAddress, userAgent, location);
      
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template.subject).toContain('New Login to Your Account');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(ipAddress);
      expect(template.html).toContain(userAgent);
      expect(template.html).toContain(location);
    });
  });

  describe('Authentication Email Service Helpers', () => {
    // Mock the sendEmail function to avoid actual email sending in tests
    const originalSendEmail = require('../src/utils/email').sendEmail;
    
    beforeEach(() => {
      // Mock sendEmail to return success without actually sending
      jest.spyOn(require('../src/utils/email'), 'sendEmail').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should have sendEmailVerification helper', () => {
      expect(typeof authEmailService.sendEmailVerification).toBe('function');
    });

    test('should have sendPasswordReset helper', () => {
      expect(typeof authEmailService.sendPasswordReset).toBe('function');
    });

    test('should have sendPasswordResetConfirmation helper', () => {
      expect(typeof authEmailService.sendPasswordResetConfirmation).toBe('function');
    });

    test('should have sendAccountLocked helper', () => {
      expect(typeof authEmailService.sendAccountLocked).toBe('function');
    });

    test('should have sendLoginAlert helper', () => {
      expect(typeof authEmailService.sendLoginAlert).toBe('function');
    });

    test('should have resendEmailVerification helper', () => {
      expect(typeof authEmailService.resendEmailVerification).toBe('function');
    });
  });

  describe('Template Security Features', () => {
    test('email verification template should include security notices', () => {
      const template = emailTemplates.emailVerification('Test User', 'token123');
      
      expect(template.html).toContain('24 hours');
      expect(template.html).toContain('security');
      expect(template.html).toContain('expire');
    });

    test('password reset template should include security warnings', () => {
      const template = emailTemplates.passwordReset('Test User', 'token456');
      
      expect(template.html).toContain('1 hour');
      expect(template.html).toContain('security');
      expect(template.html).toContain("didn't request");
    });

    test('account locked template should include security information', () => {
      const template = emailTemplates.accountLocked('Test User', 30);
      
      expect(template.html).toContain('multiple failed login attempts');
      expect(template.html).toContain('protect your account');
      expect(template.html).toContain('unauthorized access');
    });
  });

  describe('Template Formatting', () => {
    test('all authentication templates should have proper HTML structure', () => {
      const templates = [
        emailTemplates.emailVerification('User', 'token'),
        emailTemplates.passwordReset('User', 'token'),
        emailTemplates.passwordResetConfirmation('User'),
        emailTemplates.accountLocked('User', 30),
        emailTemplates.loginAlert('User', '127.0.0.1', 'Browser', 'Location')
      ];

      templates.forEach(template => {
        expect(template.html).toContain('<div');
        expect(template.html).toContain('</div>');
        expect(template.html).toContain('font-family');
        expect(template.html).toContain('max-width: 600px');
      });
    });

    test('all authentication templates should include Tourlicity branding', () => {
      const templates = [
        emailTemplates.emailVerification('User', 'token'),
        emailTemplates.passwordReset('User', 'token'),
        emailTemplates.passwordResetConfirmation('User'),
        emailTemplates.accountLocked('User', 30),
        emailTemplates.loginAlert('User', '127.0.0.1', 'Browser', 'Location')
      ];

      templates.forEach(template => {
        expect(template.html).toContain('Tourlicity');
        expect(template.subject).toContain('Tourlicity');
      });
    });
  });
});