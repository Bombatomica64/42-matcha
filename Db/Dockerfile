FROM postgis/postgis:latest

# Clean up package cache (PostGIS is already installed in this image)
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*

EXPOSE 5432
# Copy initialization script
COPY ./init.sql /docker-entrypoint-initdb.d/

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-postgres} -c "SELECT 1;" || exit 1