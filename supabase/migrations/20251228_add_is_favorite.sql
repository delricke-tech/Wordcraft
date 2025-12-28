-- Migration pour ajouter la colonne is_favorite à la table documents
-- Date: 28 décembre 2024
-- Description: Permet aux utilisateurs de marquer des documents comme favoris

-- Ajouter la colonne is_favorite si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents'
    AND column_name = 'is_favorite'
  ) THEN
    -- Ajouter la colonne avec valeur par défaut false
    ALTER TABLE documents ADD COLUMN is_favorite boolean DEFAULT false NOT NULL;
    
    -- Créer un index pour accélérer les requêtes de filtrage par favoris
    CREATE INDEX IF NOT EXISTS idx_documents_is_favorite ON documents(is_favorite) WHERE is_favorite = true;
    
    -- Créer un index composé pour filtrer par utilisateur et favoris
    CREATE INDEX IF NOT EXISTS idx_documents_user_favorite ON documents(user_id, is_favorite) WHERE is_favorite = true;
    
    RAISE NOTICE '✅ Colonne is_favorite ajoutée à la table documents avec succès';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne is_favorite existe déjà';
  END IF;
END $$;

-- Vérification finale
DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents'
    AND column_name = 'is_favorite'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Vérification: Colonne is_favorite présente dans la table documents';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Colonne is_favorite n''a pas été créée correctement';
  END IF;
END $$;

