-- GameMind Session Refactor Migration
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='sessions' and column_name='game_name') THEN
    ALTER TABLE sessions RENAME COLUMN game_name TO session_name;
  END IF;
END $$;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS games_played text[] DEFAULT '{}';
