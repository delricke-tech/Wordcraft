/**
 * Service de Recherche Web pour Enrichir les Réponses IA
 * 
 * Ce service permet d'enrichir les réponses de l'IA avec des informations
 * du web en temps réel. Trois options sont supportées :
 * 
 * Option 1 : Tavily API (Recommandé) - Optimisé pour l'IA
 * Option 2 : Serper API (Alternative) - Google Search
 * Option 3 : Mode Offline - Sans recherche externe
 * 
 * Date: 31 décembre 2024
 */

// Types
export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  answer?: string; // Réponse synthétique (Tavily uniquement)
  totalResults: number;
}

/**
 * Option 1 : Recherche avec Tavily API (Recommandé)
 * 
 * Avantages :
 * - Spécialisé pour l'IA et les LLM
 * - Résultats optimisés et pertinents
 * - Réponse synthétique incluse
 * - 1000 requêtes gratuites/mois
 * 
 * Installation :
 * 1. npm install tavily
 * 2. Créer un compte sur https://tavily.com
 * 3. Ajouter VITE_TAVILY_API_KEY dans .env
 */
export async function searchWithTavily(query: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_TAVILY_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Clé Tavily non configurée dans .env');
      return '';
    }

    console.log('🌐 Recherche Tavily:', query);
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'advanced', // 'basic' ou 'advanced'
        max_results: 5,
        include_answer: true, // Réponse synthétique
        include_raw_content: false,
        include_images: false,
        include_domains: [], // Domaines à inclure (vide = tous)
        exclude_domains: [], // Domaines à exclure
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Tavily API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    
    // Formater les résultats pour le contexte IA
    let webContext = '\n\n🌐 **INFORMATIONS COMPLÉMENTAIRES DU WEB (Tavily)** :\n\n';
    
    // Ajouter la réponse synthétique si disponible
    if (data.answer) {
      webContext += `### 💡 Réponse Synthétique\n${data.answer}\n\n`;
    }
    
    // Ajouter les sources détaillées
    if (data.results && data.results.length > 0) {
      webContext += '### 📚 Sources Détaillées\n\n';
      data.results.forEach((result: any, index: number) => {
        webContext += `**${index + 1}. ${result.title}**\n`;
        webContext += `🔗 [${result.url}](${result.url})\n`;
        webContext += `${result.content}\n\n`;
      });
    }
    
    console.log('✅ Recherche Tavily terminée:', data.results?.length || 0, 'résultats');
    return webContext;
    
  } catch (error: any) {
    console.error('❌ Erreur recherche Tavily:', error);
    return '';
  }
}

/**
 * Option 2 : Recherche avec Serper API (Alternative)
 * 
 * Avantages :
 * - API Google Search
 * - Résultats de haute qualité
 * - 2500 requêtes gratuites/mois
 * 
 * Installation :
 * 1. Créer un compte sur https://serper.dev
 * 2. Ajouter VITE_SERPER_API_KEY dans .env
 */
export async function searchWithSerper(query: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_SERPER_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Clé Serper non configurée dans .env');
      return '';
    }

    console.log('🌐 Recherche Serper:', query);
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5, // Nombre de résultats (max 10)
        gl: 'fr', // Pays (fr = France)
        hl: 'fr', // Langue
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Serper API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Formater les résultats pour le contexte IA
    let webContext = '\n\n🌐 **RÉSULTATS DE RECHERCHE WEB (Google/Serper)** :\n\n';
    
    // Ajouter le Knowledge Graph si disponible
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      webContext += `### 📖 Définition (Knowledge Graph)\n`;
      webContext += `**${kg.title}**\n`;
      if (kg.description) {
        webContext += `${kg.description}\n\n`;
      }
    }
    
    // Ajouter les résultats organiques
    if (data.organic && data.organic.length > 0) {
      webContext += '### 🔍 Résultats de Recherche\n\n';
      data.organic.forEach((result: any, index: number) => {
        webContext += `**${index + 1}. ${result.title}**\n`;
        webContext += `🔗 [${result.link}](${result.link})\n`;
        webContext += `${result.snippet}\n\n`;
      });
    }
    
    console.log('✅ Recherche Serper terminée:', data.organic?.length || 0, 'résultats');
    return webContext;
    
  } catch (error: any) {
    console.error('❌ Erreur recherche Serper:', error);
    return '';
  }
}

/**
 * Option 3 : Mode Offline - Enrichissement sans API externe
 * 
 * Utilise uniquement les connaissances du modèle GPT-4
 * Pas besoin de clé API supplémentaire
 */
export function getOfflineEnrichment(): string {
  return `\n\n💡 **ENRICHISSEMENT AVEC CONNAISSANCES GÉNÉRALES** :

Tu as accès à tes connaissances générales (entraînées jusqu'en 2023). Utilise-les pour :

1. **Contextualiser** - Donner le contexte historique ou scientifique
2. **Élargir** - Faire des liens avec d'autres domaines
3. **Exemplifier** - Proposer des exemples concrets et applications réelles
4. **Approfondir** - Suggérer des ressources ou sujets connexes à explorer

⚠️ **Important** : Précise toujours quand tu utilises tes connaissances générales vs le contenu du document fourni.`;
}

/**
 * Fonction principale : Recherche Web Intelligente
 * 
 * Essaie d'abord Tavily, puis Serper en fallback, puis mode offline
 */
export async function searchWeb(query: string, documentName: string = ''): Promise<string> {
  console.log('🌐 ===== RECHERCHE WEB INTELLIGENTE =====');
  console.log('  - Query:', query);
  console.log('  - Document:', documentName);

  // Créer une requête optimisée pour la recherche
  const optimizedQuery = documentName 
    ? `${query} ${documentName}` 
    : query;

  // Essayer Tavily en priorité
  if (import.meta.env.VITE_TAVILY_API_KEY) {
    console.log('🎯 Tentative avec Tavily API...');
    const result = await searchWithTavily(optimizedQuery);
    if (result) {
      console.log('✅ Recherche Tavily réussie');
      return result;
    }
  }

  // Essayer Serper en fallback
  if (import.meta.env.VITE_SERPER_API_KEY) {
    console.log('🎯 Tentative avec Serper API...');
    const result = await searchWithSerper(optimizedQuery);
    if (result) {
      console.log('✅ Recherche Serper réussie');
      return result;
    }
  }

  // Mode offline par défaut
  console.log('📚 Mode offline - Utilisation des connaissances du modèle');
  return getOfflineEnrichment();
}

/**
 * Extraire des mots-clés pertinents d'une question pour la recherche
 */
export function extractSearchKeywords(question: string, documentName: string): string {
  // Supprimer les mots de liaison courants
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais',
    'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'comment', 'pourquoi',
    'quand', 'où', 'quel', 'quelle', 'quels', 'quelles', 'dans', 'sur',
    'est', 'sont', 'a', 'ont', 'c\'est', 'ce', 'ces', 'cet', 'cette',
    'peux', 'peut', 'tu', 'me', 'moi', 'explique', 'donne', 'fais'
  ];
  
  const words = question.toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !stopWords.includes(word) &&
      !/^[?!.,;:]$/.test(word)
    );
  
  // Ajouter le nom du document
  const keywords = [...words, ...documentName.toLowerCase().split(/\s+/)];
  
  // Retourner une requête optimisée (max 10 mots)
  return keywords.slice(0, 10).join(' ');
}

// Export par défaut
export default {
  searchWeb,
  searchWithTavily,
  searchWithSerper,
  getOfflineEnrichment,
  extractSearchKeywords
};
