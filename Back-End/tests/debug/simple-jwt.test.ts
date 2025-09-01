import request from 'supertest';
import { createTestApp } from '../helpers/app.helper';
import { clearDatabase, closeTestPool, createTestUserInDB, seedTestData } from '../helpers/database.helper';
import type { Express } from 'express';

describe('Simple JWT Debug', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
  });

  it('should test basic login flow', async () => {
    // Create user directly in database
    const userId = await createTestUserInDB({
      email: 'simple@test.com',
      username: 'simpleuser',
      firstName: 'Simple',
      lastName: 'Test',
      password: 'SimpleTest123!',
      birthDate: '1990-01-01',
      gender: 'male'
    });

    process.stderr.write(`\n=== Created user with ID: ${userId} ===\n`);

    // Try to login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email_or_username: 'simple@test.com',
        password: 'SimpleTest123!'
      });

    process.stderr.write(`\n=== Login response ===\n`);
    process.stderr.write(`Status: ${loginResponse.status}\n`);
    process.stderr.write(`Body: ${JSON.stringify(loginResponse.body, null, 2)}\n`);
    process.stderr.write(`Has token: ${!!loginResponse.body.token}\n`);

    if (loginResponse.status === 200 && loginResponse.body.token) {
      // Test the token manually
      try {
        const { verifyJwt } = require('../../src/utils/jwt');
        const decoded = verifyJwt(loginResponse.body.token);
        process.stderr.write(`\n=== Token verification ===\n`);
        process.stderr.write(`Success: ${!!decoded}\n`);
        process.stderr.write(`UserId: ${decoded?.userId}\n`);
        process.stderr.write(`Type: ${decoded?.type}\n`);
        process.stderr.write(`Username: ${decoded?.username}\n`);
      } catch (error) {
        process.stderr.write(`\n=== Token verification error ===\n`);
        process.stderr.write(`${error}\n`);
      }

      // Test protected endpoint
      process.stderr.write(`\n=== Testing protected endpoint ===\n`);
      const profileResponse = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      process.stderr.write(`Profile status: ${profileResponse.status}\n`);
      process.stderr.write(`Profile body: ${JSON.stringify(profileResponse.body, null, 2)}\n`);
    }

    expect(loginResponse.status).toBe(200);
  });
});
