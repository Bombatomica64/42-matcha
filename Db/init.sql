-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

SELECT PostGIS_Version();

-- Create users table with location support
CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		username VARCHAR(50) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		birth_date DATE CHECK (birth_date <= CURRENT_DATE),
		password VARCHAR(255) NOT NULL,
		bio TEXT,
		first_name VARCHAR(50),
		last_name VARCHAR(50),
		activated BOOLEAN DEFAULT FALSE,
		profile_complete BOOLEAN DEFAULT FALSE,
		gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
		sexual_orientation VARCHAR(20) DEFAULT 'bisexual' CHECK (sexual_orientation IN ('heterosexual', 'homosexual', 'bisexual')),
		location geography(Point, 4326), -- PostGIS geography type for lat/lng
		location_manual BOOLEAN DEFAULT FALSE, -- If user manually set location
		fame_rating DECIMAL(2,1) DEFAULT 1.0 CHECK (fame_rating >= 0.0 AND fame_rating <= 5.0), -- Fame rating 0-5
		last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		online_status BOOLEAN DEFAULT FALSE,
		email_verification_token VARCHAR(255),
		email_verified_at TIMESTAMP,
		password_reset_token VARCHAR(255),
		password_reset_expires_at TIMESTAMP,
		likes_received_count INTEGER DEFAULT 0,
		likes_given_count INTEGER DEFAULT 0,
		views_count INTEGER DEFAULT 0,
		matches_count INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location queries
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_users_likes_received ON users(likes_received_count);
CREATE INDEX idx_users_profile_views ON users(views_count);
CREATE INDEX idx_users_matches ON users(matches_count);

-- Create photos table for local storage
CREATE TABLE IF NOT EXISTS user_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL, -- e.g., "photo_1.jpg"
        original_filename VARCHAR(255), -- User's original filename
        file_path VARCHAR(500) NOT NULL, -- e.g., "uploads/users/{id}/photo_1.jpg"
        file_size INTEGER,
        mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/gif')),
        is_primary BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one primary photo per user
CREATE UNIQUE INDEX idx_one_primary_photo_per_user 
ON user_photos (user_id)
WHERE is_primary = true;

-- Index for efficient queries
CREATE INDEX idx_user_photos_user_id ON user_photos(user_id);

-- Constraint: Max 5 photos per user (as per your specs)
CREATE OR REPLACE FUNCTION check_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM user_photos WHERE user_id = NEW.user_id) >= 5 THEN
        RAISE EXCEPTION 'User cannot have more than 5 photos';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_limit_trigger
    BEFORE INSERT ON user_photos
    FOR EACH ROW
    EXECUTE FUNCTION check_photo_limit();


CREATE INDEX IF NOT EXISTS  idx_user_photos_filename ON user_photos(filename);

-- Create Tags table
CREATE TABLE IF NOT EXISTS hashtags (
		id SERIAL PRIMARY KEY,
		name VARCHAR(50) NOT NULL UNIQUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create User Tags table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_hashtags (
		user_id UUID REFERENCES users(id) ON DELETE CASCADE,
		hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
		PRIMARY KEY (user_id, hashtag_id),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create likes table for user likes/dislikes
CREATE TABLE IF NOT EXISTS user_likes (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		liker_id UUID REFERENCES users(id) ON DELETE CASCADE,
		liked_id UUID REFERENCES users(id) ON DELETE CASCADE,
		is_like BOOLEAN NOT NULL, -- true for like, false for dislike
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(liker_id, liked_id) -- Prevent duplicate likes
);

-- Create matches table for mutual likes
CREATE TABLE IF NOT EXISTS matches (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
		user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user1_id, user2_id)
);

-- Create profile views table
CREATE TABLE IF NOT EXISTS profile_views (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
		viewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
		blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(blocker_id, blocked_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS user_reports (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
		reported_id UUID REFERENCES users(id) ON DELETE CASCADE,
		reason VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table for chat
CREATE TABLE IF NOT EXISTS messages (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
		sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
		content TEXT NOT NULL,
		read_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID REFERENCES users(id) ON DELETE CASCADE,
		type VARCHAR(50) NOT NULL, -- 'like', 'view', 'match', 'unlike', 'message'
		related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
		message TEXT,
		read_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_likes_liker ON user_likes(liker_id);
CREATE INDEX idx_user_likes_liked ON user_likes(liked_id);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_online_status ON users(online_status);

-- Function to update like counters
CREATE OR REPLACE FUNCTION update_like_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment counters
        UPDATE users SET likes_given_count = likes_given_count + 1 WHERE id = NEW.liker_id;
        IF NEW.is_like = true THEN
            UPDATE users SET likes_received_count = likes_received_count + 1 WHERE id = NEW.liked_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement counters
        UPDATE users SET likes_given_count = likes_given_count - 1 WHERE id = OLD.liker_id;
        IF OLD.is_like = true THEN
            UPDATE users SET likes_received_count = likes_received_count - 1 WHERE id = OLD.liked_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile view counter
CREATE OR REPLACE FUNCTION update_view_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET profile_views_count = profile_views_count + 1 WHERE id = NEW.viewed_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update match counter
CREATE OR REPLACE FUNCTION update_match_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET matches_count = matches_count + 1 WHERE id = NEW.user1_id;
        UPDATE users SET matches_count = matches_count + 1 WHERE id = NEW.user2_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET matches_count = matches_count - 1 WHERE id = OLD.user1_id;
        UPDATE users SET matches_count = matches_count - 1 WHERE id = OLD.user2_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER like_counter_trigger
    AFTER INSERT OR DELETE ON user_likes
    FOR EACH ROW EXECUTE FUNCTION update_like_counters();

CREATE TRIGGER view_counter_trigger
    AFTER INSERT ON profile_views
    FOR EACH ROW EXECUTE FUNCTION update_view_counter();

CREATE TRIGGER match_counter_trigger
    AFTER INSERT OR DELETE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_match_counters();