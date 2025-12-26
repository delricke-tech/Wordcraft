-- ✅ SCRIPT SQL COMPLET - Table documents

-- ================================================
-- 1. VÉRIFIER LA STRUCTURE ACTUELLE
-- ================================================

-- Voir toutes les colonnes de la table documents
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- ================================================
-- 2. CRÉER LA TABLE (si elle n'existe pas)
-- ================================================

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                    -- ✅ Nom du fichier
  storage_path text NOT NULL,            -- ✅ Chemin dans Supabase Storage
  user_id uuid NOT NULL,                 -- ✅ ID de l'utilisateur
  file_type text NOT NULL DEFAULT 'txt', -- Type de fichier (pdf, docx, txt, image...)
  created_at timestamptz DEFAULT now()   -- Date de création
);

-- ================================================
-- 3. AJOUTER DES COLONNES (si manquantes)
-- ================================================

-- Si la colonne 'name' n'existe pas
-- ALTER TABLE documents ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Document sans titre';

-- Si la colonne 'storage_path' n'existe pas
-- ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path text;

-- Si la colonne 'file_type' n'existe pas
-- ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type text NOT NULL DEFAULT 'txt';

-- ================================================
-- 4. CRÉER UN INDEX pour améliorer les performances
-- ================================================

-- Index sur user_id pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Index sur created_at pour trier rapidement
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- ================================================
-- 5. ACTIVER RLS (Row Level Security)
-- ================================================

-- Activer RLS sur la table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 6. CRÉER LES POLICIES RLS
-- ================================================

-- Policy : Les utilisateurs peuvent voir leurs propres documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy : Les utilisateurs peuvent insérer leurs propres documents
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy : Les utilisateurs peuvent mettre à jour leurs propres documents
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents"
ON documents FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy : Les utilisateurs peuvent supprimer leurs propres documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ================================================
-- 7. VÉRIFIER QUE TOUT EST OK
-- ================================================

-- Vérifier les colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- Vérifier les policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'documents';

-- Compter les documents
SELECT COUNT(*) as total_documents FROM documents;

-- ================================================
-- 8. METTRE À JOUR LES DOCUMENTS EXISTANTS (si nécessaire)
-- ================================================

-- Si des documents n'ont pas de nom
UPDATE documents 
SET name = 'Document-' || id 
WHERE name IS NULL OR name = '';

-- Si des documents n'ont pas de file_type
UPDATE documents
SET file_type = CASE
  WHEN name LIKE '%.pdf' THEN 'pdf'
  WHEN name LIKE '%.docx' OR name LIKE '%.doc' THEN 'docx'
  WHEN name LIKE '%.jpg' OR name LIKE '%.png' OR name LIKE '%.jpeg' THEN 'image'
  ELSE 'txt'
END
WHERE file_type IS NULL OR file_type = '';

-- ================================================
-- 9. TESTER UNE INSERTION
-- ================================================

-- Test d'insertion (remplacez par votre user_id)
/*
INSERT INTO documents (name, storage_path, user_id, file_type)
VALUES (
  'test.pdf',
  'user-id/12345-test.pdf',
  'votre-user-id-ici',
  'pdf'
);
*/

-- Vérifier l'insertion
-- SELECT * FROM documents ORDER BY created_at DESC LIMIT 1;

-- ================================================
-- 10. NETTOYER (si besoin de recommencer)
-- ================================================

-- ATTENTION : Ceci supprimera TOUS les documents !
-- DROP TABLE IF EXISTS documents CASCADE;
