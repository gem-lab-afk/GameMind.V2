-- SQL script to set up GameMind backend
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  platform text NOT NULL,
  primary_genre text NOT NULL,
  app_goal text NOT NULL
);

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_name text NOT NULL,
  planned_mins integer NOT NULL,
  actual_seconds integer NOT NULL,
  baseline_mood smallint NOT NULL,
  satisfaction smallint NOT NULL,
  duration_perception smallint NOT NULL,
  end_mood smallint NOT NULL,
  control_score smallint NOT NULL,
  diary_entry text NOT NULL,
  analyzer_tip text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can select their own profile." ON profiles;

CREATE POLICY "Enable insert for authenticated users only"
  ON profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users based on id"
  ON profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Sessions policies
CREATE POLICY "Users can manage their own sessions" 
  ON sessions FOR ALL 
  USING (auth.uid() = user_id);

-- Enable Realtime for sessions
alter publication supabase_realtime add table sessions;

