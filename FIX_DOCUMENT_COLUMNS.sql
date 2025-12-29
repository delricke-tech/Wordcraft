/*
  🔧 CORRECTION URGENTE : Ajouter les colonnes manquantes à la table documents
  
  PROBLÈME : L'application cherche les colonnes 'name' et 'storage_path' qui n'existent pas
  SOLUTION : Exécuter ce script dans le SQL Editor de Supabase
  
  📍 Comment appliquer ce script :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet
  3. Aller dans "SQL Editor" (icône de base de données)
  4. Copier-coller ce script
  5. Cliquer sur "Run" (Exécuter)
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- ÉTAPE 1 : Ajouter la colonne 'storage_path'
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) THEN
    -- Ajouter la colonne
    ALTER TABLE documents ADD COLUMN storage_path text;
    
    -- Copier file_url vers storage_path pour les documents existants
    -- (temporaire, sera écrasé lors du prochain upload)
    UPDATE documents 
    SET storage_path = file_url 
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    
    RAISE NOTICE '✅ Colonne storage_path ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne storage_path existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Ajouter la colonne 'name'
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) THEN
    -- Ajouter la colonne
    ALTER TABLE documents ADD COLUMN name text;
    
    -- Copier 'title' vers 'name' pour les documents existants
    UPDATE documents 
    SET name = title 
    WHERE name IS NULL;
    
    RAISE NOTICE '✅ Colonne name ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne name existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3 : Vérifier que 'folder_id' existe (devrait déjà exister)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'documents' 
    AND column_name = 'folder_id'
  ) THEN
    -- Ajouter la colonne si elle n'existe pas
    ALTER TABLE documents ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
    
    -- Créer un index
    CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
    
    RAISE NOTICE '✅ Colonne folder_id ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne folder_id existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4 : Vérification finale
-- ============================================================================
DO $$ 
DECLARE
  has_name boolean;
  has_storage_path boolean;
  has_folder_id boolean;
  doc_count integer;
BEGIN
  -- Vérifier les colonnes
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'name'
  ) INTO has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'storage_path'
  ) INTO has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'folder_id'
  ) INTO has_folder_id;
  
  -- Compter les documents
  SELECT COUNT(*) INTO doc_count FROM documents;
  
  -- Afficher le résultat
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Structure de la table documents :';
  RAISE NOTICE '  📁 folder_id : %', CASE WHEN has_folder_id THEN '✅ OK' ELSE '❌ MANQUANT' END;
  RAISE NOTICE '  📝 name : %', CASE WHEN has_name THEN '✅ OK' ELSE '❌ MANQUANT' END;
  RAISE NOTICE '  🔗 storage_path : %', CASE WHEN has_storage_path THEN '✅ OK' ELSE '❌ MANQUANT' END;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Nombre de documents : %', doc_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Action suivante : Retournez dans votre application et rechargez la page !';
  RAISE NOTICE '============================================================';
END $$;


