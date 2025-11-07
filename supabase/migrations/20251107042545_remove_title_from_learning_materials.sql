/*
  # Remove title column from learning_materials table

  ## Overview
  This migration removes the title column from the learning_materials table since the PDF filename will serve as the identifier.

  ## Changes
  - Drop the `title` column from `learning_materials` table

  ## Important Notes
  - The original_filename column will serve as the primary identifier for materials
  - This change is safe as we're in the initial development phase
*/

-- Remove title column from learning_materials table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_materials' AND column_name = 'title'
  ) THEN
    ALTER TABLE learning_materials DROP COLUMN title;
  END IF;
END $$;
