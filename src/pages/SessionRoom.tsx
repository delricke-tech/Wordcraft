import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  FileText,
  Settings,
  PhoneOff,
  Upload,
  Send,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  createDailyRoom, 
  joinDailyRoom, 
  leaveDailyRoom,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  isDailyConfigured
} from '../lib/daily';
import { DailyCall } from '@daily-co/daily-js';

type Message = {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

type Participant = {
  id: string;
  user_id: string;
  user_name: string;
  has_video: boolean;
  has_audio: boolean;
  joined_at: string;
};

export function SessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | 'documents'>('chat');
  
  // États Daily.co
  const [dailyCall, setDailyCall] = useState<DailyCall | null>(null);
  const [dailyRoomUrl, setDailyRoomUrl] = useState<string>('');
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // États des contrôles média
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // États UI
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyConfigured, setDailyConfigured] = useState(false);

  useEffect(() => {
    setDailyConfigured(isDailyConfigured());
  }, []);

  useEffect(() => {
    if (sessionId && user) {
      loadSession();
      joinSession();
      setupRealtimeSubscriptions();
    }

    return () => {
      if (dailyCall) {
        leaveDailyRoom(dailyCall);
      }
    };
  }, [sessionId, user]);

  // Initialiser Daily.co quand la session est chargée
  useEffect(() => {
    if (session && user && videoContainerRef.current && dailyConfigured && !dailyCall) {
      initializeDailyCall();
    }
  }, [session, user, dailyConfigured]);

  const initializeDailyCall = async () => {
    if (!session || !user || !videoContainerRef.current) return;
    
    setIsJoiningCall(true);
    
    try {
      let roomUrl = session.daily_room_url;
      
      // Créer la salle si elle n'existe pas
      if (!roomUrl) {
        const roomName = `session-${session.id}`;
        const room = await createDailyRoom(roomName);
        roomUrl = room.url;
        
        // Sauvegarder l'URL dans la base de données
        await supabase
          .from('study_sessions')
          .update({ daily_room_url: roomUrl })
          .eq('id', session.id);
      }
      
      setDailyRoomUrl(roomUrl);
      
      // Rejoindre la salle
      const call = await joinDailyRoom(
        videoContainerRef.current,
        roomUrl,
        user.email || 'Participant'
      );
      
      setDailyCall(call);
      
      // Événements Daily.co
      call.on('joined-meeting', () => {
        console.log('✅ Rejoint la vidéo conférence');
        setIsJoiningCall(false);
      });
      
      call.on('participant-joined', (event: any) => {
        console.log('👋 Nouveau participant:', event.participant);
        loadParticipants();
      });
      
      call.on('participant-left', (event: any) => {
        console.log('👋 Participant parti:', event.participant);
        loadParticipants();
      });
      
      call.on('error', (error: any) => {
        console.error('❌ Erreur Daily.co:', error);
        setError('Erreur de connexion vidéo');
        setIsJoiningCall(false);
      });
      
    } catch (err: any) {
      console.error('Erreur initialisation Daily.co:', err);
      setError(err.message);
      setIsJoiningCall(false);
    }
  };

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (err: any) {
      console.error('Erreur chargement session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    if (!user || !sessionId) return;

    try {
      const { data: existing } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        await supabase.from('session_participants').insert({
          session_id: sessionId,
          user_id: user.id,
          status: 'joined',
          joined_at: new Date().toISOString(),
        });

        await supabase.rpc('increment_session_participants', {
          session_id: sessionId,
        });
      } else {
        await supabase
          .from('session_participants')
          .update({ 
            status: 'joined',
            joined_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      }

      if (session?.status === 'scheduled') {
        await supabase
          .from('study_sessions')
          .update({ 
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }
    } catch (err) {
      console.error('Erreur lors de la participation:', err);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!sessionId) return;

    const participantsChannel = supabase
      .channel(`session:${sessionId}:participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`session:${sessionId}:chat`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      participantsChannel.unsubscribe();
      chatChannel.unsubscribe();
    };
  };

  const loadParticipants = async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from('session_participants')
      .select(`
        id,
        user_id,
        has_video,
        has_audio,
        joined_at,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('session_id', sessionId)
      .eq('status', 'joined');

    if (data) {
      setParticipants(
        data.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          user_name: p.profiles?.full_name || 'Utilisateur',
          has_video: p.has_video,
          has_audio: p.has_audio,
          joined_at: p.joined_at,
        }))
      );
    }
  };

  const handleToggleVideo = async () => {
    if (dailyCall) {
      const newState = !isVideoEnabled;
      await toggleCamera(dailyCall, newState);
      setIsVideoEnabled(newState);
      
      if (user && sessionId) {
        await supabase
          .from('session_participants')
          .update({ has_video: newState })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);
      }
    }
  };

  const handleToggleAudio = async () => {
    if (dailyCall) {
      const newState = !isAudioEnabled;
      await toggleMicrophone(dailyCall, newState);
      setIsAudioEnabled(newState);
      
      if (user && sessionId) {
        await supabase
          .from('session_participants')
          .update({ has_audio: newState })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (dailyCall) {
      const newState = !isScreenSharing;
      await toggleScreenShare(dailyCall, newState);
      setIsScreenSharing(newState);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !sessionId) return;

    try {
      await supabase.from('session_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Erreur envoi message:', err);
    }
  };

  const leaveSession = async () => {
    if (!user || !sessionId) return;

    try {
      if (dailyCall) {
        await leaveDailyRoom(dailyCall);
      }

      await supabase
        .from('session_participants')
        .update({ 
          status: 'left',
          left_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      await supabase.rpc('decrement_session_participants', {
        session_id: sessionId,
      });

      navigate('/sessions');
    } catch (err) {
      console.error('Erreur quitter session:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Session introuvable
          </h2>
          <p className="text-gray-500 mb-6">{error || 'Cette session n\'existe pas'}</p>
          <Link
            to="/sessions"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* En-tête */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link
            to="/sessions"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-semibold">{session.title}</h1>
            <p className="text-sm text-gray-400">
              {session.scheduled_at && format(new Date(session.scheduled_at), 'PPPp', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
            <Users size={16} />
            <span className="text-sm">{participants.length}</span>
          </div>
          {!dailyConfigured && (
            <div className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg">
              Mode sans vidéo
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Zone vidéo */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Container vidéo Daily.co */}
          <div className="flex-1 p-4 overflow-y-auto relative">
            {dailyConfigured ? (
              <>
                {isJoiningCall && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                    <div className="text-center">
                      <Loader className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                      <p className="text-white text-lg">Connexion à la vidéo...</p>
                    </div>
                  </div>
                )}
                <div 
                  ref={videoContainerRef} 
                  className="w-full h-full relative"
                  style={{ minHeight: '400px' }}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Video size={64} className="mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Mode sans vidéo</h3>
                <p className="text-center max-w-md">
                  Daily.co n'est pas configuré. Consultez <code className="bg-gray-800 px-2 py-1 rounded">CLES_API_ET_OUTILS.md</code> pour ajouter la vidéo.
                </p>
                <p className="text-sm mt-4">
                  Le chat et la gestion des participants fonctionnent normalement.
                </p>
              </div>
            )}
          </div>

          {/* Contrôles vidéo */}
          <div className="bg-gray-800 px-4 py-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleToggleAudio}
                disabled={!dailyCall}
                className={`p-4 rounded-full transition-all ${
                  isAudioEnabled
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              <button
                onClick={handleToggleVideo}
                disabled={!dailyCall}
                className={`p-4 rounded-full transition-all ${
                  isVideoEnabled
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              </button>

              <button
                onClick={handleToggleScreenShare}
                disabled={!dailyCall}
                className={`p-4 rounded-full transition-all ${
                  isScreenSharing
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Monitor size={24} />
              </button>

              <button
                onClick={leaveSession}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white ml-4"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Onglets */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActivePanel('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activePanel === 'chat'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare size={16} className="inline mr-2" />
              Chat
            </button>
            <button
              onClick={() => setActivePanel('participants')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activePanel === 'participants'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Participants
            </button>
          </div>

          {/* Contenu du panneau */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activePanel === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Aucun message</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {msg.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {msg.user_name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Envoyer un message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </form>
              </>
            )}

            {activePanel === 'participants' && (
              <div className="p-4 space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                      {participant.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {participant.user_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rejoint {format(new Date(participant.joined_at), 'HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center ${
                          participant.has_video ? 'text-teal-600' : 'text-gray-300'
                        }`}
                      >
                        <Video size={16} />
                      </div>
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center ${
                          participant.has_audio ? 'text-teal-600' : 'text-gray-300'
                        }`}
                      >
                        <Mic size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
