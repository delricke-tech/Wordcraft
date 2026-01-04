-- ============================================================================
-- 📊 FONCTIONS ET TABLES COMPLÉMENTAIRES POUR LES SESSIONS
-- ============================================================================

-- ÉTAPE 1 : Créer la table des messages de chat en session
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created ON session_messages(created_at);

-- Enable RLS
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples
CREATE POLICY "select_session_messages"
  ON session_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "insert_session_messages"
  ON session_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ÉTAPE 2 : Créer les fonctions RPC pour gérer les compteurs
-- ============================================================================

-- Fonction pour incrémenter le compteur de participants
CREATE OR REPLACE FUNCTION increment_session_participants(session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE study_sessions
  SET participant_count = participant_count + 1
  WHERE id = session_id;
END;
$$;

-- Fonction pour décrémenter le compteur de participants
CREATE OR REPLACE FUNCTION decrement_session_participants(session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE study_sessions
  SET participant_count = GREATEST(0, participant_count - 1)
  WHERE id = session_id;
END;
$$;

-- ============================================================================
-- ÉTAPE 3 : Fonction pour terminer automatiquement les sessions inactives
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_end_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Terminer les sessions actives depuis plus de 4 heures sans participants
  UPDATE study_sessions
  SET 
    status = 'ended',
    ended_at = now()
  WHERE 
    status = 'active'
    AND started_at < now() - interval '4 hours'
    AND participant_count = 0;
    
  -- Terminer les sessions scheduled dont la date est passée
  UPDATE study_sessions
  SET 
    status = 'ended',
    ended_at = now()
  WHERE 
    status = 'scheduled'
    AND scheduled_at < now() - interval '1 hour';
END;
$$;

-- ============================================================================
-- ÉTAPE 4 : Trigger pour mettre à jour automatiquement updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON study_sessions;
CREATE TRIGGER trigger_update_session_timestamp
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_updated_at();

-- ============================================================================
-- ÉTAPE 5 : Créer une vue pour les sessions avec informations de l'hôte
-- ============================================================================

CREATE OR REPLACE VIEW sessions_with_host AS
SELECT 
  s.*,
  p.full_name as host_name,
  p.avatar_url as host_avatar
FROM study_sessions s
LEFT JOIN profiles p ON s.host_id = p.id;

-- ============================================================================
-- ÉTAPE 6 : Fonction pour obtenir les participants d'une session avec profils
-- ============================================================================

CREATE OR REPLACE FUNCTION get_session_participants(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_avatar text,
  role text,
  status text,
  has_video boolean,
  has_audio boolean,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    COALESCE(p.full_name, 'Utilisateur') as user_name,
    p.avatar_url as user_avatar,
    sp.role,
    sp.status,
    sp.has_video,
    sp.has_audio,
    sp.joined_at
  FROM session_participants sp
  LEFT JOIN profiles p ON sp.user_id = p.id
  WHERE sp.session_id = p_session_id
    AND sp.status IN ('joined', 'invited')
  ORDER BY sp.joined_at DESC;
END;
$$;

-- ============================================================================
-- ÉTAPE 7 : Fonction pour nettoyer les anciennes sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les messages des sessions terminées depuis plus de 30 jours
  DELETE FROM session_messages
  WHERE session_id IN (
    SELECT id FROM study_sessions
    WHERE status = 'ended'
      AND ended_at < now() - interval '30 days'
  );
  
  -- Supprimer les participants des sessions terminées depuis plus de 30 jours
  DELETE FROM session_participants
  WHERE session_id IN (
    SELECT id FROM study_sessions
    WHERE status = 'ended'
      AND ended_at < now() - interval '30 days'
  );
  
  RAISE NOTICE 'Nettoyage des anciennes sessions terminé';
END;
$$;

-- ============================================================================
-- Message de confirmation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ FONCTIONS ET TABLES SESSIONS CRÉÉES ! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Créations :';
  RAISE NOTICE '   ✓ Table session_messages (chat en session)';
  RAISE NOTICE '   ✓ Fonctions increment/decrement_session_participants';
  RAISE NOTICE '   ✓ Fonction auto_end_inactive_sessions';
  RAISE NOTICE '   ✓ Vue sessions_with_host';
  RAISE NOTICE '   ✓ Fonction get_session_participants';
  RAISE NOTICE '   ✓ Fonction cleanup_old_sessions';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '   1. Tester la création de sessions';
  RAISE NOTICE '   2. Tester le chat en temps réel';
  RAISE NOTICE '   3. Implémenter WebRTC pour vidéo/audio';
  RAISE NOTICE '';
END $$;
