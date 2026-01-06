-- ============================================
-- Script de test pour vérifier le fix
-- Contrainte operator (Moov uniquement)
-- Date: 6 janvier 2025
-- ============================================

-- ÉTAPE 1 : Vérifier les contraintes existantes
-- ============================================

SELECT 
    '=== CONTRAINTES ACTUELLES SUR LA TABLE PAYMENTS ===' AS info;

SELECT 
    c.conname AS constraint_name,
    c.contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'payments'
  AND c.contype = 'c'  -- CHECK constraints uniquement
ORDER BY c.conname;

-- RÉSULTAT ATTENDU : Une seule contrainte avec 'operator'
-- payments_operator_check | CHECK (operator = 'moov'::text)


-- ÉTAPE 2 : Test d'insertion Moov (doit réussir)
-- ============================================

SELECT 
    '=== TEST 1: Insertion avec operator = moov (doit réussir) ===' AS info;

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Récupérer un user_id valide
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé. Créez un utilisateur d''abord.';
    END IF;
    
    -- Tenter l'insertion avec operator = 'moov'
    INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
    VALUES (
        test_user_id,
        5000,
        'TEST_MOOV_FIX_' || floor(random() * 1000000)::text,
        'moov',
        'pending'
    );
    
    RAISE NOTICE '✅ TEST 1 RÉUSSI : Insertion Moov acceptée';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TEST 1 ÉCHOUÉ : %', SQLERRM;
END $$;


-- ÉTAPE 3 : Test d'insertion Airtel (doit échouer)
-- ============================================

SELECT 
    '=== TEST 2: Insertion avec operator = airtel (doit échouer) ===' AS info;

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Récupérer un user_id valide
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé. Créez un utilisateur d''abord.';
    END IF;
    
    -- Tenter l'insertion avec operator = 'airtel' (devrait échouer)
    INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
    VALUES (
        test_user_id,
        5000,
        'TEST_AIRTEL_FAIL_' || floor(random() * 1000000)::text,
        'airtel',
        'pending'
    );
    
    RAISE NOTICE '❌ TEST 2 ÉCHOUÉ : Insertion Airtel acceptée (ne devrait pas !)';
    
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE '✅ TEST 2 RÉUSSI : Insertion Airtel refusée comme attendu';
        RAISE NOTICE '   Erreur: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ TEST 2 INCERTAIN : Erreur inattendue: %', SQLERRM;
END $$;


-- ÉTAPE 4 : Test d'insertion Orange/MTN (doit échouer)
-- ============================================

SELECT 
    '=== TEST 3: Insertion avec operator = orange (doit échouer) ===' AS info;

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé.';
    END IF;
    
    -- Tenter avec un autre opérateur
    INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
    VALUES (
        test_user_id,
        5000,
        'TEST_ORANGE_FAIL_' || floor(random() * 1000000)::text,
        'orange',
        'pending'
    );
    
    RAISE NOTICE '❌ TEST 3 ÉCHOUÉ : Insertion Orange acceptée (ne devrait pas !)';
    
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE '✅ TEST 3 RÉUSSI : Insertion Orange refusée comme attendu';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ TEST 3 INCERTAIN : Erreur inattendue: %', SQLERRM;
END $$;


-- ÉTAPE 5 : Vérifier l'unicité du TID
-- ============================================

SELECT 
    '=== TEST 4: Test contrainte UNIQUE sur tid_submitted ===' AS info;

DO $$
DECLARE
    test_user_id UUID;
    test_tid TEXT := 'TEST_UNIQUE_TID_123';
BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé.';
    END IF;
    
    -- Première insertion
    INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
    VALUES (test_user_id, 5000, test_tid, 'moov', 'pending');
    
    RAISE NOTICE '✅ Première insertion réussie';
    
    -- Deuxième insertion avec le même TID (devrait échouer)
    INSERT INTO public.payments (user_id, amount, tid_submitted, operator, status)
    VALUES (test_user_id, 3000, test_tid, 'moov', 'pending');
    
    RAISE NOTICE '❌ TEST 4 ÉCHOUÉ : Double insertion acceptée (ne devrait pas !)';
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '✅ TEST 4 RÉUSSI : Contrainte UNIQUE sur tid_submitted fonctionne';
        RAISE NOTICE '   Erreur: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ TEST 4 INCERTAIN : Erreur inattendue: %', SQLERRM;
END $$;


-- ÉTAPE 6 : Compter les contraintes sur operator
-- ============================================

SELECT 
    '=== RÉSUMÉ : Nombre de contraintes CHECK sur operator ===' AS info;

SELECT 
    COUNT(*) AS nombre_contraintes_operator,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ Une seule contrainte (correct)'
        WHEN COUNT(*) = 0 THEN '❌ Aucune contrainte trouvée (problème !)'
        ELSE '⚠️ Plusieurs contraintes (conflit !)'
    END AS statut
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'payments'
  AND c.contype = 'c'
  AND pg_get_constraintdef(c.oid) ILIKE '%operator%';


-- ÉTAPE 7 : Résumé des tests
-- ============================================

SELECT 
    '=== RÉSUMÉ DES TESTS ===' AS info;

SELECT 
    'Test 1 (Moov)' AS test,
    'Doit réussir' AS attendu,
    'Voir logs ci-dessus' AS resultat
UNION ALL
SELECT 
    'Test 2 (Airtel)' AS test,
    'Doit échouer' AS attendu,
    'Voir logs ci-dessus' AS resultat
UNION ALL
SELECT 
    'Test 3 (Orange)' AS test,
    'Doit échouer' AS attendu,
    'Voir logs ci-dessus' AS resultat
UNION ALL
SELECT 
    'Test 4 (TID unique)' AS test,
    'Doit échouer au 2e' AS attendu,
    'Voir logs ci-dessus' AS resultat;


-- ÉTAPE 8 : Nettoyer les données de test
-- ============================================

SELECT 
    '=== NETTOYAGE DES DONNÉES DE TEST ===' AS info;

DELETE FROM public.payments 
WHERE tid_submitted LIKE 'TEST_%';

SELECT 
    '✅ Données de test supprimées' AS info;


-- ============================================
-- FIN DU SCRIPT DE TEST
-- ============================================

/*
INTERPRÉTATION DES RÉSULTATS :

✅ SUCCÈS si :
- Test 1 : ✅ Insertion Moov réussit
- Test 2 : ✅ Insertion Airtel refuse (check_violation)
- Test 3 : ✅ Insertion Orange refuse (check_violation)
- Test 4 : ✅ Double TID refuse (unique_violation)
- Nombre de contraintes operator : 1

❌ ÉCHEC si :
- Test 1 : ❌ Insertion Moov refuse
- Test 2 : ❌ Insertion Airtel réussit
- Nombre de contraintes operator : 0 ou > 1

⚠️ À VÉRIFIER si :
- Erreurs inattendues dans les tests
- Nombre de contraintes operator : 0

ACTIONS SI ÉCHEC :
1. Vérifier que le script update_payments_for_sms_validation.sql a bien été exécuté
2. Vérifier les contraintes avec la requête ÉTAPE 1
3. Si plusieurs contraintes, re-exécuter la partie du script qui les supprime
4. Si aucune contrainte, exécuter la partie qui l'ajoute
*/
