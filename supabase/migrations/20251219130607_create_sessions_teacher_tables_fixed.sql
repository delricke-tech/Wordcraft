/*
  # Sessions and Teacher Course Tables

  1. New Tables
    - `study_sessions` - Synchronous study sessions
    - `session_participants` - Session attendance
    - `session_documents` - Documents shared in sessions
    - `course_templates` - Teacher course maquettes
    - `course_template_versions` - Template versioning
    - `course_enrollments` - Student enrollments
    - `revision_schedules` - Spaced repetition scheduling
    - `subscriptions` - User subscription management
    - `ai_usage_logs` - Track AI credit usage
    - `notifications` - User notifications

  2. Security
    - Enable RLS with appropriate access controls
*/

-- Study Sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
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

-- Session Participants table
CREATE TABLE IF NOT EXISTS session_participants (
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

-- Session Documents table
CREATE TABLE IF NOT EXISTS session_documents (
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

-- Course Templates table
CREATE TABLE IF NOT EXISTS course_templates (
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

-- Course Template Versions table
CREATE TABLE IF NOT EXISTS course_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  modules jsonb NOT NULL,
  change_notes text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Course Enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
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

-- Revision Schedules table
CREATE TABLE IF NOT EXISTS revision_schedules (
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

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- AI Usage Logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Enable RLS on all tables
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Study Sessions policies
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

-- Session Participants policies
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

-- Session Documents policies
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

-- Course Templates policies
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

-- Course Template Versions policies
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

-- Course Enrollments policies
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

-- Revision Schedules policies
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

-- Subscriptions policies
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

-- AI Usage Logs policies
CREATE POLICY "Users can view own usage"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can log usage"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Notifications policies
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_host ON study_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_scheduled ON study_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_course_templates_teacher ON course_templates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_templates_published ON course_templates(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_revision_schedules_user ON revision_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_schedules_next_review ON revision_schedules(next_review_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Triggers
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
