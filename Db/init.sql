-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

SELECT PostGIS_Version();

-- Create users table with location support
CREATE TABLE IF NOT EXISTS users (
		uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		username VARCHAR(50) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		age INTEGER CHECK (age >= 0),
		password VARCHAR(255) NOT NULL,
		bio TEXT,
		first_name VARCHAR(50),
		last_name VARCHAR(50),
		activated BOOLEAN DEFAULT FALSE,
		location geography(Point, 4326), -- PostGIS geography type for lat/lng
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location queries
CREATE INDEX idx_users_location ON users USING GIST (location);


-- Create photos table for local storage
CREATE TABLE IF NOT EXISTS user_photos (
        id SERIAL PRIMARY KEY,
        user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL, -- e.g., "photo_1.jpg"
        original_filename VARCHAR(255), -- User's original filename
        file_path VARCHAR(500) NOT NULL, -- e.g., "uploads/users/{uuid}/photo_1.jpg"
        file_size INTEGER,
        mime_type VARCHAR(50),
        is_primary BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one primary photo per user
CREATE UNIQUE INDEX idx_one_primary_photo_per_user 
ON user_photos (user_uuid)
WHERE is_primary = true;

-- Index for efficient queries
CREATE INDEX idx_user_photos_user_uuid ON user_photos(user_uuid);

-- Constraint: Max 5 photos per user (as per your specs)
CREATE OR REPLACE FUNCTION check_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM user_photos WHERE user_uuid = NEW.user_uuid) >= 5 THEN
        RAISE EXCEPTION 'User cannot have more than 5 photos';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_limit_trigger
    BEFORE INSERT ON user_photos
    FOR EACH ROW
    EXECUTE FUNCTION check_photo_limit();