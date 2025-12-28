/**
 * Utilitaire pour gérer les favoris de documents
 * 
 * RÈGLE IMPORTANTE: Cette fonction met à jour uniquement la colonne is_favorite
 * et ne touche JAMAIS aux colonnes name ou storage_path pour éviter les erreurs
 * "Invalid key" dues aux accents et caractères spéciaux.
 * 
 * Date: 28 décembre 2024
 */

import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

/**
 * Met à jour le statut favori d'un document
 * 
 * @param documentId - L'ID du document à modifier
 * @param userId - L'ID de l'utilisateur propriétaire
 * @param currentFavoriteStatus - Le statut actuel de is_favorite
 * @returns true si la mise à jour a réussi, false sinon
 */
export async function toggleFavorite(
  documentId: string,
  userId: string,
  currentFavoriteStatus: boolean
): Promise<boolean> {
  try {
    console.log('⭐ ===== MISE À JOUR FAVORIS =====');
    console.log('  - Document ID:', documentId);
    console.log('  - User ID:', userId);
    console.log('  - Statut actuel:', currentFavoriteStatus);
    console.log('  - Nouveau statut:', !currentFavoriteStatus);

    // Vérifier que le document appartient bien à l'utilisateur
    const { data: doc, error: checkError } = await supabase
      .from('documents')
      .select('id, user_id, name')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (checkError || !doc) {
      console.error('❌ Document non trouvé ou accès refusé:', checkError);
      toast.error('Erreur', {
        description: 'Document introuvable ou accès refusé'
      });
      return false;
    }

    console.log('✅ Document vérifié:', doc.name);

    // Mettre à jour UNIQUEMENT la colonne is_favorite
    // ❌ NE PAS toucher à storage_path
    // ❌ NE PAS toucher à name
    // ❌ NE PAS toucher à folder_id
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        is_favorite: !currentFavoriteStatus
      })
      .eq('id', documentId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      toast.error('Erreur', {
        description: 'Impossible de mettre à jour le favori'
      });
      return false;
    }

    console.log('✅ Statut favori mis à jour avec succès');

    // Afficher une notification de succès
    if (!currentFavoriteStatus) {
      toast.success('Ajouté aux favoris', {
        description: `"${doc.name}" a été ajouté à vos favoris`
      });
    } else {
      toast.success('Retiré des favoris', {
        description: `"${doc.name}" a été retiré de vos favoris`
      });
    }

    return true;
  } catch (error: any) {
    console.error('💥 Erreur inattendue lors du toggle favoris:', error);
    toast.error('Erreur', {
      description: 'Une erreur inattendue s\'est produite'
    });
    return false;
  }
}

/**
 * Récupère tous les documents favoris d'un utilisateur
 * 
 * @param userId - L'ID de l'utilisateur
 * @returns Un tableau de documents favoris
 */
export async function getFavoriteDocuments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des favoris:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('💥 Erreur inattendue lors de la récupération des favoris:', error);
    return [];
  }
}

