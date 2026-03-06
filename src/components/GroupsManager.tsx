/**
 * Composant principal pour la gestion des groupes
 * Phase 3.1 - Groupes & partage
 * 
 * Date: 8 mars 2025
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Settings,
  LogOut,
  UserPlus,
  MessageSquare,
  FileText,
  BookOpen,
  Brain,
  Search,
  Filter,
  MoreVertical,
  Crown,
  Shield,
  User,
  Mail,
  Link,
  Copy,
  Check,
  X,
  Edit,
  Trash2,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';

import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  updateMemberRole,
  removeMember,
  leaveGroup,
  inviteToGroup,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  shareDocumentWithGroup,
  getGroupSharedDocuments,
  shareStudyCardWithGroup,
  getGroupSharedStudyCards,
  sendGroupMessage,
  getGroupMessages,
  isGroupMember,
  canManageGroup,
  getGroupStats,
  type Group,
  type GroupMember,
  type GroupInvitation,
  type SharedDocument,
  type SharedStudyCard,
  type GroupMessage
} from '../services/collaborationService';

interface GroupsManagerProps {
  onGroupSelect?: (group: Group) => void;
  selectedGroupId?: string;
}

export const GroupsManager: React.FC<GroupsManagerProps> = ({
  onGroupSelect,
  selectedGroupId
}) => {
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover' | 'invitations'>('my-groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<GroupInvitation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [sharedCards, setSharedCards] = useState<SharedStudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'member'>('all');

  // Formulaire création groupe
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_private: false,
    max_members: 50
  });

  // Formulaire invitation
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as 'admin' | 'moderator' | 'member',
    message: ''
  });

  // Charger les données
  useEffect(() => {
    loadGroups();
    loadPendingInvitations();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await getUserGroups();
      setGroups(data);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const data = await getPendingInvitations();
      setPendingInvitations(data);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const [group, members, messages, documents, cards] = await Promise.all([
        getGroupDetails(groupId),
        getGroupMembers(groupId),
        getGroupMessages(groupId, 20),
        getGroupSharedDocuments(groupId),
        getGroupSharedStudyCards(groupId)
      ]);

      setSelectedGroup(group);
      setGroupMembers(members);
      setGroupMessages(messages);
      setSharedDocuments(documents);
      setSharedCards(cards);
    } catch (error) {
      console.error('Erreur détails groupe:', error);
      toast.error('Erreur lors du chargement des détails du groupe');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Le nom du groupe est requis');
      return;
    }

    try {
      const group = await createGroup(newGroup);
      toast.success('Groupe créé avec succès');
      setShowCreateGroup(false);
      setNewGroup({ name: '', description: '', is_private: false, max_members: 50 });
      loadGroups();
      setSelectedGroup(group);
      onGroupSelect?.(group);
    } catch (error) {
      console.error('Erreur création groupe:', error);
      toast.error('Erreur lors de la création du groupe');
    }
  };

  const handleInviteUser = async () => {
    if (!inviteData.email.trim()) {
      toast.error('L\'email est requis');
      return;
    }

    try {
      await inviteToGroup(selectedGroup!.id, {
        email: inviteData.email,
        role: inviteData.role,
        message: inviteData.message
      });
      toast.success('Invitation envoyée avec succès');
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'member', message: '' });
    } catch (error) {
      console.error('Erreur invitation:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      toast.success('Invitation acceptée');
      loadPendingInvitations();
      loadGroups();
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      toast.error('Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
      toast.success('Invitation refusée');
      loadPendingInvitations();
    } catch (error) {
      console.error('Erreur refus invitation:', error);
      toast.error('Erreur lors du refus de l\'invitation');
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;

    if (!confirm(`Êtes-vous sûr de vouloir quitter le groupe "${selectedGroup.name}" ?`)) {
      return;
    }

    try {
      await leaveGroup(selectedGroup.id);
      toast.success('Vous avez quitté le groupe');
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      console.error('Erreur départ groupe:', error);
      toast.error('Erreur lors du départ du groupe');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: 'admin' | 'moderator' | 'member') => {
    if (!selectedGroup) return;

    try {
      await updateMemberRole(selectedGroup.id, memberId, role);
      toast.success('Rôle mis à jour');
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;

    const member = groupMembers.find(m => m.user_id === memberId);
    if (!member) return;

    if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.user?.full_name} du groupe ?`)) {
      return;
    }

    try {
      await removeMember(selectedGroup.id, memberId);
      toast.success('Membre retiré du groupe');
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Erreur retrait membre:', error);
      toast.error('Erreur lors du retrait du membre');
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && group.user_role === 'admin') ||
                       (filterRole === 'member' && group.user_role === 'member');
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'moderator': return 'Modérateur';
      default: return 'Membre';
    }
  };

  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Groupes
          </h2>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau groupe
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'my-groups'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Mes groupes ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
              activeTab === 'invitations'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Invitations
            {pendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingInvitations.length}
              </span>
            )}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Rechercher un groupe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="member">Membre</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'my-groups' && (
            <motion.div
              key="my-groups"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Groups List */}
                <div className="lg:col-span-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">Aucun groupe trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredGroups.map((group) => (
                        <motion.div
                          key={group.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedGroup(group);
                            onGroupSelect?.(group);
                          }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedGroup?.id === group.id
                              ? 'bg-white/20 border-white/40'
                              : 'bg-white/10 border-white/20 hover:bg-white/15'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{group.name}</h3>
                              {group.description && (
                                <p className="text-white/60 text-sm line-clamp-2">{group.description}</p>
                              )}
                            </div>
                            {getRoleIcon(group.user_role || 'member')}
                          </div>
                          <div className="flex items-center gap-4 text-white/60 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {group.member_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {group.message_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {group.shared_documents_count || 0}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group Details */}
                <div className="lg:col-span-2 border-l border-white/10 overflow-y-auto">
                  {selectedGroup ? (
                    <div className="p-6">
                      {/* Group Header */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedGroup.name}</h2>
                            {selectedGroup.description && (
                              <p className="text-white/60">{selectedGroup.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(selectedGroup.user_role || 'member')}
                            <span className="text-white/60 text-sm">
                              {getRoleLabel(selectedGroup.user_role || 'member')}
                            </span>
                            <button
                              onClick={() => setShowInviteModal(true)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <UserPlus className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => setShowGroupSettings(true)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <Settings className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-white/10 rounded-lg p-3">
                            <Users className="w-5 h-5 text-white/60 mb-1" />
                            <p className="text-white font-semibold">{selectedGroup.member_count || 0}</p>
                            <p className="text-white/60 text-xs">Membres</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <MessageSquare className="w-5 h-5 text-white/60 mb-1" />
                            <p className="text-white font-semibold">{selectedGroup.message_count || 0}</p>
                            <p className="text-white/60 text-xs">Messages</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <FileText className="w-5 h-5 text-white/60 mb-1" />
                            <p className="text-white font-semibold">{selectedGroup.shared_documents_count || 0}</p>
                            <p className="text-white/60 text-xs">Documents</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <BookOpen className="w-5 h-5 text-white/60 mb-1" />
                            <p className="text-white font-semibold">{selectedGroup.shared_cards_count || 0}</p>
                            <p className="text-white/60 text-xs">Fiches</p>
                          </div>
                        </div>
                      </div>

                      {/* Members */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Membres</h3>
                        <div className="space-y-2">
                          {groupMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                                  {member.user?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{member.user?.full_name}</p>
                                  <p className="text-white/60 text-sm">{member.user?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.role)}
                                <span className="text-white/60 text-sm">{getRoleLabel(member.role)}</span>
                                {selectedGroup.user_role === 'admin' && member.user_id !== (selectedGroup.created_by) && (
                                  <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shared Content */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Contenu partagé</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Documents */}
                          <div>
                            <h4 className="text-white/80 font-medium mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Documents ({sharedDocuments.length})
                            </h4>
                            <div className="space-y-2">
                              {sharedDocuments.slice(0, 3).map((doc) => (
                                <div key={doc.id} className="p-2 bg-white/5 rounded-lg">
                                  <p className="text-white text-sm font-medium">{doc.document?.name}</p>
                                  <p className="text-white/60 text-xs">
                                    par {doc.sharer?.full_name} • {new Date(doc.shared_at).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                              {sharedDocuments.length > 3 && (
                                <p className="text-white/60 text-xs">+{sharedDocuments.length - 3} autres...</p>
                              )}
                            </div>
                          </div>

                          {/* Study Cards */}
                          <div>
                            <h4 className="text-white/80 font-medium mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Fiches ({sharedCards.length})
                            </h4>
                            <div className="space-y-2">
                              {sharedCards.slice(0, 3).map((card) => (
                                <div key={card.id} className="p-2 bg-white/5 rounded-lg">
                                  <p className="text-white text-sm font-medium">{card.study_card?.title}</p>
                                  <p className="text-white/60 text-xs">
                                    par {card.sharer?.full_name} • {new Date(card.shared_at).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                              {sharedCards.length > 3 && (
                                <p className="text-white/60 text-xs">+{sharedCards.length - 3} autres...</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Messages */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Messages récents</h3>
                        <div className="space-y-2">
                          {groupMessages.slice(0, 5).map((message) => (
                            <div key={message.id} className="p-3 bg-white/5 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-xs">
                                  {message.user_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-white font-medium text-sm">{message.user_name}</p>
                                    <p className="text-white/60 text-xs">
                                      {new Date(message.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <p className="text-white/80 text-sm">{message.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {groupMessages.length > 5 && (
                            <p className="text-white/60 text-sm text-center">+{groupMessages.length - 5} messages...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <p className="text-white/60">Sélectionnez un groupe pour voir les détails</p>
                      </div>
                    </div>
                  )}
                </div>
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
              <h3 className="text-xl font-semibold text-white mb-4">Invitations en attente</h3>
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
                          <h4 className="text-white font-semibold">{invitation.group_name}</h4>
                          <p className="text-white/60 text-sm">
                            Invité par {invitation.invited_by_name} • {getRoleLabel(invitation.role)}
                          </p>
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
        </AnimatePresence>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCreateGroup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Créer un nouveau groupe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Nom du groupe *</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                    placeholder="Mon groupe d'étude"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 resize-none"
                    rows={3}
                    placeholder="Description du groupe..."
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Nombre maximum de membres</label>
                  <input
                    type="number"
                    value={newGroup.max_members}
                    onChange={(e) => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) || 50 })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                    min="2"
                    max="100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newGroup.is_private}
                    onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                    className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="private" className="text-white/80 text-sm">Groupe privé</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
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
              <h3 className="text-xl font-bold text-white mb-4">Inviter un membre</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
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
                    <option value="member">Membre</option>
                    <option value="moderator">Modérateur</option>
                    <option value="admin">Admin</option>
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
                  onClick={handleInviteUser}
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
