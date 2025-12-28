import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

/**
 * Fonction SIMPLE pour déplacer un fichier vers un dossier
 * 
 * IMPORTANT : Cette fonction modifie UNIQUEMENT la colonne folder_id
 * Elle ne touche JAMAIS au storage_path ou au nom du fichier
 * 
 * @param fileId - ID du document à déplacer
 * @param newFolderId - ID du nouveau dossier (null pour racine)
 * @param userId - ID de l'utilisateur (pour sécurité)
 * @returns Promise<boolean> - true si succès, false si erreur
 */
export async function updateFileFolder(
  fileId: string, 
  newFolderId: string | null,
  userId: string
): Promise<boolean> {
  console.log('🔄 ===== DÉBUT DÉPLACEMENT =====');
  console.log('📄 File ID:', fileId);
  console.log('📁 New Folder ID:', newFolderId || 'RACINE');
  console.log('👤 User ID:', userId);

  try {
    // Étape 1 : Vérifier que le document existe
    console.log('🔍 Étape 1 : Vérification du document...');
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, name, folder_id, storage_path, user_id')
      .eq('id', fileId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération du document:', fetchError);
      toast.error('Erreur', {
        description: `Document introuvable : ${fetchError.message}`
      });
      return false;
    }

    console.log('✅ Document trouvé:', doc);
    console.log('  - Nom:', doc.name);
    console.log('  - Dossier actuel:', doc.folder_id || 'RACINE');
    console.log('  - Storage path:', doc.storage_path);

    // Étape 2 : Vérifier la propriété
    console.log('🔍 Étape 2 : Vérification de la propriété...');
    if (doc.user_id !== userId) {
      console.error('❌ Accès refusé : user_id ne correspond pas');
      console.error('  - Document user_id:', doc.user_id);
      console.error('  - Current user_id:', userId);
      toast.error('Accès refusé', {
        description: 'Ce document ne vous appartient pas'
      });
      return false;
    }
    console.log('✅ Utilisateur autorisé');

    // Étape 3 : Vérifier si le déplacement est nécessaire
    if (doc.folder_id === newFolderId) {
      console.log('ℹ️ Le document est déjà dans ce dossier');
      toast.info('Information', {
        description: 'Le document est déjà dans ce dossier'
      });
      return true;
    }

    // Étape 4 : Mettre à jour le folder_id
    console.log('🔄 Étape 3 : Mise à jour du folder_id...');
    console.log('  - Ancien folder_id:', doc.folder_id);
    console.log('  - Nouveau folder_id:', newFolderId);
    console.log('⚠️ IMPORTANT : storage_path reste INCHANGÉ :', doc.storage_path);

    const { data: updateData, error: updateError } = await supabase
      .from('documents')
      .update({ 
        folder_id: newFolderId,
        // ❌ NE PAS toucher à storage_path
        // ❌ NE PAS toucher à name
      })
      .eq('id', fileId)
      .eq('user_id', userId)  // Double sécurité
      .select();

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      console.error('  - Code:', updateError.code);
      console.error('  - Message:', updateError.message);
      console.error('  - Details:', updateError.details);
      toast.error('Erreur de déplacement', {
        description: `Impossible de déplacer : ${updateError.message}`
      });
      return false;
    }

    console.log('✅ Mise à jour réussie !');
    console.log('  - Données mises à jour:', updateData);

    // Étape 5 : Vérification finale
    console.log('🔍 Étape 4 : Vérification finale...');
    const { data: verifyDoc, error: verifyError } = await supabase
      .from('documents')
      .select('id, name, folder_id, storage_path')
      .eq('id', fileId)
      .single();

    if (verifyError) {
      console.warn('⚠️ Impossible de vérifier le déplacement:', verifyError);
    } else {
      console.log('✅ Vérification OK:', verifyDoc);
      console.log('  - Nouveau folder_id:', verifyDoc.folder_id);
      console.log('  - Storage path inchangé:', verifyDoc.storage_path);
    }

    // Succès !
    console.log('🎉 ===== DÉPLACEMENT RÉUSSI =====');
    toast.success('Fichier déplacé !', {
      description: `"${doc.name}" a été déplacé avec succès`
    });

    return true;

  } catch (error: any) {
    console.error('💥 ===== ERREUR FATALE =====');
    console.error('Erreur inattendue:', error);
    console.error('Stack trace:', error.stack);
    toast.error('Erreur inattendue', {
      description: error.message || 'Une erreur est survenue'
    });
    return false;
  }
}

