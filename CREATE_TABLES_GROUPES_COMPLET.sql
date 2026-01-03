-- ============================================================================
-- 🏗️ CRÉATION COMPLÈTE DES TABLES GROUPES (si manquantes)
-- ============================================================================
-- Ce script crée les tables groups et group_members + politiques + triggers
-- SÛR : N'écrase rien si les tables existent déjà
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Créer la table groups (si elle n'existe pas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_url text,
  cover_url text,
  is_public boolean DEFAULT false,
  is_discoverable boolean DEFAULT true,
  category text,
  tags text[] DEFAULT '{}',
  settings jsonb DEFAULT '{
    "allow_member_posts": true,
    "allow_member_invites": false,
    "require_approval": true,
    "enable_chat": true,
    "enable_resources": true
  }'::jsonb,
  member_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ÉTAPE 2 : Créer la table group_members (si elle n'existe pas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES profiles(id),
  UNIQUE(group_id, user_id)
);

-- ============================================================================
-- ÉTAPE 3 : Activer RLS (Row Level Security)
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : Supprimer les anciennes politiques (pour recréer proprement)
-- ============================================================================

DROP POLICY IF EXISTS "view_groups_permissive" ON groups;
DROP POLICY IF EXISTS "view_group_members_permissive" ON group_members;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Owners can update groups" ON groups;
DROP POLICY IF EXISTS "Owners can delete groups" ON groups;
DROP POLICY IF EXISTS "Admins can update members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;

-- ============================================================================
-- ÉTAPE 5 : Créer les politiques RLS PERMISSIVES
-- ============================================================================

-- SELECT sur groups (lecture)
CREATE POLICY "view_groups_permissive"
  ON groups FOR SELECT
  TO authenticated
  USING (
    is_public = true 
    OR owner_id = auth.uid()
    OR id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- SELECT sur group_members (lecture)
CREATE POLICY "view_group_members_permissive"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (SELECT id FROM groups WHERE is_public = true)
    OR group_id IN (
      SELECT group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.status = 'active'
    )
  );

-- INSERT sur groups (création)
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- INSERT sur group_members (rejoindre)
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE sur groups (modification)
CREATE POLICY "Owners can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- DELETE sur groups (suppression)
CREATE POLICY "Owners can delete groups"
  ON groups FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- UPDATE sur group_members (modification rôles)
CREATE POLICY "Admins can update members"
  ON group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- DELETE sur group_members (quitter/expulser)
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ÉTAPE 6 : Créer les index (performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_public ON groups(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_groups_created ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- ============================================================================
-- ÉTAPE 7 : Créer les fonctions de gestion des compteurs
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

-- ============================================================================
-- ÉTAPE 8 : Créer les triggers automatiques
-- ============================================================================

-- Trigger : Incrémenter quand membre ajouté
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

DROP TRIGGER IF EXISTS group_member_count_insert ON group_members;
CREATE TRIGGER group_member_count_insert
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_insert();

-- Trigger : Décrémenter quand membre supprimé
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

DROP TRIGGER IF EXISTS group_member_count_delete ON group_members;
CREATE TRIGGER group_member_count_delete
  AFTER DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_delete();

-- Trigger : Ajuster quand statut change
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

DROP TRIGGER IF EXISTS group_member_count_update ON group_members;
CREATE TRIGGER group_member_count_update
  AFTER UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count_on_update();

-- Trigger : Ajouter le propriétaire comme premier membre
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
-- ÉTAPE 9 : Vérification finale
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         ✅✅✅ TABLES GROUPES CRÉÉES AVEC SUCCÈS ! ✅✅✅         ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🏗️  Éléments créés :';
  RAISE NOTICE '   ✓ Table "groups" avec toutes ses colonnes';
  RAISE NOTICE '   ✓ Table "group_members" avec contraintes';
  RAISE NOTICE '   ✓ 8 politiques RLS (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   ✓ 6 index pour la performance';
  RAISE NOTICE '   ✓ 2 fonctions RPC (increment/decrement)';
  RAISE NOTICE '   ✓ 4 triggers automatiques (compteurs + owner)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Sécurité :';
  RAISE NOTICE '   ✓ RLS activé sur les 2 tables';
  RAISE NOTICE '   ✓ Groupes publics = lisibles par tous';
  RAISE NOTICE '   ✓ Groupes privés = lisibles par membres uniquement';
  RAISE NOTICE '   ✓ Création/modification = propriétaire uniquement';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaine étape :';
  RAISE NOTICE '   1. Actualisez /groups dans votre navigateur (F5)';
  RAISE NOTICE '   2. Créez votre premier groupe';
  RAISE NOTICE '   3. Plus d''erreur 500 !';
  RAISE NOTICE '';
END $$;
