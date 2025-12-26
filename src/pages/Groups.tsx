import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Globe,
  Lock,
  MessageSquare,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Group } from '../lib/supabase';

export function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const [myResult, publicResult] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .or(`owner_id.eq.${user?.id}`),
        supabase
          .from('groups')
          .select('*')
          .eq('is_public', true)
          .eq('is_discoverable', true)
          .limit(20),
      ]);

      setMyGroups(myResult.data || []);
      setGroups(publicResult.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayGroups = activeTab === 'my' ? myGroups : groups;
  const filteredGroups = displayGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groupes d'etude</h1>
          <p className="text-gray-500 mt-1">Collaborez avec vos pairs et partagez des ressources</p>
        </div>
        <button
          onClick={() => setShowNewGroupModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={18} />
          Creer un groupe
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mes groupes
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'discover'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Decouvrir
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher des groupes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'my' ? 'Aucun groupe pour le moment' : 'Aucun groupe trouve'}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'my'
              ? 'Creez votre premier groupe d\'etude ou rejoignez-en un existant'
              : 'Essayez un autre terme de recherche'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={18} />
              Creer un groupe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-24 bg-gradient-to-br from-teal-500 to-teal-700 relative">
                {group.cover_url && (
                  <img
                    src={group.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 right-3">
                  {group.is_public ? (
                    <span className="px-2 py-1 bg-white/90 rounded text-xs font-medium text-gray-700 flex items-center gap-1">
                      <Globe size={12} /> Public
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-white/90 rounded text-xs font-medium text-gray-700 flex items-center gap-1">
                      <Lock size={12} /> Prive
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                <Link to={`/groups/${group.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-teal-600">
                    {group.name}
                  </h3>
                </Link>
                {group.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{group.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {group.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {group.member_count}
                    </span>
                    {group.settings.enable_chat && (
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        Discussion
                      </span>
                    )}
                  </div>
                  {activeTab === 'discover' && (
                    <button className="px-3 py-1.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                      Rejoindre
                    </button>
                  )}
                  {activeTab === 'my' && (
                    <Link
                      to={`/groups/${group.id}`}
                      className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg"
                    >
                      Ouvrir
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
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
