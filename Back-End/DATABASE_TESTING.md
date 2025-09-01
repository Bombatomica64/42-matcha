# Database Setup Options for Testing

## Option 1: Docker Compose (Recommended for Local Development)

This is the easiest way to run tests locally with a clean database each time.

### Setup:
```bash
# Start test database
npm run test:db:start

# Run tests
npm test

# Stop test database
npm run test:db:stop

# Clean up test data completely
npm run test:db:clean
```

### Features:
- ✅ Isolated test database
- ✅ Automatic schema setup
- ✅ Different port (5433) to avoid conflicts
- ✅ Easy cleanup

## Option 2: Existing PostgreSQL Instance

If you already have PostgreSQL running locally:

### Setup:
1. Create test database:
```sql
CREATE DATABASE matcha_test;
```

2. Update `.env.test`:
```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/matcha_test
```

3. Run schema setup:
```bash
psql -d matcha_test -f ../Db/init.sql
```

### Pros/Cons:
- ✅ Uses existing PostgreSQL installation
- ❌ Manual database management
- ❌ Risk of data conflicts

## Option 3: In-Memory Database (SQLite)

For very fast tests, you could use SQLite in memory, but this requires:
- Schema compatibility changes
- Different SQL syntax handling
- Mock PostGIS functions

Not recommended for this project due to PostGIS dependencies.

## Option 4: GitHub Actions / CI

For CI/CD, PostgreSQL service is configured in `.github/workflows/ci.yml`:

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: matcha_test
```

## Recommended Workflow

### For Development:
```bash
# One-time setup (if not done)
chmod +x scripts/*.sh

# Daily workflow
npm test  # Automatically starts/stops test DB

# For watching tests during development
npm run test:db:start
npm run test:watch  # In another terminal
# When done:
npm run test:db:stop
```

### For CI/CD:
- Use GitHub Actions with PostgreSQL service
- No Docker Compose needed in CI

## Database Configuration Details

### Test Database Differences:
- **Port**: 5433 (instead of 5432)
- **Name**: matcha_test
- **Bcrypt rounds**: 4 (faster tests)
- **JWT secrets**: Different from production
- **Email**: Disabled/mocked

### Schema Management:
- `init.sql` runs automatically on container start
- Tests clear and seed data before each test
- Transactions can be used for faster cleanup

## Troubleshooting

### Port Already in Use:
```bash
# Check what's using port 5433
lsof -i :5433

# Kill the process or change port in docker-compose.test.yml
```

### Permission Issues:
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Database Connection Issues:
```bash
# Check if test container is running
docker ps | grep matcha-test-db

# Check logs
docker logs matcha-test-db

# Connect manually to test
psql postgresql://matcha:matcha@localhost:5433/matcha_test
```

## Environment Variables Summary

Your `.env.test` should contain:
- Test database connection (port 5433)
- Different JWT secrets
- Lower bcrypt rounds
- Mock email settings
- Test-specific upload paths
