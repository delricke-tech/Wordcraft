-- ═══════════════════════════════════════════════════════════════
-- Script SQL pour Corriger les Politiques RLS - Table documents
-- Date: 30 décembre 2024
-- Référence: [cite: 2025-12-27]
-- ═══════════════════════════════════════════════════════════════

-- 🔍 ÉTAPE 1 : Vérifier l'état actuel des politiques
-- ═══════════════════════════════════════════════════════════════

-- Afficher toutes les politiques existantes sur la table documents
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'documents';

-- Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'documents';


-- 🔧 ÉTAPE 2 : Activer RLS (si pas déjà fait)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;


-- 🗑️ ÉTAPE 3 : Supprimer les anciennes politiques restrictives (si elles existent)
-- ═══════════════════════════════════════════════════════════════

-- Supprimer les politiques qui pourraient bloquer les insertions
DROP POLICY IF EXISTS "Users can only view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can only insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can only update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can only delete their own documents" ON documents;


-- ✅ ÉTAPE 4 : Créer les nouvelles politiques permissives
-- ═══════════════════════════════════════════════════════════════

-- 📝 Politique INSERT : Permettre les insertions pour tous
-- Cette politique accepte user_id NULL (pour les uploads anonymes)
-- ET user_id avec un UUID valide (pour les utilisateurs connectés)
CREATE POLICY "Allow INSERT for all users"
ON documents
FOR INSERT
TO public
WITH CHECK (
    -- Accepter si user_id est NULL (upload anonyme)
    user_id IS NULL
    OR
    -- Accepter si user_id correspond à l'utilisateur authentifié
    auth.uid() = user_id
);

-- 📖 Politique SELECT : Permettre la lecture
-- Les utilisateurs peuvent voir leurs propres documents + les documents sans propriétaire
CREATE POLICY "Allow SELECT for all users"
ON documents
FOR SELECT
TO public
USING (
    user_id IS NULL
    OR
    auth.uid() = user_id
);

-- ✏️ Politique UPDATE : Seul le propriétaire peut modifier
CREATE POLICY "Allow UPDATE for document owner"
ON documents
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 🗑️ Politique DELETE : Seul le propriétaire peut supprimer
CREATE POLICY "Allow DELETE for document owner"
ON documents
FOR DELETE
TO public
USING (auth.uid() = user_id);


-- 🔍 ÉTAPE 5 : Vérifier les nouvelles politiques
-- ═══════════════════════════════════════════════════════════════

SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY cmd;


-- 🧪 ÉTAPE 6 : Test d'insertion (optionnel)
-- ═══════════════════════════════════════════════════════════════

-- Test 1 : Insertion avec user_id NULL (devrait fonctionner)
INSERT INTO documents (name, storage_path, user_id, file_type, file_size)
VALUES ('Test CORS.pdf', '1735245678901-abc123-test-cors.pdf', NULL, 'pdf', 12345)
RETURNING id, name, user_id, storage_path;

-- Test 2 : Vérifier que le trigger normalise bien le storage_path
INSERT INTO documents (name, storage_path, user_id, file_type, file_size)
VALUES ('Test Accents Été.pdf', '1735245678902-def456-test-accents-ete.pdf', NULL, 'pdf', 54321)
RETURNING id, name, storage_path;

-- Si le trigger fonctionne, storage_path devrait être normalisé (minuscules, sans accents)


-- 🧹 ÉTAPE 7 : Nettoyer les tests (après vérification)
-- ═══════════════════════════════════════════════════════════════

-- Supprimer les documents de test
DELETE FROM documents WHERE name LIKE 'Test%';


-- ═══════════════════════════════════════════════════════════════
-- 📋 NOTES IMPORTANTES
-- ═══════════════════════════════════════════════════════════════

/*
POLITIQUE INSERT EXPLIQUÉE:

WITH CHECK (user_id IS NULL OR auth.uid() = user_id)

Cette condition signifie :
- ✅ Accepter si user_id est NULL (utilisateurs non connectés)
- ✅ Accepter si user_id correspond à l'utilisateur actuellement authentifié
- ❌ Refuser si user_id contient un ID qui ne correspond pas à l'utilisateur actuel

Cela résout votre problème :
1. Upload anonyme : user_id = NULL → ✅ Accepté
2. Upload authentifié : user_id = auth.uid() → ✅ Accepté
3. Upload avec mauvais ID : user_id = ancien_id → ❌ Refusé (protection)
*/


-- ═══════════════════════════════════════════════════════════════
-- 🔍 VÉRIFICATION DU TRIGGER DE NORMALISATION
-- ═══════════════════════════════════════════════════════════════

-- Afficher le trigger qui normalise storage_path
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'documents'
AND trigger_name LIKE '%normalize%';

-- Si le trigger existe, vous devriez voir quelque chose comme:
-- trigger_name: normalize_storage_path
-- event_manipulation: INSERT ou UPDATE
-- action_statement: EXECUTE FUNCTION normalize_storage_path()


-- ═══════════════════════════════════════════════════════════════
-- ✅ RÉSULTAT ATTENDU
-- ═══════════════════════════════════════════════════════════════

/*
Après avoir exécuté ce script dans Supabase SQL Editor :

1. ✅ RLS activé sur la table documents
2. ✅ Politique INSERT permissive (accepte NULL et auth.uid())
3. ✅ Politique SELECT pour voir ses propres documents
4. ✅ Politiques UPDATE/DELETE pour protéger les documents
5. ✅ Trigger de normalisation préservé [cite: 2025-12-27]

L'erreur CORS devrait disparaître et les insertions fonctionner !
*/

