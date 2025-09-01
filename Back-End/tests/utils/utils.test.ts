import { hashPassword, comparePassword } from '../../src/utils/hash';
import { signJwt, verifyJwt, generateAuthToken } from '../../src/utils/jwt';
import { ValidationSchemas } from '../../src/utils/validation';

describe('Utility Functions', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await comparePassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Handling', () => {
    const testPayload = { userId: 'test-123', username: 'testuser', type: 'access' as const };

    it('should generate and verify JWT token', () => {
      const token = signJwt(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = verifyJwt(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.username).toBe(testPayload.username);
    });

    it('should reject invalid token', () => {
      const result = verifyJwt('invalid-token');
      expect(result).toBeNull();
    });

    it('should generate auth token for user', () => {
      const user = {
        id: 'test-123',
        username: 'testuser',
      };
      
      const token = generateAuthToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = verifyJwt(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(user.id);
      expect(decoded?.username).toBe(user.username);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@456.com',
      ];

      for (const email of validEmails) {
        expect(ValidationSchemas.validateEmail(email)).toBe(true);
      }
    });

    it('should reject invalid email formats', () => {
      // Test each email individually to identify the problematic one
      expect(ValidationSchemas.validateEmail('invalid-email')).toBe(false);
      expect(ValidationSchemas.validateEmail('@domain.com')).toBe(false);
      expect(ValidationSchemas.validateEmail('user@')).toBe(false);
      expect(ValidationSchemas.validateEmail('user@domain')).toBe(false);
      expect(ValidationSchemas.validateEmail('user..double@domain.com')).toBe(false);
      expect(ValidationSchemas.validateEmail('')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'SecurePassword123',
        'AnotherStrongPass1',
        'ComplexPass9word',
      ];

      for (const password of validPasswords) {
        expect(ValidationSchemas.validatePassword(password)).toBe(true);
      }
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        '123',
        'password',
        'PASSWORD',
        '12345678',
        'weakpass',
        'NoNumbers',
        'nonumbersorspecial',
        'short',
      ];

      for (const password of invalidPasswords) {
        expect(ValidationSchemas.validatePassword(password)).toBe(false);
      }
    });
  });

  describe('Username Validation', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'username',
        'user_name_123',
      ];

      for (const username of validUsernames) {
        expect(ValidationSchemas.validateUsername(username)).toBe(true);
      }
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(21), // too long
        'user-name', // contains dash
        'user.name', // contains dot
        'user name', // contains space
        'user@name', // contains @
      ];

      for (const username of invalidUsernames) {
        expect(ValidationSchemas.validateUsername(username)).toBe(false);
      }
    });
  });
});
