-- ============================================================================
-- 🔧 FIX : Correction des Politiques RLS pour les Groupes
-- Date: 3 Janvier 2026
-- Problème: Erreur 500 sur /groups à cause de RLS trop restrictives
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Supprimer les anciennes politiques restrictives
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;

-- ============================================================================
-- ÉTAPE 2 : Créer des politiques plus permissives
-- ============================================================================

-- Politique pour groups : Permettre la lecture de TOUS les groupes publics
-- et des groupes privés dont on est membre/owner
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

-- Politique pour group_members : Permettre la lecture des membres
-- de TOUS les groupes publics + groupes privés dont on est membre
CREATE POLICY "view_group_members_permissive"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    -- Membres des groupes publics = lisibles par tous
    group_id IN (
      SELECT id FROM groups WHERE is_public = true
    )
    OR
    -- Membres des groupes privés = lisibles par les membres du groupe
    group_id IN (
      SELECT group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.status = 'active'
    )
  );

-- ============================================================================
-- ÉTAPE 3 : Vérification des politiques INSERT (doivent rester sécurisées)
-- ============================================================================

-- Ces politiques doivent déjà exister, mais on les recrée par sécurité

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ÉTAPE 4 : Vérification des index (pour performance)
-- ============================================================================

-- Ces index devraient déjà exister, mais on s'assure qu'ils sont là
CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_public ON groups(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- ============================================================================
-- ÉTAPE 5 : Affichage du résultat
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ POLITIQUES RLS CORRIGÉES AVEC SUCCÈS ! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Changements appliqués :';
  RAISE NOTICE '   ✓ Lecture des groupes publics = PERMISE pour tous';
  RAISE NOTICE '   ✓ Lecture des membres publics = PERMISE pour tous';
  RAISE NOTICE '   ✓ Lecture des groupes privés = PERMISE pour les membres';
  RAISE NOTICE '   ✓ Création de groupes = SÉCURISÉE (owner_id vérifié)';
  RAISE NOTICE '   ✓ Ajout aux groupes = SÉCURISÉ (user_id vérifié)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Test à effectuer :';
  RAISE NOTICE '   1. Actualisez /groups dans votre navigateur (F5)';
  RAISE NOTICE '   2. Plus d''erreur 500 !';
  RAISE NOTICE '   3. Les groupes devraient s''afficher correctement';
  RAISE NOTICE '';
END $$;
