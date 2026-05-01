-- Run this in your Supabase SQL Editor
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS opt_in_marketing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS opt_in_updates BOOLEAN DEFAULT true;

-- Create Avatars Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access controls for avatars bucket
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload an avatar." 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their avatar." 
ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars');

-- Email Logic Framework Database Triggers
-- 1. Create a function to automatically track a user's last login when they authenticate
-- (Depending on setup this can also be handled securely by Edge Functions, but here we prep the columns)

-- Example: Function to trigger an edge function webhook when a row changes (Placeholder for Resend)
-- CREATE OR REPLACE FUNCTION public.handle_user_updates()
-- RETURNS trigger AS $$
-- BEGIN
--   -- You would make a pg_net POST request to your Edge Function here
--   -- to trigger the Resend email workflow.
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

