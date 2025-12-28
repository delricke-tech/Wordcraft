-- Script de vérification et ajout de la colonne folder_id
-- Copiez et exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table documents
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 2. Si la colonne folder_id n'existe pas, exécutez cette commande :
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;

-- 3. Créer un index pour améliorer les performances (si pas déjà fait)
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- 4. Vérifier que la colonne a été ajoutée
SELECT 
  id, 
  name, 
  folder_id, 
  storage_path,
  user_id
FROM documents
LIMIT 5;

-- 5. Vérifier que la table folders existe
SELECT id, name, user_id FROM folders LIMIT 5;

