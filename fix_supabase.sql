-- STEP 1: DROP the existing function to avoid "cannot change return type" error
DROP FUNCTION IF EXISTS get_leaderboard(uuid);

-- STEP 2: Add missing columns to the PROFILES table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_rewards text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_avatar_frame text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_leaderboard_on boolean DEFAULT false;

-- STEP 3: Add missing columns to the SESSIONS table (to prevent TrackingModal errors)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_name text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS games_played text[] DEFAULT '{}';

-- STEP 4: Create the corrected Leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(req_user_id uuid)
RETURNS TABLE (
  rank bigint,
  id uuid,
  username text,
  avatar_url text,
  level integer,
  current_xp integer,
  average_control_score numeric,
  equipped_avatar_frame text,
  equipped_title text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH ranked_profiles AS (
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.level,
      p.current_xp,
      p.equipped_avatar_frame,
      p.equipped_title,
      p.is_leaderboard_on,
      (
        SELECT COALESCE(AVG(COALESCE(s.control_score, 3)), 3)
        FROM sessions s
        WHERE s.user_id = p.id
      ) as average_control_score,
      ROW_NUMBER() OVER (ORDER BY p.current_xp DESC, p.level DESC) as rank
    FROM profiles p
  )
  SELECT 
    rank,
    id,
    username,
    avatar_url,
    level,
    current_xp,
    average_control_score,
    equipped_avatar_frame,
    equipped_title
  FROM ranked_profiles
  WHERE (rank <= 50 AND is_leaderboard_on = true) OR id = req_user_id
  ORDER BY rank ASC;
$$;

-- STEP 5: Reload Schema Cache (CRITICAL)
NOTIFY pgrst, 'reload schema';
