-- ============================================================================
-- 🔍 DIAGNOSTIC COMPLET - Erreurs 500 sur /groups
-- ============================================================================
-- Ce script vérifie TOUT : tables, colonnes, politiques, triggers, données
-- Exécutez-le sur Supabase SQL Editor pour identifier le problème
-- ============================================================================

DO $$
DECLARE
  table_exists boolean;
  column_count integer;
  policy_count integer;
  data_count integer;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           🔍 DIAGNOSTIC COMPLET - SYSTÈME GROUPES              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 1 : Vérifier que les tables existent
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 1/7 : Vérification des tables';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- Vérifier table groups
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'groups'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '   ✅ Table "groups" existe';
  ELSE
    RAISE NOTICE '   ❌ Table "groups" MANQUANTE !';
    RAISE NOTICE '   → Exécuter : supabase/migrations/00_complete_schema.sql';
  END IF;
  
  -- Vérifier table group_members
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'group_members'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '   ✅ Table "group_members" existe';
  ELSE
    RAISE NOTICE '   ❌ Table "group_members" MANQUANTE !';
    RAISE NOTICE '   → Exécuter : supabase/migrations/00_complete_schema.sql';
  END IF;
  
  -- Vérifier table profiles
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '   ✅ Table "profiles" existe';
  ELSE
    RAISE NOTICE '   ❌ Table "profiles" MANQUANTE !';
    RAISE NOTICE '   → Problème grave : table users de base absente';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 2 : Vérifier les colonnes importantes
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 2/7 : Vérification des colonnes';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- Colonnes de groups
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'groups'
  AND column_name IN ('id', 'name', 'owner_id', 'is_public', 'member_count');
  
  IF column_count = 5 THEN
    RAISE NOTICE '   ✅ Table "groups" : colonnes essentielles présentes';
  ELSE
    RAISE NOTICE '   ⚠️  Table "groups" : colonnes manquantes (% sur 5)', column_count;
  END IF;
  
  -- Colonnes de group_members
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'group_members'
  AND column_name IN ('id', 'group_id', 'user_id', 'role', 'status');
  
  IF column_count = 5 THEN
    RAISE NOTICE '   ✅ Table "group_members" : colonnes essentielles présentes';
  ELSE
    RAISE NOTICE '   ⚠️  Table "group_members" : colonnes manquantes (% sur 5)', column_count;
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 3 : Vérifier RLS (Row Level Security)
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 3/7 : Vérification RLS (Row Level Security)';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- RLS sur groups
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'groups';
  
  RAISE NOTICE '   • Table "groups" : % politiques RLS', policy_count;
  
  IF policy_count = 0 THEN
    RAISE NOTICE '   ❌ AUCUNE politique ! RLS bloque tout !';
    RAISE NOTICE '   → Exécuter : FIX_RLS_GROUPS_SIMPLE.sql';
  ELSIF policy_count < 4 THEN
    RAISE NOTICE '   ⚠️  Politiques incomplètes (minimum recommandé : 4)';
  ELSE
    RAISE NOTICE '   ✅ Politiques présentes';
  END IF;
  
  -- RLS sur group_members
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'group_members';
  
  RAISE NOTICE '   • Table "group_members" : % politiques RLS', policy_count;
  
  IF policy_count = 0 THEN
    RAISE NOTICE '   ❌ AUCUNE politique ! RLS bloque tout !';
    RAISE NOTICE '   → Exécuter : FIX_RLS_GROUPS_SIMPLE.sql';
  ELSIF policy_count < 4 THEN
    RAISE NOTICE '   ⚠️  Politiques incomplètes (minimum recommandé : 4)';
  ELSE
    RAISE NOTICE '   ✅ Politiques présentes';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 4 : Vérifier les données
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 4/7 : Vérification des données';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  -- Compter les groupes
  SELECT COUNT(*) INTO data_count FROM groups;
  RAISE NOTICE '   • Nombre de groupes : %', data_count;
  
  -- Compter les membres
  SELECT COUNT(*) INTO data_count FROM group_members;
  RAISE NOTICE '   • Nombre de membres de groupes : %', data_count;
  
  -- Compter les profils
  SELECT COUNT(*) INTO data_count FROM profiles;
  RAISE NOTICE '   • Nombre de profils utilisateurs : %', data_count;
  
  IF data_count = 0 THEN
    RAISE NOTICE '   ℹ️  Aucun utilisateur → Créez un compte d''abord';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 5 : Tester l'accès direct
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 5/7 : Test d''accès direct (sans RLS)';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  BEGIN
    -- Test SELECT sur groups
    PERFORM * FROM groups LIMIT 1;
    RAISE NOTICE '   ✅ SELECT sur "groups" fonctionne';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ❌ SELECT sur "groups" échoue : %', SQLERRM;
  END;
  
  BEGIN
    -- Test SELECT sur group_members
    PERFORM * FROM group_members LIMIT 1;
    RAISE NOTICE '   ✅ SELECT sur "group_members" fonctionne';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ❌ SELECT sur "group_members" échoue : %', SQLERRM;
  END;
  
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 6 : Vérifier les index
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 6/7 : Vérification des index (performance)';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*) INTO column_count
  FROM pg_indexes
  WHERE tablename = 'groups';
  RAISE NOTICE '   • Index sur "groups" : %', column_count;
  
  SELECT COUNT(*) INTO column_count
  FROM pg_indexes
  WHERE tablename = 'group_members';
  RAISE NOTICE '   • Index sur "group_members" : %', column_count;
  
  RAISE NOTICE '';
  
  -- ========================================================================
  -- ÉTAPE 7 : Afficher les politiques actuelles
  -- ========================================================================
  
  RAISE NOTICE '📋 ÉTAPE 7/7 : Liste des politiques RLS actuelles';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
  
  FOR table_exists IN 
    SELECT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'groups'
    )
  LOOP
    IF table_exists THEN
      RAISE NOTICE '   Politiques sur "groups" :';
      FOR column_count IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'groups'
      LOOP
        RAISE NOTICE '      • %', column_count;
      END LOOP;
    ELSE
      RAISE NOTICE '   ❌ Aucune politique sur "groups"';
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  
  FOR table_exists IN 
    SELECT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'group_members'
    )
  LOOP
    IF table_exists THEN
      RAISE NOTICE '   Politiques sur "group_members" :';
      FOR column_count IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'group_members'
      LOOP
        RAISE NOTICE '      • %', column_count;
      END LOOP;
    ELSE
      RAISE NOTICE '   ❌ Aucune politique sur "group_members"';
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                    📊 FIN DU DIAGNOSTIC                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
END $$;

-- ============================================================================
-- INSTRUCTIONS : Que faire après le diagnostic ?
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PROCHAINES ÉTAPES selon les résultats :';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Si tables "groups" ou "group_members" manquent :';
  RAISE NOTICE '   → Exécuter CREATE_TABLES_GROUPES_COMPLET.sql';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Si politiques RLS = 0 ou incomplètes :';
  RAISE NOTICE '   → Exécuter FIX_RLS_GROUPS_SIMPLE.sql';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Si erreurs sur SELECT :';
  RAISE NOTICE '   → Problème de permissions ou tables corrompues';
  RAISE NOTICE '   → Recréer les tables avec CREATE_TABLES_GROUPES_COMPLET.sql';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Si tout est OK mais erreur 500 persiste :';
  RAISE NOTICE '   → Problème côté frontend ou authentification';
  RAISE NOTICE '   → Vérifier la console navigateur (F12)';
  RAISE NOTICE '   → Copier le message d''erreur complet';
  RAISE NOTICE '';
END $$;
