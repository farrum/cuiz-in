-- Fix 1: Remove overly permissive daily_reports policy
DROP POLICY IF EXISTS "Allow full access to daily_reports" ON daily_reports;

-- Fix 2: Remove overly permissive admin_notifications insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON admin_notifications;

-- Fix 3: Fix storage policies to enforce ownership
DROP POLICY IF EXISTS "Users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;

CREATE POLICY "Users upload own profile picture" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users update own profile picture" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );