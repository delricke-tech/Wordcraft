/**
 * Gestionnaire de documents orphelins
 * 
 * Attribue automatiquement les documents sans dossier (folder_id NULL)
 * à un dossier par défaut
 * 
 * Date: 29 décembre 2024
 */

import { supabase } from '../lib/supabase';

export interface OrphanStats {
  total: number;
  assigned: number;
  failed: number;
  errors: Array<{ documentId: string; name: string; error: string }>;
}

/**
 * Crée ou récupère le dossier "Non classés" par défaut
 */
async function getOrCreateDefaultFolder(userId: string): Promise<string> {
  console.log('📁 Recherche du dossier par défaut...');

  // Vérifier si le dossier "Non classés" existe
  const { data: existing, error: searchError } = await supabase
    .from('folders')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Non classés')
    .maybeSingle();

  if (searchError) {
    console.error('Erreur recherche dossier:', searchError);
    throw searchError;
  }

  if (existing) {
    console.log('✅ Dossier "Non classés" trouvé:', existing.id);
    return existing.id;
  }

  // Créer le dossier "Non classés"
  console.log('📁 Création du dossier "Non classés"...');
  const { data: newFolder, error: createError } = await supabase
    .from('folders')
    .insert({
      user_id: userId,
      name: 'Non classés',
      color: '#6B7280',
      icon: 'folder'
    })
    .select('id')
    .single();

  if (createError || !newFolder) {
    console.error('Erreur création dossier:', createError);
    throw createError || new Error('Impossible de créer le dossier');
  }

  console.log('✅ Dossier "Non classés" créé:', newFolder.id);
  return newFolder.id;
}

/**
 * Attribue tous les documents orphelins au dossier par défaut
 */
export async function assignOrphanDocuments(
  userId: string,
  targetFolderId?: string
): Promise<OrphanStats> {
  console.log('🔄 ===== CORRECTION DOCUMENTS ORPHELINS =====');
  
  const stats: OrphanStats = {
    total: 0,
    assigned: 0,
    failed: 0,
    errors: []
  };

  try {
    // 1. Obtenir le dossier cible
    const folderId = targetFolderId || await getOrCreateDefaultFolder(userId);
    console.log('📂 Dossier cible:', folderId);

    // 2. Récupérer tous les documents orphelins de l'utilisateur
    console.log('🔍 Recherche des documents orphelins...');
    const { data: orphans, error: fetchError } = await supabase
      .from('documents')
      .select('id, name, user_id')
      .eq('user_id', userId)
      .is('folder_id', null);

    if (fetchError) {
      console.error('❌ Erreur récupération:', fetchError);
      throw fetchError;
    }

    if (!orphans || orphans.length === 0) {
      console.log('✅ Aucun document orphelin trouvé !');
      return stats;
    }

    stats.total = orphans.length;
    console.log(`📄 ${stats.total} document(s) orphelin(s) trouvé(s)`);

    // 3. Attribuer chaque document au dossier
    for (const doc of orphans) {
      console.log(`\n📄 Traitement: ${doc.name}`);

      try {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ folder_id: folderId })
          .eq('id', doc.id);

        if (updateError) {
          console.error('  ❌ Échec:', updateError);
          stats.errors.push({
            documentId: doc.id,
            name: doc.name,
            error: updateError.message
          });
          stats.failed++;
        } else {
          console.log('  ✅ Assigné au dossier');
          stats.assigned++;
        }
      } catch (error: any) {
        console.error('  ❌ Erreur:', error);
        stats.errors.push({
          documentId: doc.id,
          name: doc.name,
          error: error.message
        });
        stats.failed++;
      }
    }

    // 4. Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(50));
    console.log(`Total: ${stats.total}`);
    console.log(`✅ Assignés: ${stats.assigned}`);
    console.log(`❌ Échoués: ${stats.failed}`);
    console.log('===== FIN CORRECTION =====\n');

    return stats;

  } catch (error: any) {
    console.error('💥 Erreur fatale:', error);
    throw error;
  }
}

/**
 * Vérifie combien de documents orphelins existent
 */
export async function countOrphanDocuments(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('folder_id', null);

  if (error) {
    console.error('Erreur comptage orphelins:', error);
    return 0;
  }

  return count || 0;
}

