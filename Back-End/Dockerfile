FROM node:latest AS build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy entire source directory structure
COPY src/ ./src/

# Build the application
RUN npm run build

FROM node:lts-alpine AS production

WORKDIR /app

# Copy built application and package files
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use the correct entry point from package.json
CMD ["node", "dist/index.js"]
