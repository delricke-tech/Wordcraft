/*
  🔧 CORRECTION URGENTE : Ajouter les colonnes manquantes à la table documents
  
  PROBLÈME : L'application cherche les colonnes 'name' et 'storage_path' qui n'existent pas
  SOLUTION : Exécuter ce script dans le SQL Editor de Supabase
  
  ⚠️  RÈGLE CRITIQUE RESPECTÉE :
  Ce script nettoie automatiquement les anciens chemins (file_url) pour créer
  des storage_path sans accents ni caractères spéciaux, conformément à la règle
  du projet qui interdit les caractères spéciaux dans storage_path pour éviter
  les erreurs "Invalid key" avec Supabase Storage.
  
  Exemple : "Mon Document Été.pdf" → "mon-document-ete.pdf"
  
  📍 Comment appliquer ce script :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet
  3. Aller dans "SQL Editor" (icône de base de données)
  4. Copier-coller ce script
  5. Cliquer sur "Run" (Exécuter)
  
  ⏱️ Durée : ~10 secondes
*/

-- ============================================================================
-- ÉTAPE 1 : Activer l'extension unaccent (suppression des accents)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- ÉTAPE 2 : Créer une fonction de nettoyage des chemins
-- ============================================================================
-- Reproduit la logique de generateUniqueFileName() de TypeScript
-- Transformation : "Mon Document Été.pdf" → "mon-document-ete.pdf"
CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
RETURNS text AS $$
DECLARE
  cleaned text;
BEGIN
  IF file_path IS NULL OR file_path = '' THEN
    RETURN NULL;
  END IF;
  
  cleaned := LOWER(file_path);                                    -- minuscules
  cleaned := unaccent(cleaned);                                   -- sans accents
  cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');         -- espaces → tirets
  cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');   -- supprimer spéciaux
  cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');             -- tirets multiples
  cleaned := TRIM(BOTH '-' FROM cleaned);                         -- nettoyer bords
  
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- ÉTAPE 3 : Ajouter la colonne 'storage_path' avec nettoyage OBLIGATOIRE
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE documents ADD COLUMN storage_path text;
    
    -- ✅ RÈGLE CRITIQUE : Utiliser clean_file_path() pour éviter "Invalid key"
    -- AVANT: file_url = "Mon Document Été.pdf"
    -- APRÈS: storage_path = "mon-document-ete.pdf"
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    
    RAISE NOTICE '✅ Colonne storage_path ajoutée avec chemins nettoyés';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne storage_path existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4 : Ajouter la colonne 'name'
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE documents ADD COLUMN name text;
    
    UPDATE documents 
    SET name = title 
    WHERE name IS NULL;
    
    RAISE NOTICE '✅ Colonne name ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne name existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 5 : Vérifier que 'folder_id' existe (devrait déjà exister)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'documents' 
    AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
    RAISE NOTICE '✅ Colonne folder_id ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne folder_id existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 6 : Vérification finale
-- ============================================================================
DO $$ 
DECLARE
  has_name boolean;
  has_storage_path boolean;
  has_folder_id boolean;
  doc_count integer;
BEGIN
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
  
  SELECT COUNT(*) INTO doc_count FROM documents;
  
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

