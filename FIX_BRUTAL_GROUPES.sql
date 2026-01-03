-- ============================================================================
-- 🚨 FIX BRUTAL - DÉSACTIVE RLS TEMPORAIREMENT
-- ============================================================================
-- ⚠️ ATTENTION : Ceci désactive la sécurité RLS pour tester
-- ⚠️ À utiliser UNIQUEMENT en développement pour identifier le problème
-- ============================================================================

-- ÉTAPE 1 : DÉSACTIVER RLS (pour tester si c'est bien ça le problème)
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️⚠️⚠️ RLS DÉSACTIVÉE ! ⚠️⚠️⚠️';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test à faire MAINTENANT :';
  RAISE NOTICE '   1. Actualisez /groups (F5)';
  RAISE NOTICE '   2. Si ça marche → le problème vient de RLS';
  RAISE NOTICE '   3. Si ça ne marche toujours pas → problème ailleurs';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NE LAISSEZ PAS EN PRODUCTION !';
  RAISE NOTICE '   Réactivez avec : ALTER TABLE groups ENABLE ROW LEVEL SECURITY;';
  RAISE NOTICE '';
END $$;
