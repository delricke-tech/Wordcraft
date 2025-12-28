-- ================================================
-- SCRIPT DE VÉRIFICATION RAPIDE
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ================================================

-- 1️⃣ VÉRIFIER LA STRUCTURE DE LA TABLE
-- ================================================
SELECT 
  '1️⃣ STRUCTURE DE LA TABLE' as test,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name IN ('name', 'storage_path', 'folder_id', 'title')
ORDER BY column_name;

-- ✅ Résultat attendu : 4 lignes
-- folder_id, name, storage_path, title


-- 2️⃣ VÉRIFIER LES INDEX
-- ================================================
SELECT 
  '2️⃣ INDEX CRÉÉS' as test,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'documents'
AND indexname IN ('idx_documents_storage_path', 'idx_documents_folder_id')
ORDER BY indexname;

-- ✅ Résultat attendu : 2 lignes
-- idx_documents_folder_id, idx_documents_storage_path


-- 3️⃣ COMPTER LES DOCUMENTS PAR TYPE
-- ================================================
SELECT 
  '3️⃣ DOCUMENTS PAR TYPE' as test,
  file_type,
  COUNT(*) as nombre
FROM documents
GROUP BY file_type
ORDER BY nombre DESC;

-- ℹ️ Pour voir la répartition des fichiers


-- 4️⃣ VÉRIFIER LES DOCUMENTS SANS STORAGE_PATH
-- ================================================
SELECT 
  '4️⃣ DOCUMENTS SANS STORAGE_PATH' as test,
  COUNT(*) as nombre_sans_storage_path
FROM documents
WHERE storage_path IS NULL;

-- ✅ Résultat attendu : 0 (ou nombre d'anciens documents)
-- ⚠️ Si > 0 : Ces documents doivent être re-uploadés


-- 5️⃣ EXEMPLE DE DOCUMENTS (5 derniers)
-- ================================================
SELECT 
  '5️⃣ EXEMPLE DE DOCUMENTS' as test,
  id,
  LEFT(name, 30) as name_court,
  LEFT(storage_path, 40) as storage_path_court,
  folder_id,
  file_type,
  created_at
FROM documents
ORDER BY created_at DESC
LIMIT 5;

-- ℹ️ Pour voir des exemples concrets


-- 6️⃣ VÉRIFIER LES DOSSIERS
-- ================================================
SELECT 
  '6️⃣ DOSSIERS EXISTANTS' as test,
  id,
  name,
  parent_id,
  (SELECT COUNT(*) FROM documents d WHERE d.folder_id = folders.id) as nb_documents,
  created_at
FROM folders
ORDER BY created_at DESC
LIMIT 10;

-- ℹ️ Liste des dossiers avec nombre de documents


-- ================================================
-- RÉSUMÉ FINAL
-- ================================================
SELECT 
  '✅ RÉSUMÉ' as test,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'documents' 
   AND column_name IN ('name', 'storage_path', 'folder_id')) as colonnes_presentes_sur_3,
  (SELECT COUNT(*) FROM documents) as total_documents,
  (SELECT COUNT(*) FROM documents WHERE storage_path IS NOT NULL) as documents_avec_storage_path,
  (SELECT COUNT(*) FROM folders) as total_dossiers;

-- ✅ Résultat idéal :
-- colonnes_presentes_sur_3: 3
-- total_documents: X
-- documents_avec_storage_path: X (même nombre)
-- total_dossiers: Y


-- ================================================
-- INTERPRÉTATION DES RÉSULTATS
-- ================================================

/*
✅ TOUT EST PARFAIT SI :
  - Test 1 : 4 colonnes (folder_id, name, storage_path, title)
  - Test 2 : 2 index (idx_documents_folder_id, idx_documents_storage_path)
  - Test 4 : 0 documents sans storage_path (ou ancien nombre connu)
  - Test 6 : Au moins 1 dossier visible

⚠️ ACTIONS NÉCESSAIRES SI :
  - Test 1 : Moins de 4 colonnes → Réexécuter la migration
  - Test 4 : Documents sans storage_path → Re-uploader ces documents

❌ PROBLÈME SI :
  - Test 1 : 0 colonnes → Migration pas appliquée du tout
  - Erreur SQL → Vérifier les permissions
*/

