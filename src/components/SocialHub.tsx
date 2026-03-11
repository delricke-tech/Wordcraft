/**
 * Composant principal pour le hub social
 * Phase 3.2 - Social & découverte
 * 
 * Date: 9 mars 2025
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Search,
  TrendingUp,
  Globe,
  UserPlus,
  Mail,
  Check,
  X,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Star,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  Settings,
  Edit,
  Plus,
  Filter,
  Bell,
  Activity,
  Award,
  BookOpen,
  Target,
  Hash
} from 'lucide-react';

import {
  createOrUpdatePublicProfile,
  getMyPublicProfile,
  getPublicProfile,
  searchPublicProfiles,
  sendFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  withdrawFriendRequest,
  getUserFriends,
  removeFriend,
  getSocialActivityFeed,
  getTrendingGroups,
  getSuggestedGroups,
  logDiscoveryView,
  searchGroups,
  addUserInterest,
  getUserInterests,
  removeUserInterest,
  getPopularInterests,
  getUserSocialStats,
  getFriendSuggestions,
  type PublicProfile,
  type FriendRequest,
  type Friendship,
  type ActivityFeedItem,
  type TrendingGroup,
  type SuggestedGroup,
  type UserInterest,
  type CreateProfileData
} from '../services/socialService';

interface SocialHubProps {
  onProfileClick?: (profile: PublicProfile) => void;
  onGroupClick?: (group: any) => void;
}

export const SocialHub: React.FC<SocialHubProps> = ({
  onProfileClick,
  onGroupClick
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'friends' | 'activity' | 'profile'>('discover');
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // États pour chaque section
  const [trendingGroups, setTrendingGroups] = useState<TrendingGroup[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<PublicProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [popularInterests, setPopularInterests] = useState<{ interest: string; count: number }[]>([]);
  const [socialStats, setSocialStats] = useState<any>(null);

  // États pour les modaux
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  // Formulaires
  const [profileForm, setProfileForm] = useState<CreateProfileData>({
    display_name: '',
    bio: '',
    is_public: true,
    show_email: false,
    show_groups: true,
    show_stats: true,
    allow_friend_requests: true,
    interests: [],
    skills: []
  });

  const [newInterest, setNewInterest] = useState({
    interest: '',
    category: 'other' as const,
    proficiency_level: 1
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMyProfile(),
        loadTrendingGroups(),
        loadSuggestedGroups(),
        loadFriendSuggestions(),
        loadReceivedRequests(),
        loadSentRequests(),
        loadFriends(),
        loadActivityFeed(),
        loadUserInterests(),
        loadPopularInterests(),
        loadSocialStats()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadMyProfile = async () => {
    const profile = await getMyPublicProfile();
    setMyProfile(profile);
    if (profile) {
      setProfileForm({
        display_name: profile.display_name,
        bio: profile.bio || '',
        avatar_url: profile.avatar_url,
        cover_image_url: profile.cover_image_url,
        location: profile.location,
        website: profile.website,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        twitter_url: profile.twitter_url,
        is_public: profile.is_public,
        show_email: profile.show_email,
        show_groups: profile.show_groups,
        show_stats: profile.show_stats,
        allow_friend_requests: profile.allow_friend_requests,
        interests: profile.interests || [],
        skills: profile.skills || [],
        education: profile.education || [],
        experience: profile.experience || []
      });
    }
  };

  const loadTrendingGroups = async () => {
    const groups = await getTrendingGroups(10);
    setTrendingGroups(groups);
  };

  const loadSuggestedGroups = async () => {
    const groups = await getSuggestedGroups(20);
    setSuggestedGroups(groups);
  };

  const loadFriendSuggestions = async () => {
    const suggestions = await getFriendSuggestions(10);
    setFriendSuggestions(suggestions);
  };

  const loadReceivedRequests = async () => {
    const requests = await getReceivedFriendRequests();
    setReceivedRequests(requests);
  };

  const loadSentRequests = async () => {
    const requests = await getSentFriendRequests();
    setSentRequests(requests);
  };

  const loadFriends = async () => {
    const friendsList = await getUserFriends();
    setFriends(friendsList);
  };

  const loadActivityFeed = async () => {
    const feed = await getSocialActivityFeed(20);
    setActivityFeed(feed);
  };

  const loadUserInterests = async () => {
    const interests = await getUserInterests();
    setUserInterests(interests);
  };

  const loadPopularInterests = async () => {
    const interests = await getPopularInterests(30);
    setPopularInterests(interests);
  };

  const loadSocialStats = async () => {
    const stats = await getUserSocialStats();
    setSocialStats(stats);
  };

  // Gestionnaires d'événements
  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await createOrUpdatePublicProfile(profileForm);
      setMyProfile(updatedProfile);
      setShowEditProfile(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      await sendFriendRequest(receiverId);
      toast.success('Demande d\'ami envoyée');
      loadSentRequests();
      loadFriendSuggestions();
    } catch (error) {
      console.error('Erreur envoi demande:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success('Demande acceptée');
      loadReceivedRequests();
      loadFriends();
      loadActivityFeed();
    } catch (error) {
      console.error('Erreur acceptation:', error);
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      toast.success('Demande refusée');
      loadReceivedRequests();
    } catch (error) {
      console.error('Erreur refus:', error);
      toast.error('Erreur lors du refus');
    }
  };

  const handleWithdrawFriendRequest = async (requestId: string) => {
    try {
      await withdrawFriendRequest(requestId);
      toast.success('Demande retirée');
      loadSentRequests();
    } catch (error) {
      console.error('Erreur retrait:', error);
      toast.error('Erreur lors du retrait');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ami ?')) return;
    
    try {
      await removeFriend(friendId);
      toast.success('Ami supprimé');
      loadFriends();
      loadSocialStats();
    } catch (error) {
      console.error('Erreur suppression ami:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.interest.trim()) {
      toast.error('L\'intérêt est requis');
      return;
    }

    try {
      await addUserInterest(newInterest.interest, newInterest.category, newInterest.proficiency_level);
      toast.success('Intérêt ajouté');
      setShowAddInterest(false);
      setNewInterest({ interest: '', category: 'other', proficiency_level: 1 });
      loadUserInterests();
      loadSuggestedGroups();
      loadFriendSuggestions();
    } catch (error) {
      console.error('Erreur ajout intérêt:', error);
      toast.error('Erreur lors de l\'ajout de l\'intérêt');
    }
  };

  const handleRemoveInterest = async (interestId: string) => {
    try {
      await removeUserInterest(interestId);
      toast.success('Intérêt supprimé');
      loadUserInterests();
      loadSuggestedGroups();
      loadFriendSuggestions();
    } catch (error) {
      console.error('Erreur suppression intérêt:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const [profiles, groups] = await Promise.all([
        searchPublicProfiles(searchQuery, 10),
        searchGroups(searchQuery, 10)
      ]);
      
      setSearchResults([...profiles, ...groups]);
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleViewProfile = async (profile: PublicProfile) => {
    await logDiscoveryView('user', profile.user_id);
    setSelectedProfile(profile);
    onProfileClick?.(profile);
  };

  const handleViewGroup = async (group: any) => {
    await logDiscoveryView('group', group.id);
    onGroupClick?.(group);
  };

  const getActionIcon = (actionType: ActivityFeedItem['action_type']) => {
    switch (actionType) {
      case 'joined_group': return <Users className="w-4 h-4" />;
      case 'shared_document': return <FileText className="w-4 h-4" />;
      case 'shared_card': return <BookOpen className="w-4 h-4" />;
      case 'shared_quiz': return <Brain className="w-4 h-4" />;
      case 'created_group': return <Plus className="w-4 h-4" />;
      case 'added_friend': return <UserPlus className="w-4 h-4" />;
      case 'left_group': return <X className="w-4 h-4" />;
      case 'updated_profile': return <Edit className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionLabel = (actionType: ActivityFeedItem['action_type']) => {
    switch (actionType) {
      case 'joined_group': return 'a rejoint le groupe';
      case 'shared_document': return 'a partagé un document';
      case 'shared_card': return 'a partagé une fiche';
      case 'shared_quiz': return 'a partagé un quiz';
      case 'created_group': return 'a créé le groupe';
      case 'added_friend': return 's\'est connecté avec';
      case 'left_group': return 'a quitté le groupe';
      case 'updated_profile': return 'a mis à jour son profil';
      default: return 'a effectué une action';
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
            <Globe className="w-6 h-6" />
            Hub Social
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
            <div className="relative">
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Bell className="w-4 h-4 text-white" />
              </button>
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Stats */}
        {myProfile && socialStats && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Users className="w-5 h-5 text-white/60 mx-auto mb-1" />
              <p className="text-white font-semibold">{socialStats.friendsCount}</p>
              <p className="text-white/60 text-xs">Amis</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Users className="w-5 h-5 text-white/60 mx-auto mb-1" />
              <p className="text-white font-semibold">{socialStats.groupsCount}</p>
              <p className="text-white/60 text-xs">Groupes</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <FileText className="w-5 h-5 text-white/60 mx-auto mb-1" />
              <p className="text-white font-semibold">{socialStats.sharedDocumentsCount}</p>
              <p className="text-white/60 text-xs">Documents</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <BookOpen className="w-5 h-5 text-white/60 mx-auto mb-1" />
              <p className="text-white font-semibold">{socialStats.sharedCardsCount}</p>
              <p className="text-white/60 text-xs">Fiches</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Découverte
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
              activeTab === 'friends'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Amis
            {receivedRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {receivedRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'activity'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Activité
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profil
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Rechercher des profils ou groupes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Résultats de recherche</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                        onClick={() => result.user_id ? handleViewProfile(result) : handleViewGroup(result)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                            {result.user_id ? result.display_name?.charAt(0) || 'U' : result.name?.charAt(0) || 'G'}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              {result.user_id ? result.display_name : result.name}
                            </h4>
                            <p className="text-white/60 text-sm">
                              {result.user_id ? 'Profil' : 'Groupe'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Groups */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Groupes tendances
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingGroups.map((group) => (
                    <motion.div
                      key={group.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleViewGroup(group)}
                      className="p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium">{group.name}</h4>
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                          Tendance
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-white/60 text-sm mb-3 line-clamp-2">{group.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.current_member_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {group.messages_last_week || 0}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Suggested Groups */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Groupes suggérés
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedGroups.slice(0, 6).map((group) => (
                    <motion.div
                      key={group.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleViewGroup(group)}
                      className="p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <h4 className="text-white font-medium mb-2">{group.name}</h4>
                      {group.description && (
                        <p className="text-white/60 text-sm mb-2 line-clamp-2">{group.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">
                          {group.member_count || 0} membres
                        </span>
                        {group.interest_similarity_score > 0 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            {Math.round(group.interest_similarity_score)}% compatible
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Friend Suggestions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Suggestions d'amis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendSuggestions.map((profile) => (
                    <motion.div
                      key={profile.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white/10 rounded-lg border border-white/20"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                          {profile.display_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{profile.display_name}</h4>
                          {profile.bio && (
                            <p className="text-white/60 text-sm line-clamp-1">{profile.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProfile(profile)}
                          className="flex-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          Voir
                        </button>
                        <button
                          onClick={() => handleSendFriendRequest(profile.user_id)}
                          className="flex-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                        >
                          <UserPlus className="w-3 h-3 inline mr-1" />
                          Ajouter
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Friend Requests */}
              {receivedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Demandes reçues</h3>
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-white/10 rounded-lg border border-white/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                              {request.sender_display_name?.charAt(0) || request.sender_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">
                                {request.sender_display_name || request.sender_name}
                              </h4>
                              {request.message && (
                                <p className="text-white/60 text-sm">{request.message}</p>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                            En attente
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptFriendRequest(request.id)}
                            className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                          >
                            <Check className="w-3 h-3 inline mr-1" />
                            Accepter
                          </button>
                          <button
                            onClick={() => handleDeclineFriendRequest(request.id)}
                            className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                          >
                            <X className="w-3 h-3 inline mr-1" />
                            Refuser
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Demandes envoyées</h3>
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-white/10 rounded-lg border border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                              {request.receiver_display_name?.charAt(0) || request.receiver_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">
                                {request.receiver_display_name || request.receiver_name}
                              </h4>
                              <p className="text-white/60 text-sm">Envoyée le {new Date(request.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              En attente
                            </span>
                            <button
                              onClick={() => handleWithdrawFriendRequest(request.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Mes amis ({friends.length})</h3>
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">Aucun ami pour le moment</p>
                    <p className="text-white/40 text-sm mt-2">Explorez la section découverte pour trouver des personnes intéressantes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-white/10 rounded-lg border border-white/20"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                            {friend.friend_display_name?.charAt(0) || friend.friend_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              {friend.friend_display_name || friend.friend_name}
                            </h4>
                            {friend.friend_bio && (
                              <p className="text-white/60 text-sm line-clamp-1">{friend.friend_bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewProfile({ user_id: friend.friend_id!, display_name: friend.friend_display_name || friend.friend_name || '' } as PublicProfile)}
                            className="flex-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            Voir profil
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friend.friend_id!)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Fil d'activité</h3>
              {activityFeed.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map((activity) => (
                    <div key={activity.id} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-sm">
                          {activity.actor_display_name?.charAt(0) || activity.actor_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">
                              {activity.actor_display_name || activity.actor_name}
                            </span>
                            <span className="text-white/60 text-sm">
                              {getActionLabel(activity.action_type)}
                            </span>
                          </div>
                          {activity.target_name && (
                            <p className="text-white/80 text-sm mb-1">{activity.target_name}</p>
                          )}
                          <p className="text-white/60 text-xs">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 bg-white/10 rounded-lg">
                          {getActionIcon(activity.action_type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Profile View */}
              {myProfile ? (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        {myProfile.display_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{myProfile.display_name}</h3>
                        {myProfile.location && (
                          <p className="text-white/60 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {myProfile.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4 inline mr-2" />
                      Modifier
                    </button>
                  </div>

                  {/* Bio */}
                  {myProfile.bio && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-2">Bio</h4>
                      <p className="text-white/80">{myProfile.bio}</p>
                    </div>
                  )}

                  {/* Interests */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Hash className="w-5 h-5" />
                        Intérêts
                      </h4>
                      <button
                        onClick={() => setShowAddInterest(true)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        Ajouter
                      </button>
                    </div>
                    {userInterests.length === 0 ? (
                      <p className="text-white/60">Aucun intérêt ajouté</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {userInterests.map((interest) => (
                          <span
                            key={interest.id}
                            className="px-3 py-1 bg-white/10 text-white rounded-full text-sm flex items-center gap-2"
                          >
                            {interest.interest}
                            <button
                              onClick={() => handleRemoveInterest(interest.id)}
                              className="text-white/60 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(myProfile.website || myProfile.github_url || myProfile.linkedin_url || myProfile.twitter_url) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Réseaux sociaux</h4>
                      <div className="flex flex-wrap gap-3">
                        {myProfile.website && (
                          <a
                            href={myProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Site web
                          </a>
                        )}
                        {myProfile.github_url && (
                          <a
                            href={myProfile.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                          >
                            <Github className="w-4 h-4" />
                            GitHub
                          </a>
                        )}
                        {myProfile.linkedin_url && (
                          <a
                            href={myProfile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                        )}
                        {myProfile.twitter_url && (
                          <a
                            href={myProfile.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                            Twitter
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">Vous n'avez pas encore de profil public</p>
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                  >
                    Créer mon profil
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Modifier mon profil</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Nom d'affichage *</label>
                    <input
                      type="text"
                      value={profileForm.display_name}
                      onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Localisation</label>
                    <input
                      type="text"
                      value={profileForm.location || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="Ville, Pays"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
                    rows={3}
                    placeholder="Parlez-vous de vous..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Site web</label>
                    <input
                      type="url"
                      value={profileForm.website || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">GitHub</label>
                    <input
                      type="url"
                      value={profileForm.github_url || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={profileForm.linkedin_url || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Twitter</label>
                    <input
                      type="url"
                      value={profileForm.twitter_url || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Intérêts</label>
                    <input
                      type="text"
                      value={profileForm.interests?.join(', ') || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="JavaScript, React, Design..."
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-1">Compétences</label>
                    <input
                      type="text"
                      value={profileForm.skills?.join(', ') || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                      placeholder="Développement, Design, Marketing..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={profileForm.is_public}
                      onChange={(e) => setProfileForm({ ...profileForm, is_public: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="is_public" className="text-white/80 text-sm">Profil public</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_email"
                      checked={profileForm.show_email}
                      onChange={(e) => setProfileForm({ ...profileForm, show_email: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="show_email" className="text-white/80 text-sm">Afficher mon email</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_groups"
                      checked={profileForm.show_groups}
                      onChange={(e) => setProfileForm({ ...profileForm, show_groups: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="show_groups" className="text-white/80 text-sm">Afficher mes groupes</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_stats"
                      checked={profileForm.show_stats}
                      onChange={(e) => setProfileForm({ ...profileForm, show_stats: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="show_stats" className="text-white/80 text-sm">Afficher mes statistiques</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allow_friend_requests"
                      checked={profileForm.allow_friend_requests}
                      onChange={(e) => setProfileForm({ ...profileForm, allow_friend_requests: e.target.checked })}
                      className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="allow_friend_requests" className="text-white/80 text-sm">Autoriser les demandes d'amis</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Interest Modal */}
      <AnimatePresence>
        {showAddInterest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowAddInterest(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Ajouter un intérêt</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Intérêt *</label>
                  <input
                    type="text"
                    value={newInterest.interest}
                    onChange={(e) => setNewInterest({ ...newInterest, interest: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                    placeholder="JavaScript, Design, Photographie..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={newInterest.category}
                    onChange={(e) => setNewInterest({ ...newInterest, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="academic">Académique</option>
                    <option value="professional">Professionnel</option>
                    <option value="hobby">Loisir</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Niveau de maîtrise</label>
                  <select
                    value={newInterest.proficiency_level}
                    onChange={(e) => setNewInterest({ ...newInterest, proficiency_level: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="1">Débutant</option>
                    <option value="2">Intermédiaire</option>
                    <option value="3">Avancé</option>
                    <option value="4">Expert</option>
                    <option value="5">Maître</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddInterest(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddInterest}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
