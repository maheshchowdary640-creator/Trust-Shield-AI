-- Drop the existing scan_type check constraint if it exists
ALTER TABLE public.scans DROP CONSTRAINT IF EXISTS scans_scan_type_check;

-- Add a new check constraint that supports all 5 scan types
ALTER TABLE public.scans ADD CONSTRAINT scans_scan_type_check CHECK (scan_type IN ('screenshot', 'job_offer', 'url', 'voice', 'deepfake'));

-- Add user_id column if it doesn't already exist
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
