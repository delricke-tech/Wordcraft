-- ============================================================================
-- 🧪 TEST DE LA FONCTION clean_file_path()
-- ============================================================================
-- Ce script permet de tester la fonction de nettoyage des chemins de fichiers
-- avant de l'appliquer sur vos vraies données.

-- Activer l'extension si elle n'existe pas
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Créer la fonction (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION clean_file_path(file_path text) 
RETURNS text AS $$
DECLARE
  cleaned text;
BEGIN
  IF file_path IS NULL OR file_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convertir en minuscules
  cleaned := LOWER(file_path);
  
  -- Remplacer les accents par leurs équivalents sans accent
  cleaned := unaccent(cleaned);
  
  -- Remplacer les espaces, underscores et caractères spéciaux par des tirets
  cleaned := REGEXP_REPLACE(cleaned, '[\s_]+', '-', 'g');
  
  -- Supprimer tous les caractères non alphanumériques sauf tirets et points
  cleaned := REGEXP_REPLACE(cleaned, '[^a-z0-9\-\.]', '', 'g');
  
  -- Supprimer les tirets multiples consécutifs
  cleaned := REGEXP_REPLACE(cleaned, '-+', '-', 'g');
  
  -- Supprimer les tirets au début et à la fin
  cleaned := TRIM(BOTH '-' FROM cleaned);
  
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TESTS
-- ============================================================================

SELECT 
  'TESTS DE LA FONCTION clean_file_path()' as test_suite,
  '✅ Fonction créée avec succès' as status;

-- Test 1: Fichier avec accents
SELECT 
  'Test 1: Accents' as test_name,
  'Mon Document Été 2024.pdf' as input,
  clean_file_path('Mon Document Été 2024.pdf') as output,
  CASE 
    WHEN clean_file_path('Mon Document Été 2024.pdf') = 'mon-document-ete-2024.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 2: Caractères spéciaux
SELECT 
  'Test 2: Caractères spéciaux' as test_name,
  'Virologie_Général #1.pdf' as input,
  clean_file_path('Virologie_Général #1.pdf') as output,
  CASE 
    WHEN clean_file_path('Virologie_Général #1.pdf') = 'virologie-general-1.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 3: Parenthèses et esperluettes
SELECT 
  'Test 3: Parenthèses & Esperluettes' as test_name,
  'Cours (partie 1) & notes.pdf' as input,
  clean_file_path('Cours (partie 1) & notes.pdf') as output,
  CASE 
    WHEN clean_file_path('Cours (partie 1) & notes.pdf') = 'cours-partie-1-notes.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 4: Underscores multiples
SELECT 
  'Test 4: Underscores multiples' as test_name,
  'Document___Important___2024.pdf' as input,
  clean_file_path('Document___Important___2024.pdf') as output,
  CASE 
    WHEN clean_file_path('Document___Important___2024.pdf') = 'document-important-2024.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 5: Espaces multiples
SELECT 
  'Test 5: Espaces multiples' as test_name,
  'Mon    Document    2024.pdf' as input,
  clean_file_path('Mon    Document    2024.pdf') as output,
  CASE 
    WHEN clean_file_path('Mon    Document    2024.pdf') = 'mon-document-2024.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 6: Caractères français
SELECT 
  'Test 6: Caractères français' as test_name,
  'Présentation Français Été.pdf' as input,
  clean_file_path('Présentation Français Été.pdf') as output,
  CASE 
    WHEN clean_file_path('Présentation Français Été.pdf') = 'presentation-francais-ete.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 7: Nom déjà propre
SELECT 
  'Test 7: Nom déjà propre' as test_name,
  'document-2024.pdf' as input,
  clean_file_path('document-2024.pdf') as output,
  CASE 
    WHEN clean_file_path('document-2024.pdf') = 'document-2024.pdf' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 8: Valeur NULL
SELECT 
  'Test 8: Valeur NULL' as test_name,
  NULL::text as input,
  clean_file_path(NULL) as output,
  CASE 
    WHEN clean_file_path(NULL) IS NULL 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 9: Chaîne vide
SELECT 
  'Test 9: Chaîne vide' as test_name,
  '' as input,
  clean_file_path('') as output,
  CASE 
    WHEN clean_file_path('') IS NULL 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- Test 10: Extension complexe
SELECT 
  'Test 10: Extension complexe' as test_name,
  'Archive.tar.gz' as input,
  clean_file_path('Archive.tar.gz') as output,
  CASE 
    WHEN clean_file_path('Archive.tar.gz') = 'archive.tar.gz' 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
SELECT 
  '============================================================' as separator;

SELECT 
  '✅ TESTS TERMINÉS' as status,
  'Tous les tests ont été exécutés' as message;

SELECT 
  '============================================================' as separator;

-- Note: Si tous les tests affichent "✅ PASS", la fonction fonctionne correctement !

