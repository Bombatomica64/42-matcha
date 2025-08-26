FROM postgis/postgis:latest

# Clean up package cache (PostGIS is already installed in this image)
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*

EXPOSE 5432
# Copy initialization script
COPY ./init.sql /docker-entrypoint-initdb.d/