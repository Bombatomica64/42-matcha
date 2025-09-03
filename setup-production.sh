#!/bin/bash

# Production Setup Script for Matcha

echo "🚀 Setting up Matcha for Production with Cloudflare Tunnel"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure your Cloudflare token:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    echo "📝 To get your Cloudflare token:"
    echo "   1. Go to https://dash.cloudflare.com"
    echo "   2. Navigate to Zero Trust -> Access -> Tunnels"
    echo "   3. Create a new tunnel or use existing one"
    echo "   4. Copy the token and paste it in .env file"
    exit 1
fi

# Load environment variables
source .env

# Verify Cloudflare token is set
if [ -z "$CLOUDFLARE_TOKEN" ] || [ "$CLOUDFLARE_TOKEN" = "your_cloudflare_tunnel_token_here" ]; then
    echo "❌ Please set your CLOUDFLARE_TOKEN in the .env file"
    exit 1
fi

echo "✅ Environment configuration verified"

# Build and start services
echo "🔧 Building and starting services..."
docker compose down
docker compose build --no-cache
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "📍 Your application should be accessible through your Cloudflare tunnel URL"
echo "🔧 Traefik dashboard: http://localhost:8080"
echo "📝 To view logs: docker compose logs -f"
echo "🛑 To stop: docker compose down"
