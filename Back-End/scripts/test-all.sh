#!/bin/bash
set -e

# 1. Start Postgres test DB (if not running)
if ! docker ps | grep -q matcha-test-db; then
  echo "Starting test Postgres container..."
  docker run --rm -d --name matcha-test-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=matcha_test -p 5433:5432 postgis/postgis:16-3.4
  export STARTED_DB=1
  # Wait for DB to be ready
  for i in {1..20}; do
    docker exec matcha-test-db pg_isready -U postgres && break
    sleep 2
  done
fi

# 2. Run migrations/init SQL
export PGPASSWORD=postgres
psql -h localhost -p 5433 -U postgres -d matcha_test -f ../../Db/init.sql

# 3. Run lint
npm run lint

# 4. Run tests
npm run test:ci

# 5. Stop DB if we started it
if [ "$STARTED_DB" = "1" ]; then
  echo "Stopping test Postgres container..."
  docker stop matcha-test-db
fi
