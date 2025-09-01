import request from 'supertest';
import path from 'node:path';
import fs from 'node:fs';
import { createAndAuthenticateUser, createTestApp } from '../helpers/app.helper';
import { clearDatabase, closeTestPool, seedTestData } from '../helpers/database.helper';
import type { Express } from 'express';

describe('Photo Routes', () => {
  let app: Express;
  let authToken: string;
  let testImagePath: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Create a test image file
    testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    const testImageDir = path.dirname(testImagePath);
    
    // Create fixtures directory if it doesn't exist
    if (!fs.existsSync(testImageDir)) {
      fs.mkdirSync(testImageDir, { recursive: true });
    }
    
    // Create a minimal test image (1x1 pixel JPEG)
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02,
      0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00,
      0xB5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
      0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11,
      0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71,
      0x14, 0x32, 0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52,
      0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A, 0x16, 0x17, 0x18,
      0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36, 0x37,
      0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53,
      0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67,
      0x68, 0x69, 0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83,
      0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96,
      0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9,
      0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3,
      0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6,
      0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8,
      0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA,
      0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00,
      0x3F, 0x00, 0xF9, 0xFE, 0x8A, 0x28, 0xAF, 0xC3, 0x0F, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, minimalJpeg);
  });

  afterAll(async () => {
    await closeTestPool();
    
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
    
    // Create and authenticate a test user that can actually log in
    const userAuth = await createAndAuthenticateUser(app, {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'SecurePassword123!',
      birthDate: '1990-01-01',
      gender: 'male',
    });
    
    authToken = userAuth.token;
  });

  describe('POST /photos', () => {
    it('should upload a photo successfully', async () => {
      const response = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('photo');
      expect(response.body.photo).toHaveProperty('id');
      expect(response.body.photo).toHaveProperty('url');
      expect(response.body.photo).toHaveProperty('is_main');
    });

    it('should reject upload without authentication', async () => {
      const response = await request(app)
        .post('/photos')
        .attach('photo', testImagePath)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-image files', async () => {
      // Create a text file
      const textFilePath = path.join(__dirname, '../fixtures/test.txt');
      fs.writeFileSync(textFilePath, 'This is not an image');

      const response = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', textFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('error');

      // Clean up
      fs.unlinkSync(textFilePath);
    });

    it('should set first photo as main photo automatically', async () => {
      const response = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath)
        .expect(201);

      expect(response.body.photo.is_main).toBe(true);
    });
  });

  describe('GET /photos', () => {
    it('should get current user photos', async () => {
      // First upload a photo
      await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath);

      // Then get user photos
      const response = await request(app)
        .get('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('photos');
      expect(Array.isArray(response.body.photos)).toBe(true);
      expect(response.body.photos.length).toBeGreaterThan(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/photos')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /photos/:photoId/main', () => {
    let photoId: string;

    beforeEach(async () => {
      // Upload a photo first
      const uploadResponse = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath);
      
      photoId = uploadResponse.body.photo.id;
    });

    it('should set photo as main photo', async () => {
      const response = await request(app)
        .post(`/photos/${photoId}/main`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('photo');
      expect(response.body.photo.is_main).toBe(true);
    });

    it('should reject setting non-existent photo as main', async () => {
      const response = await request(app)
        .post('/photos/non-existent-id/main')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post(`/photos/${photoId}/main`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /photos/:photoId', () => {
    let photoId: string;

    beforeEach(async () => {
      // Upload a photo first
      const uploadResponse = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath);
      
      photoId = uploadResponse.body.photo.id;
    });

    it('should delete photo successfully', async () => {
      const response = await request(app)
        .delete(`/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .delete('/photos/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .delete(`/photos/${photoId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /photos/:photoId', () => {
    let photoId: string;

    beforeEach(async () => {
      // Upload a photo first
      const uploadResponse = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath);
      
      photoId = uploadResponse.body.photo.id;
    });

    it('should get photo details', async () => {
      const response = await request(app)
        .get(`/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('photo');
      expect(response.body.photo).toHaveProperty('id', photoId);
      expect(response.body.photo).toHaveProperty('url');
      expect(response.body.photo).toHaveProperty('is_main');
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .get('/photos/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get(`/photos/${photoId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Photo upload limits', () => {
    it('should enforce maximum photos per user', async () => {
      // Upload maximum allowed photos (assuming limit is 5)
      const maxPhotos = 5;
      
      for (let i = 0; i < maxPhotos; i++) {
        await request(app)
          .post('/photos')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('photo', testImagePath)
          .expect(201);
      }

      // Try to upload one more - should fail
      const response = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('maximum');
    });
  });

  describe('Photo file validation', () => {
    it('should enforce file size limits', async () => {
      // Create a large file (this is a simple test, in reality you'd need a very large file)
      const largeFilePath = path.join(__dirname, '../fixtures/large-file.jpg');
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      fs.writeFileSync(largeFilePath, largeBuffer);

      const response = await request(app)
        .post('/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', largeFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('error');

      // Clean up
      fs.unlinkSync(largeFilePath);
    });

    it('should only accept image file types', async () => {
      const disallowedTypes = ['txt', 'pdf', 'doc', 'mp4'];

      for (const type of disallowedTypes) {
        const filePath = path.join(__dirname, `../fixtures/test.${type}`);
        fs.writeFileSync(filePath, 'test content');

        const response = await request(app)
          .post('/photos')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('photo', filePath)
          .expect(400);

        expect(response.body).toHaveProperty('error');

        // Clean up
        fs.unlinkSync(filePath);
      }
    });
  });
});
