-- Fix JSON operator issue in PostgreSQL
-- This migration fixes the JSONB casting issue

-- Update existing wallet_transactions metadata column to use proper JSONB operations
ALTER TABLE public.wallet_transactions 
ALTER COLUMN metadata SET DEFAULT '{}';

-- Update any NULL metadata to empty JSON
UPDATE public.wallet_transactions 
SET metadata = '{}' 
WHERE metadata IS NULL;

-- Create function to safely extract JSON values
CREATE OR REPLACE FUNCTION public.get_metadata_value(key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN metadata::jsonb ->> key;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
