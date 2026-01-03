-- ============================================================================
-- 🔒 RÉACTIVER RLS
-- ============================================================================
-- À exécuter APRÈS le test si FIX_BRUTAL_GROUPES.sql a fonctionné
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS RÉACTIVÉE';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Maintenant exécutez : CREATE_TABLES_GROUPES_COMPLET.sql';
  RAISE NOTICE '   (pour recréer les bonnes politiques)';
  RAISE NOTICE '';
END $$;
