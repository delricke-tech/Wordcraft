/**
 * Service de chunking intelligent pour documents longs
 * Permet de diviser les documents en segments pertinents pour l'IA
 * 
 * Date: 6 mars 2025
 */

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  startIndex: number;
  endIndex: number;
  chunkIndex: number;
  
  // Métadonnées du chunk
  title?: string;
  summary: string;
  keywords: string[];
  relevanceScore: number;
  
  // Contexte
  previousChunkId?: string;
  nextChunkId?: string;
  overlapContent: string; // Contenu qui chevauche le chunk suivant
  
  // Statistiques
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number; // en minutes
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface ChunkingOptions {
  maxChunkSize: number; // en caractères
  minChunkSize: number; // en caractères
  overlapSize: number; // chevauchement en caractères
  strategy: 'semantic' | 'fixed' | 'paragraph' | 'section';
  preserveContext: boolean;
  generateSummaries: boolean;
  extractKeywords: boolean;
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  metadata: {
    totalChunks: number;
    averageChunkSize: number;
    totalCharacters: number;
    processingTime: number; // en ms
    strategy: ChunkingOptions['strategy'];
  };
}

/**
 * Divise un document long en chunks intelligents
 */
export async function chunkDocument(
  documentId: string,
  content: string,
  options: Partial<ChunkingOptions> = {}
): Promise<ChunkingResult> {
  const startTime = Date.now();
  
  const defaultOptions: ChunkingOptions = {
    maxChunkSize: 4000,
    minChunkSize: 500,
    overlapSize: 200,
    strategy: 'semantic',
    preserveContext: true,
    generateSummaries: true,
    extractKeywords: true,
    ...options
  };

  console.log('🔪 Début chunking document:', documentId);
  console.log('  - Stratégie:', defaultOptions.strategy);
  console.log('  - Taille:', content.length, 'caractères');

  let chunks: DocumentChunk[] = [];

  switch (defaultOptions.strategy) {
    case 'semantic':
      chunks = await chunkSemantic(content, documentId, defaultOptions);
      break;
    case 'fixed':
      chunks = chunkFixed(content, documentId, defaultOptions);
      break;
    case 'paragraph':
      chunks = chunkParagraph(content, documentId, defaultOptions);
      break;
    case 'section':
      chunks = chunkSection(content, documentId, defaultOptions);
      break;
    default:
      chunks = await chunkSemantic(content, documentId, defaultOptions);
  }

  // Post-traitement
  chunks = postProcessChunks(chunks, defaultOptions);

  const processingTime = Date.now() - startTime;
  const averageChunkSize = chunks.reduce((sum, chunk) => sum + chunk.characterCount, 0) / chunks.length;

  const result: ChunkingResult = {
    chunks,
    metadata: {
      totalChunks: chunks.length,
      averageChunkSize,
      totalCharacters: content.length,
      processingTime,
      strategy: defaultOptions.strategy
    }
  };

  console.log('✅ Chunking terminé:', result.metadata.totalChunks, 'chunks');
  console.log('  - Temps:', processingTime, 'ms');
  console.log('  - Taille moyenne:', Math.round(averageChunkSize), 'caractères');

  return result;
}

/**
 * Chunking sémantique intelligent (basé sur le contenu)
 */
async function chunkSemantic(
  content: string,
  documentId: string,
  options: ChunkingOptions
): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = [];
  const sentences = splitIntoSentences(content);
  
  let currentChunk = '';
  let chunkIndex = 0;
  let startIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    
    // Vérifier si on dépasse la taille maximale
    if (testChunk.length >= options.maxChunkSize) {
      // Créer le chunk
      const chunk = await createChunk(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        startIndex,
        startIndex + currentChunk.length,
        options
      );
      
      chunks.push(chunk);
      chunkIndex++;
      startIndex += currentChunk.length;
      
      // Démarrer le nouveau chunk avec chevauchement
      const overlapStart = Math.max(0, currentChunk.length - options.overlapSize);
      currentChunk = currentChunk.substring(overlapStart) + ' ' + sentence;
    } else {
      currentChunk = testChunk;
    }
  }
  
  // Ajouter le dernier chunk s'il reste du contenu
  if (currentChunk.trim()) {
    const chunk = await createChunk(
      currentChunk.trim(),
      documentId,
      chunkIndex,
      startIndex,
      content.length,
      options
    );
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Chunking à taille fixe
 */
function chunkFixed(
  content: string,
  documentId: string,
  options: ChunkingOptions
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const chunkSize = options.maxChunkSize;
  
  for (let i = 0; i < content.length; i += chunkSize - options.overlapSize) {
    const endIndex = Math.min(i + chunkSize, content.length);
    const chunkContent = content.substring(i, endIndex);
    
    const chunk = createChunkSync(
      chunkContent,
      documentId,
      Math.floor(i / (chunkSize - options.overlapSize)),
      i,
      endIndex,
      options
    );
    
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Chunking par paragraphes
 */
function chunkParagraph(
  content: string,
  documentId: string,
  options: ChunkingOptions
): DocumentChunk[] {
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  
  let currentChunk = '';
  let chunkIndex = 0;
  let startIndex = 0;

  for (const paragraph of paragraphs) {
    const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
    
    if (testChunk.length >= options.maxChunkSize || 
        (currentChunk && testChunk.length >= options.minChunkSize)) {
      
      const chunk = createChunkSync(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        startIndex,
        startIndex + currentChunk.length,
        options
      );
      
      chunks.push(chunk);
      chunkIndex++;
      startIndex += currentChunk.length;
      currentChunk = paragraph;
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk.trim()) {
    const chunk = createChunkSync(
      currentChunk.trim(),
      documentId,
      chunkIndex,
      startIndex,
      content.length,
      options
    );
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Chunking par sections (titres)
 */
function chunkSection(
  content: string,
  documentId: string,
  options: ChunkingOptions
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const lines = content.split('\n');
  
  let currentChunk = '';
  let chunkIndex = 0;
  let startIndex = 0;
  let currentTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter les titres (##, ###, ####)
    if (line.match(/^#{1,6}\s/)) {
      // Sauvegarder le chunk précédent s'il existe
      if (currentChunk.trim()) {
        const chunk = createChunkSync(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          startIndex,
          startIndex + currentChunk.length,
          options,
          currentTitle || undefined
        );
        
        chunks.push(chunk);
        chunkIndex++;
        startIndex += currentChunk.length;
      }
      
      currentChunk = line;
      currentTitle = line.replace(/^#{1,6}\s*/, '').trim();
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  // Ajouter le dernier chunk
  if (currentChunk.trim()) {
    const chunk = createChunkSync(
      currentChunk.trim(),
      documentId,
      chunkIndex,
      startIndex,
      content.length,
      options,
      currentTitle || undefined
    );
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Crée un chunk avec métadonnées (version synchrone)
 */
function createChunkSync(
  content: string,
  documentId: string,
  chunkIndex: number,
  startIndex: number,
  endIndex: number,
  options: ChunkingOptions,
  title?: string
): DocumentChunk {
  const now = new Date();
  const words = content.split(/\s+/).filter(word => word.length > 0);
  
  return {
    id: `chunk_${documentId}_${chunkIndex}`,
    documentId,
    content,
    startIndex,
    endIndex,
    chunkIndex,
    title,
    summary: options.generateSummaries ? generateSummary(content) : '',
    keywords: options.extractKeywords ? extractKeywords(content) : [],
    relevanceScore: calculateRelevanceScore(content),
    overlapContent: content.slice(-options.overlapSize),
    wordCount: words.length,
    characterCount: content.length,
    estimatedReadingTime: Math.ceil(words.length / 200), // 200 mots/min
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Crée un chunk avec métadonnées (version asynchrone)
 */
async function createChunk(
  content: string,
  documentId: string,
  chunkIndex: number,
  startIndex: number,
  endIndex: number,
  options: ChunkingOptions,
  title?: string
): Promise<DocumentChunk> {
  // Pour l'instant, version synchrone
  return createChunkSync(content, documentId, chunkIndex, startIndex, endIndex, options, title);
}

/**
 * Post-traitement des chunks
 */
function postProcessChunks(
  chunks: DocumentChunk[],
  options: ChunkingOptions
): DocumentChunk[] {
  // Lier les chunks entre eux
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      chunks[i].previousChunkId = chunks[i - 1].id;
    }
    if (i < chunks.length - 1) {
      chunks[i].nextChunkId = chunks[i + 1].id;
    }
  }
  
  // Calculer les scores de pertinence si nécessaire
  if (options.extractKeywords) {
    chunks.forEach(chunk => {
      chunk.relevanceScore = calculateRelevanceScore(chunk.content);
    });
  }
  
  return chunks;
}

/**
 * Divise le texte en phrases
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 10);
}

/**
 * Génère un résumé simple du chunk
 */
function generateSummary(content: string): string {
  const sentences = splitIntoSentences(content);
  if (sentences.length <= 2) return content;
  
  // Prendre la première et dernière phrase, ou les 2 premières
  if (sentences.length <= 4) {
    return sentences.slice(0, 2).join('. ');
  }
  
  return sentences.slice(0, 3).join('. ');
}

/**
 * Extrait les mots-clés du contenu
 */
function extractKeywords(content: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Compter les fréquences
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Prendre les mots les plus fréquents (max 10)
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
}

/**
 * Calcule le score de pertinence du contenu
 */
function calculateRelevanceScore(content: string): number {
  // Facteurs qui influencent la pertinence:
  const length = content.length;
  const sentences = splitIntoSentences(content);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  // Score basé sur la densité d'information
  let score = 0;
  
  // Longueur optimale (ni trop court, ni trop long)
  if (length >= 200 && length <= 2000) score += 30;
  else if (length >= 100 && length <= 3000) score += 20;
  else if (length >= 50) score += 10;
  
  // Nombre de phrases (structure)
  if (sentences.length >= 3 && sentences.length <= 10) score += 25;
  else if (sentences.length >= 2 && sentences.length <= 15) score += 15;
  else if (sentences.length >= 1) score += 5;
  
  // Densité lexicale (diversité du vocabulaire)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = uniqueWords.size / Math.max(words.length, 1);
  if (lexicalDiversity >= 0.3) score += 20;
  else if (lexicalDiversity >= 0.2) score += 10;
  
  // Présence de nombres et dates (contenu factuel)
  if (/\d/.test(content)) score += 10;
  if (/\b(19|20)\d{2}\b/.test(content)) score += 5; // années récentes
  
  return Math.min(100, score);
}

/**
 * Sélectionne les chunks les plus pertinents pour une question
 */
export function selectRelevantChunks(
  chunks: DocumentChunk[],
  query: string,
  maxChunks: number = 5
): DocumentChunk[] {
  const queryKeywords = extractKeywords(query);
  
  // Calculer les scores de pertinence pour chaque chunk
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const chunkContent = chunk.content.toLowerCase();
    
    // Score basé sur les mots-clés de la question
    queryKeywords.forEach(keyword => {
      const occurrences = (chunkContent.match(new RegExp(keyword, 'g')) || []).length;
      score += occurrences * 10;
    });
    
    // Score basé sur la pertinence intrinsèque du chunk
    score += chunk.relevanceScore;
    
    // Bonus pour les chunks avec des titres pertinents
    if (chunk.title && chunk.title.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }
    
    return { chunk, score };
  });
  
  // Trier par score et prendre les meilleurs
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(item => item.chunk);
}

/**
 * Reconstruit le contexte autour d'un chunk
 */
export function buildChunkContext(
  chunks: DocumentChunk[],
  targetChunkId: string,
  contextSize: number = 2 // nombre de chunks avant et après
): string {
  const targetChunk = chunks.find(c => c.id === targetChunkId);
  if (!targetChunk) return '';
  
  const chunkIndex = chunks.findIndex(c => c.id === targetChunkId);
  const startIndex = Math.max(0, chunkIndex - contextSize);
  const endIndex = Math.min(chunks.length - 1, chunkIndex + contextSize);
  
  const contextChunks = chunks.slice(startIndex, endIndex + 1);
  
  return contextChunks
    .map(chunk => chunk.content)
    .join('\n\n---\n\n');
}

/**
 * Exporte les chunks au format spécifié
 */
export function exportChunks(
  chunks: DocumentChunk[],
  format: 'json' | 'csv' | 'txt'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(chunks, null, 2);
    
    case 'csv':
      const headers = [
        'ID', 'Document ID', 'Chunk Index', 'Title', 'Start Index', 'End Index',
        'Character Count', 'Word Count', 'Reading Time', 'Relevance Score',
        'Keywords', 'Summary', 'Created At'
      ];
      
      const rows = chunks.map(chunk => [
        chunk.id,
        chunk.documentId,
        chunk.chunkIndex,
        `"${chunk.title || ''}"`,
        chunk.startIndex,
        chunk.endIndex,
        chunk.characterCount,
        chunk.wordCount,
        chunk.estimatedReadingTime,
        chunk.relevanceScore,
        `"${chunk.keywords.join('; ')}"`,
        `"${chunk.summary.replace(/"/g, '""')}"`,
        chunk.createdAt.toISOString()
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    case 'txt':
      return chunks.map((chunk) => 
        `=== CHUNK ${chunk.chunkIndex + 1} ===\n` +
        `Title: ${chunk.title || 'No title'}\n` +
        `Score: ${chunk.relevanceScore}/100\n` +
        `Summary: ${chunk.summary}\n` +
        `Keywords: ${chunk.keywords.join(', ')}\n\n` +
        `${chunk.content}\n\n` +
        '='.repeat(50) + '\n\n'
      ).join('');
    
    default:
      return JSON.stringify(chunks, null, 2);
  }
}
