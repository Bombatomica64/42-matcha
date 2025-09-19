-- Migration: Add auth providers and user identities tables
-- Creates registry for OAuth2/SAML providers and links users to external identities

BEGIN;

-- Auth providers registry
CREATE TABLE IF NOT EXISTS auth_providers (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'google', 'university_saml'
    name VARCHAR(100) NOT NULL,      -- Display name
    type VARCHAR(20) NOT NULL CHECK (type IN ('oauth2', 'saml')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB,                    -- Optional provider-specific config/metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- External identities linked to local users
CREATE TABLE IF NOT EXISTS user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL REFERENCES auth_providers(id) ON DELETE CASCADE,
    provider_user_id VARCHAR(255) NOT NULL,  -- Subject/ID from provider
    email VARCHAR(255),
    profile JSONB,                           -- Raw profile payload (safe subset)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id, provider_user_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_identities_user ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_provider ON user_identities(provider_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_email ON user_identities(email);

-- Seed common providers (idempotent)
INSERT INTO auth_providers(key, name, type)
    VALUES
        ('google', 'Google', 'oauth2'),
        ('university_saml', 'University SAML', 'saml')
ON CONFLICT (key) DO NOTHING;

-- Optional: add lightweight columns on users to store common provider linkage
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS university_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) CHECK (auth_provider IN ('local','google','university'));

-- Helpful partial unique indexes for optional columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id) WHERE university_id IS NOT NULL;

COMMIT;