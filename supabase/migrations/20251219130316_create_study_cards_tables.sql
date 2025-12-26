/*
  # Study Cards and Quiz Tables

  1. New Tables
    - `study_cards` - Generated study cards from documents
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `content` (jsonb) - structured content with definitions, signs, diagnostics, treatments, key points
      - `source_reference` (jsonb) - page, paragraph, timestamp mapping
      - `version` (integer)
      - `is_ai_generated` (boolean)
      - `confidence_score` (numeric)
      - `error_reports` (jsonb array)
    
    - `card_versions` - Version history for cards
      - `id` (uuid)
      - `card_id` (uuid)
      - `content` (jsonb)
      - `edited_by` (uuid)
      - `created_at` (timestamptz)
    
    - `quizzes` - Quiz containers
      - `id` (uuid)
      - `user_id` (uuid)
      - `title` (text)
      - `description` (text)
      - `settings` (jsonb) - time limits, shuffle, show answers
    
    - `quiz_questions` - Individual questions
      - `id` (uuid)
      - `quiz_id` (uuid)
      - `document_id` (uuid, optional source)
      - `card_id` (uuid, optional source)
      - `question_type` (text: qcm, qroc, clinical_case, true_false)
      - `question_text` (text)
      - `options` (jsonb)
      - `correct_answer` (jsonb)
      - `explanation` (text)
      - `source_reference` (jsonb)
      - `difficulty` (integer 1-5)
    
    - `quiz_attempts` - User quiz attempts
      - `id` (uuid)
      - `quiz_id` (uuid)
      - `user_id` (uuid)
      - `answers` (jsonb)
      - `score` (numeric)
      - `time_spent` (integer seconds)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can access their own cards/quizzes and shared ones
*/

-- Study Cards table
CREATE TABLE IF NOT EXISTS study_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{
    "definitions": [],
    "signs": [],
    "diagnostics": [],
    "treatments": [],
    "key_points": [],
    "custom_sections": []
  }'::jsonb,
  source_reference jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  is_ai_generated boolean DEFAULT false,
  confidence_score numeric(3,2),
  error_reports jsonb[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  mastery_level integer DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON study_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own cards"
  ON study_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON study_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON study_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Card Versions table for history
CREATE TABLE IF NOT EXISTS card_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES study_cards(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  edited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE card_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own cards"
  ON card_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_cards
      WHERE study_cards.id = card_versions.card_id
      AND study_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions for own cards"
  ON card_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_cards
      WHERE study_cards.id = card_versions.card_id
      AND study_cards.user_id = auth.uid()
    )
  );

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  settings jsonb DEFAULT '{
    "time_limit_minutes": null,
    "shuffle_questions": true,
    "shuffle_options": true,
    "show_answers_after": "completion",
    "allow_review": true,
    "passing_score": 70,
    "max_attempts": null
  }'::jsonb,
  is_ai_generated boolean DEFAULT false,
  is_adaptive boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  question_count integer DEFAULT 0,
  total_attempts integer DEFAULT 0,
  average_score numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can insert own quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Quiz Questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  card_id uuid REFERENCES study_cards(id) ON DELETE SET NULL,
  question_type text NOT NULL CHECK (question_type IN ('qcm', 'qroc', 'clinical_case', 'true_false', 'matching', 'fill_blank')),
  question_text text NOT NULL,
  question_media jsonb,
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer jsonb NOT NULL,
  explanation text,
  explanation_media jsonb,
  source_reference jsonb DEFAULT '{}'::jsonb,
  difficulty integer DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  tags text[] DEFAULT '{}',
  times_answered integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  average_time_seconds numeric(10,2),
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions of accessible quizzes"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND (quizzes.user_id = auth.uid() OR quizzes.is_shared = true)
    )
  );

CREATE POLICY "Users can insert questions to own quizzes"
  ON quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in own quizzes"
  ON quiz_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from own quizzes"
  ON quiz_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

-- Quiz Attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score numeric(5,2),
  percentage numeric(5,2),
  time_spent_seconds integer,
  questions_answered integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  is_completed boolean DEFAULT false
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON quiz_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_cards_user_id ON study_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_study_cards_document_id ON study_cards(document_id);
CREATE INDEX IF NOT EXISTS idx_study_cards_next_review ON study_cards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- Triggers
CREATE TRIGGER update_study_cards_updated_at
  BEFORE UPDATE ON study_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
