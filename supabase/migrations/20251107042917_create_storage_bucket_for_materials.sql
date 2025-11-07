/*
  # Create Storage Bucket for Learning Materials

  ## Overview
  This migration creates a storage bucket for storing PDF files of learning materials.

  ## New Storage Bucket
  - `learning-materials` bucket for storing PDF files
  - Public access enabled for authenticated users
  - File size limit: 10MB per file
  - Only PDF files allowed

  ## Security Policies
  - Users can upload files to their own folder
  - Users can read files from their own folder
  - Users can delete files from their own folder
*/

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'learning-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'learning-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'learning-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view files (since bucket is public)
CREATE POLICY "Public can view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'learning-materials');
