-- ============================================================================
-- 🔍 VÉRIFICATION : Test après correction RLS
-- ============================================================================
-- 
-- Ce script vous permet de vérifier que la correction a bien fonctionné.
-- Exécutez-le APRÈS avoir exécuté FIX_RLS_GROUPS_SIMPLE.sql
--
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Vérifier que les politiques existent
-- ============================================================================

DO $$
DECLARE
  policy_count integer;
BEGIN
  -- Compter les politiques sur la table groups
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'groups';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Vérification des politiques sur table "groups"';
  RAISE NOTICE '   Nombre de politiques trouvées: %', policy_count;
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '   ✅ OK - Politiques présentes';
  ELSE
    RAISE NOTICE '   ⚠️  ATTENTION - Nombre de politiques faible';
  END IF;
  
  -- Compter les politiques sur la table group_members
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'group_members';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Vérification des politiques sur table "group_members"';
  RAISE NOTICE '   Nombre de politiques trouvées: %', policy_count;
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '   ✅ OK - Politiques présentes';
  ELSE
    RAISE NOTICE '   ⚠️  ATTENTION - Nombre de politiques faible';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Afficher les politiques importantes
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Liste des politiques RLS :';
  RAISE NOTICE '';
  
  FOR rec IN 
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE tablename IN ('groups', 'group_members')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '   • %.% : %', rec.tablename, ' ', rec.policyname;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- ÉTAPE 3 : Vérifier les index (performance)
-- ============================================================================

DO $$
DECLARE
  index_count integer;
BEGIN
  RAISE NOTICE '📊 Vérification des index :';
  
  -- Index sur groups
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'groups';
  
  RAISE NOTICE '   Table groups : % index', index_count;
  
  -- Index sur group_members
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'group_members';
  
  RAISE NOTICE '   Table group_members : % index', index_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- ÉTAPE 4 : Test de requête simple
-- ============================================================================

DO $$
DECLARE
  group_count integer;
  public_group_count integer;
BEGIN
  RAISE NOTICE '🔬 Test de requêtes basiques :';
  
  -- Compter tous les groupes
  SELECT COUNT(*) INTO group_count FROM groups;
  RAISE NOTICE '   Total de groupes : %', group_count;
  
  -- Compter les groupes publics
  SELECT COUNT(*) INTO public_group_count 
  FROM groups 
  WHERE is_public = true;
  
  RAISE NOTICE '   Groupes publics : %', public_group_count;
  
  IF group_count > 0 THEN
    RAISE NOTICE '   ✅ Des groupes existent';
  ELSE
    RAISE NOTICE '   ℹ️  Aucun groupe créé (normal si première utilisation)';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- ÉTAPE 5 : Vérifier les triggers
-- ============================================================================

DO $$
DECLARE
  trigger_count integer;
BEGIN
  RAISE NOTICE '⚙️  Vérification des triggers :';
  
  -- Compter les triggers sur group_members
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'group_members'::regclass;
  
  RAISE NOTICE '   Triggers sur group_members : %', trigger_count;
  
  IF trigger_count >= 3 THEN
    RAISE NOTICE '   ✅ Triggers de comptage présents';
  ELSE
    RAISE NOTICE '   ⚠️  Triggers manquants (exécutez 20260102_groups_functions.sql)';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- RÉSULTAT FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                    ✅ VÉRIFICATION TERMINÉE                     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '   1. Actualisez votre page /groups (F5)';
  RAISE NOTICE '   2. Vérifiez la console du navigateur';
  RAISE NOTICE '   3. Les erreurs 500 devraient avoir disparu !';
  RAISE NOTICE '';
  RAISE NOTICE 'Si vous voyez encore des erreurs :';
  RAISE NOTICE '   • Videz le cache (Ctrl+Shift+R)';
  RAISE NOTICE '   • Déconnectez/reconnectez-vous';
  RAISE NOTICE '   • Vérifiez que vous êtes bien authentifié';
  RAISE NOTICE '';
END $$;
