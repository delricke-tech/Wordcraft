/*
  # WordCraft - Schéma Complet de Base de Données
  
  Ce script crée toutes les tables nécessaires pour l'application WordCraft
  dans l'ordre hiérarchique correct pour éviter les erreurs de dépendances.
  
  Ordre de création :
  1. Tables de base (profiles)
  2. Tables principales (folders, documents, groups)
  3. Tables de relation (group_members, etc.)
  4. Tables dépendantes (study_cards, quizzes, sessions, etc.)
*/

-- ============================================================================
-- SUPPRESSION DES TABLES EXISTANTES (ordre inverse des dépendances)
-- ============================================================================

-- Supprimer les triggers d'abord
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_study_cards_updated_at ON study_cards;
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON study_sessions;
DROP TRIGGER IF EXISTS update_course_templates_updated_at ON course_templates;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS revision_schedules CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS course_template_versions CASCADE;
DROP TABLE IF EXISTS course_templates CASCADE;
DROP TABLE IF EXISTS session_documents CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS group_resources CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS card_versions CASCADE;
DROP TABLE IF EXISTS study_cards CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABLES DE BASE
-- ============================================================================

-- Table Profiles (doit être créée en premier car référencée par toutes les autres)
CREATE TABLE profiles (
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

-- ============================================================================
-- TABLES D'ORGANISATION
-- ============================================================================

-- Table Folders
CREATE TABLE folders (
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

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- Table Documents
CREATE TABLE documents (
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

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);
CREATE INDEX idx_documents_file_type ON documents(file_type);

-- ============================================================================
-- TABLES D'APPRENTISSAGE
-- ============================================================================

-- Table Study Cards
CREATE TABLE study_cards (
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

CREATE INDEX idx_study_cards_user_id ON study_cards(user_id);
CREATE INDEX idx_study_cards_document_id ON study_cards(document_id);
CREATE INDEX idx_study_cards_next_review ON study_cards(next_review_at);

-- Table Card Versions
CREATE TABLE card_versions (
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

-- ============================================================================
-- TABLES DE QUIZ
-- ============================================================================

-- Table Quizzes
CREATE TABLE quizzes (
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

CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);

-- Table Quiz Questions
CREATE TABLE quiz_questions (
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

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- Table Quiz Attempts
CREATE TABLE quiz_attempts (
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

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- ============================================================================
-- TABLES DE COLLABORATION
-- ============================================================================

-- Table Groups
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_url text,
  cover_url text,
  is_public boolean DEFAULT false,
  is_discoverable boolean DEFAULT true,
  category text,
  tags text[] DEFAULT '{}',
  settings jsonb DEFAULT '{
    "allow_member_posts": true,
    "allow_member_invites": false,
    "require_approval": true,
    "enable_chat": true,
    "enable_resources": true
  }'::jsonb,
  member_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    is_public = true 
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete groups"
  ON groups FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_groups_public ON groups(is_public) WHERE is_public = true;

-- Table Group Members
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES profiles(id),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND (groups.is_public = true OR groups.owner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update members"
  ON group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- Table Group Resources
CREATE TABLE group_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('document', 'card', 'quiz', 'link')),
  resource_id uuid,
  title text NOT NULL,
  description text,
  url text,
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE group_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view resources"
  ON group_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_resources.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

CREATE POLICY "Members can share resources"
  ON group_resources FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shared_by
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_resources.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

CREATE POLICY "Sharers and admins can delete resources"
  ON group_resources FOR DELETE
  TO authenticated
  USING (
    auth.uid() = shared_by
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_resources.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin', 'moderator')
    )
  );

-- ============================================================================
-- TABLES SOCIALES
-- ============================================================================

-- Table Chat Messages
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_response')),
  attachments jsonb DEFAULT '[]'::jsonb,
  reply_to uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT message_target CHECK (
    (recipient_id IS NOT NULL AND group_id IS NULL) OR
    (recipient_id IS NULL AND group_id IS NOT NULL)
  )
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = chat_messages.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.status = 'active'
      )
    )
  );

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);

-- Table Follows
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Table Likes
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('document', 'card', 'quiz', 'post', 'comment')),
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table Comments
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('document', 'card', 'quiz', 'post')),
  target_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can comment"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table Activity Feed
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN (
    'document_upload', 'card_created', 'quiz_created', 'quiz_completed',
    'group_joined', 'resource_shared', 'followed_user', 'comment_added',
    'session_started', 'session_completed', 'achievement_earned'
  )),
  target_type text,
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM follows
      WHERE follows.follower_id = auth.uid()
      AND follows.following_id = activity_feed.user_id
    )
  );

CREATE POLICY "System can insert activities"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);

-- ============================================================================
-- TABLES DE SESSIONS
-- ============================================================================

-- Table Study Sessions
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  session_type text DEFAULT 'study' CHECK (session_type IN ('study', 'quiz', 'lecture', 'discussion')),
  settings jsonb DEFAULT '{
    "max_participants": 10,
    "allow_video": true,
    "allow_audio": true,
    "allow_screen_share": true,
    "allow_recording": false,
    "require_approval": false,
    "enable_chat": true,
    "enable_ai_assist": true
  }'::jsonb,
  room_code text UNIQUE,
  recording_url text,
  recording_consent jsonb DEFAULT '[]'::jsonb,
  transcript text,
  transcript_segments jsonb DEFAULT '[]'::jsonb,
  ai_summary text,
  ai_generated_cards uuid[] DEFAULT '{}',
  ai_generated_quiz uuid,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = host_id
    OR EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = study_sessions.id
      AND session_participants.user_id = auth.uid()
    )
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = study_sessions.group_id
        AND group_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE INDEX idx_study_sessions_host ON study_sessions(host_id);
CREATE INDEX idx_study_sessions_status ON study_sessions(status);
CREATE INDEX idx_study_sessions_scheduled ON study_sessions(scheduled_at);

-- Table Session Participants
CREATE TABLE session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant', 'viewer')),
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left', 'removed')),
  joined_at timestamptz,
  left_at timestamptz,
  has_video boolean DEFAULT false,
  has_audio boolean DEFAULT false,
  recording_consent boolean DEFAULT false,
  engagement_score integer DEFAULT 0,
  UNIQUE(session_id, user_id)
);

ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view session participants"
  ON session_participants FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_participants.session_id
      AND study_sessions.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = session_participants.session_id
      AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions"
  ON session_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON session_participants FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_participants.session_id
      AND study_sessions.host_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_participants.session_id
      AND study_sessions.host_id = auth.uid()
    )
  );

CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);

-- Table Session Documents
CREATE TABLE session_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  is_active boolean DEFAULT false,
  annotations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view documents"
  ON session_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_documents.session_id
      AND session_participants.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM study_sessions
      WHERE study_sessions.id = session_documents.session_id
      AND study_sessions.host_id = auth.uid()
    )
  );

CREATE POLICY "Participants can share documents"
  ON session_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by);

-- ============================================================================
-- TABLES DE COURS (ENSEIGNANTS)
-- ============================================================================

-- Table Course Templates
CREATE TABLE course_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  level text,
  cover_image text,
  modules jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{
    "allow_comments": true,
    "allow_questions": true,
    "track_progress": true,
    "certificate_enabled": false
  }'::jsonb,
  is_draft boolean DEFAULT true,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  version integer DEFAULT 1,
  student_count integer DEFAULT 0,
  average_rating numeric(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible templates"
  ON course_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id OR is_published = true);

CREATE POLICY "Teachers can create templates"
  ON course_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own templates"
  ON course_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own templates"
  ON course_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE INDEX idx_course_templates_teacher ON course_templates(teacher_id);
CREATE INDEX idx_course_templates_published ON course_templates(is_published) WHERE is_published = true;

-- Table Course Template Versions
CREATE TABLE course_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  modules jsonb NOT NULL,
  change_notes text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own template versions"
  ON course_template_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_templates
      WHERE course_templates.id = course_template_versions.template_id
      AND course_templates.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create versions"
  ON course_template_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_templates
      WHERE course_templates.id = course_template_versions.template_id
      AND course_templates.teacher_id = auth.uid()
    )
  );

-- Table Course Enrollments
CREATE TABLE course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress jsonb DEFAULT '{}'::jsonb,
  completion_percentage integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  certificate_issued boolean DEFAULT false,
  UNIQUE(course_id, student_id)
);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant enrollments"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM course_templates
      WHERE course_templates.id = course_enrollments.course_id
      AND course_templates.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON course_enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- ============================================================================
-- TABLES DE RÉVISION ET ABONNEMENTS
-- ============================================================================

-- Table Revision Schedules
CREATE TABLE revision_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES study_cards(id) ON DELETE CASCADE,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  interval_days integer DEFAULT 1,
  ease_factor numeric(4,2) DEFAULT 2.5,
  repetition_count integer DEFAULT 0,
  last_quality integer,
  last_reviewed_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, card_id)
);

ALTER TABLE revision_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules"
  ON revision_schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create schedules"
  ON revision_schedules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON revision_schedules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON revision_schedules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_revision_schedules_user ON revision_schedules(user_id);
CREATE INDEX idx_revision_schedules_next_review ON revision_schedules(next_review_at);

-- Table Subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'student_pro', 'teacher', 'institution')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- Table AI Usage Logs
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN (
    'ocr', 'asr', 'summarize', 'generate_cards', 'generate_quiz',
    'ask_question', 'session_summary', 'translate'
  )),
  credits_used integer NOT NULL DEFAULT 1,
  input_tokens integer,
  output_tokens integer,
  model_used text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can log usage"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);

-- Table Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'revision_reminder', 'quiz_result', 'group_invite', 'session_invite',
    'new_follower', 'comment', 'like', 'mention', 'system'
  )),
  title text NOT NULL,
  message text,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_cards_updated_at
  BEFORE UPDATE ON study_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_templates_updated_at
  BEFORE UPDATE ON course_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FONCTION DE CRÉATION AUTOMATIQUE DE PROFIL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
