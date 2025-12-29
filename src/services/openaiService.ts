/**
 * Service OpenAI avec support du proxy pour éviter CORS
 * 
 * Configuration :
 * - Par défaut : Utilise Supabase directement
 * - Si CORS bloque : Utilise le proxy local (localhost:3001)
 * 
 * RÈGLE IMPORTANTE : Utilise TOUJOURS storage_path (pas le nom d'affichage)
 * pour éviter les erreurs "Invalid key" liées aux accents
 * 
 * Date: 28 décembre 2024
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

// Configuration du proxy (activer si CORS bloque)
const USE_PROXY = false; // Mettre à true si CORS bloque
const PROXY_URL = 'http://localhost:3001';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface DocumentContext {
  documentId: string;
  documentName: string; // Pour l'affichage uniquement (nom avec accents)
  storagePath: string; // Pour accéder au fichier (chemin nettoyé)
  extractedText?: string;
}

// Configuration OpenAI
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante. Veuillez ajouter VITE_OPENAI_API_KEY dans votre fichier .env');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Pour utiliser dans le navigateur (dev uniquement)
  });
};

/**
 * Télécharge un PDF depuis Supabase (avec ou sans proxy)
 * UTILISE storage_path (pas le nom d'affichage)
 */
async function downloadPDF(storagePath: string): Promise<Blob> {
  console.log('📥 Téléchargement PDF...');
  console.log('  - Storage path:', storagePath);
  console.log('  - Utilise proxy:', USE_PROXY);

  if (USE_PROXY) {
    // Option 1 : Via proxy (évite CORS)
    console.log('🔄 Téléchargement via proxy...');
    const response = await fetch(`${PROXY_URL}/download/${storagePath}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur proxy: ${error.error || response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ PDF téléchargé via proxy:', blob.size, 'bytes');
    return blob;

  } else {
    // Option 2 : Direct depuis Supabase (peut avoir CORS)
    console.log('📦 Téléchargement direct depuis Supabase...');
    
    // RÈGLE : Utiliser storage_path pour récupérer le fichier
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      
      // Si erreur CORS, suggérer le proxy
      if (error.message.includes('CORS') || error.message.includes('blocked')) {
        throw new Error(
          'Erreur CORS détectée. ' +
          'Solution : Activez le proxy en mettant USE_PROXY = true dans openaiService.ts, ' +
          'puis lancez "node proxy-server.js" dans un terminal.'
        );
      }
      
      throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
    }

    if (!data) {
      throw new Error('Aucune donnée retournée par Supabase');
    }

    console.log('✅ PDF téléchargé:', data.size, 'bytes');
    return data;
  }
}

/**
 * Extrait le texte d'un PDF depuis Supabase Storage
 * UTILISE storage_path (pas le nom d'affichage)
 * 
 * Note: Cette fonction utilise maintenant le service pdfExtractor
 * qui gère nativement le téléchargement depuis Supabase Storage
 */
export async function extractPDFText(storagePath: string): Promise<string> {
  try {
    console.log('📄 Extraction PDF via pdfExtractor service...');
    
    // Utiliser le service dédié d'extraction PDF
    const { extractPDFFromStorage } = await import('./pdfExtractor');
    const result = await extractPDFFromStorage(storagePath);
    
    console.log('✅ Texte extrait avec succès:', result.metadata);
    return result.cleanText; // Retourner le texte nettoyé

  } catch (error: any) {
    console.error('💥 Erreur lors de l\'extraction du texte:', error);
    throw new Error(`Échec de l'extraction du texte: ${error.message}`);
  }
}

/**
 * Génère un résumé du document avec OpenAI
 */
export async function summarizeDocument(documentText: string, documentName: string): Promise<string> {
  try {
    console.log('🤖 ===== GÉNÉRATION RÉSUMÉ =====');
    console.log('  - Document:', documentName);
    console.log('📄 Texte récupéré:', documentText ? `${documentText.length} caractères` : 'NULL/VIDE');
    
    // ✅ VÉRIFICATION : Le texte doit exister
    if (!documentText || documentText.trim() === '') {
      throw new Error(
        `Erreur : Le texte de ce cours n'a pas encore été extrait.\n\n` +
        `Document : "${documentName}"\n\n` +
        `Veuillez patienter quelques secondes et réessayer.`
      );
    }
    
    const openai = getOpenAIClient();

    // Limiter le texte si trop long (max 15000 caractères pour éviter les limites)
    const truncatedText = documentText.slice(0, 15000);
    console.log('  - Texte tronqué pour OpenAI:', truncatedText.length, 'caractères');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant pédagogique expert. Tu dois analyser le document "${documentName}" et en fournir un résumé structuré et clair.`
        },
        {
          role: 'user',
          content: `Voici le contenu du document "${documentName}". Génère un résumé structuré avec :
1. Les points clés principaux
2. Les concepts importants
3. Une conclusion

Contenu du document :
${truncatedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const summary = completion.choices[0]?.message?.content || 'Impossible de générer un résumé.';
    console.log('✅ Résumé généré');
    return summary;
  } catch (error: any) {
    console.error('💥 Erreur OpenAI:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('Quota OpenAI épuisé. Veuillez vérifier votre compte OpenAI.');
    }
    
    throw new Error(`Erreur OpenAI: ${error.message}`);
  }
}

/**
 * Envoie un message au chat avec le contexte du document
 */
export async function sendChatMessage(
  message: string,
  context: DocumentContext,
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    console.log('💬 ===== ENVOI MESSAGE CHAT =====');
    console.log('  - Message utilisateur:', message);
    console.log('  - Document ID:', context.documentId);
    console.log('  - Document Name:', context.documentName);
    console.log('  - Storage Path:', context.storagePath);
    
    // ✅ LOG 1 : Vérifier si le texte arrive vraiment
    console.log('📄 Texte récupéré:', context.extractedText ? `${context.extractedText.length} caractères` : 'NULL/VIDE');
    
    // ✅ VÉRIFICATION 1 : Le contexte doit exister
    if (!context || !context.documentId || !context.storagePath) {
      console.error('❌ Contexte invalide:', context);
      throw new Error('Erreur : Le contexte du document est manquant ou invalide.');
    }

    // ✅ VÉRIFICATION 2 : Le texte doit être disponible (FALLBACK)
    if (!context.extractedText || context.extractedText.trim() === '') {
      console.error('❌ Le texte extrait est vide ou NULL');
      console.error('   Storage Path utilisé:', context.storagePath);
      throw new Error(
        `Erreur : Le texte de ce cours n'a pas encore été extrait.\n\n` +
        `Document : "${context.documentName}"\n` +
        `Fichier identifié : ${context.storagePath}\n\n` +
        `Veuillez patienter quelques secondes et réessayer. Si le problème persiste, ` +
        `retournez à la bibliothèque et rouvrez le document.`
      );
    }

    console.log('✅ Contexte valide, texte disponible');
    console.log('  - Longueur du texte:', context.extractedText.length);
    console.log('  - Premiers 100 caractères:', context.extractedText.slice(0, 100) + '...');

    const openai = getOpenAIClient();

    // Construire les messages pour OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert qui aide les étudiants à comprendre le document "${context.documentName}". 

Contexte du document (extrait) :
${context.extractedText.slice(0, 3000)}...

Règles :
- Réponds en français
- Sois clair et pédagogique
- Utilise des exemples quand nécessaire
- Formate tes réponses en Markdown
- Pour les formules mathématiques, utilise la syntaxe LaTeX avec $$ pour les équations en bloc et $ pour les inline`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('🤖 Appel à OpenAI en cours...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
    console.log('✅ Réponse reçue de OpenAI:', response.slice(0, 100) + '...');
    return response;
  } catch (error: any) {
    console.error('💥 Erreur lors de l\'envoi du message:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('Quota OpenAI épuisé. Veuillez vérifier votre compte OpenAI.');
    }
    
    throw new Error(`Erreur OpenAI: ${error.message}`);
  }
}

/**
 * Analyse un document uploadé depuis le chat (via trombone)
 */
export async function analyzeUploadedDocument(file: File): Promise<string> {
  try {
    console.log('📎 Analyse du fichier uploadé:', file.name);

    // Vérifier que c'est un PDF
    if (file.type !== 'application/pdf') {
      throw new Error('Seuls les fichiers PDF sont supportés pour l\'instant.');
    }

    // Extraire le texte du fichier
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limiter à 10 pages pour les fichiers uploadés
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log('✅ Texte extrait du fichier uploadé');
    return fullText.trim();
  } catch (error: any) {
    console.error('💥 Erreur lors de l\'analyse du fichier:', error);
    throw new Error(`Impossible d'analyser le fichier: ${error.message}`);
  }
}
