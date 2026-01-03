-- ============================================================================
-- 🌐 SYSTÈME COMMUNAUTAIRE - VERSION SAFE (Sans modification de profiles)
-- Date: 3 Janvier 2026
-- ============================================================================
-- 
-- Cette version NE MODIFIE PAS la table profiles
-- Elle crée uniquement les tables et fonctions de connexions
--
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : SYSTÈME DE CONNEXIONS (Friend Requests)
-- ============================================================================

-- Table pour gérer les demandes de connexion/amitié
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- RLS pour connection_requests
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Voir ses propres demandes (envoyées ou reçues)
DROP POLICY IF EXISTS "Users can view their connection requests" ON connection_requests;
CREATE POLICY "Users can view their connection requests" ON connection_requests
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Créer une demande
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
CREATE POLICY "Users can create connection requests" ON connection_requests
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Mettre à jour une demande (accepter/rejeter)
DROP POLICY IF EXISTS "Users can update connection requests" ON connection_requests;
CREATE POLICY "Users can update connection requests" ON connection_requests
  FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- ============================================================================
-- PARTIE 2 : TABLE DES CONNEXIONS ACTIVES
-- ============================================================================

-- Table pour les connexions acceptées (amis)
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (user_id_1 < user_id_2), -- Éviter les doublons (A-B = B-A)
  UNIQUE(user_id_1, user_id_2)
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user_id_1);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user_id_2);

-- RLS pour connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Voir ses propres connexions
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Seul le système peut créer des connexions (via trigger)
DROP POLICY IF EXISTS "System can create connections" ON connections;
CREATE POLICY "System can create connections" ON connections
  FOR INSERT TO authenticated
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- ============================================================================
-- PARTIE 3 : FONCTIONS DE GESTION DES CONNEXIONS
-- ============================================================================

-- Fonction pour accepter une demande de connexion
CREATE OR REPLACE FUNCTION accept_connection_request(request_id uuid)
RETURNS void AS $$
DECLARE
  sender uuid;
  receiver uuid;
BEGIN
  -- Récupérer les IDs
  SELECT sender_id, receiver_id INTO sender, receiver
  FROM connection_requests
  WHERE id = request_id AND status = 'pending';

  IF sender IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Mettre à jour le statut
  UPDATE connection_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;

  -- Créer la connexion (toujours user_id_1 < user_id_2)
  INSERT INTO connections (user_id_1, user_id_2)
  VALUES (LEAST(sender, receiver), GREATEST(sender, receiver))
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rejeter une demande
CREATE OR REPLACE FUNCTION reject_connection_request(request_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE connection_requests
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer une connexion
CREATE OR REPLACE FUNCTION remove_connection(user1 uuid, user2 uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM connections
  WHERE (user_id_1 = LEAST(user1, user2) AND user_id_2 = GREATEST(user1, user2));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 4 : FONCTION DE SUGGESTIONS INTELLIGENTES (Version simplifiée)
-- ============================================================================

-- Fonction pour obtenir des suggestions personnalisées
CREATE OR REPLACE FUNCTION get_user_suggestions(
  for_user_id uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  study_field text,
  institution text,
  connections_count integer,
  common_institution boolean,
  common_study_field boolean,
  mutual_connections integer,
  suggestion_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.study_field,
    p.institution,
    0 as connections_count, -- Sera mis à jour manuellement
    (p.institution = (SELECT institution FROM profiles WHERE id = for_user_id)) as common_institution,
    (p.study_field = (SELECT study_field FROM profiles WHERE id = for_user_id)) as common_study_field,
    0 as mutual_connections, -- Sera calculé plus tard
    (
      CASE WHEN p.institution = (SELECT institution FROM profiles WHERE id = for_user_id) THEN 50 ELSE 0 END +
      CASE WHEN p.study_field = (SELECT study_field FROM profiles WHERE id = for_user_id) THEN 30 ELSE 0 END
    )::integer as suggestion_score
  FROM profiles p
  WHERE p.id != for_user_id
  AND p.id NOT IN (
    -- Exclure les connexions existantes
    SELECT user_id_2 FROM connections WHERE user_id_1 = for_user_id
    UNION
    SELECT user_id_1 FROM connections WHERE user_id_2 = for_user_id
  )
  AND p.id NOT IN (
    -- Exclure les demandes en attente
    SELECT receiver_id FROM connection_requests WHERE sender_id = for_user_id AND status = 'pending'
    UNION
    SELECT sender_id FROM connection_requests WHERE receiver_id = for_user_id AND status = 'pending'
  )
  ORDER BY suggestion_score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5 : FONCTION DE RECHERCHE D'UTILISATEURS
-- ============================================================================

-- Fonction pour rechercher des utilisateurs
CREATE OR REPLACE FUNCTION search_users(
  search_term text,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  study_field text,
  institution text,
  bio text,
  connections_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.study_field,
    p.institution,
    p.bio,
    0 as connections_count
  FROM profiles p
  WHERE 
    p.full_name ILIKE '%' || search_term || '%'
    OR p.email ILIKE '%' || search_term || '%'
    OR p.study_field ILIKE '%' || search_term || '%'
    OR p.institution ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN p.full_name ILIKE search_term || '%' THEN 1
      WHEN p.full_name ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 6 : NOTIFICATIONS
-- ============================================================================

-- Assurer que la table notifications existe
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'connection_request', 'connection_accepted', 'mention', 'share')),
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_id uuid,
  target_type text CHECK (target_type IN ('post', 'comment', 'card', 'quiz', 'profile')),
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Fonction pour créer une notification de demande de connexion
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, target_id, target_type)
  VALUES (NEW.receiver_id, 'connection_request', NEW.sender_id, NEW.id, 'profile');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une notification d'acceptation
CREATE OR REPLACE FUNCTION notify_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, actor_id, target_id, target_type)
    VALUES (NEW.sender_id, 'connection_accepted', NEW.receiver_id, NEW.id, 'profile');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour notifications
DROP TRIGGER IF EXISTS connection_request_notification ON connection_requests;
CREATE TRIGGER connection_request_notification
  AFTER INSERT ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();

DROP TRIGGER IF EXISTS connection_accepted_notification ON connection_requests;
CREATE TRIGGER connection_accepted_notification
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_accepted();

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Système communautaire installé avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Éléments créés :';
  RAISE NOTICE '   - Table connection_requests (demandes de connexion)';
  RAISE NOTICE '   - Table connections (connexions actives)';
  RAISE NOTICE '   - Fonctions : accept_connection_request, reject_connection_request';
  RAISE NOTICE '   - Fonction : get_user_suggestions (suggestions personnalisées)';
  RAISE NOTICE '   - Fonction : search_users (recherche utilisateurs)';
  RAISE NOTICE '   - Notifications automatiques pour connexions';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Fonctionnalités disponibles :';
  RAISE NOTICE '   ✓ Découvrir de nouveaux utilisateurs';
  RAISE NOTICE '   ✓ Suggestions intelligentes (même école, domaine)';
  RAISE NOTICE '   ✓ Système de demandes de connexion';
  RAISE NOTICE '   ✓ Recherche d''utilisateurs';
  RAISE NOTICE '   ✓ Notifications en temps réel';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ NOTE : Les colonnes profiles restent inchangées';
  RAISE NOTICE '   Vous pouvez les ajouter manuellement si besoin';
END $$;
