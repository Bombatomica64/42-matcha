import request from 'supertest';
import { createTestApp, createTestUser } from '../helpers/app.helper';
import { clearDatabase, closeTestPool } from '../helpers/database.helper';
import type { Express } from 'express';

describe('Authentication Routes', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'SecurePassword123!',
      birthDate: '1990-01-01',
      gender: 'male',
    };

    it('should register a new user successfully', async () => {
      const response = await createTestUser(app, validUserData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', validUserData.email);
      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid email format', async () => {
      const response = await createTestUser(app, {
        ...validUserData,
        email: 'invalid-email',
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject weak password', async () => {
      const response = await createTestUser(app, {
        ...validUserData,
        password: '123',
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email', async () => {
      // First registration
      await createTestUser(app, validUserData);
      
      // Second registration with same email
      const response = await createTestUser(app, validUserData);
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'SecurePassword123!',
      birthDate: '1990-01-01',
      gender: 'male',
    };

    beforeEach(async () => {
      // Register a user for login tests
      await createTestUser(app, userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Register and login to get refresh token
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePassword123!',
        birthDate: '1990-01-01',
        gender: 'male',
      };

      await createTestUser(app, userData);
      
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const { refreshToken } = loginResponse.body;

      // Use refresh token to get new access token
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
