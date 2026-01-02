-- ============================================================================
-- 🚀 SCRIPT COMPLET SUPABASE - TOUT EN UN
-- Date: 2 Janvier 2026
-- ============================================================================
-- 
-- Ce script contient TOUTES les fonctions et tables nécessaires pour que
-- l'application WordCraft fonctionne en temps réel.
--
-- ⚠️ PRÉREQUIS : Les tables de base doivent exister (profiles, groups, etc.)
-- Si elles n'existent pas, exécutez d'abord : 00_complete_schema.sql
--
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : FONCTIONS ET TRIGGERS POUR LES GROUPES
-- ============================================================================

-- Fonction pour incrémenter le compteur de membres d'un groupe
CREATE OR REPLACE FUNCTION increment_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_count = member_count + 1
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour décrémenter le compteur de membres d'un groupe
CREATE OR REPLACE FUNCTION decrement_group_members(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement le compteur de membres
-- Quand un membre est ajouté
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

-- Quand un membre est supprimé
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

-- Quand le statut d'un membre change
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

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS group_member_count_insert ON group_members;
DROP TRIGGER IF EXISTS group_member_count_delete ON group_members;
DROP TRIGGER IF EXISTS group_member_count_update ON group_members;

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

-- Ajouter le propriétaire comme premier membre lors de la création d'un groupe
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_owner_as_member_trigger ON groups;

CREATE TRIGGER add_owner_as_member_trigger
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- ============================================================================
-- PARTIE 2 : SYSTÈME SOCIAL - Posts, Likes, Commentaires
-- ============================================================================

-- Table Posts (Publications sociales)
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'status' CHECK (post_type IN ('status', 'achievement', 'share', 'question')),
  media_urls text[] DEFAULT '{}',
  shared_resource_id uuid,
  shared_resource_type text CHECK (shared_resource_type IN ('document', 'card', 'quiz', 'group')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Politique: Voir les posts publics + ses propres posts + posts des amis
CREATE POLICY "Users can view posts" ON posts
  FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM follows
        WHERE follows.follower_id = auth.uid()
        AND follows.following_id = posts.user_id
      )
    )
  );

-- Politique: Créer ses propres posts
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique: Modifier ses propres posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Supprimer ses propres posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PARTIE 3 : FONCTIONS ET TRIGGERS POUR LES COMPTEURS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at_trigger ON posts;
CREATE TRIGGER update_posts_updated_at_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();

-- Incrémenter like_count quand un like est ajouté sur un post
CREATE OR REPLACE FUNCTION increment_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_type = 'post' THEN
    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Décrémenter like_count quand un like est retiré
CREATE OR REPLACE FUNCTION decrement_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.target_type = 'post' THEN
    UPDATE posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.target_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Incrémenter comment_count quand un commentaire est ajouté
CREATE OR REPLACE FUNCTION increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_type = 'post' AND NOT NEW.is_deleted THEN
    UPDATE posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Décrémenter comment_count quand un commentaire est supprimé
CREATE OR REPLACE FUNCTION decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.target_type = 'post' AND NOT OLD.is_deleted THEN
    UPDATE posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.target_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 4 : CRÉATION DES TRIGGERS POUR LES LIKES ET COMMENTAIRES
-- ============================================================================

-- Triggers pour les likes
DROP TRIGGER IF EXISTS post_like_count_insert ON likes;
CREATE TRIGGER post_like_count_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_like_count();

DROP TRIGGER IF EXISTS post_like_count_delete ON likes;
CREATE TRIGGER post_like_count_delete
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_like_count();

-- Triggers pour les commentaires
DROP TRIGGER IF EXISTS post_comment_count_insert ON comments;
CREATE TRIGGER post_comment_count_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_comment_count();

DROP TRIGGER IF EXISTS post_comment_count_delete ON comments;
CREATE TRIGGER post_comment_count_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_comment_count();

-- Trigger pour marquer comme modifié
DROP TRIGGER IF EXISTS post_comment_count_update ON comments;
CREATE TRIGGER post_comment_count_update
  AFTER UPDATE ON comments
  FOR EACH ROW
  WHEN (OLD.is_deleted = false AND NEW.is_deleted = true)
  EXECUTE FUNCTION decrement_post_comment_count();

-- ============================================================================
-- PARTIE 5 : VUES UTILES
-- ============================================================================

-- Vue pour récupérer les posts avec les infos utilisateur
CREATE OR REPLACE VIEW posts_with_profiles AS
SELECT 
  p.*,
  pr.full_name,
  pr.avatar_url,
  pr.email,
  pr.study_field,
  pr.institution
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id;

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

-- Si vous voyez ce message, le script s'est exécuté avec succès ! ✅
DO $$
BEGIN
  RAISE NOTICE '✅ Script complet exécuté avec succès !';
  RAISE NOTICE '📋 Tables créées : posts';
  RAISE NOTICE '⚙️ Fonctions créées : increment_group_members, decrement_group_members, add_owner_as_member';
  RAISE NOTICE '🔧 Triggers créés : Compteurs automatiques pour groups, posts, likes, comments';
  RAISE NOTICE '🔒 Politiques RLS activées sur posts';
  RAISE NOTICE '👁️ Vue créée : posts_with_profiles';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Votre application est maintenant FONCTIONNELLE !';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes :';
  RAISE NOTICE '   1. Redémarrez votre application (npm run dev)';
  RAISE NOTICE '   2. Testez /feed pour créer un post';
  RAISE NOTICE '   3. Testez /groups pour rejoindre un groupe';
  RAISE NOTICE '   4. Vérifiez que les compteurs fonctionnent en temps réel';
END $$;
