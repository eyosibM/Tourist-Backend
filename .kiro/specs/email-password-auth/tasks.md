# Implementation Plan

- [x] 1. Enhance User model with authentication fields









  - Add email verification fields (email_verified, email_verification_token, email_verification_expires)
  - Add password reset fields (password_reset_token, password_reset_expires)
  - Add security tracking fields (login_attempts, account_locked_until, last_login)
  - Update password field to be conditionally required (not required for Google users)
  - Add password hashing middleware using bcrypt with 12 salt rounds
  - _Requirements: 1.3, 3.4, 4.1, 5.1_
-



- [-] 2. Create security utilities and token service









  - [x] 2.1 Create token generation utilities for email verification and password reset


    - Implement cryptographically secure token generation
    - Add token expiration handling (24h for email verification, 1h for password reset)
    - Create token validation functions
    - _Requirements: 3.4, 4.2, 4.3_
  
  - [x] 2.2 Implement password security utilities
















    - Create password strength validation function
    - Implement secure password hashing with bcrypt
    - Add password comparison utility
    - _Requirements: 1.3, 2.3, 5.1_

- [x] 3. Extend validation schemas for new authentication endpoints












  - Add registration validation schema (email, password, first_name, last_name)
  - Add login validation schema (email, password)
  - Add password reset request schema (email)
  - Add password reset completion schema (token, new_password)
  - Add email verification schema (token)
  - _Requirements: 1.5, 2.1, 3.1, 4.1, 5.1_

- [x] 4. Create security middleware for authentication protection







  - [x] 4.1 Implement rate limiting middleware for authentication endpoints




    - Create rate limiter for login attempts (5 per 15 minutes per IP)
    - Create rate limiter for registration (3 per hour per IP)
    - Create rate limiter for password reset requests (3 per hour per email)
    - _Requirements: 2.4, 3.2, 5.2_
  
  - [x] 4.2 Create account security middleware


    - Implement account lock detection and enforcement
    - Create middleware to require email verification for protected routes
    - Add security event logging middleware
    - _Requirements: 2.4, 4.4, 5.4_



- [x] 5. Extend email service with authentication templates











  - Add email verification template with secure verification link
  - Add password reset template with reset instructions and secure link
  - Add password reset confirmation template
  - Add account locked notification template
  - Update email service to handle new template types
  - _Requirements: 1.4, 3.1, 4.1, 4.4_

- [x] 6. Implement authentication controller methods















  - [x] 6.1 Create user registration endpoint



    - Validate registration data and check for existing email
    - Hash password securely and create new user account
    - Generate email verification token and send verification email
    - Return appropriate response without sensitive data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 6.2 Create user login endpoint




    - Validate credentials and check account status (active, not locked)
    - Verify email verification status and enforce if required
    - Update login tracking (last_login, reset failed attempts)
    - Generate JWT token and return user data
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 6.3 Create password reset request endpoint


    - Validate email and generate reset token (don't reveal if email exists)
    - Send password reset email with secure reset link
    - Log security event for password reset request
    - Return consistent response regardless of email existence
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 6.4 Create password reset completion endpoint



    - Validate reset token and check expiration
    - Update user password with new hashed password
    - Invalidate all existing JWT tokens for the user
    - Send password reset confirmation email
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 6.5 Create email verification endpoint


    - Validate verification token and check expiration
    - Update user email_verified status to true
    - Clear verification token fields
    - Return success response
    - _Requirements: 4.1, 4.2_
  
  - [x] 6.6 Create resend verification email endpoint


    - Check if user exists and email is not already verified
    - Generate new verification token and invalidate previous ones
    - Send new verification email with rate limiting
    - Return appropriate response
    - _Requirements: 4.4, 4.5_

- [x] 7. Add new authentication routes to auth router












  - Add POST /register route with validation and rate limiting
  - Add POST /login route with validation and rate limiting
  - Add POST /forgot-password route with validation and rate limiting
  - Add POST /reset-password route with validation
  - Add POST /verify-email route with validation
  - Add POST /resend-verification route with validation and rate limiting
  - Update existing routes to handle email verification status
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.4_

- [x] 8. Update existing authentication middleware






  - Modify authenticate middleware to check email verification for email/password users
  - Update user sanitization to include email verification status
  - Enhance error responses with appropriate error codes
  - Add security event logging to existing authentication flows
  - _Requirements: 2.3, 4.1, 5.4_

- [-] 9. Create security event logging system



  - [x] 9.1 Create SecurityEvent model for audit logging


    - Define schema for security events (login attempts, password resets, etc.)
    - Include user_id, event_type, ip_address, user_agent, metadata fields
    - Add indexes for efficient querying
    - _Requirements: 5.4, 5.5_
  
  - [x] 9.2 Implement security event logging service









    - Create service to log authentication events
    - Add helper functions for different event types
    - Integrate with existing authentication flows
    - _Requirements: 2.5, 3.5, 4.5, 5.4_

- [x] 10. Update Google OAuth integration











  - Modify googleAuth controller to set email_verified: true for Google users
  - Update Google user creation to handle mixed authentication scenarios
  - Ensure Google users can still use email/password authentication if they set a password
  - Maintain backward compatibility with existing Google OAuth flow
  - _Requirements: 1.1, 2.1, 4.1_

- [ ]* 11. Create comprehensive authentication tests
  - [ ]* 11.1 Write unit tests for authentication utilities
    - Test password hashing and verification functions
    - Test token generation and validation utilities
    - Test rate limiting functionality
    - _Requirements: 1.3, 2.3, 3.4, 4.2_
  
  - [ ]* 11.2 Write integration tests for authentication flows
    - Test complete registration → verification → login flow
    - Test password reset → new password → login flow
    - Test account locking and unlock scenarios
    - Test rate limiting across different endpoints
    - _Requirements: 1.1, 2.1, 3.1, 4.1_
  
  - [ ]* 11.3 Write API endpoint tests
    - Test all new authentication endpoints with valid and invalid data
    - Test error responses and status codes
    - Test security middleware integration
    - Test mixed Google OAuth and email/password scenarios
    - _Requirements: 1.5, 2.2, 3.2, 4.2, 5.1_

- [ ] 12. Add Swagger documentation for new endpoints
  - Document registration endpoint with request/response schemas
  - Document login endpoint with authentication examples
  - Document password reset endpoints with security notes
  - Document email verification endpoints
  - Update existing endpoint documentation to include email verification status
  - _Requirements: 1.1, 2.1, 3.1, 4.1_