import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  Play,
  Trash2,
  Clock,
  Target,
  Sparkles,
  X,
  Award,
  BarChart2,
  Loader2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Quiz } from '../lib/supabase';
import { toast } from 'sonner';
import { ContextualActions } from '../components/ContextualActions';

export function Quizzes() {
  const { user } = useAuth();  // ✅ FIX : Récupérer le user
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]); // ✅ Sélection multiple
  const [selectionMode, setSelectionMode] = useState(false); // ✅ Mode sélection

  useEffect(() => {
    if (user) {  // ✅ FIX : Vérifier que le user existe
      fetchQuizzes();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    if (!user) return;  // ✅ FIX : Protection supplémentaire
    
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)  // ✅ FIX : Filtrer par user_id
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (!error) {
      setQuizzes(quizzes.filter((q) => q.id !== id));
      toast.success('Quiz supprimé !');
    }
  };

  // ✅ Suppression multiple
  const handleDeleteSelected = async () => {
    if (selectedQuizzes.length === 0) return;
    
    const confirmed = confirm(`Supprimer ${selectedQuizzes.length} quiz sélectionné(s) ?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .in('id', selectedQuizzes);

    if (!error) {
      setQuizzes(quizzes.filter((q) => !selectedQuizzes.includes(q.id)));
      setSelectedQuizzes([]);
      setSelectionMode(false);
      toast.success(`${selectedQuizzes.length} quiz supprimé(s) !`);
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Toggle sélection d'un quiz
  const handleToggleQuiz = (id: string) => {
    if (selectedQuizzes.includes(id)) {
      setSelectedQuizzes(selectedQuizzes.filter(qId => qId !== id));
    } else {
      setSelectedQuizzes([...selectedQuizzes, id]);
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAttempts = quizzes.reduce((sum, q) => sum + q.total_attempts, 0);
  const avgScore =
    quizzes.filter((q) => q.average_score !== null).reduce((sum, q) => sum + (q.average_score || 0), 0) /
      quizzes.filter((q) => q.average_score !== null).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz</h1>
          <p className="text-gray-500 mt-1">Testez vos connaissances avec des quiz adaptatifs</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Boutons sélection multiple */}
          {selectionMode ? (
            <>
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedQuizzes([]);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
                Annuler
              </button>
              {selectedQuizzes.length > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedQuizzes.length} sélectionné(s)
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                    Supprimer ({selectedQuizzes.length})
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {quizzes.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Sélectionner
                </button>
              )}
              <button
                onClick={() => setShowNewQuizModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus size={18} />
                Nouveau quiz
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total quiz</span>
            <ClipboardList size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{quizzes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total questions</span>
            <Target size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {quizzes.reduce((sum, q) => sum + q.question_count, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Tentatives</span>
            <BarChart2 size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalAttempts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Score moyen</span>
            <Award size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{avgScore.toFixed(0)}%</p>
        </div>
      </div>

      {/* ✅ Actions contextuelles */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
        <p className="text-sm text-gray-700 font-medium mb-3">Actions rapides depuis les quiz :</p>
        <ContextualActions context="quiz" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun quiz pour l'instant</h3>
          <p className="text-gray-500 mb-6">Creez votre premier quiz ou generez-en un a partir d'un document</p>
          <button
            onClick={() => setShowNewQuizModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            Creer un quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`bg-white border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all relative ${
                selectedQuizzes.includes(quiz.id) ? 'border-teal-500' : 'border-gray-200'
              }`}
            >
              {/* ✅ Checkbox en mode sélection */}
              {selectionMode && (
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedQuizzes.includes(quiz.id)}
                    onChange={() => handleToggleQuiz(quiz.id)}
                    className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className={`p-5 ${selectionMode ? 'pt-10' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ClipboardList size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <Link to={`/quizzes/${quiz.id}/take`}>
                        <h3 className="font-semibold text-gray-900 hover:text-teal-600">
                          {quiz.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500">{quiz.question_count} questions</p>
                    </div>
                  </div>
                  {quiz.is_ai_generated && (
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-600 rounded flex items-center gap-1">
                      <Sparkles size={10} /> IA
                    </span>
                  )}
                </div>

                {quiz.description && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">{quiz.description}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  {quiz.settings.time_limit_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {quiz.settings.time_limit_minutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Target size={14} />
                    {quiz.settings.passing_score}% pour reussir
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">{quiz.total_attempts} tentatives</span>
                  {quiz.average_score !== null && (
                    <span className="font-medium text-gray-700">
                      Moy : {quiz.average_score.toFixed(0)}%
                    </span>
                  )}
                </div>
                {!selectionMode && (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/quizzes/${quiz.id}/take`}
                      className="p-1.5 hover:bg-teal-100 rounded"
                      title="Passer le quiz"
                    >
                      <Play size={16} className="text-teal-600" />
                    </Link>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-1.5 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewQuizModal && (
        <NewQuizModal
          onClose={() => setShowNewQuizModal(false)}
          onCreated={fetchQuizzes}
        />
      )}
    </div>
  );
}

function NewQuizModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'ai-topic' | 'ai-document'>('ai-document');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Fichier uploadé
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'ai-document') {
      fetchDocuments();
    }
  }, [mode]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, file_type, storage_path')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  const handleCreateManual = async () => {
    if (!user || !title) return;

    setLoading(true);
    setError('');
    
    const { error: insertError } = await supabase.from('quizzes').insert({
      user_id: user.id,
      title,
      description,
      is_ai_generated: false,
    });

    if (!insertError) {
      onCreated();
      onClose();
    } else {
      setError('Erreur lors de la création du quiz');
    }
    setLoading(false);
  };

  const handleCreateFromDocument = async () => {
    if (!user || (!selectedDocument && !uploadedFile)) return;

    setLoading(true);
    setError('');

    try {
      console.log('🤖 Génération de quiz depuis document...');

      let doc: any;
      let extractedText: string;

      // Si un fichier a été uploadé, l'utiliser directement
      if (uploadedFile) {
        console.log('📤 Upload et extraction depuis fichier uploadé:', uploadedFile.name);
        
        // Extraire le texte directement du fichier
        const { extractText } = await import('../services/textExtractor');
        const { getFileType } = await import('../utils/fileUtils');
        
        const fileType = getFileType(uploadedFile.name);
        const extractResult = await extractText(uploadedFile, fileType);
        extractedText = typeof extractResult === 'string' ? extractResult : extractResult.text;

        // Créer un objet document temporaire
        doc = {
          name: uploadedFile.name,
          id: 'temp-' + Date.now(),
        };
      } else {
        // Sinon, récupérer le document existant
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', selectedDocument)
          .single();

        if (docError || !docData) {
          throw new Error('Document introuvable');
        }

        doc = docData;

        // 2. Extraire le texte
        const { extractText } = await import('../services/textExtractor');
        const extractResult = await extractText(doc.storage_path, doc.file_type);
        extractedText = typeof extractResult === 'string' ? extractResult : extractResult.text;
      }

      if (!extractedText || extractedText.trim() === '') {
        throw new Error('Impossible d\'extraire le texte du document');
      }

      console.log('✅ Texte extrait:', extractedText.substring(0, 200) + '...');

      // 3. Générer le quiz avec le nombre de questions choisi
      const { generateQuizFromText } = await import('../services/quizGenerator');
      const quiz = await generateQuizFromText(
        extractedText,
        doc.name,
        doc.id,
        questionCount // Passer le nombre de questions
      );

      console.log('✅ Quiz généré:', quiz);

      // 4. Créer le quiz dans Supabase
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: title || `Quiz - ${doc.name}`,
          description: description || `Quiz généré depuis le document : ${doc.name}`,
          is_ai_generated: true,
          question_count: quiz.questions.length,
          settings: {
            time_limit_minutes: 15,
            passing_score: 70,
            show_correct_answers: true,
            randomize_questions: true,
            randomize_options: true,
          }
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // 5. Ajouter les questions
      const questionsToInsert = quiz.questions.map(q => ({
        quiz_id: quizData.id,
        question_type: 'qcm',
        question_text: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      console.log('✅ Quiz créé avec succès');
      
      // ✅ Fermer la modale immédiatement pour un meilleur UX
      onClose();
      
      // ✅ NAVIGATION vers la page de passage du quiz (pas de page détail)
      setTimeout(() => {
        navigate(`/quizzes/${quizData.id}/take`);
        onCreated(); // Rafraîchir la liste après navigation
      }, 100);
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Erreur lors de la génération du quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWithAI = async () => {
    if (!user || !topic) return;

    setLoading(true);
    setError('');

    try {
      console.log('🤖 Génération de quiz par IA sur le sujet:', topic);

      // ✅ Utiliser l'Edge Function qui génère directement un quiz complet
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          text: `Génère un cours détaillé sur le sujet suivant et des questions de quiz basées dessus : "${topic}". 
Le contenu doit être pédagogique, structuré, avec :
- Une introduction claire
- Les concepts clés bien expliqués
- Des exemples concrets
- Des définitions précises
- Des détails importants

Utilise ce contenu pour créer les questions de quiz.`,
          documentName: topic,
          questionCount: 10
        },
      });

      if (error) {
        console.error('❌ Erreur Edge Function:', error);
        throw new Error(error.message || 'Erreur lors de la génération du quiz');
      }

      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('Aucune question générée');
      }

      console.log('✅ Quiz généré:', data);

      // Convertir les réponses string en index si nécessaire
      const questions = data.questions.map((q: any, index: number) => {
        let correctAnswerIndex = 0;
        if (typeof q.correctAnswer === 'string') {
          correctAnswerIndex = q.options.findIndex((opt: string) => opt === q.correctAnswer);
          if (correctAnswerIndex === -1) correctAnswerIndex = 0;
        } else if (typeof q.correctAnswer === 'number') {
          correctAnswerIndex = q.correctAnswer;
        }

        return {
          id: `q${Date.now()}-${index}`,
          question: q.question,
          options: q.options,
          correctAnswer: correctAnswerIndex,
          explanation: q.explanation || '',
        };
      });

      // Étape 2 : Créer le quiz dans Supabase
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: title || `Quiz : ${topic}`,
          description: description || `Quiz généré par IA sur : ${topic}`,
          is_ai_generated: true,
          question_count: questions.length,
          settings: {
            time_limit_minutes: 15,
            passing_score: 70,
            show_correct_answers: true,
            randomize_questions: true,
            randomize_options: true,
          }
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Étape 3 : Ajouter les questions
      const questionsToInsert = questions.map((q: any) => ({
        quiz_id: quizData.id,
        question_type: 'qcm',
        question_text: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      console.log('✅ Quiz créé avec succès dans la base de données');
      
      // ✅ Fermer la modale immédiatement pour un meilleur UX
      onClose();
      
      // ✅ NAVIGATION vers la page de passage du quiz
      setTimeout(() => {
        navigate(`/quizzes/${quizData.id}/take`);
        onCreated(); // Rafraîchir la liste après navigation
      }, 100);
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Erreur lors de la génération du quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nouveau quiz</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Sélecteur de mode - 3 options */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => setMode('ai-document')}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
              mode === 'ai-document'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sparkles size={20} className={mode === 'ai-document' ? 'text-purple-600' : 'text-gray-400'} />
            <div className="flex-1">
              <p className={`font-medium ${mode === 'ai-document' ? 'text-purple-700' : 'text-gray-700'}`}>
                IA depuis un document
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Générer un quiz depuis vos documents existants
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode('ai-topic')}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
              mode === 'ai-topic'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sparkles size={20} className={mode === 'ai-topic' ? 'text-teal-600' : 'text-gray-400'} />
            <div className="flex-1">
              <p className={`font-medium ${mode === 'ai-topic' ? 'text-teal-700' : 'text-gray-700'}`}>
                IA sur un sujet
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                L'IA crée un cours puis génère un quiz
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
              mode === 'manual'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Plus size={20} className={mode === 'manual' ? 'text-blue-600' : 'text-gray-400'} />
            <div className="flex-1">
              <p className={`font-medium ${mode === 'manual' ? 'text-blue-700' : 'text-gray-700'}`}>
                Créer manuellement
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Créez un quiz vide et ajoutez vos questions
              </p>
            </div>
          </button>
        </div>

        {/* Mode IA depuis document */}
        {mode === 'ai-document' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sélectionner un document <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDocument}
                onChange={(e) => {
                  setSelectedDocument(e.target.value);
                  if (e.target.value) setUploadedFile(null); // Clear upload
                }}
                disabled={!!uploadedFile}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <option value="">Choisir un document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Séparateur OU */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-x-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <span className="relative bg-white px-3 text-sm font-medium text-gray-500">OU</span>
            </div>

            {/* NOUVEAU : Zone d'upload direct */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Uploader un nouveau document
              </label>
              <div className="flex items-center gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploadedFile 
                    ? 'border-purple-500 bg-purple-50' 
                    : selectedDocument
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        setSelectedDocument(''); // Clear selected
                      }
                    }}
                    disabled={!!selectedDocument}
                    className="hidden"
                  />
                  <Upload size={20} className={uploadedFile ? 'text-purple-600' : 'text-gray-400'} />
                  <span className={`text-sm ${uploadedFile ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                    {uploadedFile ? uploadedFile.name : 'Choisir un fichier...'}
                  </span>
                </label>
                {uploadedFile && (
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="Retirer le fichier"
                  >
                    <X size={18} className="text-red-500" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés : PDF, DOCX, TXT, Images (JPG, PNG)
              </p>
            </div>

            {/* NOUVEAU : Nombre de questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre de questions
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(5, Math.min(20, parseInt(e.target.value) || 10)))}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">{questionCount} Q</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommandé : 10 questions (5 min : 5-8 | 10 min : 10-15 | 20 min : 15-20)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre personnalisé (optionnel)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Laissez vide pour un titre automatique"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description personnalisée du quiz"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {!selectedDocument && !uploadedFile && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Sélectionnez un document existant ou uploadez un nouveau fichier.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Formulaire IA par sujet */}
        {mode === 'ai-topic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sujet du quiz <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ex: Le système cardiovasculaire, La photosynthèse..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Entrez un sujet précis pour obtenir des questions pertinentes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre personnalisé (optionnel)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Laissez vide pour un titre automatique"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description personnalisée du quiz"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Formulaire Manuel */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre du quiz <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Quiz Système Cardiovasculaire"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus={mode === 'manual'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brève description du quiz"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={
              mode === 'ai-document' 
                ? handleCreateFromDocument 
                : mode === 'ai-topic' 
                ? handleCreateWithAI 
                : handleCreateManual
            }
            disabled={
              loading || 
              (mode === 'ai-document' && !selectedDocument && !uploadedFile) ||
              (mode === 'ai-topic' && !topic) || 
              (mode === 'manual' && !title)
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'ai-document' 
                ? 'bg-purple-600 hover:bg-purple-700'
                : mode === 'ai-topic'
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === 'manual' ? 'Création...' : 'Génération...'}
              </>
            ) : (
              <>
                {mode === 'manual' ? <Plus size={18} /> : <Sparkles size={18} />}
                {mode === 'ai-document' 
                  ? 'Générer depuis document'
                  : mode === 'ai-topic'
                  ? 'Générer avec IA'
                  : 'Créer le quiz'
                }
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
