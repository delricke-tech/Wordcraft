/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
/*
  🔧 SCRIPT DE VÉRIFICATION ET CORRECTION SÉCURISÉ
  
  Ce script vérifie et ajoute uniquement les colonnes manquantes à la table documents.
  Il ne génère PAS d'erreur si les colonnes existent déjà.
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. Sélectionner votre projet : delirisee-techsProject
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"
  
  ⏱️ Durée : ~5 secondes
*/

-- ============================================================================
-- VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- ============================================================================

DO $$ 
DECLARE
  v_has_name boolean;
  v_has_storage_path boolean;
  v_has_extracted_text boolean;
  v_has_is_favorite boolean;
  v_columns_added text[] := '{}';
BEGIN
  -- Vérifier quelles colonnes existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'name'
  ) INTO v_has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'storage_path'
  ) INTO v_has_storage_path;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'extracted_text'
  ) INTO v_has_extracted_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'is_favorite'
  ) INTO v_has_is_favorite;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 ANALYSE DE LA TABLE DOCUMENTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  
  -- Ajouter 'name' si manquante
  IF NOT v_has_name THEN
    ALTER TABLE documents ADD COLUMN name text;
    UPDATE documents SET name = title WHERE name IS NULL;
    v_columns_added := array_append(v_columns_added, 'name');
    RAISE NOTICE '✅ Colonne "name" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "name" existe déjà';
  END IF;
  
  -- Ajouter 'storage_path' si manquante
  IF NOT v_has_storage_path THEN
    -- Créer l'extension unaccent si nécessaire
    CREATE EXTENSION IF NOT EXISTS unaccent;
    
    -- Créer la fonction de nettoyage si elle n'existe pas
    CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
    RETURNS text AS $func$
    DECLARE
      cleaned text;
    BEGIN
      IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
      END IF;
      
      cleaned := LOWER(file_path);
      cleaned := unaccent(cleaned);
      cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
      cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
      cleaned := TRIM(BOTH '-' FROM cleaned);
      
      RETURN cleaned;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;
    
    ALTER TABLE documents ADD COLUMN storage_path text;
    UPDATE documents 
    SET storage_path = clean_file_path(file_url)
    WHERE storage_path IS NULL AND file_url IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    v_columns_added := array_append(v_columns_added, 'storage_path');
    RAISE NOTICE '✅ Colonne "storage_path" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "storage_path" existe déjà';
  END IF;
  
  -- Ajouter 'extracted_text' si manquante (normalement elle existe déjà)
  IF NOT v_has_extracted_text THEN
    ALTER TABLE documents ADD COLUMN extracted_text text;
    v_columns_added := array_append(v_columns_added, 'extracted_text');
    RAISE NOTICE '✅ Colonne "extracted_text" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "extracted_text" existe déjà';
  END IF;
  
  -- Ajouter 'is_favorite' si manquante
  IF NOT v_has_is_favorite THEN
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false;
    v_columns_added := array_append(v_columns_added, 'is_favorite');
    RAISE NOTICE '✅ Colonne "is_favorite" ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓  Colonne "is_favorite" existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  
  IF array_length(v_columns_added, 1) > 0 THEN
    RAISE NOTICE '✅ COLONNES AJOUTÉES : %', array_to_string(v_columns_added, ', ');
  ELSE
    RAISE NOTICE '✅ TOUTES LES COLONNES EXISTENT DÉJÀ - AUCUNE MODIFICATION';
  END IF;
  
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE - AFFICHER LA STRUCTURE COMPLÈTE
-- ============================================================================

SELECT 
  '📊 Structure actuelle de la table documents :' as info;

SELECT 
  column_name as "Colonne",
  data_type as "Type",
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ Required'
  END as "Nullabilité",
  COALESCE(column_default, '-') as "Défaut"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'documents'
  AND column_name IN ('name', 'storage_path', 'extracted_text', 'is_favorite', 'title', 'file_url', 'folder_id')
ORDER BY 
  CASE column_name
    WHEN 'folder_id' THEN 1
    WHEN 'name' THEN 2
    WHEN 'title' THEN 3
    WHEN 'file_url' THEN 4
    WHEN 'storage_path' THEN 5
    WHEN 'extracted_text' THEN 6
    WHEN 'is_favorite' THEN 7
  END;
