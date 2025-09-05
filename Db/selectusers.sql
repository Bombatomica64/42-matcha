SELECT id,
       username,
       email,
       birth_date,
       password,
       bio,
       first_name,
       last_name,
       activated,
       profile_complete,
       gender,
       sexual_orientation,
       location,
       location_manual,
       fame_rating,
       last_seen,
       online_status,
       email_verification_token,
       email_verified_at,
       password_reset_token,
       password_reset_expires_at,
       likes_received_count,
       views_count,
       matches_count,
       created_at,
       updated_at
FROM public.users
ORDER BY updated_at DESC
LIMIT 100;

-- SELECT * FROM get_discoverable_users('3631423c-fc47-4ba9-bffc-448bed706aec') LIMIT 1;