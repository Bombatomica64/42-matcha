#!/bin/bash

# Start test database
echo "🚀 Starting test database..."
docker compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout 60s bash -c 'until docker exec matcha-test-db pg_isready -U matcha -d matcha_test; do sleep 1; done'

if [ $? -eq 0 ]; then
    echo "✅ Test database is ready!"
    echo "📍 Connection: postgresql://matcha:matcha@localhost:5433/matcha_test"
else
    echo "❌ Test database failed to start within 60 seconds"
    exit 1
fi
