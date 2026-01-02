-- ============================================================================
-- CORRECTION : document_id NULLABLE pour fichiers temporaires
-- ============================================================================
-- Date : 2 janvier 2025
-- Objectif : Permettre la création de fiches/quiz depuis fichiers uploadés
--           sans les sauvegarder dans la table documents
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFIER LES CONTRAINTES ACTUELLES
-- ============================================================================

-- Voir les contraintes sur study_cards.document_id
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'study_cards'::regclass
  AND conname LIKE '%document%';

-- Voir les contraintes sur quizzes.document_id  
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'quizzes'::regclass
  AND conname LIKE '%document%';

-- ============================================================================
-- 2. CORRECTION study_cards : document_id NULLABLE
-- ============================================================================

-- Rendre document_id nullable si ce n'est pas déjà le cas
ALTER TABLE study_cards 
  ALTER COLUMN document_id DROP NOT NULL IF EXISTS;

-- Mettre à jour la contrainte de clé étrangère pour permettre NULL
-- et définir CASCADE sur suppression
ALTER TABLE study_cards
  DROP CONSTRAINT IF EXISTS study_cards_document_id_fkey;

ALTER TABLE study_cards
  ADD CONSTRAINT study_cards_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES documents(id)
  ON DELETE SET NULL;  -- Si le document est supprimé, mettre à NULL au lieu de supprimer la fiche

COMMENT ON COLUMN study_cards.document_id IS 
  'UUID du document source (nullable pour fiches créées depuis fichiers temporaires)';

-- ============================================================================
-- 3. CORRECTION quizzes : document_id NULLABLE
-- ============================================================================

-- Rendre document_id nullable si ce n'est pas déjà le cas
ALTER TABLE quizzes 
  ALTER COLUMN document_id DROP NOT NULL IF EXISTS;

-- Mettre à jour la contrainte de clé étrangère
ALTER TABLE quizzes
  DROP CONSTRAINT IF EXISTS quizzes_document_id_fkey;

ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES documents(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN quizzes.document_id IS 
  'UUID du document source (nullable pour quiz créés depuis fichiers temporaires)';

-- ============================================================================
-- 4. CORRECTION quiz_questions : document_id NULLABLE
-- ============================================================================

-- Rendre document_id nullable si ce n'est pas déjà le cas
ALTER TABLE quiz_questions 
  ALTER COLUMN document_id DROP NOT NULL IF EXISTS;

-- Mettre à jour la contrainte de clé étrangère
ALTER TABLE quiz_questions
  DROP CONSTRAINT IF EXISTS quiz_questions_document_id_fkey;

ALTER TABLE quiz_questions
  ADD CONSTRAINT quiz_questions_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES documents(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN quiz_questions.document_id IS 
  'UUID du document source (nullable pour questions créées depuis fichiers temporaires)';

-- ============================================================================
-- 5. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que les colonnes acceptent bien NULL
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'document_id'
  AND table_name IN ('study_cards', 'quizzes', 'quiz_questions')
ORDER BY table_name;

-- Résultat attendu : is_nullable = 'YES' pour toutes les lignes

-- ============================================================================
-- 6. TEST D'INSERTION
-- ============================================================================

-- Test 1 : Créer une fiche SANS document_id (devrait réussir)
DO $$
DECLARE
    test_user_id uuid;
    test_card_id uuid;
BEGIN
    -- Récupérer un user_id existant
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insérer une fiche sans document_id
        INSERT INTO study_cards (user_id, title, content, is_ai_generated)
        VALUES (
            test_user_id,
            'TEST - Fiche sans document',
            '{"definitions": [], "key_points": []}',
            true
        )
        RETURNING id INTO test_card_id;
        
        RAISE NOTICE 'Test réussi : Fiche créée avec id=%', test_card_id;
        
        -- Nettoyer le test
        DELETE FROM study_cards WHERE id = test_card_id;
        RAISE NOTICE 'Test nettoyé : Fiche supprimée';
    ELSE
        RAISE NOTICE 'Aucun utilisateur trouvé pour le test';
    END IF;
END $$;

-- Test 2 : Créer un quiz SANS document_id (devrait réussir)
DO $$
DECLARE
    test_user_id uuid;
    test_quiz_id uuid;
BEGIN
    -- Récupérer un user_id existant
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insérer un quiz sans document_id
        INSERT INTO quizzes (user_id, title, is_ai_generated)
        VALUES (
            test_user_id,
            'TEST - Quiz sans document',
            true
        )
        RETURNING id INTO test_quiz_id;
        
        RAISE NOTICE 'Test réussi : Quiz créé avec id=%', test_quiz_id;
        
        -- Nettoyer le test
        DELETE FROM quizzes WHERE id = test_quiz_id;
        RAISE NOTICE 'Test nettoyé : Quiz supprimé';
    ELSE
        RAISE NOTICE 'Aucun utilisateur trouvé pour le test';
    END IF;
END $$;

-- ============================================================================
-- 7. MIGRATION DES DONNÉES EXISTANTES (SI NÉCESSAIRE)
-- ============================================================================

-- Vérifier s'il existe des fiches/quiz avec document_id invalide
SELECT 
    'study_cards' as table_name,
    COUNT(*) as count_invalid
FROM study_cards sc
WHERE sc.document_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.id = sc.document_id
  )
UNION ALL
SELECT 
    'quizzes' as table_name,
    COUNT(*) as count_invalid
FROM quizzes q
WHERE q.document_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.id = q.document_id
  );

-- Si count_invalid > 0, mettre à NULL les document_id invalides
-- UPDATE study_cards SET document_id = NULL 
-- WHERE document_id IS NOT NULL 
--   AND NOT EXISTS (SELECT 1 FROM documents WHERE id = study_cards.document_id);

-- UPDATE quizzes SET document_id = NULL 
-- WHERE document_id IS NOT NULL 
--   AND NOT EXISTS (SELECT 1 FROM documents WHERE id = quizzes.document_id);

-- ============================================================================
-- RÉSUMÉ DES CHANGEMENTS
-- ============================================================================

/*
AVANT :
- study_cards.document_id : Peut-être NOT NULL ou avec mauvaise contrainte FK
- quizzes.document_id : Peut-être NOT NULL ou avec mauvaise contrainte FK
- ❌ Erreur : "invalid input syntax for type uuid: 'temp-xxx'"

APRÈS :
- study_cards.document_id : NULLABLE, FK avec ON DELETE SET NULL
- quizzes.document_id : NULLABLE, FK avec ON DELETE SET NULL
- ✅ Fiches/Quiz créés depuis fichiers temporaires sans document_id

AVANTAGES :
✅ Upload direct de fichiers sans créer d'entrée dans documents
✅ Pas d'encombrement de la bibliothèque
✅ Fiches/Quiz temporaires ou permanents au choix
✅ Suppression d'un document ne supprime pas les fiches/quiz associés
*/

-- ============================================================================
-- INSTRUCTIONS D'EXÉCUTION
-- ============================================================================

/*
1. Connectez-vous à Supabase Dashboard
2. Allez dans "SQL Editor"
3. Copiez-collez ce script
4. Cliquez "Run"
5. Vérifiez les résultats dans l'onglet "Results"

OU

1. Depuis psql : \i FIX_DOCUMENT_ID_NULLABLE.sql
2. Vérifiez : SELECT * FROM information_schema.columns WHERE column_name = 'document_id';
*/
