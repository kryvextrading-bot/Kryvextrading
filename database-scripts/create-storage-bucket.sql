-- Create the deposit-proofs storage bucket for Supabase
-- Run this in your Supabase SQL editor

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deposit-proofs',
  'deposit-proofs',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policy for the bucket
-- Users can upload to their own folder only
CREATE POLICY "Users can upload to their own deposit proof folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'deposit-proofs' AND
  auth.role() = 'authenticated' AND
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- 3. Create RLS policy for reading
-- Users can read their own files, and admins can read all
CREATE POLICY "Users can read their own deposit proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deposit-proofs' AND
  (
    auth.role() = 'authenticated' AND
    split_part(name, '/', 1) = auth.uid()::text
  )
);

-- 4. Create RLS policy for updating
-- Users can update their own files
CREATE POLICY "Users can update their own deposit proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'deposit-proofs' AND
  auth.role() = 'authenticated' AND
  split_part(name, '/', 1) = auth.uid()::text
);

-- 5. Create RLS policy for deleting
-- Users can delete their own files
CREATE POLICY "Users can delete their own deposit proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'deposit-proofs' AND
  auth.role() = 'authenticated' AND
  split_part(name, '/', 1) = auth.uid()::text
);

-- Note: If you still get permission errors, you may need to use service_role key instead
-- Or create the bucket manually in Supabase dashboard under Storage section
