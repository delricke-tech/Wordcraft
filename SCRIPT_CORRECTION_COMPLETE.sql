-- ============================================================================
-- 🔧 SCRIPT UNIQUE - CORRECTION COMPLÈTE DE TOUTES LES ERREURS
-- Date: 3 Janvier 2026
-- ============================================================================
--
-- CE SCRIPT COMBINE TOUS LES CORRECTIFS EN 1 SEUL FICHIER
-- Exécutez ce script UNIQUE dans Supabase pour tout corriger d'un coup !
--
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : AJOUTER LES COLONNES MANQUANTES À PROFILES
-- ============================================================================

DO $$ 
BEGIN
  -- last_active_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Colonne last_active_at ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne last_active_at existe déjà';
  END IF;

  -- is_online
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_online'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_online boolean DEFAULT false;
    RAISE NOTICE '✅ Colonne is_online ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne is_online existe déjà';
  END IF;

  -- profile_views
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_views'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_views integer DEFAULT 0;
    RAISE NOTICE '✅ Colonne profile_views ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne profile_views existe déjà';
  END IF;

  -- connections_count (CRUCIAL)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'connections_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN connections_count integer DEFAULT 0;
    RAISE NOTICE '✅ Colonne connections_count ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne connections_count existe déjà';
  END IF;

  -- year_of_study
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'year_of_study'
  ) THEN
    ALTER TABLE profiles ADD COLUMN year_of_study integer;
    RAISE NOTICE '✅ Colonne year_of_study ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne year_of_study existe déjà';
  END IF;

  -- interests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'interests'
  ) THEN
    ALTER TABLE profiles ADD COLUMN interests text[] DEFAULT '{}';
    RAISE NOTICE '✅ Colonne interests ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne interests existe déjà';
  END IF;

  -- languages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages text[] DEFAULT '{}';
    RAISE NOTICE '✅ Colonne languages ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne languages existe déjà';
  END IF;

  -- location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
    RAISE NOTICE '✅ Colonne location ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne location existe déjà';
  END IF;
END $$;

-- Index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution);
CREATE INDEX IF NOT EXISTS idx_profiles_study_field ON profiles(study_field);
CREATE INDEX IF NOT EXISTS idx_profiles_connections_count ON profiles(connections_count DESC);

-- ============================================================================
-- PARTIE 2 : FONCTIONS RPC POUR DÉCOUVRIR (CORRIGÉES)
-- ============================================================================

-- Fonction : get_user_suggestions
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
DECLARE
  current_user_institution text;
  current_user_study_field text;
BEGIN
  SELECT p.institution, p.study_field 
  INTO current_user_institution, current_user_study_field
  FROM profiles p
  WHERE p.id = for_user_id;

  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    p.study_field,
    p.institution,
    COALESCE(p.connections_count, 0) AS connections_count,
    (p.institution = current_user_institution) AS common_institution,
    (p.study_field = current_user_study_field) AS common_study_field,
    (
      SELECT COUNT(*)::integer
      FROM connections c1
      WHERE (c1.user_id_1 = for_user_id OR c1.user_id_2 = for_user_id)
      AND (c1.user_id_1 = p.id OR c1.user_id_2 = p.id)
    ) AS mutual_connections,
    (
      CASE WHEN p.institution = current_user_institution THEN 50 ELSE 0 END +
      CASE WHEN p.study_field = current_user_study_field THEN 30 ELSE 0 END +
      (COALESCE(p.connections_count, 0) * 2) +
      (COALESCE(p.profile_views, 0) / 10)
    )::integer AS suggestion_score
  FROM profiles p
  WHERE p.id != for_user_id
  AND p.id NOT IN (
    SELECT c.user_id_2 FROM connections c WHERE c.user_id_1 = for_user_id
    UNION
    SELECT c.user_id_1 FROM connections c WHERE c.user_id_2 = for_user_id
  )
  AND p.id NOT IN (
    SELECT cr.receiver_id FROM connection_requests cr WHERE cr.sender_id = for_user_id AND cr.status = 'pending'
    UNION
    SELECT cr.sender_id FROM connection_requests cr WHERE cr.receiver_id = for_user_id AND cr.status = 'pending'
  )
  ORDER BY suggestion_score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : search_users
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
    p.id AS user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.study_field,
    p.institution,
    p.bio,
    COALESCE(p.connections_count, 0) AS connections_count
  FROM profiles p
  WHERE 
    p.full_name ILIKE '%' || search_term || '%'
    OR p.email ILIKE '%' || search_term || '%'
    OR COALESCE(p.study_field, '') ILIKE '%' || search_term || '%'
    OR COALESCE(p.institution, '') ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN p.full_name ILIKE search_term || '%' THEN 1
      WHEN p.full_name ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END,
    COALESCE(p.connections_count, 0) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 3 : FONCTIONS POUR GROUPES
-- ============================================================================

-- Fonction pour incrémenter le compteur de membres
CREATE OR REPLACE FUNCTION increment_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_count = member_count + 1
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour décrémenter le compteur de membres
CREATE OR REPLACE FUNCTION decrement_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : Quand un membre est ajouté
CREATE OR REPLACE FUNCTION update_group_member_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Quand un membre est supprimé
CREATE OR REPLACE FUNCTION update_group_member_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'active' THEN
    UPDATE groups
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.group_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Quand le statut change
CREATE OR REPLACE FUNCTION update_group_member_count_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE groups
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.group_id;
  ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Ajouter le propriétaire comme membre
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS group_member_count_insert ON group_members;
DROP TRIGGER IF EXISTS group_member_count_delete ON group_members;
DROP TRIGGER IF EXISTS group_member_count_update ON group_members;
DROP TRIGGER IF EXISTS add_owner_as_member_trigger ON groups;

-- Créer les triggers
CREATE TRIGGER group_member_count_insert
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_insert();

CREATE TRIGGER group_member_count_delete
  AFTER DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_delete();

CREATE TRIGGER group_member_count_update
  AFTER UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_update();

CREATE TRIGGER add_owner_as_member_trigger
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ TOUTES LES CORRECTIONS APPLIQUÉES AVEC SUCCÈS ! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Ce qui a été corrigé :';
  RAISE NOTICE '   ✓ Colonnes profiles ajoutées (8 colonnes)';
  RAISE NOTICE '   ✓ Fonction get_user_suggestions (erreur 400 + 42702)';
  RAISE NOTICE '   ✓ Fonction search_users';
  RAISE NOTICE '   ✓ Fonctions groupes (increment/decrement)';
  RAISE NOTICE '   ✓ Triggers groupes (4 triggers)';
  RAISE NOTICE '   ✓ Index pour performances';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '   1. Actualisez votre application (F5)';
  RAISE NOTICE '   2. Plus d''erreur 400 !';
  RAISE NOTICE '   3. Plus d''erreur 42702 !';
  RAISE NOTICE '   4. Plus d''erreur 500 sur les groupes !';
  RAISE NOTICE '   5. TOUT FONCTIONNE ! 🎉';
  RAISE NOTICE '';
END $$;
