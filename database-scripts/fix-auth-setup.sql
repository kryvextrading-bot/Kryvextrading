-- Fix for existing policies and complete auth setup
-- Run this in Supabase SQL Editor if you get "policy already exists" errors

-- 1. Create function to handle new user signup (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, just return
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger for new user signup (drop and recreate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions (these are safe to run multiple times)
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Create profiles for existing users (safe to run multiple times)
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5. Make sure the users table has the correct structure for auth integration
-- This adds the foreign key constraint if it's missing
DO $$
BEGIN
    -- Check if the foreign key constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
