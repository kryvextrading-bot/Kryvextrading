-- =====================================================
-- CREATE AUDIT LOGS TABLE
-- =====================================================

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit logs (admin only)
DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins can manage audit logs" ON public.audit_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO anon;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_audit_logs_updated_at ON public.audit_logs;
CREATE TRIGGER handle_audit_logs_updated_at
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script creates the audit_logs table with:
-- 1. Proper table structure
-- 2. Indexes for performance
-- 3. RLS policies for security
-- 4. Trigger for timestamp management
-- 5. Proper permissions
--
