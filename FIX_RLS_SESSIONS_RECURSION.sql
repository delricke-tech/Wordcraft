-- ============================================================================
-- 🔧 CORRECTION RÉCURSION INFINIE - POLITIQUES RLS STUDY_SESSIONS
-- ============================================================================
-- Ce script corrige l'erreur "Infinite recursion detected in policy for relation study_sessions"
-- Les politiques actuelles créent une boucle infinie entre study_sessions et session_participants
-- ============================================================================

-- ÉTAPE 1 : Supprimer TOUTES les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can view accessible sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON study_sessions;
DROP POLICY IF EXISTS "Hosts can update sessions" ON study_sessions;
DROP POLICY IF EXISTS "Hosts can delete sessions" ON study_sessions;

DROP POLICY IF EXISTS "Participants can view session participants" ON session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON session_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON session_participants;

DROP POLICY IF EXISTS "Session participants can view documents" ON session_documents;
DROP POLICY IF EXISTS "Participants can share documents" ON session_documents;

-- ============================================================================
-- ÉTAPE 2 : Créer des politiques SIMPLES et DIRECTES (sans récursion)
-- ============================================================================

-- 🟢 STUDY_SESSIONS : Politiques sans récursion
-- ============================================================================

-- SELECT : Permettre à tous les utilisateurs authentifiés de voir les sessions
-- (Le filtrage se fera côté application si nécessaire)
CREATE POLICY "select_study_sessions_permissive"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : Un utilisateur ne peut créer une session que s'il en est l'hôte
CREATE POLICY "insert_study_sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- UPDATE : Seul l'hôte peut modifier sa session
CREATE POLICY "update_study_sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- DELETE : Seul l'hôte peut supprimer sa session
CREATE POLICY "delete_study_sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- 🟢 SESSION_PARTICIPANTS : Politiques sans récursion
-- ============================================================================

-- SELECT : Tous les utilisateurs authentifiés peuvent voir les participants
CREATE POLICY "select_session_participants_permissive"
  ON session_participants FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : Un utilisateur peut s'ajouter comme participant
CREATE POLICY "insert_session_participants"
  ON session_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE : Un utilisateur peut modifier sa propre participation
CREATE POLICY "update_session_participants"
  ON session_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE : Un utilisateur peut retirer sa participation
CREATE POLICY "delete_session_participants"
  ON session_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 🟢 SESSION_DOCUMENTS : Politiques simples
-- ============================================================================

-- SELECT : Tous peuvent voir les documents de session
CREATE POLICY "select_session_documents_permissive"
  ON session_documents FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : Un utilisateur peut partager un document s'il en est l'auteur
CREATE POLICY "insert_session_documents"
  ON session_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by);

-- UPDATE : Un utilisateur peut modifier les documents qu'il a partagés
CREATE POLICY "update_session_documents"
  ON session_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

-- DELETE : Un utilisateur peut supprimer les documents qu'il a partagés
CREATE POLICY "delete_session_documents"
  ON session_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by);

-- ============================================================================
-- ÉTAPE 3 : Vérifier que RLS est activée sur toutes les tables
-- ============================================================================

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : Créer des index pour améliorer les performances
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_study_sessions_host ON study_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_scheduled ON study_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_documents_session ON session_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_documents_shared_by ON session_documents(shared_by);

-- ============================================================================
-- ÉTAPE 5 : Message de confirmation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ RLS CORRIGÉE - RÉCURSION ÉLIMINÉE ! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Changements appliqués :';
  RAISE NOTICE '   ✓ Politiques simplifiées sans récursion';
  RAISE NOTICE '   ✓ SELECT permissif pour tous les utilisateurs authentifiés';
  RAISE NOTICE '   ✓ INSERT/UPDATE/DELETE sécurisés par user_id/host_id';
  RAISE NOTICE '   ✓ Index créés pour de meilleures performances';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '   1. Rafraîchir la page des sessions (F5)';
  RAISE NOTICE '   2. Les erreurs "Infinite recursion" devraient disparaître';
  RAISE NOTICE '   3. Vous pourrez créer et rejoindre des sessions';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Note : Le filtrage des sessions privées se fait côté application';
  RAISE NOTICE '    → Plus de récursion = Plus rapide et plus stable';
  RAISE NOTICE '';
END $$;
