import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Globe,
  Lock,
  X,
  ChevronDown,
  Star,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Group } from '../lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ContextualActions } from '../components/ContextualActions';

type GroupWithMembers = Group & {
  members?: Array<{ profiles: { avatar_url?: string; full_name?: string; email: string } }>;
};

export function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [myGroups, setMyGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // Récupérer les groupes dont je suis membre
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      const myGroupIds = myMemberships?.map((m) => m.group_id) || [];

      // Récupérer mes groupes avec les membres
      let myGroupsQuery = supabase
        .from('groups')
        .select(`
          *,
          members:group_members!inner(
            profiles:user_id (
              avatar_url,
              full_name,
              email
            )
          )
        `);
      
      if (myGroupIds.length > 0) {
        myGroupsQuery = myGroupsQuery.in('id', myGroupIds);
      } else {
        myGroupsQuery = myGroupsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Récupérer les groupes publics avec les membres
      const publicQuery = supabase
        .from('groups')
        .select(`
          *,
          members:group_members!inner(
            profiles:user_id (
              avatar_url,
              full_name,
              email
            )
          )
        `)
        .eq('is_public', true)
        .eq('is_discoverable', true)
        .not('id', 'in', `(${myGroupIds.join(',')})`)
        .limit(20);

      const [myResult, publicResult] = await Promise.all([
        myGroupsQuery,
        publicQuery,
      ]);

      setMyGroups(myResult.data || []);
      setGroups(publicResult.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      // Vérifier si l'utilisateur est déjà membre
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.info('Vous êtes déjà membre de ce groupe');
        return;
      }

      // Ajouter l'utilisateur au groupe
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        status: 'active',
      });

      if (error) throw error;

      // Incrémenter le compteur de membres
      await supabase.rpc('increment_group_members', { group_id: groupId });

      toast.success('Vous avez rejoint le groupe !');
      fetchGroups();
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error('Impossible de rejoindre le groupe');
    }
  };

  const displayGroups = activeTab === 'my' ? myGroups : groups;
  const filteredGroups = displayGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tri des groupes
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groupes de travail et projets</h1>
          <p className="text-gray-500 mt-1">Collaborez avec vos pairs et partagez des ressources</p>
        </div>
        <button
          onClick={() => setShowNewGroupModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          Créer
        </button>
      </div>

      {/* ✅ Actions contextuelles */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-4 border border-teal-200">
        <p className="text-sm text-gray-700 font-medium mb-3">Actions rapides depuis les groupes :</p>
        <ContextualActions context="group" />
      </div>

      {/* Filtres et Recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Onglets */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes groupes
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Découvrir
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="+ recherche"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'my' ? 'Aucun groupe pour le moment' : 'Aucun groupe trouvé'}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'my'
              ? 'Créez votre premier groupe d\'étude ou rejoignez-en un existant'
              : 'Essayez un autre terme de recherche'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus size={18} />
              Créer un groupe
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête du tableau */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wider">
            <div className="col-span-1 flex items-center">
              <input type="checkbox" className="w-4 h-4 text-teal-600 border-gray-300 rounded" />
            </div>
            <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-gray-900" onClick={() => setSortBy('name')}>
              Dénomination
              <ChevronDown size={14} className={sortBy === 'name' ? 'text-teal-600' : ''} />
            </div>
            <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900" onClick={() => setSortBy('created')}>
              Date de création
              <ChevronDown size={14} className={sortBy === 'created' ? 'text-teal-600' : ''} />
            </div>
            <div className="col-span-2">Confidentialité</div>
            <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900" onClick={() => setSortBy('updated')}>
              Mise à jour
              <ChevronDown size={14} className={sortBy === 'updated' ? 'text-teal-600' : ''} />
            </div>
            <div className="col-span-2">Membres</div>
          </div>

          {/* Lignes du tableau */}
          <div className="divide-y divide-gray-200">
            {sortedGroups.map((group) => (
              <div
                key={group.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Checkbox + Icône */}
                <div className="col-span-1 flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 border-gray-300 rounded" />
                  <Star size={16} className="text-gray-400 hover:text-yellow-500 cursor-pointer" />
                </div>

                {/* Nom du groupe */}
                <div className="col-span-3">
                  <Link
                    to={`/groups/${group.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-teal-600 truncate">
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="text-xs text-gray-500 truncate">{group.description}</p>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Date de création */}
                <div className="col-span-2 text-sm text-gray-600">
                  {new Date(group.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  <br />
                  <span className="text-xs text-gray-400">
                    {new Date(group.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Confidentialité */}
                <div className="col-span-2">
                  {group.is_public ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                      <Globe size={14} />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                      <Lock size={14} />
                      Privé
                    </span>
                  )}
                </div>

                {/* Date de mise à jour */}
                <div className="col-span-2 text-sm text-gray-600">
                  {formatDistanceToNow(new Date(group.updated_at || group.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </div>

                {/* Membres (avatars) */}
                <div className="col-span-2 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {group.members?.slice(0, 3).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium"
                        title={member.profiles?.full_name || member.profiles?.email}
                      >
                        {member.profiles?.avatar_url ? (
                          <img
                            src={member.profiles.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (member.profiles?.full_name || member.profiles?.email)?.[0]?.toUpperCase()
                        )}
                      </div>
                    ))}
                    {group.member_count > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                        +{group.member_count - 3}
                      </div>
                    )}
                  </div>
                  {activeTab === 'discover' ? (
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className="p-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    >
                      Rejoindre
                    </button>
                  ) : (
                    <button className="p-1.5 hover:bg-gray-200 rounded-md transition-colors">
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewGroupModal && (
        <NewGroupModal
          onClose={() => setShowNewGroupModal(false)}
          onCreated={fetchGroups}
        />
      )}
    </div>
  );
}

function NewGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !name) return;

    setLoading(true);
    const { error } = await supabase.from('groups').insert({
      owner_id: user.id,
      name,
      description,
      is_public: isPublic,
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
          <h2 className="text-xl font-bold text-gray-900">Creer un groupe</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du groupe</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Groupe d'etude Medecine"
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
              placeholder="De quoi parle ce groupe ?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className="w-4 h-4 text-teal-600"
              />
              <Globe size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                className="w-4 h-4 text-teal-600"
              />
              <Lock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Prive</span>
            </label>
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
            disabled={!name || loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer le groupe'}
          </button>
        </div>
      </div>
    </div>
  );
}
