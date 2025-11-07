/*
  # Create Learning Materials Management Schema

  ## Overview
  This migration creates the database schema for managing uploaded learning materials (PDF files).

  ## New Tables

  ### `learning_materials`
  Stores information about uploaded learning materials such as lecture notes, textbooks, slides, etc.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for each material
  - `user_id` (uuid, foreign key) - References the user who uploaded the material
  - `title` (text, required) - Title of the learning material
  - `course_name` (text, required) - Name of the course this material belongs to
  - `material_type` (text, required) - Type of material (lecture, textbook, slides, assignment, other)
  - `description` (text, optional) - Additional notes or description about the material
  - `file_path` (text, required) - Storage path/URL for the PDF file
  - `file_size` (bigint, required) - Size of the file in bytes
  - `original_filename` (text, required) - Original name of the uploaded file
  - `created_at` (timestamptz) - Timestamp when the material was uploaded
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on `learning_materials` table
  - Policy 1: Users can view their own learning materials
  - Policy 2: Users can insert their own learning materials
  - Policy 3: Users can update their own learning materials
  - Policy 4: Users can delete their own learning materials

  ## Important Notes
  - All timestamps use `timestamptz` for timezone awareness
  - File size stored in bytes for precise storage tracking
  - Material type is constrained to specific values
  - User ownership is enforced through RLS policies
*/

-- Create learning_materials table
CREATE TABLE IF NOT EXISTS learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  course_name text NOT NULL,
  material_type text NOT NULL CHECK (material_type IN ('lecture', 'textbook', 'slides', 'assignment', 'other')),
  description text DEFAULT '',
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  original_filename text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_materials_user_id ON learning_materials(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_learning_materials_created_at ON learning_materials(created_at DESC);

-- Enable Row Level Security
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own learning materials
CREATE POLICY "Users can view own learning materials"
  ON learning_materials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own learning materials
CREATE POLICY "Users can insert own learning materials"
  ON learning_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own learning materials
CREATE POLICY "Users can update own learning materials"
  ON learning_materials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own learning materials
CREATE POLICY "Users can delete own learning materials"
  ON learning_materials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_learning_materials_updated_at ON learning_materials;
CREATE TRIGGER update_learning_materials_updated_at
  BEFORE UPDATE ON learning_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
