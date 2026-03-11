-- ============================================================================
-- TABLES POUR LA RÉVISION ESPACÉE (ALGORITHME SM-2)
-- Création: 7 mars 2025
-- Objectif: Permettre la révision espacée optimisée avec suivi de progression
-- ============================================================================

-- Table principale des cartes de révision espacée
CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Contenu de la carte
  front text NOT NULL,
  back text NOT NULL,
  category text NOT NULL DEFAULT 'Général',
  tags text[] DEFAULT '{}',
  difficulty text NOT NULL CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
  
  -- Propriétés SM-2 (SuperMemo 2)
  ease_factor numeric NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  next_review_date timestamptz NOT NULL DEFAULT now(),
  last_review_date timestamptz,
  
  -- Statistiques
  total_reviews integer NOT NULL DEFAULT 0,
  correct_reviews integer NOT NULL DEFAULT 0,
  average_response_time numeric NOT NULL DEFAULT 0, -- en secondes
  mastery_level numeric NOT NULL DEFAULT 0, -- 0-100%
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des sessions de révision
CREATE TABLE IF NOT EXISTS review_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Configuration de la session
  focus_mode text NOT NULL CHECK (focus_mode IN ('focused', 'relaxed', 'intense')) DEFAULT 'focused',
  max_cards integer DEFAULT 20,
  time_limit integer, -- en minutes, NULL = pas de limite
  
  -- Période de la session
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  
  -- Statistiques de la session
  cards_reviewed integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  average_response_time numeric DEFAULT 0, -- en secondes
  
  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

-- Table des résultats de révision individuels
CREATE TABLE IF NOT EXISTS review_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES review_sessions(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES spaced_repetition_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Résultat de la révision
  is_correct boolean NOT NULL,
  response_time numeric NOT NULL, -- en secondes
  difficulty_rating text NOT NULL CHECK (difficulty_rating IN ('again', 'hard', 'good', 'easy')),
  quality_score numeric NOT NULL CHECK (quality_score >= 0 AND quality_score <= 5), -- 0-5 SM-2
  
  -- État avant/après la révision
  ease_factor_before numeric NOT NULL,
  ease_factor_after numeric,
  interval_before integer NOT NULL,
  interval_after integer,
  repetitions_before integer NOT NULL,
  repetitions_after integer,
  mastery_before numeric NOT NULL,
  mastery_after numeric,
  
  -- Timestamps
  review_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Table des objectifs d'étude quotidiens
CREATE TABLE IF NOT EXISTS daily_study_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Configuration de l'objectif
  target_date date NOT NULL,
  cards_to_review integer NOT NULL DEFAULT 20,
  new_cards_to_create integer NOT NULL DEFAULT 5,
  study_time_minutes integer NOT NULL DEFAULT 30,
  
  -- Progression
  cards_reviewed integer NOT NULL DEFAULT 0,
  new_cards_created integer NOT NULL DEFAULT 0,
  study_time_completed integer NOT NULL DEFAULT 0, -- en minutes
  goal_achieved boolean NOT NULL DEFAULT false,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte d'unicité
  UNIQUE(user_id, target_date)
);

-- Table des statistiques quotidiennes
CREATE TABLE IF NOT EXISTS daily_study_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Date
  study_date date NOT NULL,
  
  -- Statistiques de la journée
  total_cards integer NOT NULL DEFAULT 0,
  new_cards integer NOT NULL DEFAULT 0,
  review_sessions integer NOT NULL DEFAULT 0,
  study_time_minutes integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  average_mastery numeric DEFAULT 0,
  
  -- Progression
  streak_days integer NOT NULL DEFAULT 0, -- jours consécutifs
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte d'unicité
  UNIQUE(user_id, study_date)
);

-- Activer Row Level Security
ALTER TABLE spaced_repetition_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_study_statistics ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour spaced_repetition_cards
CREATE POLICY "Users can view own spaced cards"
  ON spaced_repetition_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spaced cards"
  ON spaced_repetition_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spaced cards"
  ON spaced_repetition_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spaced cards"
  ON spaced_repetition_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour review_sessions
CREATE POLICY "Users can view own review sessions"
  ON review_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own review sessions"
  ON review_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review sessions"
  ON review_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour review_results
CREATE POLICY "Users can view own review results"
  ON review_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own review results"
  ON review_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour daily_study_goals
CREATE POLICY "Users can view own study goals"
  ON daily_study_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study goals"
  ON daily_study_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study goals"
  ON daily_study_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour daily_study_statistics
CREATE POLICY "Users can view own study statistics"
  ON daily_study_statistics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study statistics"
  ON daily_study_statistics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study statistics"
  ON daily_study_statistics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_spaced_cards_user_id ON spaced_repetition_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_next_review ON spaced_repetition_cards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_document_id ON spaced_repetition_cards(document_id);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_mastery ON spaced_repetition_cards(mastery_level DESC);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_tags ON spaced_repetition_cards USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_start_time ON review_sessions(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_review_results_session_id ON review_results(session_id);
CREATE INDEX IF NOT EXISTS idx_review_results_card_id ON review_results(card_id);
CREATE INDEX IF NOT EXISTS idx_review_results_user_id ON review_results(user_id);
CREATE INDEX IF NOT EXISTS idx_review_results_date ON review_results(review_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_study_goals(user_id, target_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_statistics_user_date ON daily_study_statistics(user_id, study_date DESC);

-- Trigger pour updated_at automatique
CREATE TRIGGER update_spaced_repetition_cards_updated_at
  BEFORE UPDATE ON spaced_repetition_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_study_goals_updated_at
  BEFORE UPDATE ON daily_study_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_study_statistics_updated_at
  BEFORE UPDATE ON daily_study_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour les statistiques quotidiennes automatiquement
CREATE OR REPLACE FUNCTION update_daily_study_statistics()
RETURNS TRIGGER AS $$
DECLARE
  today_date date := CURRENT_DATE;
  stats_record daily_study_statistics%ROWTYPE;
BEGIN
  -- Insérer ou mettre à jour les statistiques du jour
  INSERT INTO daily_study_statistics (
    user_id,
    study_date,
    total_cards,
    new_cards,
    review_sessions,
    study_time_minutes,
    correct_answers,
    average_mastery,
    streak_days
  )
  SELECT 
    NEW.user_id,
    today_date,
    COUNT(DISTINCT sr.id),
    COUNT(DISTINCT CASE WHEN sr.total_reviews = 0 THEN sr.id END),
    COUNT(DISTINCT rs.id),
    COALESCE(AVG(rs.average_response_time), 0),
    COALESCE(SUM(CASE WHEN rr.is_correct THEN 1 ELSE 0 END), 0),
    COALESCE(AVG(sr.mastery_level), 0),
    COALESCE(
      (
        SELECT COUNT(*) 
        FROM daily_study_statistics dss 
        WHERE dss.user_id = NEW.user_id 
        AND dss.study_date >= today_date - INTERVAL '1 day'
        AND dss.total_cards > 0
      ), 0
    ) + 1
  FROM spaced_repetition_cards sr
  LEFT JOIN review_sessions rs ON rs.user_id = sr.user_id 
    AND DATE(rs.start_time) = today_date
  LEFT JOIN review_results rr ON rr.user_id = sr.user_id 
    AND DATE(rr.review_date) = today_date
  WHERE sr.user_id = NEW.user_id
  ON CONFLICT (user_id, study_date) 
  DO UPDATE SET
    total_cards = EXCLUDED.total_cards,
    new_cards = EXCLUDED.new_cards,
    review_sessions = EXCLUDED.review_sessions,
    study_time_minutes = EXCLUDED.study_time_minutes,
    correct_answers = EXCLUDED.correct_answers,
    average_mastery = EXCLUDED.average_mastery,
    streak_days = EXCLUDED.streak_days,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques après chaque révision
CREATE TRIGGER trigger_update_daily_stats_after_review
  AFTER INSERT ON review_results
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_study_statistics();

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'spaced_repetition_cards', 
  'review_sessions', 
  'review_results',
  'daily_study_goals',
  'daily_study_statistics'
)
ORDER BY table_name;

-- Vérifier les politiques RLS
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE tablename IN (
  'spaced_repetition_cards', 
  'review_sessions', 
  'review_results',
  'daily_study_goals',
  'daily_study_statistics'
)
ORDER BY tablename, policyname;
