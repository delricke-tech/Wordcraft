/**
 * Service OpenAI pour l'analyse de documents PDF
 * 
 * RÈGLE IMPORTANTE : Ce service utilise toujours storage_path pour accéder aux fichiers
 * et ne touche JAMAIS au nom d'affichage pour éviter les erreurs "Invalid key"
 * 
 * Date: 28 décembre 2024
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface DocumentContext {
  documentId: string;
  documentName: string; // Pour l'affichage uniquement
  storagePath: string; // Pour accéder au fichier
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
 * Extrait le texte d'un PDF depuis Supabase Storage
 * UTILISE storage_path (pas le nom d'affichage)
 */
export async function extractPDFText(storagePath: string): Promise<string> {
  try {
    console.log('📄 Extraction du texte PDF...');
    console.log('  - Storage path:', storagePath);

    // RÈGLE : Utiliser storage_path pour récupérer le fichier
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
    }

    if (!data) {
      throw new Error('Aucune donnée retournée par Supabase');
    }

    console.log('✅ PDF téléchargé, taille:', data.size, 'bytes');

    // Convertir le Blob en ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Utiliser pdfjs-dist pour extraire le texte
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configuration du worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('📖 PDF chargé:', pdf.numPages, 'pages');

    let fullText = '';

    // Extraire le texte de chaque page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log('✅ Texte extrait:', fullText.length, 'caractères');
    return fullText.trim();
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
    console.log('🤖 Génération du résumé avec OpenAI...');
    
    const openai = getOpenAIClient();

    // Limiter le texte si trop long (max 15000 caractères pour éviter les limites)
    const truncatedText = documentText.slice(0, 15000);

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
    console.log('💬 Envoi du message au chat...');
    console.log('  - Message:', message);
    console.log('  - Document:', context.documentName);

    const openai = getOpenAIClient();

    // Construire les messages pour OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert qui aide les étudiants à comprendre le document "${context.documentName}". 

${context.extractedText ? `Contexte du document (extrait) :
${context.extractedText.slice(0, 3000)}...` : 'Le texte du document n\'est pas encore chargé.'}

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
    console.log('✅ Réponse reçue');
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

