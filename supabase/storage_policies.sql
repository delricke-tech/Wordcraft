-- ========================================
-- Configuration Storage pour le bucket 'documents'
-- ========================================
-- À exécuter dans Supabase SQL Editor

-- 1. Créer le bucket 'documents' (si pas déjà fait via l'interface)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques pour permettre aux utilisateurs d'uploader leurs documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Politiques pour permettre aux utilisateurs de voir leurs documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politiques pour permettre aux utilisateurs de supprimer leurs documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Permettre l'accès public en lecture (pour les URLs publiques)
CREATE POLICY "Public documents are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- ========================================
-- Vérification : Liste des politiques Storage
-- ========================================
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- ========================================
-- Notes importantes
-- ========================================
-- 
-- 1. Les fichiers sont stockés dans des dossiers par utilisateur :
--    documents/user-id-xxx/fichier.pdf
--
-- 2. Les politiques garantissent que :
--    - Chaque utilisateur ne peut uploader que dans son dossier
--    - Chaque utilisateur ne peut voir/supprimer que ses propres fichiers
--    - Les URLs publiques sont accessibles par tous (nécessaire pour afficher)
--
-- 3. Pour tester :
--    - Connectez-vous à l'application
--    - Allez dans Bibliothèque
--    - Uploadez un fichier PDF
--    - Vérifiez qu'il apparaît dans Storage → documents → votre-user-id/
