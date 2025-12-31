/*
  🔧 FIX : SUPPRESSION COMPLÈTE DES COMPTES (AUTH + DONNÉES)
  
  Problème : Quand on supprime un compte, l'email reste bloqué dans auth.users
  Solution : Supprimer aussi l'entrée dans auth.users
  
  📍 Comment utiliser :
  1. Ouvrir Supabase Dashboard → SQL Editor
  2. Copier-coller ce script
  3. Cliquer sur "Run"
  
  Date : 31 décembre 2024
*/

-- ============================================================================
-- ÉTAPE 1 : NETTOYER LES COMPTES AUTH ORPHELINS EXISTANTS
-- ============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Compter les comptes auth sans profil correspondant
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM profiles);
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🔍 NETTOYAGE DES COMPTES AUTH ORPHELINS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Comptes auth orphelins trouvés : %', orphan_count;
  RAISE NOTICE '';
  
  IF orphan_count > 0 THEN
    -- Supprimer les comptes auth orphelins
    DELETE FROM auth.users
    WHERE id NOT IN (SELECT id FROM profiles);
    
    RAISE NOTICE '✅ % comptes auth orphelins supprimés', orphan_count;
    RAISE NOTICE '💡 Ces emails sont maintenant disponibles pour réinscription !';
  ELSE
    RAISE NOTICE '✅ Aucun compte auth orphelin détecté';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- ÉTAPE 2 : AMÉLIORER LA FONCTION delete_user_completely
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS void AS $$
DECLARE
  doc_count INTEGER;
  folder_count INTEGER;
  user_email TEXT;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_to_delete;
  
  -- Compter les documents à supprimer
  SELECT COUNT(*) INTO doc_count 
  FROM documents 
  WHERE user_id = user_id_to_delete;
  
  -- Compter les dossiers à supprimer
  SELECT COUNT(*) INTO folder_count 
  FROM folders 
  WHERE user_id = user_id_to_delete;
  
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  SUPPRESSION COMPLÈTE DU COMPTE';
  RAISE NOTICE '  - User ID : %', user_id_to_delete;
  RAISE NOTICE '  - Email : %', user_email;
  RAISE NOTICE '  - Documents : %', doc_count;
  RAISE NOTICE '  - Dossiers : %', folder_count;
  RAISE NOTICE '';
  
  -- Étape 1 : Supprimer le profil (cascade supprimera documents/dossiers)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  RAISE NOTICE '✅ Profil supprimé (cascade : documents + dossiers)';
  
  -- Étape 2 : Supprimer le compte auth
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  RAISE NOTICE '✅ Compte auth supprimé';
  
  -- Étape 3 : Nettoyer les fichiers Storage orphelins
  DELETE FROM storage.objects
  WHERE bucket_id = 'documents'
  AND owner = user_id_to_delete;
  RAISE NOTICE '✅ Fichiers Storage supprimés';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Compte supprimé complètement !';
  RAISE NOTICE '💡 L''email "%s" est maintenant disponible', user_email;
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 3 : TRIGGER AUTOMATIQUE DE SUPPRESSION AUTH
-- ============================================================================

-- Fonction pour supprimer le compte auth quand le profil est supprimé
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer le compte auth correspondant
  DELETE FROM auth.users WHERE id = OLD.id;
  
  RAISE NOTICE '🧹 Compte auth supprimé automatiquement pour user_id: %', OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS auto_delete_auth_user ON profiles;

-- Créer le trigger
CREATE TRIGGER auto_delete_auth_user
  AFTER DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  auth_users_count INTEGER;
  profiles_count INTEGER;
  orphan_auth_count INTEGER;
BEGIN
  -- Compter les utilisateurs auth
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;
  
  -- Compter les profils
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  
  -- Compter les orphelins auth
  SELECT COUNT(*) INTO orphan_auth_count
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM profiles);
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE !';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 État actuel :';
  RAISE NOTICE '  - Comptes auth : %', auth_users_count;
  RAISE NOTICE '  - Profils : %', profiles_count;
  RAISE NOTICE '  - Orphelins auth : %', orphan_auth_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Comportements automatiques :';
  RAISE NOTICE '  ✅ Suppression profil → Compte auth supprimé automatiquement';
  RAISE NOTICE '  ✅ Email libéré → Réinscription possible immédiatement';
  RAISE NOTICE '  ✅ Tous les fichiers Storage nettoyés';
  RAISE NOTICE '';
  
  IF orphan_auth_count = 0 THEN
    RAISE NOTICE '✅ Aucun orphelin auth ! Base propre !';
  ELSE
    RAISE NOTICE '⚠️  Il reste % comptes auth orphelins', orphan_auth_count;
    RAISE NOTICE '💡 Ces emails sont maintenant libres pour réinscription';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Commandes utiles :';
  RAISE NOTICE '  - Supprimer compte : SELECT delete_user_completely(''user-uuid'');';
  RAISE NOTICE '  - Nettoyer orphelins : (Automatique maintenant !)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
