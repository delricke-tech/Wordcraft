/*
  🧹 NETTOYAGE DES ORPHELINS EXISTANTS
  
  Ce script DOIT être exécuté AVANT le script de nettoyage automatique
  pour supprimer les données orphelines qui existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. SQL Editor → New query
  3. Copier-coller CE SCRIPT EN PREMIER
  4. Cliquer sur "Run"
  
  Date : 31 décembre 2024
*/

-- ============================================================================
-- ÉTAPE 1 : IDENTIFIER LES ORPHELINS
-- ============================================================================

DO $$ 
DECLARE
  orphan_docs_count INTEGER;
  orphan_folders_count INTEGER;
BEGIN
  -- Compter les documents orphelins
  SELECT COUNT(*) INTO orphan_docs_count
  FROM documents
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = documents.user_id
  );
  
  -- Compter les dossiers orphelins
  SELECT COUNT(*) INTO orphan_folders_count
  FROM folders
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = folders.user_id
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DES DONNÉES ORPHELINES';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Documents orphelins trouvés : %', orphan_docs_count;
  RAISE NOTICE '📊 Dossiers orphelins trouvés : %', orphan_folders_count;
  RAISE NOTICE '';
  
  IF orphan_docs_count > 0 OR orphan_folders_count > 0 THEN
    RAISE NOTICE '⚠️  Des données orphelines ont été détectées !';
    RAISE NOTICE '   Elles seront nettoyées dans les prochaines étapes.';
  ELSE
    RAISE NOTICE '✅ Aucun orphelin détecté. Base de données propre !';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- ÉTAPE 2 : SUPPRIMER LES DOCUMENTS ORPHELINS
-- ============================================================================

DO $$ 
DECLARE
  deleted_count INTEGER;
  orphan_users TEXT[];
BEGIN
  -- Récupérer les IDs des utilisateurs manquants
  SELECT ARRAY_AGG(DISTINCT user_id::TEXT)
  INTO orphan_users
  FROM documents
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = documents.user_id
  );
  
  -- Supprimer les documents orphelins
  DELETE FROM documents
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = documents.user_id
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧹 NETTOYAGE DES DOCUMENTS ORPHELINS';
  RAISE NOTICE '  → % documents supprimés', deleted_count;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '  → User IDs orphelins : %', orphan_users;
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3 : SUPPRIMER LES DOSSIERS ORPHELINS
-- ============================================================================

DO $$ 
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les dossiers orphelins
  DELETE FROM folders
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = folders.user_id
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧹 NETTOYAGE DES DOSSIERS ORPHELINS';
  RAISE NOTICE '  → % dossiers supprimés', deleted_count;
END $$;

-- ============================================================================
-- ÉTAPE 4 : NETTOYER LES FICHIERS STORAGE ORPHELINS
-- ============================================================================

DO $$ 
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les fichiers Storage sans document correspondant
  DELETE FROM storage.objects
  WHERE bucket_id = 'documents'
  AND NOT EXISTS (
    SELECT 1 FROM documents WHERE documents.storage_path = storage.objects.name
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧹 NETTOYAGE DES FICHIERS STORAGE ORPHELINS';
  RAISE NOTICE '  → % fichiers Storage supprimés', deleted_count;
END $$;

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================================================

DO $$ 
DECLARE
  remaining_orphan_docs INTEGER;
  remaining_orphan_folders INTEGER;
  remaining_orphan_files INTEGER;
BEGIN
  -- Vérifier qu'il ne reste plus d'orphelins
  SELECT COUNT(*) INTO remaining_orphan_docs
  FROM documents
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = documents.user_id
  );
  
  SELECT COUNT(*) INTO remaining_orphan_folders
  FROM folders
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = folders.user_id
  );
  
  SELECT COUNT(*) INTO remaining_orphan_files
  FROM storage.objects
  WHERE bucket_id = 'documents'
  AND NOT EXISTS (
    SELECT 1 FROM documents WHERE documents.storage_path = storage.objects.name
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ !';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Vérification finale :';
  RAISE NOTICE '  - Documents orphelins restants : %', remaining_orphan_docs;
  RAISE NOTICE '  - Dossiers orphelins restants : %', remaining_orphan_folders;
  RAISE NOTICE '  - Fichiers Storage orphelins restants : %', remaining_orphan_files;
  RAISE NOTICE '';
  
  IF remaining_orphan_docs = 0 AND remaining_orphan_folders = 0 AND remaining_orphan_files = 0 THEN
    RAISE NOTICE '✅ Base de données 100%% propre !';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Prochaine étape :';
    RAISE NOTICE '   Vous pouvez maintenant exécuter le script SUPABASE_AUTO_CLEANUP.sql';
  ELSE
    RAISE NOTICE '⚠️  Il reste des orphelins. Réexécutez ce script.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
