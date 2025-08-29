import request from 'supertest';
import { authenticateUser, createTestApp, createTestUser } from '../helpers/app.helper';
import { clearDatabase, closeTestPool, seedTestData } from '../helpers/database.helper';
import type { Express } from 'express';

describe('Hashtag Routes', () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
    
    // Create and authenticate a test user
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
    authToken = await authenticateUser(app, {
      email: userData.email,
      password: userData.password,
    });
  });

  describe('GET /hashtags', () => {
    it('should get all hashtags', async () => {
      const response = await request(app)
        .get('/hashtags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
      expect(Array.isArray(response.body.hashtags)).toBe(true);
      expect(response.body.hashtags.length).toBeGreaterThan(0);
      
      // Check hashtag structure
      const hashtag = response.body.hashtags[0];
      expect(hashtag).toHaveProperty('id');
      expect(hashtag).toHaveProperty('name');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/hashtags')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/hashtags')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /hashtags/search', () => {
    it('should search hashtags by name', async () => {
      const response = await request(app)
        .get('/hashtags/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'travel' })
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
      expect(Array.isArray(response.body.hashtags)).toBe(true);
      
      // Check that returned hashtags contain the search term
      for (const hashtag of response.body.hashtags) {
        expect(hashtag.name.toLowerCase()).toContain('travel');
      }
    });

    it('should return empty array for non-existent hashtag', async () => {
      const response = await request(app)
        .get('/hashtags/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'nonexistenthashtag' })
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
      expect(response.body.hashtags).toHaveLength(0);
    });

    it('should require search query parameter', async () => {
      const response = await request(app)
        .get('/hashtags/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /hashtags', () => {
    it('should create a new hashtag', async () => {
      const newHashtag = { name: 'newhashtag' };

      const response = await request(app)
        .post('/hashtags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newHashtag)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('hashtag');
      expect(response.body.hashtag).toHaveProperty('name', 'newhashtag');
      expect(response.body.hashtag).toHaveProperty('id');
    });

    it('should not create duplicate hashtags', async () => {
      const hashtagData = { name: 'travel' }; // This already exists from seedTestData

      const response = await request(app)
        .post('/hashtags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(hashtagData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate hashtag name format', async () => {
      const invalidHashtags = [
        { name: '' }, // Empty name
        { name: 'a' }, // Too short
        { name: 'a'.repeat(51) }, // Too long
        { name: 'invalid name' }, // Contains space
        { name: 'invalid-name' }, // Contains hyphen
        { name: 'invalid@name' }, // Contains special character
      ];

      for (const hashtag of invalidHashtags) {
        const response = await request(app)
          .post('/hashtags')
          .set('Authorization', `Bearer ${authToken}`)
          .send(hashtag)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should normalize hashtag names to lowercase', async () => {
      const hashtagData = { name: 'UPPERCASE' };

      const response = await request(app)
        .post('/hashtags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(hashtagData)
        .expect(201);

      expect(response.body.hashtag.name).toBe('uppercase');
    });
  });

  describe('GET /hashtags/popular', () => {
    it('should get popular hashtags', async () => {
      const response = await request(app)
        .get('/hashtags/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
      expect(Array.isArray(response.body.hashtags)).toBe(true);
      
      // Check that hashtags have usage count
      if (response.body.hashtags.length > 0) {
        const hashtag = response.body.hashtags[0];
        expect(hashtag).toHaveProperty('name');
        expect(hashtag).toHaveProperty('usage_count');
        expect(typeof hashtag.usage_count).toBe('number');
      }
    });

    it('should limit number of popular hashtags', async () => {
      const response = await request(app)
        .get('/hashtags/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.hashtags.length).toBeLessThanOrEqual(5);
    });
  });

  describe('PUT /hashtags/user', () => {
    it('should update user hashtags', async () => {
      const hashtagIds = ['test-hashtag-1', 'test-hashtag-2'];

      const response = await request(app)
        .put('/hashtags/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hashtag_ids: hashtagIds })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('hashtags');
      expect(Array.isArray(response.body.hashtags)).toBe(true);
    });

    it('should validate hashtag IDs exist', async () => {
      const invalidHashtagIds = ['non-existent-id'];

      const response = await request(app)
        .put('/hashtags/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hashtag_ids: invalidHashtagIds })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should limit number of hashtags per user', async () => {
      // Create array with too many hashtag IDs (assuming limit is 10)
      const tooManyHashtags = Array.from({ length: 15 }, (_, i) => `hashtag-${i}`);

      const response = await request(app)
        .put('/hashtags/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hashtag_ids: tooManyHashtags })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /hashtags/user', () => {
    it('should get current user hashtags', async () => {
      const response = await request(app)
        .get('/hashtags/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
      expect(Array.isArray(response.body.hashtags)).toBe(true);
    });
  });
});
