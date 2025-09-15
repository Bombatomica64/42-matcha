#!/bin/bash

# Stop and remove test services (DB + Redis)
echo "🛑 Stopping test services (Postgres + Redis)..."
docker compose -f docker-compose.test.yml down

# Remove volumes if --clean flag is provided
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning up test services volumes..."
    docker compose -f docker-compose.test.yml down -v
    echo "✅ Test services cleaned up"
else
    echo "✅ Test services stopped (data preserved)"
    echo "💡 Use --clean flag to remove all test data"
fi
