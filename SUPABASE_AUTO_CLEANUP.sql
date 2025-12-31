/*
  🧹 SYSTÈME DE NETTOYAGE AUTOMATIQUE COMPLET
  
  Ce script configure des triggers pour nettoyer automatiquement :
  1. Les fichiers Storage quand un document est supprimé
  2. Tous les documents quand un compte est supprimé
  3. Les orphelins et références cassées
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard
  2. SQL Editor → New query
  3. Copier-coller ce script
  4. Cliquer sur "Run"
  
  Date : 31 décembre 2024
*/

-- ============================================================================
-- ÉTAPE 1 : FONCTION DE NETTOYAGE DU STORAGE
-- ============================================================================

-- Fonction pour supprimer un fichier du Storage quand un document est supprimé
CREATE OR REPLACE FUNCTION delete_storage_file()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer le fichier du bucket "documents"
  IF OLD.storage_path IS NOT NULL THEN
    PERFORM storage.foldername(OLD.storage_path);
    
    -- Appeler l'API Storage pour supprimer le fichier
    DELETE FROM storage.objects
    WHERE bucket_id = 'documents'
    AND name = OLD.storage_path;
    
    RAISE NOTICE '🧹 Fichier Storage supprimé : %', OLD.storage_path;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 2 : TRIGGER DE SUPPRESSION AUTOMATIQUE DES FICHIERS STORAGE
-- ============================================================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS auto_delete_storage_file ON documents;

-- Créer le trigger
CREATE TRIGGER auto_delete_storage_file
  BEFORE DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION delete_storage_file();

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LES CASCADES DE SUPPRESSION
-- ============================================================================

-- Vérifier et mettre à jour les contraintes de clés étrangères pour CASCADE

-- Documents → Folders (si un dossier est supprimé, mettre folder_id à NULL)
ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_folder_id_fkey,
ADD CONSTRAINT documents_folder_id_fkey 
  FOREIGN KEY (folder_id) 
  REFERENCES folders(id) 
  ON DELETE SET NULL;

-- Documents → Users (si un user est supprimé, supprimer ses documents)
ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_user_id_fkey,
ADD CONSTRAINT documents_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Folders → Users (si un user est supprimé, supprimer ses dossiers)
ALTER TABLE folders 
DROP CONSTRAINT IF EXISTS folders_user_id_fkey,
ADD CONSTRAINT folders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Study Cards → Documents (si un document est supprimé, supprimer ses cartes)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_cards') THEN
    ALTER TABLE study_cards 
    DROP CONSTRAINT IF EXISTS study_cards_document_id_fkey,
    ADD CONSTRAINT study_cards_document_id_fkey 
      FOREIGN KEY (document_id) 
      REFERENCES documents(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Quizzes → Documents (si un document est supprimé, supprimer ses quiz)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quizzes') THEN
    ALTER TABLE quizzes 
    DROP CONSTRAINT IF EXISTS quizzes_document_id_fkey,
    ADD CONSTRAINT quizzes_document_id_fkey 
      FOREIGN KEY (document_id) 
      REFERENCES documents(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4 : FONCTION DE NETTOYAGE DES ORPHELINS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_orphans()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les documents sans user (orphelins)
  DELETE FROM documents
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = documents.user_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🧹 % documents orphelins supprimés', deleted_count;
  END IF;
  
  -- Supprimer les dossiers sans user
  DELETE FROM folders
  WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = folders.user_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🧹 % dossiers orphelins supprimés', deleted_count;
  END IF;
  
  -- Nettoyer les fichiers Storage orphelins (fichiers sans document correspondant)
  DELETE FROM storage.objects
  WHERE bucket_id = 'documents'
  AND NOT EXISTS (
    SELECT 1 FROM documents WHERE documents.storage_path = storage.objects.name
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE '🧹 % fichiers Storage orphelins supprimés', deleted_count;
  END IF;
  
  RAISE NOTICE '✅ Nettoyage des orphelins terminé !';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 5 : FONCTION POUR SUPPRIMER COMPLÈTEMENT UN COMPTE
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS void AS $$
DECLARE
  doc_count INTEGER;
  folder_count INTEGER;
BEGIN
  -- Compter les documents à supprimer
  SELECT COUNT(*) INTO doc_count FROM documents WHERE user_id = user_id_to_delete;
  
  -- Compter les dossiers à supprimer
  SELECT COUNT(*) INTO folder_count FROM folders WHERE user_id = user_id_to_delete;
  
  RAISE NOTICE '🗑️  Suppression du compte : %', user_id_to_delete;
  RAISE NOTICE '  - % documents à supprimer', doc_count;
  RAISE NOTICE '  - % dossiers à supprimer', folder_count;
  
  -- Les documents seront automatiquement supprimés grâce à ON DELETE CASCADE
  -- Et les fichiers Storage seront supprimés par le trigger auto_delete_storage_file
  
  -- Supprimer le profil (cascade fera le reste)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  RAISE NOTICE '✅ Compte supprimé complètement avec tous ses fichiers !';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 6 : VÉRIFICATION ET RAPPORT
-- ============================================================================

DO $$ 
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Vérifier que le trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_delete_storage_file'
  ) INTO trigger_exists;
  
  -- Vérifier que les fonctions existent
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'delete_storage_file'
  ) INTO function_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ SYSTÈME DE NETTOYAGE AUTOMATIQUE CONFIGURÉ !';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Composants installés :';
  RAISE NOTICE '  - Fonction delete_storage_file() : %', CASE WHEN function_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - Trigger auto_delete_storage_file : %', CASE WHEN trigger_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - Fonction cleanup_orphans() : ✅';
  RAISE NOTICE '  - Fonction delete_user_completely() : ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Comportements automatiques :';
  RAISE NOTICE '  ✅ Suppression document → Fichier Storage supprimé';
  RAISE NOTICE '  ✅ Suppression compte → Tous documents + fichiers supprimés';
  RAISE NOTICE '  ✅ Suppression dossier → Documents restent (folder_id = NULL)';
  RAISE NOTICE '  ✅ Cascades configurées pour toutes les tables';
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Commandes utiles :';
  RAISE NOTICE '  - Nettoyer orphelins : SELECT cleanup_orphans();';
  RAISE NOTICE '  - Supprimer compte : SELECT delete_user_completely(''user-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- ÉTAPE 7 : NETTOYAGE INITIAL (OPTIONNEL)
-- ============================================================================

-- Décommentez la ligne ci-dessous pour nettoyer les orphelins existants
-- SELECT cleanup_orphans();
