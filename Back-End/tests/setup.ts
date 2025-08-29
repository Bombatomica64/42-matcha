import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock console.log to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup needed for all tests
});

afterAll(async () => {
  // Cleanup after all tests
});
