-- ============================================================================
-- 🔒 RÉACTIVER RLS + BONNES POLITIQUES
-- ============================================================================
-- Exécuter ce script APRÈS avoir testé que ça marche sans RLS
-- ============================================================================

-- ÉTAPE 1 : Réactiver RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "view_groups_permissive" ON groups;
DROP POLICY IF EXISTS "view_group_members_permissive" ON group_members;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Owners can update groups" ON groups;
DROP POLICY IF EXISTS "Owners can delete groups" ON groups;
DROP POLICY IF EXISTS "Admins can update members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- ÉTAPE 3 : Créer les politiques PERMISSIVES (qui marchent !)
-- ============================================================================

-- ✅ GROUPS : SELECT (lecture)
CREATE POLICY "select_groups_public"
  ON groups FOR SELECT
  TO authenticated
  USING (true);  -- ✅ TOUT LE MONDE PEUT LIRE (filtrage se fait côté app)

-- ✅ GROUP_MEMBERS : SELECT (lecture)
CREATE POLICY "select_group_members_public"
  ON group_members FOR SELECT
  TO authenticated
  USING (true);  -- ✅ TOUT LE MONDE PEUT LIRE (filtrage se fait côté app)

-- ✅ GROUPS : INSERT (création)
CREATE POLICY "insert_groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- ✅ GROUP_MEMBERS : INSERT (rejoindre)
CREATE POLICY "insert_group_members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ✅ GROUPS : UPDATE (modification)
CREATE POLICY "update_groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ✅ GROUPS : DELETE (suppression)
CREATE POLICY "delete_groups"
  ON groups FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ✅ GROUP_MEMBERS : DELETE (quitter)
CREATE POLICY "delete_group_members"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ÉTAPE 4 : Index (performance)
CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_public ON groups(is_public);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ÉTAPE 5 : Message de succès
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ RLS RÉACTIVÉE AVEC POLITIQUES PERMISSIVES ! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Changements :';
  RAISE NOTICE '   ✓ Lecture totale (SELECT) = PERMISE pour tous authentifiés';
  RAISE NOTICE '   ✓ Création = Sécurisée (owner_id vérifié)';
  RAISE NOTICE '   ✓ Modification = Sécurisée (owner uniquement)';
  RAISE NOTICE '   ✓ Suppression = Sécurisée (owner uniquement)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Test à faire :';
  RAISE NOTICE '   1. Actualisez /groups (F5)';
  RAISE NOTICE '   2. Ça devrait marcher maintenant !';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Note : Politiques très permissives en lecture';
  RAISE NOTICE '    → Filtrage public/privé se fait côté application';
  RAISE NOTICE '    → Actions sensibles restent protégées côté base';
  RAISE NOTICE '';
END $$;
