-- Fix for your specific users table structure
-- RUN THIS in Supabase SQL Editor

-- 1. Drop the problematic default value constraint
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

-- 2. Grant basic permissions (critical for 403 fix)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Enable RLS on your existing table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- 5. Create proper RLS policies for your table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'superadmin'
    );

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'superadmin'
    );

-- 6. Create proper auth trigger function for your table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user profile with auth user ID
    INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Sync existing auth users with your users table
INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    created_at, 
    updated_at
)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    created_at,
    NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
