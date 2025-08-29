# Testing Guide for Matcha Backend

This guide explains how to run and write tests for the Matcha Express.js backend application.

## Test Setup

The testing framework uses:
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library for testing Express apps
- **ts-jest** - TypeScript preprocessor for Jest

## Configuration Files

- `jest.config.js` - Jest configuration with TypeScript support and path mapping
- `.env.test` - Environment variables for testing
- `tests/setup.ts` - Global test setup and configuration

## Test Structure

```
tests/
├── setup.ts                 # Global test setup
├── helpers/
│   ├── app.helper.ts        # Express app testing utilities
│   └── database.helper.ts   # Database testing utilities
├── routes/
│   ├── health.test.ts       # Health endpoint tests
│   ├── auth.test.ts         # Authentication tests
│   └── user.test.ts         # User routes tests
└── utils/
    └── utils.test.ts        # Utility functions tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (no watch mode, with coverage)
npm run test:ci
```

### Specific Test Files

```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="authentication"

# Run tests in a specific directory
npm test -- tests/routes/
```

## Environment Setup

### Database Setup

1. Create a test database (separate from development):
```sql
CREATE DATABASE matcha_test;
```

2. Update `.env.test` with your test database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matcha_test
DB_USER=your_test_user
DB_PASSWORD=your_test_password
```

### Important Notes

- Tests use a **separate test database** to avoid affecting development data
- Database is **cleared between tests** to ensure test isolation
- Tests run **sequentially** (maxWorkers: 1) to avoid database conflicts
- Console logs are **mocked** to reduce noise during testing

## Writing Tests

### Basic Test Structure

```typescript
import request from 'supertest';
import { createTestApp } from '../helpers/app.helper';
import { clearDatabase, closeTestPool } from '../helpers/database.helper';
import type { Express } from 'express';

describe('Feature Name', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Add test data if needed
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('expectedProperty');
  });
});
```

### Testing Authenticated Routes

```typescript
import { authenticateUser, createTestUser } from '../helpers/app.helper';

describe('Protected Routes', () => {
  let app: Express;
  let authToken: string;

  beforeEach(async () => {
    await clearDatabase();
    
    // Create and authenticate a test user
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'SecurePassword123',
      birthDate: '1990-01-01',
      gender: 'male',
    };

    await createTestUser(app, userData);
    authToken = await authenticateUser(app, {
      email: userData.email,
      password: userData.password,
    });
  });

  it('should access protected route', async () => {
    const response = await request(app)
      .get('/protected-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
```

### Testing Database Operations

```typescript
import { seedTestData, testQuery } from '../helpers/database.helper';

describe('Database Operations', () => {
  beforeEach(async () => {
    await clearDatabase();
    await seedTestData(); // Adds test users and data
  });

  it('should query database', async () => {
    const result = await testQuery('SELECT * FROM users WHERE username = $1', ['testuser1']);
    expect(result.rows).toHaveLength(1);
  });
});
```

## Test Categories

### 1. Health and Basic Routes (`health.test.ts`)
- Health check endpoint
- Root endpoint
- Swagger documentation endpoint

### 2. Authentication Tests (`auth.test.ts`)
- User registration validation
- Login functionality
- Token refresh mechanism
- Password validation
- Duplicate email handling

### 3. User Routes Tests (`user.test.ts`)
- Profile retrieval and updates
- User discovery with filters
- Pagination testing
- Authorization checks

### 4. Utility Tests (`utils.test.ts`)
- Password hashing and verification
- JWT token generation and validation
- Email validation
- Username validation

## Test Helpers

### App Helper (`app.helper.ts`)
```typescript
// Create test app instance
const app = await createTestApp();

// Create a test user
await createTestUser(app, userData);

// Authenticate and get token
const token = await authenticateUser(app, credentials);
```

### Database Helper (`database.helper.ts`)
```typescript
// Clear all tables
await clearDatabase();

// Seed test data
await seedTestData();

// Execute custom query
await testQuery('SELECT * FROM users');

// Close connection pool
await closeTestPool();
```

## Coverage Reports

Coverage reports show which parts of your code are tested:

```bash
npm run test:coverage
```

This generates:
- Console output with coverage percentages
- HTML report in `coverage/lcov-report/index.html`
- LCOV file for CI/CD integration

## CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Sets up PostgreSQL test database
- Installs dependencies
- Runs linting
- Executes tests with coverage
- Uploads coverage reports

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 2. Descriptive Test Names
```typescript
// Good
it('should return 401 when accessing protected route without token', () => {});

// Bad
it('should fail', () => {});
```

### 3. Test Both Success and Failure Cases
```typescript
describe('User Registration', () => {
  it('should register user with valid data', () => {});
  it('should reject invalid email format', () => {});
  it('should reject duplicate email', () => {});
  it('should reject weak password', () => {});
});
```

### 4. Use Meaningful Assertions
```typescript
// Good
expect(response.body).toHaveProperty('token');
expect(response.body.user).not.toHaveProperty('password');

// Less informative
expect(response.status).toBe(200);
```

### 5. Group Related Tests
```typescript
describe('Authentication', () => {
  describe('POST /auth/register', () => {
    // Registration tests
  });
  
  describe('POST /auth/login', () => {
    // Login tests
  });
});
```

## Debugging Tests

### View Test Output
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with detailed output
npm test -- --testNamePattern="specific test" --verbose
```

### Debug Database Issues
```typescript
// Add debug queries in tests
const result = await testQuery('SELECT * FROM users');
console.log('Users in database:', result.rows);
```

### Check Test Database State
```bash
# Connect to test database
psql -h localhost -U your_user -d matcha_test

# List tables
\dt

# Check specific table
SELECT * FROM users;
```

## Common Issues and Solutions

### 1. Database Connection Issues
- Ensure test database exists and credentials are correct
- Check that database service is running
- Verify `.env.test` configuration

### 2. Path Resolution Issues
- Check `jest.config.js` module name mapping
- Ensure TypeScript paths are correctly configured

### 3. Async/Await Issues
- Always use `await` for database operations
- Ensure `beforeAll`, `beforeEach`, `afterAll` are async

### 4. Test Timeouts
- Increase timeout in `jest.config.js` if needed
- Ensure database operations complete properly

This testing setup provides comprehensive coverage for your Express.js application while maintaining good practices for maintainability and reliability.
