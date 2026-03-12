/**
 * Composant pour afficher et gérer les guides d'étude
 * Permet de générer, visualiser et exporter des guides d'étude structurés
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Target, 
  List, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Download,
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  generateStudyGuide, 
  generateQuickStudyGuide, 
  generateAdvancedStudyGuide,
  formatStudyGuideForDisplay,
  type StudyGuide,
  type StudyGuideOptions,
  type StudyGuideSection
} from '../services/studyGuideService';
import { toast } from 'sonner';

interface StudyGuideGeneratorProps {
  documentTitle: string;
  documentContent: string;
  onGenerated?: (guide: StudyGuide) => void;
  className?: string;
}

export function StudyGuideGenerator({ 
  documentTitle, 
  documentContent, 
  onGenerated,
  className = ''
}: StudyGuideGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGuide, setGeneratedGuide] = useState<StudyGuide | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [selectedOptions, setSelectedOptions] = useState<StudyGuideOptions>({
    difficulty: 'intermédiaire',
    includeExercises: true,
    includeExamples: true,
    maxSections: 5,
    targetDuration: 60
  });

  const handleGenerateGuide = async (options: StudyGuideOptions) => {
    if (!documentContent.trim()) {
      toast.error('Contenu requis', {
        description: 'Le document doit contenir du texte pour générer un guide'
      });
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Génération du guide d\'étude en cours...');

    try {
      const guide = await generateStudyGuide(documentContent, documentTitle, options);
      setGeneratedGuide(guide);
      onGenerated?.(guide);
      
      toast.success('Guide d\'étude généré avec succès', {
        id: loadingToast,
        description: `${guide.sections.length} sections • ${guide.estimatedDuration} minutes`
      });
    } catch (error: any) {
      console.error('❌ Erreur génération guide:', error);
      toast.error('Erreur lors de la génération', {
        id: loadingToast,
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickGenerate = () => {
    handleGenerateGuide({
      difficulty: 'intermédiaire',
      includeExercises: false,
      includeExamples: true,
      maxSections: 3,
      targetDuration: 30
    });
  };

  const handleAdvancedGenerate = () => {
    handleGenerateGuide({
      difficulty: 'avancé',
      includeExercises: true,
      includeExamples: true,
      maxSections: 8,
      targetDuration: 120
    });
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const exportGuide = (format: 'markdown' | 'json') => {
    if (!generatedGuide) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'markdown') {
      content = formatStudyGuideForDisplay(generatedGuide);
      filename = `${generatedGuide.title.replace(/[^a-z0-9]/gi, '_')}.md`;
      mimeType = 'text/markdown';
    } else {
      content = JSON.stringify(generatedGuide, null, 2);
      filename = `${generatedGuide.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Guide exporté en ${format.toUpperCase()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'débutant': return 'text-green-400';
      case 'intermédiaire': return 'text-yellow-400';
      case 'avancé': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'débutant': return <CheckCircle className="w-4 h-4" />;
      case 'intermédiaire': return <AlertCircle className="w-4 h-4" />;
      case 'avancé': return <TrendingUp className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Guide d'Étude IA</h3>
            <p className="text-sm text-white/70">Générez des guides d'étude structurés et personnalisés</p>
          </div>
        </div>

        {/* Options rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <button
            onClick={handleQuickGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 rounded-lg transition-colors text-green-300 text-sm"
          >
            <Zap className="w-4 h-4" />
            Rapide (30min)
          </button>
          
          <button
            onClick={() => handleGenerateGuide(selectedOptions)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg transition-colors text-blue-300 text-sm"
          >
            <Play className="w-4 h-4" />
            Personnalisé
          </button>
          
          <button
            onClick={handleAdvancedGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 rounded-lg transition-colors text-purple-300 text-sm"
          >
            <Target className="w-4 h-4" />
            Avancé (120min)
          </button>
        </div>

        {/* Options personnalisées */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">Options personnalisées :</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 block mb-1">Difficulté</label>
              <select
                value={selectedOptions.difficulty}
                onChange={(e) => setSelectedOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <option value="débutant">Débutant</option>
                <option value="intermédiaire">Intermédiaire</option>
                <option value="avancé">Avancé</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Durée cible (minutes)</label>
              <input
                type="number"
                min="15"
                max="180"
                value={selectedOptions.targetDuration}
                onChange={(e) => setSelectedOptions(prev => ({ ...prev, targetDuration: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Nombre de sections</label>
              <input
                type="number"
                min="2"
                max="10"
                value={selectedOptions.maxSections}
                onChange={(e) => setSelectedOptions(prev => ({ ...prev, maxSections: parseInt(e.target.value) || 5 }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={selectedOptions.includeExercises}
                  onChange={(e) => setSelectedOptions(prev => ({ ...prev, includeExercises: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
                />
                Inclure exercices
              </label>

              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={selectedOptions.includeExamples}
                  onChange={(e) => setSelectedOptions(prev => ({ ...prev, includeExamples: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/50"
                />
                Inclure exemples
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Guide généré */}
      <AnimatePresence>
        {generatedGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
          >
            {/* Header du guide */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getDifficultyIcon(generatedGuide.difficulty)}
                  <div>
                    <h4 className="text-lg font-semibold text-white">{generatedGuide.title}</h4>
                    <p className="text-sm text-white/70">{generatedGuide.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportGuide('markdown')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60"
                    title="Exporter en Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportGuide('json')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/60"
                    title="Exporter en JSON"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getDifficultyColor(generatedGuide.difficulty)}`}>
                    {generatedGuide.difficulty}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">{generatedGuide.estimatedDuration} min</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">{generatedGuide.sections.length} sections</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">{generatedGuide.learningObjectives.length} objectifs</span>
                </div>
              </div>
            </div>

            {/* Contenu du guide */}
            <div className="max-h-96 overflow-y-auto">
              {/* Prérequis et objectifs */}
              <div className="p-4 space-y-4 border-b border-white/10">
                {generatedGuide.prerequisites.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-white/80 mb-2">Prérequis</h5>
                    <ul className="space-y-1">
                      {generatedGuide.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-white/70">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedGuide.learningObjectives.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-white/80 mb-2">Objectifs d'apprentissage</h5>
                    <ul className="space-y-1">
                      {generatedGuide.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                          <span className="text-blue-400 font-medium">{index + 1}.</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Sections */}
              <div className="divide-y divide-white/10">
                {generatedGuide.sections.map((section, index) => (
                  <div key={index} className="p-4">
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex items-center justify-between text-left mb-3"
                    >
                      <div className="flex items-center gap-3">
                        <h5 className="text-sm font-medium text-white">
                          {index + 1}. {section.title}
                        </h5>
                        <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                          {section.estimatedTime} min
                        </span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-white/60 transition-transform ${
                          expandedSections.has(index) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSections.has(index) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <div className="text-sm text-white/80 leading-relaxed">
                            {section.content}
                          </div>

                          {section.keyPoints.length > 0 && (
                            <div>
                              <h6 className="text-xs font-medium text-white/70 mb-2">Points clés</h6>
                              <ul className="space-y-1">
                                {section.keyPoints.map((point, pointIndex) => (
                                  <li key={pointIndex} className="flex items-start gap-2 text-xs text-white/70">
                                    <span className="text-blue-400">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.examples && section.examples.length > 0 && (
                            <div>
                              <h6 className="text-xs font-medium text-white/70 mb-2">Exemples</h6>
                              <ul className="space-y-1">
                                {section.examples.map((example, exampleIndex) => (
                                  <li key={exampleIndex} className="text-xs text-white/70 bg-white/5 p-2 rounded">
                                    {example}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.exercises && section.exercises.length > 0 && (
                            <div>
                              <h6 className="text-xs font-medium text-white/70 mb-2">Exercices</h6>
                              <ul className="space-y-1">
                                {section.exercises.map((exercise, exerciseIndex) => (
                                  <li key={exerciseIndex} className="text-xs text-white/70 bg-blue-500/10 p-2 rounded border-l-2 border-blue-400">
                                    {exercise}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
