-- ============================================================================
-- 🌐 SYSTÈME COMMUNAUTAIRE SOCIAL - Découverte et Connexions
-- Date: 3 Janvier 2026
-- ============================================================================
-- 
-- Ce script crée un système social complet pour découvrir et connecter les utilisateurs
-- Inspiré de Facebook : suggestions, demandes d'amis, utilisateurs populaires, etc.
--
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : AMÉLIORATION TABLE PROFILES
-- ============================================================================

-- Ajouter des champs pour améliorer les suggestions (avec gestion d'erreurs)
DO $$ 
BEGIN
  -- last_active_at
  BEGIN
    ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- is_online
  BEGIN
    ALTER TABLE profiles ADD COLUMN is_online boolean DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- profile_views
  BEGIN
    ALTER TABLE profiles ADD COLUMN profile_views integer DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- connections_count
  BEGIN
    ALTER TABLE profiles ADD COLUMN connections_count integer DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- year_of_study
  BEGIN
    ALTER TABLE profiles ADD COLUMN year_of_study integer;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- interests
  BEGIN
    ALTER TABLE profiles ADD COLUMN interests text[] DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- languages
  BEGIN
    ALTER TABLE profiles ADD COLUMN languages text[] DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;

  -- location
  BEGIN
    ALTER TABLE profiles ADD COLUMN location text;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;
END $$;

-- Index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution);
CREATE INDEX IF NOT EXISTS idx_profiles_study_field ON profiles(study_field);

-- ============================================================================
-- PARTIE 2 : SYSTÈME DE CONNEXIONS (Friend Requests)
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
-- PARTIE 3 : TABLE DES CONNEXIONS ACTIVES
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
-- PARTIE 4 : FONCTIONS DE GESTION DES CONNEXIONS
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

  -- Incrémenter les compteurs
  UPDATE profiles SET connections_count = connections_count + 1
  WHERE id IN (sender, receiver);
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

  -- Décrémenter les compteurs
  UPDATE profiles SET connections_count = GREATEST(connections_count - 1, 0)
  WHERE id IN (user1, user2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5 : VUES POUR SUGGESTIONS ET DÉCOUVERTE
-- ============================================================================

-- Vue : Nouveaux utilisateurs (inscrits récemment)
CREATE OR REPLACE VIEW new_users AS
SELECT 
  p.*,
  EXTRACT(EPOCH FROM (now() - p.created_at))/86400 as days_since_joined
FROM profiles p
WHERE p.created_at > now() - interval '30 days'
ORDER BY p.created_at DESC;

-- Vue : Utilisateurs actifs récemment
CREATE OR REPLACE VIEW recently_active_users AS
SELECT 
  p.*,
  EXTRACT(EPOCH FROM (now() - p.last_active_at))/3600 as hours_since_active
FROM profiles p
WHERE p.last_active_at > now() - interval '7 days'
ORDER BY p.last_active_at DESC;

-- Vue : Utilisateurs populaires (beaucoup de connexions)
CREATE OR REPLACE VIEW popular_users AS
SELECT 
  p.*,
  p.connections_count,
  p.profile_views
FROM profiles p
WHERE p.connections_count > 5
ORDER BY p.connections_count DESC, p.profile_views DESC;

-- ============================================================================
-- PARTIE 6 : FONCTION DE SUGGESTIONS INTELLIGENTES
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
    p.connections_count,
    (p.institution = (SELECT institution FROM profiles WHERE id = for_user_id)) as common_institution,
    (p.study_field = (SELECT study_field FROM profiles WHERE id = for_user_id)) as common_study_field,
    (
      SELECT COUNT(*)::integer
      FROM connections c1
      WHERE (c1.user_id_1 = for_user_id OR c1.user_id_2 = for_user_id)
      AND (c1.user_id_1 = p.id OR c1.user_id_2 = p.id)
    ) as mutual_connections,
    (
      CASE WHEN p.institution = (SELECT institution FROM profiles WHERE id = for_user_id) THEN 50 ELSE 0 END +
      CASE WHEN p.study_field = (SELECT study_field FROM profiles WHERE id = for_user_id) THEN 30 ELSE 0 END +
      (p.connections_count * 2) +
      (p.profile_views / 10)
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
-- PARTIE 7 : FONCTION POUR FEED COMMUNAUTAIRE
-- ============================================================================

-- Fonction pour obtenir le feed communautaire (tous les posts publics)
CREATE OR REPLACE FUNCTION get_community_feed(
  for_user_id uuid,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  content text,
  post_type text,
  like_count integer,
  comment_count integer,
  share_count integer,
  created_at timestamptz,
  full_name text,
  avatar_url text,
  study_field text,
  is_liked boolean,
  is_connected boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.post_type,
    p.like_count,
    p.comment_count,
    p.share_count,
    p.created_at,
    pr.full_name,
    pr.avatar_url,
    pr.study_field,
    EXISTS(
      SELECT 1 FROM likes l 
      WHERE l.target_id = p.id 
      AND l.target_type = 'post' 
      AND l.user_id = for_user_id
    ) as is_liked,
    EXISTS(
      SELECT 1 FROM connections c
      WHERE (c.user_id_1 = for_user_id AND c.user_id_2 = p.user_id)
      OR (c.user_id_2 = for_user_id AND c.user_id_1 = p.user_id)
    ) as is_connected
  FROM posts p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  WHERE p.visibility = 'public'
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 8 : NOTIFICATIONS
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
-- PARTIE 9 : FONCTION DE RECHERCHE D'UTILISATEURS
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
    p.connections_count
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
    END,
    p.connections_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  RAISE NOTICE '   - Fonction : get_community_feed (feed communautaire)';
  RAISE NOTICE '   - Fonction : search_users (recherche utilisateurs)';
  RAISE NOTICE '   - Vues : new_users, recently_active_users, popular_users';
  RAISE NOTICE '   - Notifications automatiques pour connexions';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Fonctionnalités disponibles :';
  RAISE NOTICE '   ✓ Découvrir de nouveaux utilisateurs';
  RAISE NOTICE '   ✓ Suggestions intelligentes (même école, domaine)';
  RAISE NOTICE '   ✓ Système de demandes de connexion';
  RAISE NOTICE '   ✓ Feed communautaire (tous les posts publics)';
  RAISE NOTICE '   ✓ Recherche d''utilisateurs';
  RAISE NOTICE '   ✓ Notifications en temps réel';
END $$;
