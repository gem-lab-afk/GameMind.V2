-- Task 1: Add is_leaderboard_on
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_leaderboard_on boolean DEFAULT false;

-- Migrate any existing is_public data if present (optional but safe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_public') THEN
    UPDATE profiles SET is_leaderboard_on = is_public;
  END IF;
END $$;

-- Drop existing overlapping policies to prevent issues
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own rewards" ON profiles;

-- Create public select policy
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles 
FOR SELECT 
USING (is_leaderboard_on = true);

-- Task 2: Ensure unlocked_rewards and equipped columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_rewards text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_avatar_frame text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_title text;

-- Create update policy
CREATE POLICY "Users can update own rewards" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- RPC Refactor: Leaderboard Security Definer
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
