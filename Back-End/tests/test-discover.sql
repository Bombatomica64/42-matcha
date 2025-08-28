-- Test script for the discover algorithm
-- This script demonstrates the discovery query logic

-- Sample test cases:
-- 1. Test the query structure with placeholder user ID
-- 2. Show how the scoring algorithm works
-- 3. Demonstrate filtering logic

-- Main discover query (example with user ID 'test-user-id')
WITH user_location AS (
    SELECT location FROM users WHERE id = 'test-user-id'
),
blocked_users AS (
    -- Users I blocked or who blocked me
    SELECT blocked_id as user_id FROM user_blocks WHERE blocker_id = 'test-user-id'
    UNION
    SELECT blocker_id as user_id FROM user_blocks WHERE blocked_id = 'test-user-id'
),
already_rated AS (
    -- Users I already liked/disliked
    SELECT liked_id as user_id FROM user_likes WHERE liker_id = 'test-user-id'
),
potential_matches AS (
    SELECT 
        u.*,
        -- Calculate age
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
        -- Calculate distance if both users have location
        CASE 
            WHEN u.location IS NOT NULL AND ul.location IS NOT NULL 
            THEN ST_Distance(u.location, ul.location) / 1000.0  -- Convert to kilometers
            ELSE NULL 
        END as distance_km,
        -- Count common hashtags for similarity score
        (
            SELECT COUNT(*)
            FROM user_hashtags uh1
            JOIN user_hashtags uh2 ON uh1.hashtag_id = uh2.hashtag_id
            WHERE uh1.user_id = 'test-user-id' AND uh2.user_id = u.id
        ) as common_hashtags,
        -- Check if user has photos
        (SELECT COUNT(*) FROM user_photos WHERE user_id = u.id) as photo_count,
        -- Activity score (more recent = higher score)
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
    WHERE u.id != 'test-user-id'  -- Not myself
        AND u.activated = true  -- Must be activated
        AND u.profile_complete = true  -- Must have complete profile
        AND u.gender = ANY(ARRAY['female']::text[])  -- Example: looking for females
        AND u.id NOT IN (SELECT user_id FROM blocked_users WHERE user_id IS NOT NULL)  -- Not blocked
        AND u.id NOT IN (SELECT user_id FROM already_rated WHERE user_id IS NOT NULL)  -- Not already rated
        AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) BETWEEN 18 AND 100  -- Age range
        AND u.fame_rating >= 0  -- Minimum fame rating
        AND (
            u.location IS NULL  -- User without location (include them)
            OR ul.location IS NULL  -- Current user without location (include all)
            OR ST_Distance(u.location, ul.location) / 1000.0 <= 50  -- Within 50km
        )
)
SELECT 
    pm.id,
    pm.username,
    pm.first_name,
    pm.last_name,
    pm.age,
    pm.distance_km,
    pm.common_hashtags,
    pm.photo_count,
    pm.activity_score,
    pm.fame_rating,
    -- Calculate composite score for ranking
    (
        -- Fame rating component (0-5 scale, weight 20%)
        (pm.fame_rating / 5.0) * 20 +
        -- Common interests component (weight 30%)
        LEAST(pm.common_hashtags * 10, 30) +  -- Cap at 30 points
        -- Distance component (weight 25%) - closer is better
        CASE 
            WHEN pm.distance_km IS NULL THEN 15  -- Neutral score for unknown location
            WHEN pm.distance_km <= 5 THEN 25
            WHEN pm.distance_km <= 15 THEN 20
            WHEN pm.distance_km <= 30 THEN 15
            ELSE 10
        END +
        -- Activity component (weight 25%)
        (pm.activity_score / 100.0) * 25
    ) as compatibility_score
FROM potential_matches pm
WHERE pm.photo_count > 0  -- Must have at least one photo
ORDER BY compatibility_score DESC, pm.distance_km ASC NULLS LAST
LIMIT 20 OFFSET 0;

-- Test query to show scoring breakdown
SELECT 
    'Scoring Breakdown' as description,
    'Fame Rating (20%)' as component,
    'Common Hashtags (30%)' as component2,
    'Distance (25%)' as component3,
    'Activity (25%)' as component4,
    'Total (100%)' as total;

-- Example scoring:
-- User with fame_rating=4.5, 2 common hashtags, 10km distance, online
-- Fame: (4.5/5.0) * 20 = 18 points
-- Hashtags: min(2*10, 30) = 20 points  
-- Distance: (10km in 5-15km range) = 20 points
-- Activity: (100/100) * 25 = 25 points
-- Total: 18 + 20 + 20 + 25 = 83 points
