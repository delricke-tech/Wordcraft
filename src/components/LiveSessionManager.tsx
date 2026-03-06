/**
 * Composant principal pour la gestion des sessions live
 * Phase 3.3 - Sessions & live
 * 
 * Date: 10 mars 2025
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  Calendar,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  Play,
  Square,
  MessageSquare,
  Heart,
  Download,
  FileText,
  UserPlus,
  Mail,
  Check,
  X,
  Crown,
  Shield,
  Hand,
  Globe,
  User,
  RadioIcon,
  Award,
  Lock
} from 'lucide-react';

import {
  createLiveSession,
  getUserSessions,
  getPublicSessions,
  getLiveSession,
  startLiveSession,
  endLiveSession,
  joinLiveSession,
  leaveLiveSession,
  getSessionParticipants,
  updateParticipantMedia,
  inviteToLiveSession,
  getPendingSessionInvitations,
  acceptSessionInvitation,
  declineSessionInvitation,
  sendSessionMessage,
  getSessionMessages,
  addSessionReaction,
  getSessionReactions,
  getSessionRecordings,
  generateAISummary,
  getSessionSummaries,
  getSessionStats,
  type LiveSession,
  type LiveSessionParticipant,
  type LiveSessionInvitation,
  type LiveSessionMessage,
  type LiveSessionReaction,
  type LiveSessionRecording,
  type LiveSessionSummary,
  type CreateSessionData,
  type CreateInvitationData
} from '../services/liveSessionService';

interface LiveSessionManagerProps {
  onSessionSelect?: (session: LiveSession) => void;
  selectedSessionId?: string;
}

export const LiveSessionManager: React.FC<LiveSessionManagerProps> = ({
  onSessionSelect,
  selectedSessionId
}) => {
  const [activeTab, setActiveTab] = useState<'my-sessions' | 'discover' | 'invitations' | 'recordings'>('my-sessions');
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [publicSessions, setPublicSessions] = useState<LiveSession[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<LiveSessionInvitation[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [sessionParticipants, setSessionParticipants] = useState<LiveSessionParticipant[]>([]);
  const [sessionMessages, setSessionMessages] = useState<LiveSessionMessage[]>([]);
  const [sessionReactions, setSessionReactions] = useState<LiveSessionReaction[]>([]);
  const [sessionRecordings, setSessionRecordings] = useState<LiveSessionRecording[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<LiveSessionSummary[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'ended'>('all');
  const [filterType, setFilterType] = useState<'all' | 'meeting' | 'presentation' | 'study_session' | 'workshop'>('all');

  // États pour les modaux
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // États pour la session en cours
  const [isInSession, setIsInSession] = useState(false);
  const [myParticipantInfo, setMyParticipantInfo] = useState<LiveSessionParticipant | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Formulaires
  const [newSession, setNewSession] = useState<CreateSessionData>({
    title: '',
    description: '',
    session_type: 'meeting',
    max_participants: 50,
    is_public: false,
    requires_approval: false,
    recording_enabled: false,
    screen_sharing_enabled: true,
    chat_enabled: true,
    reactions_enabled: true,
    tags: []
  });

  const [inviteData, setInviteData] = useState<CreateInvitationData>({
    role: 'participant',
    message: ''
  });

  const [newMessage, setNewMessage] = useState('');

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetails(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMySessions(),
        loadPublicSessions(),
        loadPendingInvitations()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadMySessions = async () => {
    const data = await getUserSessions();
    setSessions(data);
  };

  const loadPublicSessions = async () => {
    const data = await getPublicSessions(20);
    setPublicSessions(data);
  };

  const loadPendingInvitations = async () => {
    const data = await getPendingSessionInvitations();
    setPendingInvitations(data);
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const [session, participants, messages, reactions, recordings, summaries, stats] = await Promise.all([
        getLiveSession(sessionId),
        getSessionParticipants(sessionId),
        getSessionMessages(sessionId, 50),
        getSessionReactions(sessionId),
        getSessionRecordings(sessionId),
        getSessionSummaries(sessionId),
        getSessionStats(sessionId)
      ]);

      setSelectedSession(session);
      setSessionParticipants(participants);
      setSessionMessages(messages);
      setSessionReactions(reactions);
      setSessionRecordings(recordings);
      setSessionSummaries(summaries);
      setSessionStats(stats);
    } catch (error) {
      console.error('Erreur détails session:', error);
      toast.error('Erreur lors du chargement des détails de la session');
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.title.trim()) {
      toast.error('Le titre de la session est requis');
      return;
    }

    try {
      const session = await createLiveSession(newSession);
      toast.success('Session créée avec succès');
      setShowCreateSession(false);
      setNewSession({
        title: '',
        description: '',
        session_type: 'meeting',
        max_participants: 50,
        is_public: false,
        requires_approval: false,
        recording_enabled: false,
        screen_sharing_enabled: true,
        chat_enabled: true,
        reactions_enabled: true,
        tags: []
      });
      loadMySessions();
      setSelectedSession(session);
      onSessionSelect?.(session);
    } catch (error) {
      console.error('Erreur création session:', error);
      toast.error('Erreur lors de la création de la session');
    }
  };

  const handleStartSession = async () => {
    if (!selectedSession) return;

    try {
      const roomUrl = `https://wordcraft.daily.co/${selectedSession.id}`;
      await startLiveSession(selectedSession.id, roomUrl);
      toast.success('Session démarrée');
      loadSessionDetails(selectedSession.id);
      
      await handleJoinSession(selectedSession.id);
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      toast.error('Erreur lors du démarrage de la session');
    }
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;

    if (!confirm('Êtes-vous sûr de vouloir terminer cette session ?')) return;

    try {
      await endLiveSession(selectedSession.id);
      toast.success('Session terminée');
      loadSessionDetails(selectedSession.id);
      
      if (sessionMessages.length > 0) {
        try {
          await generateAISummary(selectedSession.id);
          toast.success('Résumé IA généré');
          loadSessionDetails(selectedSession.id);
        } catch (error) {
          console.error('Erreur génération résumé:', error);
        }
      }
    } catch (error) {
      console.error('Erreur fin session:', error);
      toast.error('Erreur lors de la fin de la session');
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const participant = await joinLiveSession(sessionId);
      setIsInSession(true);
      setMyParticipantInfo(participant);
      toast.success('Vous avez rejoint la session');
      loadSessionDetails(sessionId);
    } catch (error) {
      console.error('Erreur rejoindre session:', error);
      toast.error('Erreur lors de la connexion à la session');
    }
  };

  const handleLeaveSession = async () => {
    if (!selectedSession) return;

    try {
      await leaveLiveSession(selectedSession.id);
      setIsInSession(false);
      setMyParticipantInfo(null);
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
      setIsScreenSharing(false);
      setIsHandRaised(false);
      toast.success('Vous avez quitté la session');
      loadSessionDetails(selectedSession.id);
    } catch (error) {
      console.error('Erreur quitter session:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleInviteToSession = async () => {
    if (!selectedSession || !inviteData.invited_email) {
      toast.error('L\'email est requis');
      return;
    }

    try {
      await inviteToLiveSession(selectedSession.id, inviteData);
      toast.success('Invitation envoyée avec succès');
      setShowInviteModal(false);
      setInviteData({ role: 'participant', message: '' });
    } catch (error) {
      console.error('Erreur invitation session:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptSessionInvitation(invitationId);
      toast.success('Invitation acceptée');
      loadPendingInvitations();
      loadMySessions();
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      toast.error('Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineSessionInvitation(invitationId);
      toast.success('Invitation refusée');
      loadPendingInvitations();
    } catch (error) {
      console.error('Erreur refus invitation:', error);
      toast.error('Erreur lors du refus de l\'invitation');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    try {
      await sendSessionMessage(selectedSession.id, newMessage);
      setNewMessage('');
      loadSessionDetails(selectedSession.id);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleAddReaction = async (reactionType: LiveSessionReaction['reaction_type'], reactionValue: string) => {
    if (!selectedSession) return;

    try {
      await addSessionReaction(selectedSession.id, reactionType, reactionValue, 'session');
      toast.success('Réaction ajoutée');
      loadSessionDetails(selectedSession.id);
    } catch (error) {
      console.error('Erreur ajout réaction:', error);
      toast.error('Erreur lors de l\'ajout de la réaction');
    }
  };

  const handleToggleAudio = async () => {
    if (!selectedSession || !myParticipantInfo) return;

    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);
    
    try {
      await updateParticipantMedia(selectedSession.id, myParticipantInfo.user_id, {
        audio_enabled: newAudioState
      });
    } catch (error) {
      console.error('Erreur toggle audio:', error);
      setIsAudioEnabled(!newAudioState);
    }
  };

  const handleToggleVideo = async () => {
    if (!selectedSession || !myParticipantInfo) return;

    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);
    
    try {
      await updateParticipantMedia(selectedSession.id, myParticipantInfo.user_id, {
        video_enabled: newVideoState
      });
    } catch (error) {
      console.error('Erreur toggle video:', error);
      setIsVideoEnabled(!newVideoState);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!selectedSession || !myParticipantInfo) return;

    const newScreenShareState = !isScreenSharing;
    setIsScreenSharing(newScreenShareState);
    
    try {
      await updateParticipantMedia(selectedSession.id, myParticipantInfo.user_id, {
        screen_sharing: newScreenShareState
      });
    } catch (error) {
      console.error('Erreur toggle screen share:', error);
      setIsScreenSharing(!newScreenShareState);
    }
  };

  const handleToggleHand = async () => {
    if (!selectedSession || !myParticipantInfo) return;

    const newHandState = !isHandRaised;
    setIsHandRaised(newHandState);
    
    try {
      await updateParticipantMedia(selectedSession.id, myParticipantInfo.user_id, {
        hand_raised: newHandState
      });
    } catch (error) {
      console.error('Erreur toggle hand:', error);
      setIsHandRaised(!newHandState);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesType = filterType === 'all' || session.session_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getSessionTypeIcon = (type: LiveSession['session_type']) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'presentation': return <Monitor className="w-4 h-4" />;
      case 'study_session': return <FileText className="w-4 h-4" />;
      case 'workshop': return <Award className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getSessionTypeLabel = (type: LiveSession['session_type']) => {
    switch (type) {
      case 'meeting': return 'Réunion';
      case 'presentation': return 'Présentation';
      case 'study_session': return 'Session d\'étude';
      case 'workshop': return 'Atelier';
      default: return 'Session';
    }
  };

  const getStatusColor = (status: LiveSession['status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400';
      case 'live': return 'text-green-400';
      case 'ended': return 'text-gray-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: LiveSession['status']) => {
    switch (status) {
      case 'scheduled': return 'Programmée';
      case 'live': return 'En direct';
      case 'ended': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnue';
    }
  };

  const getRoleIcon = (role: LiveSessionParticipant['role']) => {
    switch (role) {
      case 'host': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'speaker': return <RadioIcon className="w-4 h-4 text-green-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: LiveSessionParticipant['role']) => {
    switch (role) {
      case 'host': return 'Hôte';
      case 'moderator': return 'Modérateur';
      case 'speaker': return 'Intervenant';
      default: return 'Participant';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-6 h-6" />
            Sessions Live
          </h2>
          <button
            onClick={() => setShowCreateSession(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle session
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('my-sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'my-sessions'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Video className="w-4 h-4 inline mr-2" />
            Mes sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Découvrir
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
              activeTab === 'invitations'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Invitations
            {pendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingInvitations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'recordings'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Enregistrements
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Rechercher une session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
          >
            <option value="all">Tous les statuts</option>
            <option value="scheduled">Programmées</option>
            <option value="live">En direct</option>
            <option value="ended">Terminées</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
          >
            <option value="all">Tous les types</option>
            <option value="meeting">Réunions</option>
            <option value="presentation">Présentations</option>
            <option value="study_session">Sessions d'étude</option>
            <option value="workshop">Ateliers</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'my-sessions' && (
            <motion.div
              key="my-sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Sessions List */}
                <div className="lg:col-span-1 overflow-y-auto p-6">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Video className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">Aucune session trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSessions.map((session) => (
                        <motion.div
                          key={session.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedSession(session);
                            onSessionSelect?.(session);
                          }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedSession?.id === session.id
                              ? 'bg-white/20 border-white/40'
                              : 'bg-white/10 border-white/20 hover:bg-white/15'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                                {getSessionTypeIcon(session.session_type)}
                                {session.title}
                              </h3>
                              {session.description && (
                                <p className="text-white/60 text-sm line-clamp-2">{session.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs font-medium ${getStatusColor(session.status)}`}>
                                {getStatusLabel(session.status)}
                              </span>
                              {session.is_public ? (
                                <Globe className="w-3 h-3 text-white/60" />
                              ) : (
                                <Lock className="w-3 h-3 text-white/60" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-white/60 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {session.current_participants || 0}/{session.max_participants}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {session.scheduled_start ? new Date(session.scheduled_start).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.scheduled_start ? new Date(session.scheduled_start).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Session Details */}
                <div className="lg:col-span-2 border-l border-white/10 overflow-y-auto">
                  {selectedSession ? (
                    <div className="p-6">
                      {/* Session Header */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                              {getSessionTypeIcon(selectedSession.session_type)}
                              {selectedSession.title}
                            </h2>
                            {selectedSession.description && (
                              <p className="text-white/60">{selectedSession.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                              {getStatusLabel(selectedSession.status)}
                            </span>
                          </div>
                        </div>

                        {/* Session Actions */}
                        <div className="flex gap-3 mb-4">
                          {selectedSession.status === 'scheduled' && (
                            <button
                              onClick={handleStartSession}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Démarrer
                            </button>
                          )}
                          {selectedSession.status === 'live' && (
                            <button
                              onClick={handleEndSession}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Square className="w-4 h-4" />
                              Terminer
                            </button>
                          )}
                          {selectedSession.status === 'live' && !isInSession && (
                            <button
                              onClick={() => handleJoinSession(selectedSession.id)}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              Rejoindre
                            </button>
                          )}
                          {selectedSession.status === 'live' && isInSession && (
                            <button
                              onClick={handleLeaveSession}
                              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <VideoOff className="w-4 h-4" />
                              Quitter
                            </button>
                          )}
                          <button
                            onClick={() => setShowInviteModal(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Inviter
                          </button>
                        </div>

                        {/* Session Stats */}
                        {sessionStats && (
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-lg p-3">
                              <Users className="w-5 h-5 text-white/60 mb-1" />
                              <p className="text-white font-semibold">{sessionStats.currentParticipants}</p>
                              <p className="text-white/60 text-xs">Participants actuels</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <MessageSquare className="w-5 h-5 text-white/60 mb-1" />
                              <p className="text-white font-semibold">{sessionStats.totalMessages}</p>
                              <p className="text-white/60 text-xs">Messages</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <Heart className="w-5 h-5 text-white/60 mb-1" />
                              <p className="text-white font-semibold">{sessionStats.totalReactions}</p>
                              <p className="text-white/60 text-xs">Réactions</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <Clock className="w-5 h-5 text-white/60 mb-1" />
                              <p className="text-white font-semibold">{Math.round(sessionStats.averageDuration / 60)}min</p>
                              <p className="text-white/60 text-xs">Durée moyenne</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Session Controls */}
                      {isInSession && (
                        <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
                          <h3 className="text-lg font-semibold text-white mb-3">Contrôles de session</h3>
                          <div className="flex gap-3">
                            <button
                              onClick={handleToggleAudio}
                              className={`p-3 rounded-lg transition-colors ${
                                isAudioEnabled 
                                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={handleToggleVideo}
                              className={`p-3 rounded-lg transition-colors ${
                                isVideoEnabled 
                                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={handleToggleScreenShare}
                              className={`p-3 rounded-lg transition-colors ${
                                isScreenSharing 
                                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                  : 'bg-gray-500 hover:bg-gray-600 text-white'
                              }`}
                            >
                              {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={handleToggleHand}
                              className={`p-3 rounded-lg transition-colors ${
                                isHandRaised 
                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                  : 'bg-gray-500 hover:bg-gray-600 text-white'
                              }`}
                            >
                              <Hand className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Participants */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Participants ({sessionParticipants.length})</h3>
                        <div className="space-y-2">
                          {sessionParticipants.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {getRoleIcon(participant.role)}
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-xs">
                                  {participant.user_display_name?.charAt(0) || participant.user_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="text-white font-medium">
                                    {participant.user_display_name || participant.user_name}
                                  </p>
                                  <p className="text-white/60 text-xs">{getRoleLabel(participant.role)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {participant.audio_enabled && <Mic className="w-3 h-3 text-green-400" />}
                                {participant.video_enabled && <Video className="w-3 h-3 text-green-400" />}
                                {participant.screen_sharing && <Monitor className="w-3 h-3 text-blue-400" />}
                                {participant.hand_raised && <Hand className="w-3 h-3 text-yellow-400" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Chat */}
                      {selectedSession.chat_enabled && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-3">Chat</h3>
                          <div className="bg-white/5 rounded-lg border border-white/20 p-4 h-64 overflow-y-auto mb-3">
                            {sessionMessages.length === 0 ? (
                              <p className="text-white/60 text-center">Aucun message pour le moment</p>
                            ) : (
                              <div className="space-y-3">
                                {sessionMessages.map((message) => (
                                  <div key={message.id} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-xs">
                                      {message.user_display_name?.charAt(0) || message.user_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white font-medium text-sm">
                                          {message.user_display_name || message.user_name}
                                        </p>
                                        <p className="text-white/60 text-xs">
                                          {new Date(message.created_at).toLocaleTimeString()}
                                        </p>
                                      </div>
                                      <p className="text-white/80 text-sm">{message.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {isInSession && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Tapez votre message..."
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                              />
                              <button
                                onClick={handleSendMessage}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                              >
                                Envoyer
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reactions */}
                      {selectedSession.reactions_enabled && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-3">Réactions</h3>
                          <div className="flex gap-2 mb-3">
                            {['👍', '❤️', '😂', '👏', '🎉'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction('emoji', emoji)}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-2xl transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recordings */}
                      {sessionRecordings.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-3">Enregistrements ({sessionRecordings.length})</h3>
                          <div className="space-y-2">
                            {sessionRecordings.map((recording) => (
                              <div key={recording.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Download className="w-4 h-4 text-white/60" />
                                  <div>
                                    <p className="text-white text-sm font-medium">
                                      {recording.recording_type} - {Math.round((recording.duration_seconds || 0) / 60)}min
                                    </p>
                                    <p className="text-white/60 text-xs">
                                      {new Date(recording.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={recording.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                                >
                                  Télécharger
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summaries */}
                      {sessionSummaries.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Résumés ({sessionSummaries.length})</h3>
                          <div className="space-y-3">
                            {sessionSummaries.map((summary) => (
                              <div key={summary.id} className="p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-white font-medium">{summary.title}</h4>
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                    {summary.summary_type}
                                  </span>
                                </div>
                                <p className="text-white/80 text-sm mb-2">{summary.content}</p>
                                {summary.key_points.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-white/60 text-xs mb-1">Points clés:</p>
                                    <ul className="list-disc list-inside text-white/80 text-sm">
                                      {summary.key_points.map((point, index) => (
                                        <li key={index}>{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Video className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">Sélectionnez une session pour voir les détails</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Sessions publiques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedSession(session);
                      onSessionSelect?.(session);
                    }}
                    className="p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                          {getSessionTypeIcon(session.session_type)}
                          {session.title}
                        </h4>
                        {session.description && (
                          <p className="text-white/60 text-sm line-clamp-2">{session.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusLabel(session.status)}
                        </span>
                        <Globe className="w-3 h-3 text-white/60" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {session.current_participants || 0}/{session.max_participants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {session.scheduled_start ? new Date(session.scheduled_start).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Rejoindre
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'invitations' && (
            <motion.div
              key="invitations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Invitations reçues</h3>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Aucune invitation en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{invitation.session_title}</h4>
                          <p className="text-white/60 text-sm">
                            Invité par {invitation.host_display_name || invitation.host_name} • {getRoleLabel(invitation.role)}
                          </p>
                          {invitation.scheduled_start && (
                            <p className="text-white/60 text-sm">
                              {new Date(invitation.scheduled_start).toLocaleString()}
                            </p>
                          )}
                          {invitation.message && (
                            <p className="text-white/80 mt-2">{invitation.message}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                          En attente
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recordings' && (
            <motion.div
              key="recordings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Enregistrements de session</h3>
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Sélectionnez une session pour voir ses enregistrements</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCreateSession(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Créer une nouvelle session</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Titre *</label>
                    <input
                      type="text"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="Ma session live"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Type de session</label>
                    <select
                      value={newSession.session_type}
                      onChange={(e) => setNewSession({ ...newSession, session_type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="meeting">Réunion</option>
                      <option value="presentation">Présentation</option>
                      <option value="study_session">Session d'étude</option>
                      <option value="workshop">Atelier</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
                    rows={3}
                    placeholder="Description de la session..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Nombre maximum de participants</label>
                    <input
                      type="number"
                      value={newSession.max_participants}
                      onChange={(e) => setNewSession({ ...newSession, max_participants: parseInt(e.target.value) || 50 })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      min="2"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Mot de passe (optionnel)</label>
                    <input
                      type="password"
                      value={newSession.password || ''}
                      onChange={(e) => setNewSession({ ...newSession, password: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="Mot de passe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Tags</label>
                  <input
                    type="text"
                    value={newSession.tags?.join(', ') || ''}
                    onChange={(e) => setNewSession({ ...newSession, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                    placeholder="éducation, technologie, design..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={newSession.is_public}
                      onChange={(e) => setNewSession({ ...newSession, is_public: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="is_public" className="text-white/80 text-sm">Session publique</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requires_approval"
                      checked={newSession.requires_approval}
                      onChange={(e) => setNewSession({ ...newSession, requires_approval: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="requires_approval" className="text-white/80 text-sm">Nécessite une approbation</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recording_enabled"
                      checked={newSession.recording_enabled}
                      onChange={(e) => setNewSession({ ...newSession, recording_enabled: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="recording_enabled" className="text-white/80 text-sm">Activer l'enregistrement</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="screen_sharing_enabled"
                      checked={newSession.screen_sharing_enabled}
                      onChange={(e) => setNewSession({ ...newSession, screen_sharing_enabled: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="screen_sharing_enabled" className="text-white/80 text-sm">Partage d'écran</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chat_enabled"
                      checked={newSession.chat_enabled}
                      onChange={(e) => setNewSession({ ...newSession, chat_enabled: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="chat_enabled" className="text-white/80 text-sm">Chat activé</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="reactions_enabled"
                      checked={newSession.reactions_enabled}
                      onChange={(e) => setNewSession({ ...newSession, reactions_enabled: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="reactions_enabled" className="text-white/80 text-sm">Réactions activées</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateSession(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSession}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Inviter à la session</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={inviteData.invited_email}
                    onChange={(e) => setInviteData({ ...inviteData, invited_email: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Rôle</label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="participant">Participant</option>
                    <option value="moderator">Modérateur</option>
                    <option value="speaker">Intervenant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Message (optionnel)</label>
                  <textarea
                    value={inviteData.message}
                    onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
                    rows={3}
                    placeholder="Message d'invitation..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInviteToSession}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                >
                  Inviter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
