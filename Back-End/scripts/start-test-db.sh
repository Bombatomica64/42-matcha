#!/bin/bash

#!/bin/bash

# Start test services (Postgres + Redis)
echo "🚀 Starting test services (Postgres + Redis)..."
docker compose -f docker-compose.test.yml up -d

DB_CONTAINER=$(docker compose -f docker-compose.test.yml ps -q test-db)
REDIS_CONTAINER=$(docker compose -f docker-compose.test.yml ps -q test-redis)

# Wait for database to be ready
echo "⏳ Waiting for Postgres to be ready..."
timeout 60s bash -c "until docker exec $DB_CONTAINER pg_isready -U matcha -d matcha_test; do sleep 1; done"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
timeout 60s bash -c "until docker exec $REDIS_CONTAINER sh -c 'redis-cli ping | grep PONG'; do sleep 1; done"

if [ $? -eq 0 ]; then
    echo "✅ Test services are ready!"
    echo "📍 Postgres: postgresql://matcha:matcha@localhost:5433/matcha_test"
    echo "📍 Redis: redis://localhost:6380"
else
    echo "❌ Test services failed to start within 60 seconds"
    exit 1
fi
