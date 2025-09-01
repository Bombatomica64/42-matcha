import type { Express } from 'express';
import request from 'supertest';
import { createTestUserInDB } from './database.helper';

export const createTestApp = async (): Promise<Express> => {
  // Import app without starting the server
  const { app } = await import('../../src/server');
  return app;
};

export const authenticateUser = async (app: Express, credentials: { email: string; password: string }) => {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email_or_username: credentials.email,
      password: credentials.password
    });
    
  if (response.status !== 200) {
    console.log('Login failed with status:', response.status);
    console.log('Response body:', response.body);
    console.log('Credentials used:', credentials);
    throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.body)}`);
  }
    
  return response.body.token;
};

/**
 * Create a test user that can actually authenticate (bypasses email verification)
 * Returns the user ID and credentials for testing
 */
export const createAuthenticatableUser = async (userData?: Partial<{
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  birthDate: string;
  gender: string;
  bio: string;
}>): Promise<{ userId: string; credentials: { email: string; password: string } }> => {
  const defaultData = {
    email: 'testuser@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    birthDate: '1990-01-01',
    gender: 'male',
    bio: 'Test user for authentication',
    ...userData
  };

  const userId = await createTestUserInDB(defaultData);
  
  return {
    userId,
    credentials: {
      email: defaultData.email,
      password: defaultData.password
    }
  };
};

/**
 * Create a test user and get authentication token in one step
 */
export const createAndAuthenticateUser = async (
  app: Express, 
  userData?: Parameters<typeof createAuthenticatableUser>[0]
): Promise<{ userId: string; token: string; credentials: { email: string; password: string } }> => {
  const { userId, credentials } = await createAuthenticatableUser(userData);
  const token = await authenticateUser(app, credentials);
  
  return { userId, token, credentials };
};

/**
 * @deprecated Use createAuthenticatableUser instead - this won't work due to email verification
 */
export const createTestUser = async (app: Express, userData: {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  birthDate: string;
  gender: string;
}) => {
  const response = await request(app)
    .post('/auth/register')
    .send({
      email: userData.email,
      username: userData.username,
      first_name: userData.firstName,
      last_name: userData.lastName,
      password: userData.password,
      birth_date: userData.birthDate,
      gender: userData.gender,
    });
    
  return response;
};
