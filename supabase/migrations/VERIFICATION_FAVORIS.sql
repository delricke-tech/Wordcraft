-- Script de vérification rapide pour le système de favoris
-- Date: 28 décembre 2024

-- 1. Vérifier que la colonne is_favorite existe
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'documents' 
AND column_name = 'is_favorite';

-- Résultat attendu :
-- column_name  | data_type | column_default | is_nullable
-- -------------|-----------|----------------|-------------
-- is_favorite  | boolean   | false          | NO

-- 2. Vérifier les index créés
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'documents'
AND indexname LIKE '%favorite%';

-- Résultat attendu : 2 index
-- idx_documents_is_favorite
-- idx_documents_user_favorite

-- 3. Compter les documents par statut favori (test)
SELECT 
    is_favorite,
    COUNT(*) as nombre_documents
FROM documents
GROUP BY is_favorite
ORDER BY is_favorite DESC;

-- 4. Afficher les 5 premiers documents avec leur statut favori
SELECT 
    id,
    name,
    is_favorite,
    created_at
FROM documents
ORDER BY created_at DESC
LIMIT 5;

-- 5. Test de mise à jour (facultatif - décommentez pour tester)
-- UPDATE documents 
-- SET is_favorite = true 
-- WHERE id = 'REMPLACER_PAR_UN_ID_REEL'
-- RETURNING id, name, is_favorite;

