#!/bin/bash

# Stop and remove test database
echo "🛑 Stopping test database..."
docker compose -f docker-compose.test.yml down

# Remove volumes if --clean flag is provided
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning up test database volumes..."
    docker compose -f docker-compose.test.yml down -v
    docker volume rm back-end_test_db_data 2>/dev/null || true
    echo "✅ Test database cleaned up"
else
    echo "✅ Test database stopped (data preserved)"
    echo "💡 Use --clean flag to remove all test data"
fi
