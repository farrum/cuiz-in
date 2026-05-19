
-- 1) Drop legacy password_hash column from profiles (Supabase Auth handles credentials)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2) Allow users to delete their own files in the 'profiles' storage bucket
DROP POLICY IF EXISTS "Users can delete their own profile files" ON storage.objects;
CREATE POLICY "Users can delete their own profile files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
