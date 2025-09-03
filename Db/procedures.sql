-- Ensure old version (wrong return type) is removed so we can change column type
DROP FUNCTION IF EXISTS get_discoverable_users(UUID, INTEGER, INTEGER, INTEGER, DECIMAL, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_discoverable_users(
    p_user_id UUID,
    p_max_distance INTEGER DEFAULT 50,
    p_age_min INTEGER DEFAULT 18,
    p_age_max INTEGER DEFAULT 100,
    p_min_fame_rating DECIMAL DEFAULT 0,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
    id UUID,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    gender VARCHAR,
    sexual_orientation VARCHAR,
    birth_date DATE,
    bio TEXT,
    fame_rating DECIMAL,
    online_status BOOLEAN,
    last_seen TIMESTAMP,
    location geography(Point,4326), -- align with table users.location type
    distance_km DECIMAL,
    compatibility_score DECIMAL,
    age INTEGER,
    common_hashtags INTEGER,
    photo_count INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH user_location AS (
        SELECT u.location, u.gender, u.sexual_orientation
        FROM users u
        WHERE u.id = p_user_id
    ),
    compatible_genders AS (
        SELECT CASE
            WHEN ul.sexual_orientation = 'heterosexual' THEN
                CASE
                    WHEN ul.gender = 'male' THEN ARRAY['female']
                    WHEN ul.gender = 'female' THEN ARRAY['male']
                    ELSE ARRAY['male', 'female']
                END
            WHEN ul.sexual_orientation = 'homosexual' THEN ARRAY[ul.gender]
            WHEN ul.sexual_orientation = 'bisexual' THEN ARRAY['male', 'female', 'other']
            ELSE ARRAY['male', 'female', 'other']
        END as genders
        FROM user_location ul
    ),
    blocked_users AS (
        SELECT blocked_id as user_id FROM user_blocks WHERE blocker_id = p_user_id
        UNION
        SELECT blocker_id as user_id FROM user_blocks WHERE blocked_id = p_user_id
    ),
    already_rated AS (
        SELECT liked_id as user_id FROM user_likes WHERE liker_id = p_user_id
    ),
    potential_matches AS (
        SELECT
            u.id,
            u.username,
            u.first_name,
            u.last_name,
            u.gender,
            u.sexual_orientation,
            u.birth_date,
            u.bio,
            u.fame_rating,
            u.online_status,
            u.last_seen,
            u.location,
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date))::INTEGER as age,
            CASE
                WHEN u.location IS NOT NULL AND ul.location IS NOT NULL
                THEN (ST_Distance(u.location, ul.location) / 1000.0)::DECIMAL
                ELSE NULL
            END as distance_km,
            (
                SELECT COUNT(*)::INTEGER
                FROM user_hashtags uh1
                JOIN user_hashtags uh2 ON uh1.hashtag_id = uh2.hashtag_id
                WHERE uh1.user_id = p_user_id AND uh2.user_id = u.id
            ) as common_hashtags,
            (SELECT COUNT(*)::INTEGER FROM user_photos WHERE user_id = u.id) as photo_count,
            CASE
                WHEN u.online_status = true THEN 100
                WHEN u.last_seen > NOW() - INTERVAL '1 day' THEN 80
                WHEN u.last_seen > NOW() - INTERVAL '3 days' THEN 60
                WHEN u.last_seen > NOW() - INTERVAL '7 days' THEN 40
                WHEN u.last_seen > NOW() - INTERVAL '30 days' THEN 20
                ELSE 10
            END as activity_score
        FROM users u
        CROSS JOIN user_location ul
        CROSS JOIN compatible_genders cg
        WHERE u.id != p_user_id
            AND u.activated = true
            AND u.profile_complete = true
            AND u.gender = ANY(cg.genders)
            AND u.id NOT IN (SELECT user_id FROM blocked_users)
            AND u.id NOT IN (SELECT user_id FROM already_rated)
            AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) BETWEEN p_age_min AND p_age_max
            AND u.fame_rating >= p_min_fame_rating
            AND (
                u.location IS NULL
                OR ul.location IS NULL
                OR ST_Distance(u.location, ul.location) / 1000.0 <= p_max_distance
            )
            AND (SELECT COUNT(*) FROM user_photos WHERE user_id = u.id) > 0
    )
    SELECT
        pm.id,
        pm.username,
        pm.first_name,
        pm.last_name,
        pm.gender,
        pm.sexual_orientation,
        pm.birth_date,
        pm.bio,
        pm.fame_rating,
        pm.online_status,
        pm.last_seen,
    pm.location::geography(Point,4326),
        pm.distance_km,
        (
            (pm.fame_rating / 5.0) * 20 +
            LEAST(pm.common_hashtags * 10, 30) +
            CASE
                WHEN pm.distance_km IS NULL THEN 15
                WHEN pm.distance_km <= 5 THEN 25
                WHEN pm.distance_km <= 15 THEN 20
                WHEN pm.distance_km <= 30 THEN 15
                ELSE 10
            END +
            (pm.activity_score / 100.0) * 25
        )::DECIMAL as compatibility_score,
        pm.age,
        pm.common_hashtags,
        pm.photo_count
    FROM potential_matches pm
    ORDER BY compatibility_score DESC, pm.distance_km ASC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$;