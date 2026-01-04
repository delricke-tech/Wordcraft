import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  Share2,
  X,
  Mic,
  VideoIcon,
  Monitor,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, StudySession } from '../lib/supabase';
import { format, isFuture, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Sessions() {
  useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' && s.scheduled_at && isFuture(new Date(s.scheduled_at))
  );
  const pastSessions = sessions.filter(
    (s) => s.status === 'ended' || (s.scheduled_at && isPast(new Date(s.scheduled_at)))
  );
  const activeSessions = sessions.filter((s) => s.status === 'active');

  const displaySessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'study':
        return 'bg-blue-100 text-blue-700';
      case 'quiz':
        return 'bg-amber-100 text-amber-700';
      case 'lecture':
        return 'bg-purple-100 text-purple-700';
      case 'discussion':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'study':
        return 'Etude';
      case 'quiz':
        return 'Quiz';
      case 'lecture':
        return 'Cours';
      case 'discussion':
        return 'Discussion';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions d'etude</h1>
          <p className="text-gray-500 mt-1">Collaborez en temps reel avec video, audio et documents partages</p>
        </div>
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={18} />
          Nouvelle session
        </button>
      </div>

      {activeSessions.length > 0 && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-teal-100">En direct</span>
              </div>
              <h3 className="text-xl font-semibold">{activeSessions[0].title}</h3>
              <p className="text-teal-100 mt-1">
                {activeSessions[0].participant_count} participants
              </p>
            </div>
            <Link
              to={`/sessions/${activeSessions[0].id}/join`}
              className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 rounded-lg font-medium hover:bg-teal-50"
            >
              <Play size={20} />
              Rejoindre
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">En cours</span>
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeSessions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">A venir</span>
            <Calendar size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{upcomingSessions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total sessions</span>
            <Video size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{sessions.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          A venir ({upcomingSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Passees ({pastSessions.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : displaySessions.length === 0 ? (
        <div className="text-center py-16">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'upcoming' ? 'Aucune session a venir' : 'Aucune session passee'}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'upcoming'
              ? 'Planifiez une nouvelle session d\'etude pour collaborer avec d\'autres'
              : 'Vos sessions passees apparaitront ici'}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={18} />
              Planifier une session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displaySessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Video size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/sessions/${session.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-teal-600">
                          {session.title}
                        </h3>
                      </Link>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${getSessionTypeColor(session.session_type ?? '')}`}>
                        {getSessionTypeLabel(session.session_type ?? '')}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-500 mt-1">{session.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      {session.scheduled_at && (
                        <>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(session.scheduled_at), 'd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(new Date(session.scheduled_at), 'HH:mm')}
                          </span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {session.participant_count} / {session.settings.max_participants}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {session.settings.allow_video && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <VideoIcon size={12} /> Video
                        </span>
                      )}
                      {session.settings.allow_audio && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mic size={12} /> Audio
                        </span>
                      )}
                      {session.settings.allow_screen_share && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Monitor size={12} /> Partage d'ecran
                        </span>
                      )}
                      {session.settings.enable_ai_assist && (
                        <span className="flex items-center gap-1 text-xs text-purple-600">
                          <Sparkles size={12} /> Assistant IA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === 'upcoming' && (
                    <Link
                      to={`/sessions/${session.id}/join`}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      <Play size={16} />
                      Rejoindre
                    </Link>
                  )}
                  {activeTab === 'past' && session.recording_url && (
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Play size={16} />
                      Enregistrement
                    </button>
                  )}
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Share2 size={18} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer la session"
                  >
                    <Trash2 size={18} className="text-red-500 hover:text-red-700" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewSessionModal && (
        <NewSessionModal
          onClose={() => setShowNewSessionModal(false)}
          onCreated={fetchSessions}
        />
      )}
    </div>
  );
}

function NewSessionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState('study');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !title) return;

    setLoading(true);
    const scheduledAt = scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : null;

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from('study_sessions').insert({
      host_id: user.id,
      title,
      description,
      session_type: sessionType,
      scheduled_at: scheduledAt,
      room_code: roomCode,
    });

    if (!error) {
      onCreated();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle session d'etude</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre de la session</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Revision d'anatomie"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Que allez-vous couvrir dans cette session ?"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de session</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="study">Session d'etude</option>
              <option value="quiz">Session quiz</option>
              <option value="lecture">Cours</option>
              <option value="discussion">Discussion</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
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
            {loading ? 'Creation...' : 'Creer la session'}
          </button>
        </div>
      </div>
    </div>
  );
}
