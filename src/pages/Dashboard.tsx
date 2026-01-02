import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
 FileText,
  BookOpen,
  ClipboardList,
  Calendar,
  Target,
  Flame,
  ArrowRight,
  Sparkles,
  Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    documents: 0,
    cards: 0,
    quizzes: 0,
    dueReviews: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [docsResult, cardsResult, quizzesResult, dueCardsResult] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact' }).limit(5).order('created_at', { ascending: false }),
        supabase.from('study_cards').select('*', { count: 'exact' }),
        supabase.from('quizzes').select('*', { count: 'exact' }).limit(3).order('created_at', { ascending: false }),
        supabase.from('study_cards').select('*').lte('next_review_at', new Date().toISOString()).limit(5),
      ]);

      setStats({
        documents: docsResult.count || 0,
        cards: cardsResult.count || 0,
        quizzes: quizzesResult.count || 0,
        dueReviews: dueCardsResult.data?.length || 0,
      });

      setRecentDocuments(docsResult.data || []);
      setDueCards(dueCardsResult.data || []);
      setRecentQuizzes(quizzesResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatReviewDate = (date: string | null) => {
    if (!date) return 'Non programmé';
    const d = new Date(date);
    if (isToday(d)) return "Aujourd'hui";
    if (isTomorrow(d)) return 'Demain';
    return format(d, 'd MMM', { locale: fr });
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-800/20 text-red-300';
      case 'docx':
        return 'bg-blue-800/20 text-blue-300';
      case 'image':
        return 'bg-green-800/20 text-green-300';
      case 'video':
        return 'bg-violet-800/20 text-violet-300';
      case 'url':
        return 'bg-yellow-600/20 text-yellow-300';
      default:
        return 'bg-slate-800/40 text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-b from-[#111c2a] to-[#191e2e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-10 bg-gradient-to-tr from-[#111c2a] via-[#171d33] to-[#1b2340] min-h-screen px-2 py-8 md:px-10 lg:px-36 transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-teal-sm">
            {getGreeting()}, <span className="text-teal-400">{profile?.full_name?.split(' ')[0] || 'ami(e)'}</span> !
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Voici ce qui se passe avec vos études</p>
        </div>
        <Link
          to="/cards"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl shadow-lg font-semibold text-lg hover:scale-105 hover:from-teal-600 hover:to-cyan-700 transition duration-200"
        >
          <Play size={22} />
          Voir mes fiches
        </Link>
      </div>

      {/* Modern cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8">
        <div className="rounded-2xl p-7 bg-gradient-to-br from-[#193c57]/80 to-[#20263b]/90 border border-slate-800 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-blue-900/40 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-7 h-7 text-blue-300" />
            </div>
            <span className="text-3xl font-extrabold text-white">{stats.documents}</span>
          </div>
          <p className="mt-6 text-slate-300 font-semibold text-lg">Documents</p>
          <Link to="/library" className="mt-3 text-base text-teal-300 hover:text-teal-200 flex items-center gap-1 transition">
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl p-7 bg-gradient-to-br from-[#15544d]/80 to-[#20383b]/90 border border-slate-800 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-green-900/40 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-7 h-7 text-green-300" />
            </div>
            <span className="text-3xl font-extrabold text-white">{stats.cards}</span>
          </div>
          <p className="mt-6 text-slate-300 font-semibold text-lg">Fiches</p>
          <Link to="/cards" className="mt-3 text-base text-teal-300 hover:text-teal-200 flex items-center gap-1 transition">
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl p-7 bg-gradient-to-br from-[#684520]/80 to-[#29241d]/90 border border-slate-800 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-amber-900/40 flex items-center justify-center group-hover:scale-110 transition">
              <ClipboardList className="w-7 h-7 text-amber-300" />
            </div>
            <span className="text-3xl font-extrabold text-white">{stats.quizzes}</span>
          </div>
          <p className="mt-6 text-slate-300 font-semibold text-lg">Quiz</p>
          <Link to="/quizzes" className="mt-3 text-base text-teal-300 hover:text-teal-200 flex items-center gap-1 transition">
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl p-7 bg-gradient-to-br from-[#451b2c]/80 to-[#3e2532]/90 border border-slate-800 shadow-xl hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-red-900/40 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-7 h-7 text-red-300" />
            </div>
            <span className="text-3xl font-extrabold text-white">{stats.dueReviews}</span>
          </div>
          <p className="mt-6 text-slate-300 font-semibold text-lg">Révisions dues</p>
          <Link to="/cards" className="mt-3 text-base text-teal-300 hover:text-teal-200 flex items-center gap-1 transition">
            Voir les fiches <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 lg:gap-8">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#181f32] via-[#232945]/90 to-[#22324e]/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-7 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Documents récents</h2>
              <Link to="/library" className="text-sm text-teal-300 hover:text-teal-200 transition">
                Voir tout
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-800">
            {recentDocuments.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Aucun document pour l'instant</p>
                <Link to="/library?upload=true" className="mt-3 text-base text-teal-300 hover:text-teal-200">
                  Importez votre premier document
                </Link>
              </div>
            ) : (
              recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/library/${doc.id}`}
                  className="flex items-center gap-5 p-5 hover:bg-white/5 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${getFileTypeIcon(doc.file_type)}`}>
                    <FileText size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* RÈGLE : Afficher name (avec accents) pour l'utilisateur */}
                    <p className="font-semibold text-white truncate text-lg">{doc.name || 'Document sans nom'}</p>
                    <p className="text-sm text-slate-400">
                      {format(new Date(doc.created_at), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.has_cards && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-900/40 text-green-200 rounded">
                        Fiches
                      </span>
                    )}
                    {doc.has_quiz && (
                      <span className="px-2 py-1 text-xs font-medium bg-amber-900/40 text-amber-200 rounded">
                        Quiz
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-7 h-full">
          <div className="rounded-2xl bg-gradient-to-tl from-[#191c29] via-[#213b3c]/80 to-[#131c29]/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-7 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">À réviser</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {dueCards.length === 0 ? (
                <div className="p-7 text-center">
                  <Target className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-base">Aucune fiche à réviser</p>
                </div>
              ) : (
                dueCards.slice(0, 4).map((card) => (
                  <Link
                    key={card.id}
                    to={`/cards/${card.id}`}
                    className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate text-base">{card.title}</p>
                      <p className="text-xs text-slate-400">
                        Maîtrise : <span className="text-green-200 font-semibold">{card.mastery_level}%</span>
                      </p>
                    </div>
                    <span className="text-xs font-medium text-red-300 bg-red-900/20 px-2 py-1 rounded">
                      {formatReviewDate(card.next_review_at)}
                    </span>
                  </Link>
                ))
              )}
            </div>
            {dueCards.length > 0 && (
              <div className="p-4 bg-white/5 border-t border-slate-800">
                <Link
                  to="/cards"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium text-base shadow-md hover:scale-105 transition"
                >
                  <Play size={18} />
                  Voir les fiches
                </Link>
              </div>
            )}
          </div>

          {/* AI Assistant card */}
          <div className="bg-gradient-to-br from-teal-800 via-[#1a2744] to-indigo-900 rounded-2xl p-7 text-white border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-16 w-44 h-44 bg-teal-400/20 blur-2xl rounded-full z-0" />
            <div className="flex items-center gap-4 mb-5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">Assistant IA</p>
                <p className="text-teal-100 text-base">{profile?.ai_credits || 0} crédits</p>
              </div>
            </div>
            <p className="text-teal-100 text-base mb-5 relative z-10">
              Générez des fiches, quiz et résumés à partir de vos documents instantanément.
            </p>
            <Link
              to="/ai-assistant"
              className="relative z-10 flex items-center justify-center gap-2 w-full py-3 bg-white/90 text-teal-800 rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] hover:bg-white transition"
            >
              Ouvrir l’assistant IA
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-8">
        <div className="rounded-2xl bg-gradient-to-br from-[#28253b] via-[#262f46]/80 to-[#142445]/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-7 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Quiz récents</h2>
              <Link to="/quizzes" className="text-sm text-teal-300 hover:text-teal-200 transition">
                Voir tout
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-800">
            {recentQuizzes.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList className="w-14 h-14 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">Aucun quiz pour l'instant</p>
                <Link to="/quizzes/new" className="mt-3 text-base text-teal-300 hover:text-teal-200">
                  Créez votre premier quiz
                </Link>
              </div>
            ) : (
              recentQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quizzes/${quiz.id}`}
                  className="flex items-center gap-5 p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-900/40 flex items-center justify-center">
                    <ClipboardList size={22} className="text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-lg">{quiz.title}</p>
                    <p className="text-sm text-slate-400">
                      {quiz.question_count} questions
                    </p>
                  </div>
                  {quiz.average_score !== null && (
                    <span className="text-base font-semibold text-slate-200">
                      Moy : <span className="text-teal-300">{quiz.average_score.toFixed(0)}%</span>
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-tr from-[#2c283b] via-[#22313f] to-[#1f275a] border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-7 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Série d'étude</h2>
              <div className="flex items-center gap-3 text-amber-300">
                <Flame size={22} />
                <span className="font-bold text-lg">7 jours</span>
              </div>
            </div>
          </div>
          <div className="p-7">
            <div className="flex items-center justify-between mb-5">
              <span className="text-base text-slate-400">Cette semaine</span>
              <span className="text-base font-semibold text-slate-200">5/7 jours</span>
            </div>
            <div className="flex gap-2 mb-4">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="flex-1 text-center">
                  <div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center font-bold border-2 ${
                      i < 5
                        ? 'bg-gradient-to-br from-teal-900/70 via-cyan-900/30 to-transparent text-teal-300 border-teal-500 shadow-md'
                        : 'bg-slate-800/50 text-slate-500 border-slate-800'
                    }`}
                  >
                    {i < 5 ? <Flame size={18} /> : null}
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block tracking-wider">{day}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-400">Objectif hebdomadaire</span>
                <span className="font-semibold text-white">30 fiches révisées</span>
              </div>
              <div className="mt-2 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300" style={{ width: '73%' }} />
              </div>
              <p className="mt-2 text-xs text-teal-300">22 sur 30 fiches terminées</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
