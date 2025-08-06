FROM postgis/postgis:latest

# Clean up package cache (PostGIS is already installed in this image)
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set database configuration
ARG POSTGRES_USER=matcha
ARG POSTGRES_PASSWORD=matcha
ARG POSTGRES_DB=matcha

ENV POSTGRES_USER=${POSTGRES_USER}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ENV POSTGRES_DB=${POSTGRES_DB}

# Copy initialization script
COPY ./init.sql /docker-entrypoint-initdb.d/