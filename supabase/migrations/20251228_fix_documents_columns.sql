/*
  # Correction de la table documents
  
  Ce script corrige les incohérences entre le schéma SQL et le code de l'application :
  1. Ajoute la colonne 'storage_path' pour stocker le chemin nettoyé dans Supabase Storage
  2. Ajoute la colonne 'name' pour stocker le nom original du fichier (distinct de 'title')
  
  La colonne 'folder_id' existe déjà dans le schéma initial, donc pas besoin de l'ajouter.
  
  RÈGLE IMPORTANTE :
  - 'name' = nom original du fichier avec accents/espaces (pour l'affichage)
  - 'storage_path' = chemin nettoyé pour Supabase Storage (sans accents/espaces)
  - 'title' = titre personnalisé du document (peut être différent du nom du fichier)
*/

-- Ajouter la colonne storage_path si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE documents ADD COLUMN storage_path text;
    
    -- Créer un index pour améliorer les performances de recherche
    CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
    
    RAISE NOTICE 'Colonne storage_path ajoutée à la table documents';
  ELSE
    RAISE NOTICE 'Colonne storage_path existe déjà';
  END IF;
END $$;

-- Ajouter la colonne name si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE documents ADD COLUMN name text;
    
    -- Copier les valeurs de 'title' vers 'name' pour les documents existants
    UPDATE documents SET name = title WHERE name IS NULL;
    
    RAISE NOTICE 'Colonne name ajoutée à la table documents';
  ELSE
    RAISE NOTICE 'Colonne name existe déjà';
  END IF;
END $$;

-- Vérifier que la colonne folder_id existe (elle devrait déjà exister)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
    
    RAISE NOTICE 'Colonne folder_id ajoutée à la table documents';
  ELSE
    RAISE NOTICE 'Colonne folder_id existe déjà';
  END IF;
END $$;

-- Afficher un message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration terminée : La table documents est maintenant compatible avec le code de l''application';
  RAISE NOTICE 'Structure finale :';
  RAISE NOTICE '  - folder_id : ID du dossier (pour l''organisation logique)';
  RAISE NOTICE '  - name : Nom original du fichier (pour l''affichage)';
  RAISE NOTICE '  - storage_path : Chemin nettoyé dans Supabase Storage (sans accents/espaces)';
  RAISE NOTICE '  - title : Titre personnalisé du document';
END $$;

