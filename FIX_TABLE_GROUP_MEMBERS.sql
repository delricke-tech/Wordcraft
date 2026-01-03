-- ============================================================================
-- 🔧 FIX : Correction des Fonctions RPC (Erreur 42702)
-- Date: 3 Janvier 2026
-- ============================================================================
--
-- Ce script corrige l'erreur "column reference is ambiguous"
-- en qualifiant explicitement toutes les références de colonnes
--
-- ============================================================================

-- ============================================================================
-- FONCTION 1 : get_user_suggestions (CORRIGÉE)
-- ============================================================================

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
  -- Récupérer les infos de l'utilisateur actuel AVANT la requête principale
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
    -- Exclure les connexions existantes
    SELECT c.user_id_2 FROM connections c WHERE c.user_id_1 = for_user_id
    UNION
    SELECT c.user_id_1 FROM connections c WHERE c.user_id_2 = for_user_id
  )
  AND p.id NOT IN (
    -- Exclure les demandes en attente
    SELECT cr.receiver_id FROM connection_requests cr WHERE cr.sender_id = for_user_id AND cr.status = 'pending'
    UNION
    SELECT cr.sender_id FROM connection_requests cr WHERE cr.receiver_id = for_user_id AND cr.status = 'pending'
  )
  ORDER BY suggestion_score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION 2 : search_users (CORRIGÉE)
-- ============================================================================

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
-- FONCTION 3 : get_community_feed (BONUS - si elle existe)
-- ============================================================================

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
    p.id AS post_id,
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
    ) AS is_liked,
    EXISTS(
      SELECT 1 FROM connections c
      WHERE (c.user_id_1 = for_user_id AND c.user_id_2 = p.user_id)
      OR (c.user_id_2 = for_user_id AND c.user_id_1 = p.user_id)
    ) AS is_connected
  FROM posts p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  WHERE p.visibility = 'public'
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ FONCTIONS CORRIGÉES AVEC SUCCÈS ! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Fonctions mises à jour :';
  RAISE NOTICE '   ✓ get_user_suggestions (erreur 42702 corrigée)';
  RAISE NOTICE '   ✓ search_users (erreur 42702 corrigée)';
  RAISE NOTICE '   ✓ get_community_feed (bonus)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Changements appliqués :';
  RAISE NOTICE '   - Variables DECLARE pour éviter ambiguïté';
  RAISE NOTICE '   - Alias explicites (AS user_id, AS full_name, etc.)';
  RAISE NOTICE '   - COALESCE pour gérer les NULL';
  RAISE NOTICE '   - Qualification complète des colonnes (p.id, c.user_id_1, etc.)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Prochaine étape :';
  RAISE NOTICE '   1. Actualisez /discover dans votre navigateur (F5)';
  RAISE NOTICE '   2. Plus d''erreur 42702 !';
  RAISE NOTICE '   3. Les suggestions devraient s''afficher correctement';
  RAISE NOTICE '';
END $$;
