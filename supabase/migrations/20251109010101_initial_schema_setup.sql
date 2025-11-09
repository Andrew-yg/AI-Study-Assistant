/*
  # Initial Database Schema Setup

  ## Overview
  Complete database schema for multi-user chat application with document management.

  ## Tables Created

  ### 1. `conversations`
  Stores chat sessions for each user with complete data isolation.
  
  **Columns:**
  - `id` (uuid, PK) - Unique conversation identifier
  - `user_id` (uuid, FK) - Owner of the conversation  
  - `title` (text) - Conversation title
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last activity timestamp

  ### 2. `messages`
  Stores chat messages within conversations.
  
  **Columns:**
  - `id` (uuid, PK) - Unique message identifier
  - `conversation_id` (uuid, FK) - Parent conversation
  - `role` (text) - Sender role (user/assistant)
  - `content` (text) - Message content
  - `created_at` (timestamptz) - Message timestamp

  ### 3. `learning_materials`
  Stores uploaded PDF materials linked to conversations.
  
  **Columns:**
  - `id` (uuid, PK) - Unique material identifier
  - `user_id` (uuid, FK) - Owner of the material
  - `conversation_id` (uuid, FK, nullable) - Associated conversation
  - `course_name` (text) - Course name
  - `material_type` (text) - Type of material
  - `description` (text) - Description
  - `file_path` (text) - Storage path
  - `file_size` (bigint) - File size in bytes
  - `original_filename` (text) - Original filename
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security & Data Isolation
  - RLS enabled on all tables
  - Users can only access their own data
  - CASCADE deletes maintain data integrity
  - Conversation ownership enforced at database level

  ## Indexes
  - User ID indexes for fast user data lookup
  - Conversation ID indexes for message/material retrieval
  - Timestamp indexes for chronological sorting
*/

-- ============================================
-- Helper Functions
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Table: conversations
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: messages
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Function to update conversation's updated_at when message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- Table: learning_materials
-- ============================================

CREATE TABLE IF NOT EXISTS learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  course_name text NOT NULL,
  material_type text NOT NULL CHECK (material_type IN ('lecture', 'textbook', 'slides', 'assignment', 'other')),
  description text DEFAULT '',
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  original_filename text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_materials_user_id ON learning_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_materials_conversation_id ON learning_materials(conversation_id);
CREATE INDEX IF NOT EXISTS idx_learning_materials_created_at ON learning_materials(created_at DESC);

ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning materials"
  ON learning_materials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning materials"
  ON learning_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning materials"
  ON learning_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning materials"
  ON learning_materials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_learning_materials_updated_at ON learning_materials;
CREATE TRIGGER update_learning_materials_updated_at
  BEFORE UPDATE ON learning_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Storage Bucket Setup
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

  -- Recreate policies
  CREATE POLICY "Users can upload own files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'learning-materials' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can view own files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'learning-materials' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'learning-materials' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "Public can view files"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'learning-materials');

EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;