/**
 * Service pour la génération de guides d'étude structurés
 * Utilise l'IA pour créer des guides d'apprentissage organisés
 */

import { getOpenAIClient } from './openaiService';

export interface StudyGuideSection {
  title: string;
  content: string;
  keyPoints: string[];
  examples?: string[];
  exercises?: string[];
  estimatedTime: number; // en minutes
}

export interface StudyGuide {
  id: string;
  title: string;
  description: string;
  difficulty: 'débutant' | 'intermédiaire' | 'avancé';
  estimatedDuration: number; // en minutes
  sections: StudyGuideSection[];
  summary: string;
  prerequisites?: string[];
  learningObjectives: string[];
  resources: string[];
  createdAt: string;
}

export interface StudyGuideOptions {
  difficulty?: 'débutant' | 'intermédiaire' | 'avancé';
  includeExercises?: boolean;
  includeExamples?: boolean;
  maxSections?: number;
  targetDuration?: number; // en minutes
  focusAreas?: string[]; // domaines à privilégier
}

/**
 * Génère un guide d'étude structuré à partir d'un contenu
 */
export async function generateStudyGuide(
  content: string,
  documentTitle: string,
  options: StudyGuideOptions = {}
): Promise<StudyGuide> {
  const {
    difficulty = 'intermédiaire',
    includeExercises = true,
    includeExamples = true,
    maxSections = 5,
    targetDuration = 60,
    focusAreas = []
  } = options;

  try {
    console.log('📚 Génération du guide d\'étude...');
    console.log(`  - Document: ${documentTitle}`);
    console.log(`  - Difficulté: ${difficulty}`);
    console.log(`  - Durée cible: ${targetDuration} minutes`);
    console.log(`  - Sections: ${maxSections}`);

    const openai = getOpenAIClient();

    const systemPrompt = `Tu es un expert en pédagogie et en conception de guides d'étude. Ta mission est de créer un guide d'étude structuré et efficace à partir du contenu fourni.

CONSIGNES IMPORTANTES :
1. Structure le guide en sections logiques et progressives
2. Adapte le contenu au niveau de difficulté spécifié
3. Inclus des points clés, exemples et exercices si demandé
4. Estime le temps d'apprentissage pour chaque section
5. Crée des objectifs d'apprentissage clairs et mesurables

FORMAT DE SORTIE OBLIGATOIRE (JSON) :
{
  "title": "Titre du guide",
  "description": "Description brève du guide",
  "difficulty": "débutant|intermédiaire|avancé",
  "estimatedDuration": temps_total_en_minutes,
  "prerequisites": ["prérequis1", "prérequis2"],
  "learningObjectives": ["objectif1", "objectif2", "objectif3"],
  "sections": [
    {
      "title": "Titre de la section",
      "content": "Contenu détaillé de la section",
      "keyPoints": ["point1", "point2", "point3"],
      "examples": ["exemple1", "exemple2"],
      "exercises": ["exercice1", "exercice2"],
      "estimatedTime": temps_en_minutes
    }
  ],
  "summary": "Résumé du guide",
  "resources": ["ressource1", "ressource2"]
}

NIVEAUX DE DIFFICULTÉ :
- débutant: vocabulaire simple, concepts de base, exemples très concrets
- intermédiaire: concepts plus complexes, quelques abstractions, exemples variés
- avancé: concepts abstraits, terminologie spécialisée, analyse critique

IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans aucun texte avant ou après.`;

    const userPrompt = `Génère un guide d'étude structuré à partir du contenu suivant :

TITRE DU DOCUMENT : ${documentTitle}
CONTENU :
${content.substring(0, 8000)} ${content.length > 8000 ? '\\n\\n[Contenu tronqué pour traitement...]': ''}

OPTIONS :
- Niveau de difficulté : ${difficulty}
- Durée cible : ${targetDuration} minutes
- Nombre maximum de sections : ${maxSections}
- Inclure des exemples : ${includeExamples ? 'oui' : 'non'}
- Inclure des exercices : ${includeExercises ? 'oui' : 'non'}
${focusAreas.length > 0 ? `- Domaines à privilégier : ${focusAreas.join(', ')}` : ''}

Génère le guide d'étude en suivant le format JSON spécifié.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Pas de réponse de l\'IA pour la génération du guide');
    }

    // Extraire le JSON de la réponse
    let studyGuideData: StudyGuide;
    try {
      // Nettoyer la réponse pour extraire le JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        studyGuideData = JSON.parse(jsonMatch[0]);
      } else {
        studyGuideData = JSON.parse(responseContent);
      }
    } catch (parseError: any) {
      console.error('Erreur parsing JSON:', parseError);
      throw new Error('Format de réponse invalide pour le guide d\'étude');
    }

    // Valider et enrichir le guide
    const studyGuide: StudyGuide = {
      id: `guide_${Date.now()}`,
      title: studyGuideData.title || `Guide d'étude - ${documentTitle}`,
      description: studyGuideData.description || 'Guide d\'étude généré par IA',
      difficulty: studyGuideData.difficulty || difficulty,
      estimatedDuration: studyGuideData.estimatedDuration || targetDuration,
      sections: (studyGuideData.sections || []).slice(0, maxSections).map(section => ({
        ...section,
        estimatedTime: section.estimatedTime || Math.ceil(targetDuration / maxSections)
      })),
      summary: studyGuideData.summary || 'Résumé du guide d\'étude',
      prerequisites: studyGuideData.prerequisites || [],
      learningObjectives: studyGuideData.learningObjectives || [],
      resources: studyGuideData.resources || [],
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Guide d'étude généré: ${studyGuide.sections.length} sections`);
    return studyGuide;

  } catch (error: any) {
    console.error('❌ Erreur génération guide d\'étude:', error);
    throw new Error(`Échec de la génération du guide: ${error.message}`);
  }
}

/**
 * Génère un guide d'étude rapide (version simplifiée)
 */
export async function generateQuickStudyGuide(
  content: string,
  documentTitle: string
): Promise<StudyGuide> {
  return generateStudyGuide(content, documentTitle, {
    difficulty: 'intermédiaire',
    includeExercises: false,
    includeExamples: true,
    maxSections: 3,
    targetDuration: 30
  });
}

/**
 * Génère un guide d'étude avancé (version complète)
 */
export async function generateAdvancedStudyGuide(
  content: string,
  documentTitle: string
): Promise<StudyGuide> {
  return generateStudyGuide(content, documentTitle, {
    difficulty: 'avancé',
    includeExercises: true,
    includeExamples: true,
    maxSections: 8,
    targetDuration: 120
  });
}

/**
 * Formate un guide d'étude pour l'affichage
 */
export function formatStudyGuideForDisplay(guide: StudyGuide): string {
  let formatted = `# ${guide.title}\n\n`;
  formatted += `**${guide.description}**\n\n`;
  formatted += `**Niveau :** ${guide.difficulty}\n`;
  formatted += `**Durée estimée :** ${guide.estimatedDuration} minutes\n\n`;

  if (guide.prerequisites && guide.prerequisites.length > 0) {
    formatted += `**Prérequis :**\n`;
    guide.prerequisites.forEach(prereq => {
      formatted += `- ${prereq}\n`;
    });
    formatted += '\n';
  }

  if (guide.learningObjectives && guide.learningObjectives.length > 0) {
    formatted += `**Objectifs d'apprentissage :**\n`;
    guide.learningObjectives.forEach((objective, index) => {
      formatted += `${index + 1}. ${objective}\n`;
    });
    formatted += '\n';
  }

  formatted += '## Sections\n\n';
  guide.sections.forEach((section, index) => {
    formatted += `### ${index + 1}. ${section.title} (${section.estimatedTime} min)\n\n`;
    formatted += `${section.content}\n\n`;

    if (section.keyPoints.length > 0) {
      formatted += '**Points clés :**\n';
      section.keyPoints.forEach(point => {
        formatted += `- ${point}\n`;
      });
      formatted += '\n';
    }

    if (section.examples && section.examples.length > 0) {
      formatted += '**Exemples :**\n';
      section.examples.forEach(example => {
        formatted += `- ${example}\n`;
      });
      formatted += '\n';
    }

    if (section.exercises && section.exercises.length > 0) {
      formatted += '**Exercices :**\n';
      section.exercises.forEach(exercise => {
        formatted += `- ${exercise}\n`;
      });
      formatted += '\n';
    }
  });

  formatted += '## Résumé\n\n';
  formatted += `${guide.summary}\n\n`;

  if (guide.resources.length > 0) {
    formatted += '## Ressources additionnelles\n\n';
    guide.resources.forEach(resource => {
      formatted += `- ${resource}\n`;
    });
  }

  return formatted;
}
