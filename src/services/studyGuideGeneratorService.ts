/**
 * Service de génération de guides d'étude structurés par IA
 * Crée des plans d'étude personnalisés avec objectifs, ressources et évaluation
 * 
 * Date: 10 mars 2026
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

// Types
export interface StudyGuide {
  id: string;
  documentId: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: number; // Heures
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  objectives: string[];
  structure: StudySection[];
  resources: StudyResource[];
  assessments: StudyAssessment[];
  schedule: StudySchedule;
  metadata: {
    generatedAt: string;
    wordCount: number;
    sectionCount: number;
    resourceCount: number;
    assessmentCount: number;
    confidence: number;
  };
}

export interface StudySection {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedTime: number; // Minutes
  objectives: string[];
  keyPoints: string[];
  activities: StudyActivity[];
  resources: string[]; // IDs des ressources
  assessment: string; // ID de l'évaluation
}

export interface StudyActivity {
  id: string;
  type: 'reading' | 'exercise' | 'discussion' | 'practice' | 'reflection';
  title: string;
  description: string;
  estimatedTime: number; // Minutes
  instructions: string[];
  materials?: string[];
}

export interface StudyResource {
  id: string;
  type: 'internal' | 'external' | 'video' | 'article' | 'book' | 'tool';
  title: string;
  description: string;
  url?: string;
  content?: string;
  relevance: number; // 0-1
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface StudyAssessment {
  id: string;
  type: 'quiz' | 'exercise' | 'project' | 'presentation' | 'self-assessment';
  title: string;
  description: string;
  questions?: AssessmentQuestion[];
  criteria?: string[];
  passingScore?: number;
  timeLimit?: number; // Minutes
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface StudySchedule {
  type: 'flexible' | 'structured' | 'intensive';
  sessions: StudySession[];
  totalDuration: number; // Heures
  recommendedPace: string;
}

export interface StudySession {
  day: number;
  title: string;
  sections: string[]; // IDs des sections
  activities: string[]; // IDs des activités
  estimatedTime: number; // Minutes
  objectives: string[];
}

export interface StudyGuideGenerationOptions {
  targetAudience?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // Heures souhaitées
  includeAssessments?: boolean;
  includeResources?: boolean;
  scheduleType?: 'flexible' | 'structured' | 'intensive';
  language?: 'fr' | 'en';
  focusAreas?: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
}

export interface StudyGuideGenerationResult {
  guide: StudyGuide;
  statistics: {
    processingTime: number;
    confidence: number;
    coverage: number; // % du document couvert
    completeness: number; // 0-1
  };
}

// Client OpenAI
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé OpenAI manquante pour la génération de guides d\'étude');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

/**
 * Génère un guide d'étude complet à partir d'un document
 */
export async function generateStudyGuideFromDocument(
  documentId: string,
  documentText: string,
  documentTitle: string,
  options: StudyGuideGenerationOptions = {}
): Promise<StudyGuideGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log('📚 ===== GÉNÉRATION GUIDE D\'ÉTUDE =====');
    console.log('  - Document:', documentTitle);
    console.log('  - Document ID:', documentId);
    console.log('  - Options:', options);

    const openai = getOpenAIClient();
    
    // Options par défaut
    const {
      targetAudience = 'Étudiants et professionnels',
      difficulty = 'intermediate',
      duration = 10, // 10 heures par défaut
      includeAssessments = true,
      includeResources = true,
      scheduleType = 'flexible',
      language = 'fr',
      focusAreas = [],
      learningStyle = 'mixed'
    } = options;

    // Limiter le texte pour l'API
    const maxTextLength = 20000;
    const truncatedText = documentText.slice(0, maxTextLength);
    
    console.log(`  - Texte tronqué: ${truncatedText.length} caractères`);

    // Construire les prompts
    const systemPrompt = buildStudyGuideSystemPrompt(options);
    const userPrompt = buildStudyGuideUserPrompt(
      documentTitle,
      truncatedText,
      options
    );

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Pas de réponse de OpenAI');
    }

    // Parser la réponse JSON
    let guideData;
    try {
      guideData = JSON.parse(responseContent);
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new Error('Réponse OpenAI invalide');
    }

    // Traiter et structurer le guide
    const processedGuide = processStudyGuideData(
      guideData,
      documentId,
      documentTitle,
      options
    );

    // Calculer les statistiques
    const processingTime = Date.now() - startTime;
    const statistics = calculateGuideStatistics(
      processedGuide,
      processingTime,
      documentText.length
    );

    console.log(`✅ Guide d'étude généré en ${processingTime}ms`);
    console.log(`  - Sections: ${processedGuide.structure.length}`);
    console.log(`  - Durée: ${processedGuide.estimatedDuration}h`);
    console.log(`  - Objectifs: ${processedGuide.objectives.length}`);

    return {
      guide: processedGuide,
      statistics
    };

  } catch (error) {
    console.error('💥 Erreur génération guide d\'étude:', error);
    throw new Error(`Échec de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Construit le prompt système pour la génération de guides d'étude
 */
function buildStudyGuideSystemPrompt(options: StudyGuideGenerationOptions): string {
  const { difficulty, language, learningStyle, scheduleType } = options;
  
  return `Tu es un expert en pédagogie et en conception de programmes d'étude. 

TON OBJECTIF :
Créer un guide d'étude structuré et efficace qui permette aux apprenants de maîtriser le contenu du document de manière progressive et complète.

PRINCIPES PÉDAGOGIQUES :
- Structurer l'apprentissage en séquences logiques
- Définir des objectifs clairs et mesurables
- Varier les types d'activités pour maintenir l'engagement
- Inclure des évaluations formatives et sommatives
- Adapter le rythme et la complexité au niveau visé
- Proposer des ressources complémentaires pertinentes

NIVEAU DE DIFFICULTÉ (${difficulty}) :
${difficulty === 'beginner' ? '- Approche progressive avec beaucoup de soutien et d\'explications' : ''}
${difficulty === 'intermediate' ? '- Équilibre entre théorie et pratique avec autonomie modérée' : ''}
${difficulty === 'advanced' ? '- Approche analytique avec autonomie et approfondissement' : ''}

STYLE D'APPRENTISSAGE (${learningStyle}) :
${learningStyle === 'visual' ? '- Privilégier les schémas, graphiques et représentations visuelles' : ''}
${learningStyle === 'auditory' ? '- Inclure des discussions, explications orales et podcasts' : ''}
${learningStyle === 'kinesthetic' ? '- Mettre l\'accent sur les exercices pratiques et applications concrètes' : ''}
${learningStyle === 'reading' ? '- Favoriser les lectures structurées et documentation écrite' : ''}
${learningStyle === 'mixed' ? '- Équilibrer tous les types d\'activités pour tous les styles' : ''}

FORMAT DE SORTIE OBLIGATOIRE :
{
  "title": "Titre attractif du guide d'étude",
  "description": "Description brève et engageante du guide",
  "targetAudience": "Public cible",
  "estimatedDuration": 10,
  "objectives": ["Objectif 1", "Objectif 2", "Objectif 3"],
  "structure": [
    {
      "title": "Titre de la section",
      "description": "Description de la section",
      "estimatedTime": 90,
      "objectives": ["Objectif section 1", "Objectif section 2"],
      "keyPoints": ["Point clé 1", "Point clé 2", "Point clé 3"],
      "activities": [
        {
          "type": "reading|exercise|discussion|practice|reflection",
          "title": "Titre de l'activité",
          "description": "Description de l'activité",
          "estimatedTime": 30,
          "instructions": ["Instruction 1", "Instruction 2"]
        }
      ]
    }
  ],
  "resources": [
    {
      "type": "internal|external|video|article|book|tool",
      "title": "Titre de la ressource",
      "description": "Description de la ressource",
      "url": "URL si externe",
      "relevance": 0.9,
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "assessments": [
    {
      "type": "quiz|exercise|project|presentation|self-assessment",
      "title": "Titre de l'évaluation",
      "description": "Description de l'évaluation",
      "questions": [
        {
          "type": "multiple-choice|true-false|short-answer|essay",
          "question": "Question",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Réponse correcte",
          "points": 5
        }
      ],
      "passingScore": 70,
      "timeLimit": 30
    }
  ]
}

LANGUE : ${language === 'fr' ? 'Français' : 'Anglais'}
SCHEDULE : ${scheduleType === 'flexible' ? 'Flexible et adaptable' : scheduleType === 'structured' ? 'Structuré avec sessions fixes' : 'Intensif et accéléré'}

RÈGLES QUALITÉ :
- Chaque section doit avoir des objectifs clairs
- Les activités doivent être variées et engageantes
- Les évaluations doivent tester les compétences clés
- Les ressources doivent être pertinentes et accessibles
- La durée totale doit être réaliste et atteignable`;
}

/**
 * Construit le prompt utilisateur pour la génération
 */
function buildStudyGuideUserPrompt(
  documentTitle: string,
  documentText: string,
  options: StudyGuideGenerationOptions
): string {
  const { duration, targetAudience, focusAreas } = options;
  
  let prompt = `DOCUMENT : "${documentTitle}"

CONTEXTE :
Crée un guide d'étude complet et structuré basé sur ce document.

PUBLIC CIBLE : ${targetAudience}
DURÉE SOUHAITÉE : ${duration} heures

TEXTE À ANALYSER :
${documentText}

INSTRUCTIONS SPÉCIFIques :`;

  if (focusAreas && focusAreas.length > 0) {
    prompt += `\n- Zones de focus prioritaires : ${focusAreas.join(', ')}`;
  }

  prompt += `

CONSEILS PÉDAGOGIQUES :
- Identifie les concepts fondamentaux qui doivent être maîtrisés
- Structure l'apprentissage de manière progressive (simple → complexe)
- Inclut des activités pratiques pour appliquer les connaissances
- Prévois des points de contrôle réguliers pour évaluer la progression
- Suggère des ressources complémentaires pour approfondir

Génère maintenant le guide d'étude complet au format JSON requis.`;

  return prompt;
}

/**
 * Traite et structure les données du guide d'étude
 */
function processStudyGuideData(
  guideData: any,
  documentId: string,
  documentTitle: string,
  options: StudyGuideGenerationOptions
): StudyGuide {
  const { difficulty, scheduleType, language } = options;
  
  // Générer les sections
  const structure = (guideData.structure || []).map((section: any, index: number) => ({
    id: `section_${index + 1}`,
    title: section.title || `Section ${index + 1}`,
    description: section.description || '',
    order: index + 1,
    estimatedTime: section.estimatedTime || 60,
    objectives: Array.isArray(section.objectives) ? section.objectives : [],
    keyPoints: Array.isArray(section.keyPoints) ? section.keyPoints : [],
    activities: (section.activities || []).map((activity: any, actIndex: number) => ({
      id: `activity_${index}_${actIndex}`,
      type: validateActivityType(activity.type),
      title: activity.title || 'Activité',
      description: activity.description || '',
      estimatedTime: activity.estimatedTime || 30,
      instructions: Array.isArray(activity.instructions) ? activity.instructions : [],
      materials: activity.materials || []
    })),
    resources: [],
    assessment: ''
  }));

  // Générer les ressources
  const resources = (guideData.resources || []).map((resource: any, index: number) => ({
    id: `resource_${index + 1}`,
    type: validateResourceType(resource.type),
    title: resource.title || 'Ressource',
    description: resource.description || '',
    url: resource.url,
    content: resource.content,
    relevance: Math.max(0.1, Math.min(1, Number(resource.relevance) || 0.8)),
    difficulty: validateDifficulty(resource.difficulty)
  }));

  // Générer les évaluations
  const assessments = (guideData.assessments || []).map((assessment: any, index: number) => ({
    id: `assessment_${index + 1}`,
    type: validateAssessmentType(assessment.type),
    title: assessment.title || 'Évaluation',
    description: assessment.description || '',
    questions: (assessment.questions || []).map((question: any, qIndex: number) => ({
      id: `question_${index}_${qIndex}`,
      type: validateQuestionType(question.type),
      question: question.question || '',
      options: Array.isArray(question.options) ? question.options : [],
      correctAnswer: question.correctAnswer,
      points: Number(question.points) || 5
    })),
    criteria: Array.isArray(assessment.criteria) ? assessment.criteria : [],
    passingScore: Number(assessment.passingScore) || 70,
    timeLimit: Number(assessment.timeLimit)
  }));

  // Générer l'emploi du temps
  const schedule = generateStudySchedule(structure, scheduleType);

  return {
    id: `guide_${documentId}_${Date.now()}`,
    documentId,
    title: guideData.title || `Guide d'étude : ${documentTitle}`,
    description: guideData.description || `Guide d'étude basé sur ${documentTitle}`,
    targetAudience: guideData.targetAudience || 'Étudiants',
    estimatedDuration: Number(guideData.estimatedDuration) || 10,
    difficulty: difficulty || 'intermediate',
    language: language || 'fr',
    objectives: Array.isArray(guideData.objectives) ? guideData.objectives : [],
    structure,
    resources,
    assessments,
    schedule,
    metadata: {
      generatedAt: new Date().toISOString(),
      wordCount: JSON.stringify(guideData).length,
      sectionCount: structure.length,
      resourceCount: resources.length,
      assessmentCount: assessments.length,
      confidence: 0.85
    }
  };
}

/**
 * Génère un emploi du temps d'étude
 */
function generateStudySchedule(
  sections: StudySection[],
  scheduleType: StudySchedule['type']
): StudySchedule {
  const sessions: StudySession[] = [];
  let totalDuration = 0;

  switch (scheduleType) {
    case 'structured':
      // Emploi du temps structuré : 1-2 sections par session
      let day = 1;
      for (let i = 0; i < sections.length; i += 2) {
        const sessionSections = sections.slice(i, i + 2);
        const sessionTime = sessionSections.reduce((sum, s) => sum + s.estimatedTime, 0);
        
        sessions.push({
          day,
          title: `Session ${day}`,
          sections: sessionSections.map(s => s.id),
          activities: [],
          estimatedTime: sessionTime,
          objectives: sessionSections.flatMap(s => s.objectives).slice(0, 3)
        });
        
        totalDuration += sessionTime;
        day++;
      }
      break;

    case 'intensive':
      // Emploi du temps intensif : tout en peu de sessions
      const sectionsPerSession = Math.ceil(sections.length / 3);
      for (let i = 0; i < sections.length; i += sectionsPerSession) {
        const sessionSections = sections.slice(i, i + sectionsPerSession);
        const sessionTime = sessionSections.reduce((sum, s) => sum + s.estimatedTime, 0);
        
        sessions.push({
          day: Math.floor(i / sectionsPerSession) + 1,
          title: `Session intensive ${Math.floor(i / sectionsPerSession) + 1}`,
          sections: sessionSections.map(s => s.id),
          activities: [],
          estimatedTime: sessionTime,
          objectives: sessionSections.flatMap(s => s.objectives).slice(0, 5)
        });
        
        totalDuration += sessionTime;
      }
      break;

    default: // flexible
      // Emploi du temps flexible : une section par session
      sections.forEach((section, index) => {
        sessions.push({
          day: index + 1,
          title: section.title,
          sections: [section.id],
          activities: section.activities.map(a => a.id),
          estimatedTime: section.estimatedTime,
          objectives: section.objectives.slice(0, 2)
        });
        
        totalDuration += section.estimatedTime;
      });
  }

  return {
    type: scheduleType,
    sessions,
    totalDuration: Math.round(totalDuration / 60), // Convertir en heures
    recommendedPace: scheduleType === 'intensive' ? 'Accéléré' : scheduleType === 'structured' ? 'Régulier' : 'Flexible'
  };
}

/**
 * Fonctions de validation
 */
function validateActivityType(type: any): StudyActivity['type'] {
  const validTypes: StudyActivity['type'][] = ['reading', 'exercise', 'discussion', 'practice', 'reflection'];
  return validTypes.includes(type) ? type : 'reading';
}

function validateResourceType(type: any): StudyResource['type'] {
  const validTypes: StudyResource['type'][] = ['internal', 'external', 'video', 'article', 'book', 'tool'];
  return validTypes.includes(type) ? type : 'internal';
}

function validateAssessmentType(type: any): StudyAssessment['type'] {
  const validTypes: StudyAssessment['type'][] = ['quiz', 'exercise', 'project', 'presentation', 'self-assessment'];
  return validTypes.includes(type) ? type : 'quiz';
}

function validateQuestionType(type: any): AssessmentQuestion['type'] {
  const validTypes: AssessmentQuestion['type'][] = ['multiple-choice', 'true-false', 'short-answer', 'essay'];
  return validTypes.includes(type) ? type : 'multiple-choice';
}

function validateDifficulty(difficulty: any): StudyResource['difficulty'] {
  const validDifficulties: StudyResource['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
  return validDifficulties.includes(difficulty) ? difficulty : 'intermediate';
}

/**
 * Calcule les statistiques du guide
 */
function calculateGuideStatistics(
  guide: StudyGuide,
  processingTime: number,
  documentLength: number
): StudyGuideGenerationResult['statistics'] {
  const confidence = guide.metadata.confidence;
  const coverage = Math.min(1, (guide.structure.length * 2000) / documentLength);
  const completeness = Math.min(1, 
    (guide.objectives.length * 0.3 + 
     guide.structure.length * 0.4 + 
     guide.resources.length * 0.2 + 
     guide.assessments.length * 0.1) / 10
  );

  return {
    processingTime,
    confidence,
    coverage,
    completeness
  };
}

/**
 * Sauvegarde le guide d'étude dans Supabase
 */
export async function saveStudyGuideToDatabase(guide: StudyGuide): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('study_guides')
      .insert({
        id: guide.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        document_id: guide.documentId,
        title: guide.title,
        description: guide.description,
        target_audience: guide.targetAudience,
        estimated_duration: guide.estimatedDuration,
        difficulty: guide.difficulty,
        language: guide.language,
        objectives: guide.objectives,
        structure: guide.structure,
        resources: guide.resources,
        assessments: guide.assessments,
        schedule: guide.schedule,
        metadata: guide.metadata,
        created_at: guide.metadata.generatedAt
      });

    if (error) {
      throw error;
    }

    console.log(`💾 Guide d'étude sauvegardé: ${guide.id}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde guide:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Formate le guide d'étude pour l'affichage
 */
export function formatStudyGuideForDisplay(
  guide: StudyGuide,
  options: {
    includeSchedule?: boolean;
    includeResources?: boolean;
    includeAssessments?: boolean;
    compact?: boolean;
  } = {}
): string {
  const {
    includeSchedule = true,
    includeResources = true,
    includeAssessments = true,
    compact = false
  } = options;

  let formattedText = `# ${guide.title}\n\n`;
  
  formattedText += `📚 **Guide d'étude structuré**\n\n`;
  formattedText += `**Description :** ${guide.description}\n`;
  formattedText += `**Public cible :** ${guide.targetAudience}\n`;
  formattedText += `**Durée estimée :** ${guide.estimatedDuration} heures\n`;
  formattedText += `**Difficulté :** ${guide.difficulty}\n`;
  formattedText += `**Langue :** ${guide.language}\n\n`;

  // Objectifs
  formattedText += `## 🎯 Objectifs d'apprentissage\n\n`;
  guide.objectives.forEach((objective, index) => {
    formattedText += `${index + 1}. ${objective}\n`;
  });
  formattedText += '\n';

  // Structure du guide
  formattedText += `## 📋 Structure du guide\n\n`;
  guide.structure.forEach((section, index) => {
    formattedText += `### ${index + 1}. ${section.title}\n\n`;
    formattedText += `**Description :** ${section.description}\n`;
    formattedText += `**Durée :** ${section.estimatedTime} minutes\n\n`;
    
    if (section.objectives.length > 0) {
      formattedText += `**Objectifs :**\n`;
      section.objectives.forEach(obj => formattedText += `- ${obj}\n`);
      formattedText += '\n';
    }
    
    if (section.keyPoints.length > 0) {
      formattedText += `**Points clés :**\n`;
      section.keyPoints.forEach(point => formattedText += `- ${point}\n`);
      formattedText += '\n';
    }
    
    if (!compact && section.activities.length > 0) {
      formattedText += `**Activités :**\n`;
      section.activities.forEach(activity => {
        formattedText += `- **${activity.title}** (${activity.type}, ${activity.estimatedTime}min)\n`;
        formattedText += `  ${activity.description}\n`;
      });
      formattedText += '\n';
    }
  });

  // Emploi du temps
  if (includeSchedule && guide.schedule.sessions.length > 0) {
    formattedText += `## 📅 Emploi du temps (${guide.schedule.recommendedPace})\n\n`;
    guide.schedule.sessions.forEach(session => {
      formattedText += `**Jour ${session.day} :** ${session.title}\n`;
      formattedText += `- Durée : ${session.estimatedTime} minutes\n`;
      formattedText += `- Objectifs : ${session.objectives.slice(0, 2).join(', ')}\n\n`;
    });
  }

  // Ressources
  if (includeResources && guide.resources.length > 0) {
    formattedText += `## 📚 Ressources complémentaires\n\n`;
    guide.resources.forEach((resource, index) => {
      formattedText += `### ${index + 1}. ${resource.title}\n`;
      formattedText += `**Type :** ${resource.type}\n`;
      formattedText += `**Description :** ${resource.description}\n`;
      formattedText += `**Difficulté :** ${resource.difficulty}\n`;
      formattedText += `**Pertinence :** ${(resource.relevance * 100).toFixed(1)}%\n`;
      if (resource.url) formattedText += `**URL :** ${resource.url}\n`;
      formattedText += '\n';
    });
  }

  // Évaluations
  if (includeAssessments && guide.assessments.length > 0) {
    formattedText += `## 📝 Évaluations\n\n`;
    guide.assessments.forEach((assessment, index) => {
      formattedText += `### ${index + 1}. ${assessment.title}\n`;
      formattedText += `**Type :** ${assessment.type}\n`;
      formattedText += `**Description :** ${assessment.description}\n`;
      if (assessment.passingScore) formattedText += `**Score de passage :** ${assessment.passingScore}%\n`;
      if (assessment.timeLimit) formattedText += `**Limite de temps :** ${assessment.timeLimit} minutes\n`;
      
      if (!compact && assessment.questions && assessment.questions.length > 0) {
        formattedText += `**Questions :**\n`;
        assessment.questions.slice(0, 3).forEach((question, qIndex) => {
          formattedText += `${qIndex + 1}. ${question.question}\n`;
        });
        if (assessment.questions.length > 3) {
          formattedText += `... et ${assessment.questions.length - 3} autres questions\n`;
        }
      }
      formattedText += '\n';
    });
  }

  // Métadonnées
  formattedText += `---\n`;
  formattedText += `*Guide généré le ${new Date(guide.metadata.generatedAt).toLocaleDateString()}* | `;
  formattedText += `*Confiance : ${(guide.metadata.confidence * 100).toFixed(1)}%*`;

  return formattedText;
}
