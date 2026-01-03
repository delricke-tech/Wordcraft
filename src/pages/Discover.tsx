import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Clock,
  School,
  MapPin,
  TrendingUp,
  Search,
  Sparkles,
  Check,
  X as XIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

type UserSuggestion = {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  study_field?: string;
  institution?: string;
  connections_count: number;
  common_institution: boolean;
  common_study_field: boolean;
  mutual_connections: number;
  suggestion_score: number;
};

type ConnectionRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
    study_field?: string;
  };
};

export function Discover() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'new' | 'requests' | 'search'>('suggestions');

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer les suggestions personnalisées
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .rpc('get_user_suggestions', {
          for_user_id: user.id,
          limit_count: 20,
        });

      if (suggestionsError) throw suggestionsError;
      setSuggestions(suggestionsData || []);

      // Récupérer les nouveaux utilisateurs
      const { data: newUsersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12)
        .neq('id', user.id);

      setNewUsers(newUsersData || []);

      // Récupérer les demandes de connexion reçues
      const { data: requestsData } = await supabase
        .from('connection_requests')
        .select(`
          *,
          sender:sender_id (
            full_name,
            avatar_url,
            study_field
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchQuery,
        limit_count: 15,
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('connection_requests').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Demande de connexion envoyée !');
      fetchData(); // Rafraîchir pour retirer de la liste
    } catch (error: any) {
      console.error('Error sending request:', error);
      if (error.code === '23505') {
        toast.error('Demande déjà envoyée');
      } else {
        toast.error('Impossible d\'envoyer la demande');
      }
    }
  };

  const handleConnectionRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        const { error } = await supabase.rpc('accept_connection_request', {
          request_id: requestId,
        });
        if (error) throw error;
        toast.success('Connexion acceptée ! 🎉');
      } else {
        const { error } = await supabase.rpc('reject_connection_request', {
          request_id: requestId,
        });
        if (error) throw error;
        toast.info('Demande refusée');
      }

      fetchData(); // Rafraîchir
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const renderUserCard = (userData: any, showConnectButton = true) => (
    <div key={userData.user_id || userData.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <Link to={`/profile/${userData.user_id || userData.id}`}>
          {userData.avatar_url ? (
            <img
              src={userData.avatar_url}
              alt={userData.full_name}
              className="w-20 h-20 rounded-full object-cover mb-3 hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {(userData.full_name || 'U')[0].toUpperCase()}
            </div>
          )}
        </Link>

        {/* Nom */}
        <Link
          to={`/profile/${userData.user_id || userData.id}`}
          className="font-semibold text-gray-900 hover:text-teal-600 mb-1"
        >
          {userData.full_name || 'Utilisateur'}
        </Link>

        {/* Infos */}
        <div className="space-y-1 mb-3 w-full">
          {userData.study_field && (
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <School size={14} />
              {userData.study_field}
            </p>
          )}
          {userData.institution && (
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <MapPin size={12} />
              {userData.institution}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {userData.common_institution && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              Même école
            </span>
          )}
          {userData.common_study_field && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
              Même domaine
            </span>
          )}
          {userData.mutual_connections > 0 && (
            <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
              {userData.mutual_connections} ami(s) en commun
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users size={14} />
            {userData.connections_count || 0} connexions
          </span>
        </div>

        {/* Bouton */}
        {showConnectButton && (
          <button
            onClick={() => sendConnectionRequest(userData.user_id || userData.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <UserPlus size={18} />
            Se connecter
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-teal-600" />
          Découvrir des personnes
        </h1>
        <p className="text-gray-500 mt-1">
          Élargissez votre réseau et connectez-vous avec d'autres étudiants
        </p>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des personnes (nom, école, domaine...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Demandes en attente */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="text-teal-600" />
            Demandes de connexion ({pendingRequests.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {request.sender?.avatar_url ? (
                    <img
                      src={request.sender.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {(request.sender?.full_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{request.sender?.full_name}</p>
                    {request.sender?.study_field && (
                      <p className="text-xs text-gray-500">{request.sender.study_field}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConnectionRequest(request.id, 'accept')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                  >
                    <Check size={16} />
                    Accepter
                  </button>
                  <button
                    onClick={() => handleConnectionRequest(request.id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <XIcon size={16} />
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'bg-teal-50 text-teal-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp size={16} />
          Suggestions
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'new'
              ? 'bg-teal-50 text-teal-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Clock size={16} />
          Nouveaux
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : searchQuery.length > 2 ? (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Résultats de recherche ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((user) => renderUserCard(user))}
            </div>
          )}
        </div>
      ) : activeTab === 'suggestions' ? (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Personnes que vous pourriez connaître
          </h2>
          {suggestions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune suggestion pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {suggestions.map((user) => renderUserCard(user))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Nouveaux membres de la communauté
          </h2>
          {newUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun nouveau membre</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {newUsers.map((user) => renderUserCard(user))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
