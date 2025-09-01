# Testing Guide for Matcha Backend

This guide covers the comprehensive testing setup for the Matcha dating app backend.

## Overview

The testing framework uses:
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion library for testing Express applications
- **TypeScript** - Full TypeScript support for tests
- **PostgreSQL** - Test database for integration tests

## Project Structure

```
tests/
├── setup.ts                     # Global test setup
├── helpers/
│   ├── app.helper.ts            # Express app test utilities
│   └── database.helper.ts       # Database test utilities
├── routes/
│   ├── auth.test.ts            # Authentication endpoint tests
│   ├── user.test.ts            # User management endpoint tests
│   ├── hashtag.test.ts         # Hashtag endpoint tests
│   └── photo.test.ts           # Photo upload/management tests
├── utils/
│   └── utils.test.ts           # Utility function tests
└── integration/
    └── app.integration.test.ts  # End-to-end integration tests
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install --save-dev jest @types/jest supertest @types/supertest ts-jest
```

### 2. Environment Configuration

Create a `.env.test` file:

```env
NODE_ENV=test
PORT=3001
HOST=localhost

# Database - Use a separate test database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matcha_test
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Secrets (different from production)
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key

# Other configuration...
```

### 3. Database Setup

Create a test database:

```sql
CREATE DATABASE matcha_test;
```

Run your database migrations on the test database to create the required tables.

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI/CD Pipeline
```bash
npm run test:ci
```

## Test Categories

### 1. Unit Tests (`tests/utils/`)

Test individual utility functions in isolation:
- Password hashing and verification
- JWT token generation and validation
- Email and password validation
- Username validation

**Example:**
```typescript
describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });
});
```

### 2. Route Tests (`tests/routes/`)

Test individual API endpoints:

#### Authentication Tests
- User registration with validation
- User login with credentials
- Token refresh functionality
- Error handling for invalid inputs

#### User Management Tests
- Profile retrieval and updates
- User discovery with filters
- Profile completeness validation

#### Hashtag Tests
- Hashtag creation and search
- User hashtag associations
- Popular hashtags endpoint

#### Photo Tests
- Photo upload with file validation
- Photo management (set as profile, delete)
- File type and size restrictions

### 3. Integration Tests (`tests/integration/`)

Test complete user workflows:
- User discovery and matching flow
- Like/dislike and match creation
- Block/unblock functionality
- Location-based filtering
- Database consistency checks

**Example Integration Test:**
```typescript
it('should create match when both users like each other', async () => {
  // User1 likes User2
  await request(app)
    .post(`/users/${user2Id}/like`)
    .set('Authorization', `Bearer ${user1Token}`)
    .expect(200);

  // User2 likes User1 back - should create match
  const response = await request(app)
    .post(`/users/${user1Id}/like`)
    .set('Authorization', `Bearer ${user2Token}`)
    .expect(200);

  expect(response.body).toHaveProperty('match', true);
});
```

## Test Utilities

### Database Helpers

```typescript
import { clearDatabase, seedTestData, testQuery } from '../helpers/database.helper';

// Clear all tables before each test
beforeEach(async () => {
  await clearDatabase();
  await seedTestData();
});

// Run custom queries for verification
const result = await testQuery('SELECT COUNT(*) FROM users');
```

### App Helpers

```typescript
import { createTestApp, createTestUser, authenticateUser } from '../helpers/app.helper';

// Create Express app instance for testing
const app = await createTestApp();

// Create and authenticate test users
const userData = { email: 'test@example.com', /* ... */ };
await createTestUser(app, userData);
const token = await authenticateUser(app, { email, password });
```

## Best Practices

### 1. Test Isolation
- Each test is independent
- Database is cleared before each test
- Fresh test data is seeded

### 2. Realistic Test Data
- Use meaningful test data
- Test edge cases and validation
- Include both valid and invalid inputs

### 3. Error Testing
- Test error responses
- Verify error messages
- Check HTTP status codes

### 4. Authentication Testing
- Test protected endpoints
- Verify token validation
- Test unauthorized access

### 5. Database Testing
- Verify data persistence
- Check referential integrity
- Test complex queries

## Coverage Goals

Aim for high test coverage across:
- **Routes**: 90%+ coverage of all endpoints
- **Controllers**: All business logic paths
- **Services**: Core application logic
- **Utilities**: All helper functions
- **Integration**: Complete user workflows

## Continuous Integration

Tests run automatically on:
- Pull requests to `main` and `develop`
- Pushes to protected branches
- GitHub Actions workflow with PostgreSQL service

### CI Configuration

The GitHub Actions workflow:
1. Sets up Node.js and PostgreSQL
2. Installs dependencies
3. Runs database migrations
4. Executes all tests with coverage
5. Reports results and coverage

## Debugging Tests

### Common Issues

1. **Database connection errors**
   - Verify test database exists
   - Check connection credentials
   - Ensure database is accessible

2. **JWT secret errors**
   - Set JWT_SECRET in test environment
   - Use different secrets for testing

3. **File upload tests failing**
   - Check file permissions
   - Verify upload directory exists
   - Test file size limits

### Debugging Commands

```bash
# Run specific test file
npm test -- auth.test.ts

# Run with verbose output
npm test -- --verbose

# Run single test case
npm test -- --testNamePattern="should register user"

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Considerations

- Tests run with `maxWorkers: 1` for database consistency
- Use transactions for faster test cleanup
- Mock external services when possible
- Keep test database small and focused

## Security Testing

Include tests for:
- SQL injection prevention
- XSS protection
- Authentication bypass attempts
- Authorization checks
- Input sanitization

## Maintenance

- Update tests when API changes
- Add tests for new features
- Review and refactor test helpers
- Monitor test execution time
- Update dependencies regularly

This comprehensive testing setup ensures your Matcha backend is reliable, secure, and maintainable.
