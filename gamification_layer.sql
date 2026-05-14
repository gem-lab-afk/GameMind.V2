-- Task 3: Cosmetic Implementation Schema Update
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS control_score smallint DEFAULT 3;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS equipped_avatar_frame text DEFAULT '',
ADD COLUMN IF NOT EXISTS equipped_title text DEFAULT 'Novice',
ADD COLUMN IF NOT EXISTS unlocked_rewards text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Ensure existing nulls are converted to empty arrays
UPDATE profiles SET unlocked_rewards = '{}' WHERE unlocked_rewards IS NULL;

-- Task 1: Leaderboard RPC / View
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
      p.is_public,
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
  WHERE (rank <= 50 AND is_public = true) OR id = req_user_id
  ORDER BY rank ASC;
$$;
