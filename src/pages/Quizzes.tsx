import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  Play,
  Pencil,
  Trash2,
  Clock,
  Target,
  Sparkles,
  X,
  Award,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Quiz } from '../lib/supabase';

export function Quizzes() {
  useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
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
        <button
          onClick={() => setShowNewQuizModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={18} />
          Nouveau quiz
        </button>
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
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ClipboardList size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <Link to={`/quizzes/${quiz.id}`}>
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
                <div className="flex items-center gap-1">
                  <Link
                    to={`/quizzes/${quiz.id}/take`}
                    className="p-1.5 hover:bg-teal-100 rounded"
                    title="Passer le quiz"
                  >
                    <Play size={16} className="text-teal-600" />
                  </Link>
                  <Link
                    to={`/quizzes/${quiz.id}/edit`}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Modifier"
                  >
                    <Pencil size={16} className="text-gray-500" />
                  </Link>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-1.5 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !title) return;

    setLoading(true);
    const { error } = await supabase.from('quizzes').insert({
      user_id: user.id,
      title,
      description,
    });

    if (!error) {
      onCreated();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nouveau quiz</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre du quiz</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Quiz Systeme Cardiovasculaire"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve description du quiz"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!title || loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer le quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
