-- Fix for user_already_exists registration error
-- Run this in Supabase SQL Editor

-- 1. Drop and recreate the auth trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create improved trigger function that handles existing users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user profile already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        -- User profile already exists, just update the email if needed
        UPDATE public.users 
        SET email = NEW.email,
            updated_at = NOW()
        WHERE id = NEW.id;
    ELSE
        -- Create new user profile
        INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle any race conditions
        UPDATE public.users 
        SET email = NEW.email,
            updated_at = NOW()
        WHERE id = NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Update existing users to ensure they have profiles
INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    created_at,
    NOW()
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.users.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- 5. Create a function to check if email exists before registration
CREATE OR REPLACE FUNCTION public.check_email_exists(email_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = email_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions for the email check function
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;

-- 7. Update RLS policies to be more permissive for inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- 8. Add a policy to allow service role to insert
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NULL);
