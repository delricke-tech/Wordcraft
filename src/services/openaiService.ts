/**
 * Service OpenAI avec support du proxy pour éviter CORS
 * VERSION AMÉLIORÉE : Réponses détaillées et enrichies
 * 
 * Configuration :
 * - Par défaut : Utilise Supabase directement
 * - Si CORS bloque : Utilise le proxy local (localhost:3001)
 * 
 * RÈGLE IMPORTANTE : Utilise TOUJOURS storage_path (pas le nom d'affichage)
 * pour éviter les erreurs "Invalid key" liées aux accents
 * 
 * NOUVEAUTÉS v2.0 :
 * - Prompts système détaillés pour réponses exhaustives
 * - Niveaux de détail configurables (concis, standard, détaillé)
 * - Support de la recherche web optionnelle (Tavily/Serper)
 * - Résumés structurés et approfondis
 * - Modèle GPT-4o-mini pour meilleure qualité
 * 
 * Date: 31 décembre 2024
 */

import OpenAI from 'openai';
// import { supabase } from '../lib/supabase';
import { searchWeb } from './webSearch';

// Configuration du proxy (activer si CORS bloque) - Désactivé
// const USE_PROXY = false;
// const PROXY_URL = 'http://localhost:3001';

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

// Note: La fonction downloadPDF a été supprimée car elle n'est pas utilisée.
// Une fonction similaire existe dans pdfExtractor.ts si nécessaire.

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
 * Génère un résumé DÉTAILLÉ du document avec OpenAI
 * VERSION AMÉLIORÉE : Résumés plus complets et structurés
 */
export async function summarizeDocument(
  documentText: string, 
  documentName: string,
  options?: {
    detailLevel?: 'bref' | 'standard' | 'exhaustif';
  }
): Promise<string> {
  try {
    console.log('🤖 ===== GÉNÉRATION RÉSUMÉ AMÉLIORÉ =====');
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

    // Déterminer le niveau de détail
    const detailLevel = options?.detailLevel || 'exhaustif';
    const maxTokens = detailLevel === 'bref' ? 800 : detailLevel === 'standard' ? 1500 : 2500;
    
    // Utiliser plus de texte pour un résumé plus riche
    const maxInputLength = detailLevel === 'bref' ? 15000 : detailLevel === 'standard' ? 25000 : 40000;
    const truncatedText = documentText.slice(0, maxInputLength);
    console.log('  - Texte tronqué pour OpenAI:', truncatedText.length, 'caractères');
    console.log('  - Niveau de détail:', detailLevel);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modèle plus performant
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant pédagogique expert spécialisé dans la synthèse de documents académiques. 
Tu dois analyser le document "${documentName}" et en fournir un résumé DÉTAILLÉ, STRUCTURÉ et PÉDAGOGIQUE.`
        },
        {
          role: 'user',
          content: `📚 Analyse ce document "${documentName}" et génère un résumé ${detailLevel === 'bref' ? 'concis' : detailLevel === 'standard' ? 'équilibré' : 'EXHAUSTIF et DÉTAILLÉ'}.

${detailLevel === 'exhaustif' ? `
🎯 STRUCTURE REQUISE (résumé exhaustif) :

## 📖 Vue d'Ensemble
- Résumé en 2-3 phrases
- Objectif principal du document

## 🔑 Points Clés Principaux
- Liste détaillée des points essentiels (au moins 5-8 points)
- Développe chaque point avec explications

## 💡 Concepts Importants
- Liste et explique tous les concepts majeurs
- Donne des définitions claires
- Fais des liens entre les concepts

## 📊 Informations Détaillées
- Données chiffrées importantes
- Formules ou équations clés
- Méthodologies mentionnées

## 🌐 Contexte et Applications
- Dans quel contexte ce document s'inscrit-il ?
- Quelles sont les applications pratiques ?
- Qui est concerné par ces informations ?

## 📌 Points À Retenir Absolument
- Les 5-10 éléments ESSENTIELS à mémoriser
- Ce qu'il ne faut surtout pas oublier

## 💪 Suggestions d'Approfondissement
- Quels sujets connexes explorer ?
- Quelles questions se poser pour aller plus loin ?

## ✅ Conclusion
- Synthèse finale
- Importance de ce document
` : detailLevel === 'standard' ? `
🎯 STRUCTURE REQUISE (résumé standard) :

## 📖 Résumé
- Vue d'ensemble en quelques phrases

## 🔑 Points Clés (4-6 points)
- Les éléments essentiels

## 💡 Concepts Importants
- Définitions et explications

## 📌 À Retenir
- Ce qu'il faut mémoriser

## ✅ Conclusion
- Synthèse finale
` : `
🎯 STRUCTURE REQUISE (résumé bref) :

## 📖 En Bref
- Résumé en 2-3 phrases

## 🔑 Points Clés (3-4 points)
- L'essentiel à retenir

## ✅ Conclusion
- Synthèse en 1 phrase
`}

📄 **CONTENU DU DOCUMENT** :
${truncatedText}

💡 **CONSIGNES** :
- Utilise Markdown pour structurer
- Sois pédagogique et clair
- Utilise des emojis pour faciliter la lecture
- Développe RÉELLEMENT chaque section (ne te contente pas de listes sommaires)
- Pour les formules : utilise la syntaxe LaTeX ($$ ... $$)
${detailLevel === 'exhaustif' ? '- SOIS EXHAUSTIF : Fournis un maximum de détails et d\'informations' : ''}
${detailLevel === 'standard' ? '- Équilibre entre concision et complétude' : ''}
${detailLevel === 'bref' ? '- Va droit à l\'essentiel, mais reste complet' : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 'Impossible de générer un résumé.';
    console.log('✅ Résumé généré');
    console.log(`📊 Longueur du résumé: ${summary.length} caractères`);
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
 * VERSION AMÉLIORÉE : Réponses plus détaillées et enrichies
 */
export async function sendChatMessage(
  message: string,
  context: DocumentContext,
  conversationHistory: ChatMessage[],
  options?: {
    useWebSearch?: boolean;  // Activer la recherche web (si disponible)
    detailLevel?: 'concis' | 'standard' | 'détaillé';  // Niveau de détail souhaité
  }
): Promise<string> {
  try {
    console.log('💬 ===== ENVOI MESSAGE CHAT (VERSION AMÉLIORÉE) =====');
    console.log('  - Message utilisateur:', message);
    console.log('  - Document ID:', context.documentId);
    console.log('  - Document Name:', context.documentName);
    console.log('  - Storage Path:', context.storagePath);
    console.log('  - Niveau de détail:', options?.detailLevel || 'détaillé');
    console.log('  - Recherche web:', options?.useWebSearch ? 'Activée' : 'Désactivée');
    
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

    // Déterminer le niveau de détail
    const detailLevel = options?.detailLevel || 'détaillé';
    const maxTokens = detailLevel === 'concis' ? 800 : detailLevel === 'standard' ? 1500 : 3000;
    
    // Utiliser plus de contexte du document pour des réponses plus riches
    const contextLength = detailLevel === 'concis' ? 3000 : detailLevel === 'standard' ? 5000 : 8000;

    // 🔍 Recherche web optionnelle (si activée)
    let webContext = '';
    if (options?.useWebSearch) {
      console.log('🌐 Recherche web activée...');
      try {
        // Utiliser le service de recherche web
        webContext = await searchWeb(message, context.documentName);
        console.log('✅ Recherche web terminée');
      } catch (error) {
        console.warn('⚠️ Recherche web échouée, utilisation du contexte document uniquement');
        // En cas d'erreur, utiliser le mode offline enrichment
        const { getOfflineEnrichment } = await import('./webSearch');
        webContext = getOfflineEnrichment();
      }
    }

    // Construire les messages pour OpenAI avec prompt amélioré
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert de haut niveau qui aide les étudiants à comprendre le document "${context.documentName}". 

📚 CONTEXTE DU DOCUMENT (${context.extractedText.length} caractères) :
${context.extractedText.slice(0, contextLength)}${context.extractedText.length > contextLength ? '...' : ''}

${webContext}

🎯 TES MISSIONS :
1. **Fournir des réponses DÉTAILLÉES et COMPLÈTES** - Ne te limite pas, développe tes explications
2. **Structurer tes réponses** avec des titres, listes et sections claires
3. **Donner des exemples concrets** et des applications pratiques
4. **Expliquer le "pourquoi"** et pas seulement le "quoi"
5. **Faire des liens** avec d'autres concepts connexes
6. **Citer des passages** du document quand pertinent
7. **Ajouter des notes complémentaires** pour approfondir

📝 RÈGLES DE FORMATAGE :
- Utilise Markdown pour structurer (titres ##, listes, **gras**, *italique*)
- Pour les formules mathématiques : $$ pour les équations en bloc et $ pour inline (LaTeX)
- Utilise des emojis pour rendre la lecture agréable 📖✨
- Ajoute des sections comme :
  - 💡 **Point Clé**
  - ⚠️ **Attention**
  - 📌 **À Retenir**
  - 🔍 **Approfondissement**
  - 💪 **Exercice Pratique**
  - 🌐 **Contexte Plus Large**

🎨 STYLE DE RÉPONSE (${detailLevel}) :
${detailLevel === 'concis' ? '- Réponse synthétique mais complète (800 tokens max)' : ''}
${detailLevel === 'standard' ? '- Réponse équilibrée avec détails et exemples (1500 tokens max)' : ''}
${detailLevel === 'détaillé' ? '- Réponse exhaustive avec explications approfondies, exemples multiples, contexte élargi (3000 tokens max)' : ''}

🌟 OBJECTIF : Rendre l'étudiant EXPERT sur le sujet abordé !`
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

    console.log('🤖 Appel à OpenAI en cours avec GPT-4o-mini (mode détaillé)...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modèle plus performant pour des réponses de qualité
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      frequency_penalty: 0.3, // Évite les répétitions
      presence_penalty: 0.3,  // Encourage la diversité du vocabulaire
    });

    const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
    console.log('✅ Réponse reçue de OpenAI:', response.slice(0, 100) + '...');
    console.log(`📊 Longueur de la réponse: ${response.length} caractères`);
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
