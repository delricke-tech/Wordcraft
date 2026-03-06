/**
 * Composant de génération de contenu IA avancé
 * Permet de générer des résumés, fiches de révision et quiz
 * 
 * Date: 6 mars 2025
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Brain, 
  Hash, 
  HelpCircle, 
  Download,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateDocumentSummary, 
  generateFlashCards, 
  generateQuiz,
  type SummaryOptions,
  type FlashCardOptions,
  type QuizOptions,
  type GeneratedSummary,
  type GeneratedFlashCards,
  type GeneratedQuiz
} from '../services/contentGenerationService';

interface ContentGeneratorProps {
  documentId: string;
  documentName: string;
  documentContent: string;
  onGenerated?: (type: 'summary' | 'flashcards' | 'quiz', content: any) => void;
}

export function ContentGenerator({ 
  documentId, 
  documentName, 
  documentContent, 
  onGenerated 
}: ContentGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz'>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    summary?: GeneratedSummary;
    flashcards?: GeneratedFlashCards;
    quiz?: GeneratedQuiz;
  }>({});

  // Options pour chaque type de contenu
  const [summaryOptions, setSummaryOptions] = useState<SummaryOptions>({
    type: 'global',
    detailLevel: 'standard',
    language: 'fr',
    includeExamples: true
  });

  const [flashcardOptions, setFlashcardOptions] = useState<FlashCardOptions>({
    count: 10,
    difficulty: 'moyen',
    categories: ['Général'],
    includeExamples: true,
    format: 'qa'
  });

  const [quizOptions, setQuizOptions] = useState<QuizOptions>({
    type: 'mixte',
    questionCount: 10,
    difficulty: 'moyen',
    includeExplanations: true
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateDocumentSummary(
        documentContent,
        documentId,
        documentName,
        summaryOptions
      );
      
      setGeneratedContent(prev => ({ ...prev, summary }));
      onGenerated?.('summary', summary);
      
      toast.success('Résumé généré !', {
        description: `${summary.metadata.wordCount} mots, ${summary.metadata.readingTime} min de lecture`
      });
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFlashCards = async () => {
    setIsGenerating(true);
    try {
      const flashcards = await generateFlashCards(
        documentContent,
        documentId,
        documentName,
        flashcardOptions
      );
      
      setGeneratedContent(prev => ({ ...prev, flashcards }));
      onGenerated?.('flashcards', flashcards);
      
      toast.success('Flashcards générées !', {
        description: `${flashcards.metadata.totalCount} cartes créées`
      });
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const quiz = await generateQuiz(
        documentContent,
        documentId,
        documentName,
        quizOptions
      );
      
      setGeneratedContent(prev => ({ ...prev, quiz }));
      onGenerated?.('quiz', quiz);
      
      toast.success('Quiz généré !', {
        description: `${quiz.metadata.totalQuestions} questions, ${quiz.metadata.totalPoints} points`
      });
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (type: 'summary' | 'flashcards' | 'quiz') => {
    const content = generatedContent[type];
    if (!content) return;

    let exportText = '';
    let filename = '';
    let mimeType = 'text/plain';

    switch (type) {
      case 'summary':
        const summary = content as GeneratedSummary;
        exportText = `# Résumé - ${documentName}\n\n${summary.content}\n\n---\nGénéré le ${new Date(summary.metadata.generatedAt).toLocaleString('fr-FR')}`;
        filename = `resume_${documentName}.md`;
        mimeType = 'text/markdown';
        break;
      case 'flashcards':
        const flashcards = content as GeneratedFlashCards;
        exportText = `# Flashcards - ${documentName}\n\n${flashcards.cards.map((card: any, index: number) => 
          `## Carte ${index + 1}\n**Question:** ${card.front}\n**Réponse:** ${card.back}\n**Catégorie:** ${card.category}\n**Difficulté:** ${card.difficulty}\n`
        ).join('\n')}\n---\nGénéré le ${new Date(flashcards.metadata.generatedAt).toLocaleString('fr-FR')}`;
        filename = `flashcards_${documentName}.md`;
        mimeType = 'text/markdown';
        break;
      case 'quiz':
        const quiz = content as GeneratedQuiz;
        exportText = `# Quiz - ${documentName}\n\n${quiz.questions.map((question: any, index: number) => 
          `## Question ${index + 1}\n**Type:** ${question.type}\n**Question:** ${question.question}\n${question.options ? `**Options:**\n${question.options.map((opt: any, i: number) => `${String.fromCharCode(97 + i)}) ${opt}`).join('\n')}\n` : ''}**Réponse:** ${question.correctAnswer}\n**Points:** ${question.points}\n${question.explanation ? `**Explication:** ${question.explanation}\n` : ''}`
        ).join('\n')}\n---\nGénéré le ${new Date(quiz.metadata.generatedAt).toLocaleString('fr-FR')}`;
        filename = `quiz_${documentName}.md`;
        mimeType = 'text/markdown';
        break;
    }

    // Télécharger le fichier
    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Export réussi', {
      description: `Fichier ${filename} téléchargé`
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Génération de contenu IA</h3>
            <p className="text-sm text-gray-600">Document: {documentName}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Résumé
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Hash className="w-4 h-4" />
            Flashcards
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'quiz'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quiz
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Onglet Résumé */}
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de résumé
                  </label>
                  <select
                    value={summaryOptions.type}
                    onChange={(e) => setSummaryOptions(prev => ({ 
                      ...prev, 
                      type: e.target.value as SummaryOptions['type'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="global">Global</option>
                    <option value="sections">Par sections</option>
                    <option value="key_points">Points clés</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de détail
                  </label>
                  <select
                    value={summaryOptions.detailLevel}
                    onChange={(e) => setSummaryOptions(prev => ({ 
                      ...prev, 
                      detailLevel: e.target.value as SummaryOptions['detailLevel'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="concis">Concis</option>
                    <option value="standard">Standard</option>
                    <option value="détaillé">Détaillé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue
                  </label>
                  <select
                    value={summaryOptions.language}
                    onChange={(e) => setSummaryOptions(prev => ({ 
                      ...prev, 
                      language: e.target.value as SummaryOptions['language'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeExamples"
                    checked={summaryOptions.includeExamples}
                    onChange={(e) => setSummaryOptions(prev => ({ 
                      ...prev, 
                      includeExamples: e.target.checked 
                    }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="includeExamples" className="ml-2 text-sm text-gray-700">
                    Inclure des exemples
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer le résumé
                  </>
                )}
              </button>

              {generatedContent.summary && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-purple-900">Résumé généré</h4>
                    <button
                      onClick={() => handleExport('summary')}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Exporter"
                    >
                      <Download className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>📝 {generatedContent.summary.metadata.wordCount} mots</p>
                    <p>⏱️ {generatedContent.summary.metadata.readingTime} min de lecture</p>
                    <p>🤖 Modèle: {generatedContent.summary.metadata.model}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Onglet Flashcards */}
          {activeTab === 'flashcards' && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de cartes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={flashcardOptions.count}
                    onChange={(e) => setFlashcardOptions(prev => ({ 
                      ...prev, 
                      count: parseInt(e.target.value) || 10 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulté
                  </label>
                  <select
                    value={flashcardOptions.difficulty}
                    onChange={(e) => setFlashcardOptions(prev => ({ 
                      ...prev, 
                      difficulty: e.target.value as FlashCardOptions['difficulty'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={flashcardOptions.format}
                    onChange={(e) => setFlashcardOptions(prev => ({ 
                      ...prev, 
                      format: e.target.value as FlashCardOptions['format'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="qa">Question/Réponse</option>
                    <option value="definition">Définition</option>
                    <option value="concept">Concept</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeExamplesCards"
                    checked={flashcardOptions.includeExamples}
                    onChange={(e) => setFlashcardOptions(prev => ({ 
                      ...prev, 
                      includeExamples: e.target.checked 
                    }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="includeExamplesCards" className="ml-2 text-sm text-gray-700">
                    Inclure des exemples
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerateFlashCards}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Hash className="w-5 h-5" />
                    Générer les flashcards
                  </>
                )}
              </button>

              {generatedContent.flashcards && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-purple-900">Flashcards générées</h4>
                    <button
                      onClick={() => handleExport('flashcards')}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Exporter"
                    >
                      <Download className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>🎴 {generatedContent.flashcards.metadata.totalCount} cartes</p>
                    <p>📊 Difficulté: {generatedContent.flashcards.metadata.difficulty}</p>
                    <p>🤖 Modèle: {generatedContent.flashcards.metadata.model}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Onglet Quiz */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de quiz
                  </label>
                  <select
                    value={quizOptions.type}
                    onChange={(e) => setQuizOptions(prev => ({ 
                      ...prev, 
                      type: e.target.value as QuizOptions['type'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="qcm">QCM</option>
                    <option value="vrai_faux">Vrai/Faux</option>
                    <option value="ouvert">Questions ouvertes</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={quizOptions.questionCount}
                    onChange={(e) => setQuizOptions(prev => ({ 
                      ...prev, 
                      questionCount: parseInt(e.target.value) || 10 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulté
                  </label>
                  <select
                    value={quizOptions.difficulty}
                    onChange={(e) => setQuizOptions(prev => ({ 
                      ...prev, 
                      difficulty: e.target.value as QuizOptions['difficulty'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeExplanations"
                    checked={quizOptions.includeExplanations}
                    onChange={(e) => setQuizOptions(prev => ({ 
                      ...prev, 
                      includeExplanations: e.target.checked 
                    }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="includeExplanations" className="ml-2 text-sm text-gray-700">
                    Inclure les explications
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-5 h-5" />
                    Générer le quiz
                  </>
                )}
              </button>

              {generatedContent.quiz && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-purple-900">Quiz généré</h4>
                    <button
                      onClick={() => handleExport('quiz')}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Exporter"
                    >
                      <Download className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>📋 {generatedContent.quiz.metadata.totalQuestions} questions</p>
                    <p>🎯 {generatedContent.quiz.metadata.totalPoints} points au total</p>
                    <p>📊 Type: {generatedContent.quiz.metadata.type}</p>
                    <p>🤖 Modèle: {generatedContent.quiz.metadata.model}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
