/*
  # WordCraft Core Database Schema

  1. New Tables
    - `profiles` - User profiles with role and subscription info
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `role` (text: student, teacher, admin)
      - `subscription_tier` (text: free, student_pro, teacher, institution)
      - `ai_credits` (integer)
      - `created_at`, `updated_at` (timestamptz)
    
    - `documents` - Uploaded documents and resources
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `file_type` (text: pdf, docx, txt, image, url, video)
      - `file_url` (text)
      - `file_size` (bigint)
      - `extracted_text` (text)
      - `metadata` (jsonb)
      - `ai_tags` (text array)
      - `processing_status` (text)
      - `has_cards`, `has_quiz`, `has_audio` (boolean)
      - `created_at`, `updated_at` (timestamptz)
    
    - `folders` - Document organization
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `parent_id` (uuid, self-reference)
      - `created_at` (timestamptz)
    
    - `document_folders` - Many-to-many for documents in folders
      - `document_id` (uuid)
      - `folder_id` (uuid)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'student_pro', 'teacher', 'institution')),
  ai_credits integer NOT NULL DEFAULT 50,
  institution text,
  study_field text,
  bio text,
  onboarding_completed boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{"email": true, "push": true, "revision_reminders": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'folder',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'image', 'url', 'video', 'audio')),
  file_url text,
  original_url text,
  file_size bigint DEFAULT 0,
  mime_type text,
  extracted_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ai_tags text[] DEFAULT '{}',
  ai_summary text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  has_cards boolean DEFAULT false,
  has_quiz boolean DEFAULT false,
  has_audio boolean DEFAULT false,
  confidence_score numeric(3,2),
  page_count integer,
  duration_seconds integer,
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
