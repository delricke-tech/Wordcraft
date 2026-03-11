import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingResult {
  chunk: DocumentChunk;
  embedding: number[];
  success: boolean;
  error?: string;
}

export interface CitationResult {
  id: string;
  document_id: string;
  chunk_id: string;
  text_snippet: string;
  relevance_score: number;
  page_number?: number;
  chunk_position?: number;
}

export interface SearchQuery {
  query: string;
  document_id?: string;
  limit?: number;
  threshold?: number; // Seuil de similarité (0-1)
}

class EmbeddingsService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Divise un document en chunks pour l'embedding
   */
  chunkDocument(content: string, chunkSize: number = 1000, overlap: number = 200): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    if (!content || content.trim().length === 0) {
      return chunks;
    }

    const words = content.split(/\s+/);
    let currentIndex = 0;

    while (currentIndex < words.length) {
      const chunkWords = words.slice(currentIndex, currentIndex + chunkSize);
      const chunkContent = chunkWords.join(' ');
      
      chunks.push({
        id: `chunk_${currentIndex}`,
        document_id: '', // Sera défini plus tard
        chunk_index: currentIndex,
        content: chunkContent,
        metadata: {
          word_count: chunkWords.length,
          char_count: chunkContent.length,
          start_position: currentIndex,
          end_position: currentIndex + chunkWords.length - 1
        }
      });

      currentIndex += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Génère des embeddings pour un chunk de texte
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`🧠 Génération embedding pour ${text.length} caractères...`);
      
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // 1536 dimensions
        input: text,
        encoding_format: 'float',
      });

      const embedding = response.data[0]?.embedding;
      
      if (!embedding) {
        throw new Error('Aucun embedding généré');
      }

      console.log(`✅ Embedding généré: ${embedding.length} dimensions`);
      return embedding;
      
    } catch (error) {
      console.error('❌ Erreur génération embedding:', error);
      throw new Error(`Échec de la génération d'embedding: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère des embeddings pour tous les chunks d'un document
   */
  async generateDocumentEmbeddings(
    documentId: string, 
    chunks: DocumentChunk[]
  ): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    console.log(`🚀 Génération embeddings pour ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const embedding = await this.generateEmbedding(chunk.content);
        
        // Insérer dans Supabase
        const { error } = await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            embedding: `[${embedding.join(',')}]`, // Convertir en texte pour Supabase
            metadata: chunk.metadata || {}
          });

        if (error) {
          throw new Error(`Erreur insertion chunk: ${error.message}`);
        }

        results.push({
          chunk,
          embedding,
          success: true
        });

        console.log(`✅ Chunk ${i + 1}/${chunks.length} traité`);
        
        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erreur chunk ${i + 1}:`, error);
        results.push({
          chunk,
          embedding: [],
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🎉 Embeddings générés: ${successCount}/${chunks.length} chunks`);
    
    return results;
  }

  /**
   * Recherche sémantique dans les chunks
   */
  async semanticSearch(query: SearchQuery): Promise<CitationResult[]> {
    try {
      console.log(`🔍 Recherche sémantique: "${query.query}"`);
      
      // Générer l'embedding de la requête
      const queryEmbedding = await this.generateEmbedding(query.query);
      
      // Construire la requête Supabase
      let supabaseQuery = supabase
        .rpc('search_document_chunks', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: query.threshold || 0.7,
          match_count: query.limit || 10
        });

      // Si document_id spécifié, filtrer
      if (query.document_id) {
        supabaseQuery = supabaseQuery.eq('document_id', query.document_id);
      }

      const { data, error } = await supabaseQuery;
      
      if (error) {
        throw new Error(`Erreur recherche sémantique: ${error.message}`);
      }

      const citations: CitationResult[] = (data || []).map((result: any) => ({
        id: result.id,
        document_id: result.document_id,
        chunk_id: result.id,
        text_snippet: result.content,
        relevance_score: result.similarity || 0.0,
        page_number: result.metadata?.page_number,
        chunk_position: result.chunk_index
      }));

      console.log(`✅ Recherche sémantique: ${citations.length} résultats`);
      return citations;
      
    } catch (error) {
      console.error('❌ Erreur recherche sémantique:', error);
      throw new Error(`Échec de la recherche sémantique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche hybride (sémantique + full-text)
   */
  async hybridSearch(query: SearchQuery): Promise<CitationResult[]> {
    try {
      console.log(`🔍 Recherche hybride: "${query.query}"`);
      
      // Recherche sémantique
      const semanticResults = await this.semanticSearch({
        ...query,
        limit: Math.floor((query.limit || 10) * 0.7) // 70% sémantique
      });
      
      // Recherche full-text
      const textResults = await this.fullTextSearch({
        ...query,
        limit: Math.floor((query.limit || 10) * 0.3) // 30% full-text
      });
      
      // Combiner et dédupliquer les résultats
      const allResults = [...semanticResults, ...textResults];
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Trier par pertinence
      uniqueResults.sort((a, b) => b.relevance_score - a.relevance_score);
      
      // Limiter le nombre de résultats
      const finalResults = uniqueResults.slice(0, query.limit || 10);
      
      console.log(`✅ Recherche hybride: ${finalResults.length} résultats uniques`);
      return finalResults;
      
    } catch (error) {
      console.error('❌ Erreur recherche hybride:', error);
      throw new Error(`Échec de la recherche hybride: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche full-text traditionnelle
   */
  private async fullTextSearch(query: SearchQuery): Promise<CitationResult[]> {
    try {
      let supabaseQuery = supabase
        .from('document_chunks')
        .select('*')
        .textSearch('content', query.query)
        .limit(query.limit || 5);

      if (query.document_id) {
        supabaseQuery = supabaseQuery.eq('document_id', query.document_id);
      }

      const { data, error } = await supabaseQuery;
      
      if (error) {
        throw new Error(`Erreur recherche full-text: ${error.message}`);
      }

      const citations: CitationResult[] = (data || []).map((chunk: any) => ({
        id: chunk.id,
        document_id: chunk.document_id,
        chunk_id: chunk.id,
        text_snippet: chunk.content,
        relevance_score: 0.5, // Score par défaut pour full-text
        page_number: chunk.metadata?.page_number,
        chunk_position: chunk.chunk_index
      }));

      return citations;
      
    } catch (error) {
      console.error('❌ Erreur recherche full-text:', error);
      return [];
    }
  }

  /**
   * Déduplique les résultats de recherche
   */
  private deduplicateResults(results: CitationResult[]): CitationResult[] {
    const seen = new Set<string>();
    const unique: CitationResult[] = [];
    
    for (const result of results) {
      const key = `${result.document_id}-${result.chunk_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }
    
    return unique;
  }

  /**
   * Supprime tous les embeddings d'un document
   */
  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression embeddings pour document: ${documentId}`);
      
      const { error } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (error) {
        throw new Error(`Erreur suppression embeddings: ${error.message}`);
      }

      console.log('✅ Embeddings supprimés avec succès');
      
    } catch (error) {
      console.error('❌ Erreur suppression embeddings:', error);
      throw new Error(`Échec de la suppression des embeddings: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Compte le nombre de chunks pour un document
   */
  async countDocumentChunks(documentId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId);

      if (error) {
        throw new Error(`Erreur comptage chunks: ${error.message}`);
      }

      return count || 0;
      
    } catch (error) {
      console.error('❌ Erreur comptage chunks:', error);
      return 0;
    }
  }

  /**
   * Teste la connexion au service d'embeddings
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateEmbedding("Test de connexion embeddings");
      return true;
    } catch (error) {
      console.error('❌ Test connexion embeddings échoué:', error);
      return false;
    }
  }
}

export const embeddingsService = new EmbeddingsService();
export default embeddingsService;
