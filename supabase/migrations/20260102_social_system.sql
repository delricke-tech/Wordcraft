-- ============================================================================
-- SYSTÈME SOCIAL - Posts, Profils, Fil d'Actualité
-- Date: 2 janvier 2026
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
-- FONCTIONS ET TRIGGERS
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

-- ============================================================================
-- COMPTEURS AUTOMATIQUES
-- ============================================================================

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
-- CRÉATION DES TRIGGERS
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
-- VUES UTILES
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
-- DONNÉES DE TEST (Optionnel)
-- ============================================================================

-- Vous pouvez décommenter pour créer des posts de test
-- INSERT INTO posts (user_id, content, post_type, visibility) VALUES
-- ((SELECT id FROM profiles LIMIT 1), 'Première publication ! 🎉', 'status', 'public'),
-- ((SELECT id FROM profiles LIMIT 1), 'J''ai terminé mon quiz de mathématiques avec 95% ! 🎓', 'achievement', 'public');
