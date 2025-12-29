/**
 * Script de migration pour extraire le texte de tous les PDFs
 * et remplir la colonne extracted_text
 * 
 * RÈGLE : Utilise storage_path (sans accents) pour lire les fichiers
 * 
 * Date: 29 décembre 2024
 */

import { supabase } from '../lib/supabase';
import { extractPDFFromStorage } from './pdfExtractor';

export interface MigrationProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  current?: string;
  errors: Array<{ documentId: string; name: string; error: string }>;
}

/**
 * Extrait le texte de tous les documents PDF et met à jour la colonne extracted_text
 * 
 * @param onProgress - Callback appelé à chaque progression
 * @returns Résultat de la migration
 */
export async function migratePDFContent(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  console.log('🚀 ===== MIGRATION PDF CONTENT =====');
  
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  try {
    // 1. Récupérer tous les documents PDF qui n'ont pas encore de texte extrait
    console.log('📊 Récupération des documents PDF...');
    
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, name, storage_path, file_type, extracted_text')
      .eq('file_type', 'pdf')
      .or('extracted_text.is.null,extracted_text.eq.');

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération:', fetchError);
      throw fetchError;
    }

    if (!documents || documents.length === 0) {
      console.log('✅ Tous les documents ont déjà leur texte extrait !');
      return progress;
    }

    progress.total = documents.length;
    console.log(`📄 ${progress.total} document(s) à traiter`);

    if (onProgress) onProgress({ ...progress });

    // 2. Traiter chaque document
    for (const doc of documents) {
      progress.current = doc.name;
      console.log(`\n📄 Traitement: ${doc.name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Storage path: ${doc.storage_path}`);

      try {
        // Vérifier que storage_path existe
        if (!doc.storage_path) {
          const errorMsg = 'Pas de storage_path (colonne vide)';
          console.warn(`⚠️  ${errorMsg}`);
          progress.errors.push({
            documentId: doc.id,
            name: doc.name,
            error: errorMsg
          });
          progress.failed++;
          progress.processed++;
          if (onProgress) onProgress({ ...progress });
          continue;
        }

        // Extraire le texte du PDF en utilisant storage_path (RÈGLE: sans accents)
        console.log('   🔄 Extraction du texte...');
        const extracted = await extractPDFFromStorage(doc.storage_path);

        // Mettre à jour la base de données avec le texte extrait
        console.log('   💾 Sauvegarde dans la BDD...');
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            extracted_text: extracted.cleanText,
            page_count: extracted.metadata.pages,
            processing_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', doc.id);

        if (updateError) {
          console.error('   ❌ Erreur lors de la mise à jour:', updateError);
          progress.errors.push({
            documentId: doc.id,
            name: doc.name,
            error: `Update failed: ${updateError.message}`
          });
          progress.failed++;
        } else {
          console.log(`   ✅ Succès! ${extracted.metadata.pages} pages, ${extracted.metadata.words} mots`);
          progress.succeeded++;
        }

        progress.processed++;
        if (onProgress) onProgress({ ...progress });

        // Petit délai pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ Erreur lors du traitement:`, error.message);
        progress.errors.push({
          documentId: doc.id,
          name: doc.name,
          error: error.message
        });
        progress.failed++;
        progress.processed++;
        if (onProgress) onProgress({ ...progress });
      }
    }

    // 3. Résumé final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(50));
    console.log(`Total traité : ${progress.processed}/${progress.total}`);
    console.log(`✅ Réussis    : ${progress.succeeded}`);
    console.log(`❌ Échoués    : ${progress.failed}`);

    if (progress.errors.length > 0) {
      console.log('\n⚠️  Erreurs rencontrées:');
      progress.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.name} (${err.documentId})`);
        console.log(`   → ${err.error}`);
      });
    }

    console.log('\n✅ Migration terminée!');
    console.log('===== FIN MIGRATION =====\n');

    return progress;

  } catch (error: any) {
    console.error('💥 Erreur fatale lors de la migration:', error);
    throw error;
  }
}

/**
 * Version simplifiée pour un seul document
 */
export async function extractSingleDocument(documentId: string): Promise<void> {
  console.log(`📄 Extraction pour le document: ${documentId}`);

  // Récupérer le document
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('id, name, storage_path, file_type')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    throw new Error(`Document introuvable: ${documentId}`);
  }

  if (doc.file_type !== 'pdf') {
    throw new Error(`Le document n'est pas un PDF: ${doc.file_type}`);
  }

  if (!doc.storage_path) {
    throw new Error('Le document n\'a pas de storage_path');
  }

  console.log(`📄 Traitement: ${doc.name}`);
  console.log(`   Storage path: ${doc.storage_path}`);

  // Extraire le texte
  const extracted = await extractPDFFromStorage(doc.storage_path);

  // Mettre à jour
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      extracted_text: extracted.cleanText,
      page_count: extracted.metadata.pages,
      processing_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId);

  if (updateError) {
    throw new Error(`Échec de la mise à jour: ${updateError.message}`);
  }

  console.log(`✅ Extraction réussie! ${extracted.metadata.pages} pages, ${extracted.metadata.words} mots`);
}

