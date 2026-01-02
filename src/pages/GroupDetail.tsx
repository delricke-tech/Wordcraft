import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Users,
  Settings,
  Paperclip,
  Smile,
  MoreVertical,
  X,
  UserPlus,
  Crown,
  Shield,
  Trash2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

type Group = {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  owner_id: string;
  is_public: boolean;
  member_count: number;
  settings: any;
  created_at: string;
};

type GroupMember = {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'pending' | 'active' | 'banned';
  joined_at: string;
  profiles: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
};

type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
  reply_to?: string;
  is_edited: boolean;
  is_deleted: boolean;
  read_by: string[];
  created_at: string;
  profiles: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
};

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (id) {
      fetchGroupData();
      subscribeToMessages();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupData = async () => {
    try {
      setLoading(true);

      // Récupérer les infos du groupe
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Récupérer les membres
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Trouver le rôle de l'utilisateur actuel
      const currentMember = membersData?.find((m) => m.user_id === user?.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }

      // Récupérer les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:sender_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Marquer les messages comme lus
      if (user && messagesData && messagesData.length > 0) {
        markMessagesAsRead();
      }
    } catch (error: any) {
      console.error('Error fetching group data:', error);
      toast.error('Erreur lors du chargement du groupe');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`group-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${id}`,
        },
        async (payload) => {
          // Récupérer le profil de l'expéditeur
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            profiles: profileData,
          } as ChatMessage;

          setMessages((prev) => [...prev, newMsg]);

          // Marquer comme lu si ce n'est pas notre message
          if (payload.new.sender_id !== user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markMessagesAsRead = async () => {
    if (!user || !id) return;

    const unreadMessages = messages.filter(
      (msg) => msg.sender_id !== user.id && !msg.read_by.includes(user.id)
    );

    for (const msg of unreadMessages) {
      await supabase
        .from('chat_messages')
        .update({
          read_by: [...msg.read_by, user.id],
        })
        .eq('id', msg.id);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;

    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: user.id,
        group_id: id,
        content: newMessage.trim(),
        message_type: 'text',
        read_by: [user.id],
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Impossible d\'envoyer le message');
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !id) return;

    if (!confirm('Voulez-vous vraiment quitter ce groupe ?')) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Vous avez quitté le groupe');
      navigate('/groups');
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast.error('Impossible de quitter le groupe');
    }
  };

  const getMessageStatus = (msg: ChatMessage) => {
    if (msg.sender_id !== user?.id) return null;

    const readCount = msg.read_by.length;
    const totalMembers = members.length;

    if (readCount >= totalMembers) {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else if (readCount > 1) {
      return <CheckCheck size={16} className="text-gray-400" />;
    } else {
      return <Check size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Groupe introuvable</p>
        <button
          onClick={() => navigate('/groups')}
          className="mt-4 text-teal-600 hover:underline"
        >
          Retour aux groupes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900">{group.name}</h1>
              <p className="text-sm text-gray-500">{group.member_count} membres</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voir les membres"
          >
            <Users size={20} className="text-gray-600" />
          </button>
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Paramètres"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.sender_id === user?.id;
          const senderName = msg.profiles?.full_name || msg.profiles?.email || 'Utilisateur';

          return (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                {!isOwnMessage && (
                  <div className="flex-shrink-0">
                    {msg.profiles?.avatar_url ? (
                      <img
                        src={msg.profiles.avatar_url}
                        alt={senderName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {senderName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  {!isOwnMessage && (
                    <p className="text-xs text-gray-600 mb-1 px-3">{senderName}</p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-xs ${
                          isOwnMessage ? 'text-teal-100' : 'text-gray-500'
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                      {getMessageStatus(msg)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Smile size={20} className="text-gray-600" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Ecrivez un message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Modal Membres */}
      {showMembers && (
        <MembersModal
          group={group}
          members={members}
          currentUserRole={currentUserRole}
          onClose={() => setShowMembers(false)}
          onMembersUpdate={fetchGroupData}
        />
      )}

      {/* Modal Paramètres */}
      {showSettings && (
        <SettingsModal
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={fetchGroupData}
          onLeave={handleLeaveGroup}
        />
      )}
    </div>
  );
}

function MembersModal({
  group,
  members,
  currentUserRole,
  onClose,
  onMembersUpdate,
}: {
  group: Group;
  members: GroupMember[];
  currentUserRole: string;
  onClose: () => void;
  onMembersUpdate: () => void;
}) {
  const { user } = useAuth();
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  
  // Utilisé pour afficher le nom du groupe dans le titre
  console.log('Modal membres du groupe:', group.name);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={16} className="text-blue-500" />;
      case 'moderator':
        return <Shield size={16} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'admin':
        return 'Administrateur';
      case 'moderator':
        return 'Modérateur';
      default:
        return 'Membre';
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!canManageMembers) return;
    if (memberUserId === user?.id) {
      toast.error('Vous ne pouvez pas vous retirer vous-même');
      return;
    }

    if (!confirm('Voulez-vous vraiment retirer ce membre ?')) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Membre retiré du groupe');
      onMembersUpdate();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Impossible de retirer ce membre');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Membres ({members.length})</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {member.profiles?.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-medium">
                      {(member.profiles?.full_name || member.profiles?.email)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.profiles?.full_name || member.profiles?.email}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {getRoleIcon(member.role)}
                      <span>{getRoleLabel(member.role)}</span>
                    </div>
                  </div>
                </div>

                {canManageMembers && member.user_id !== user?.id && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Retirer du groupe"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {canManageMembers && (
          <div className="p-6 border-t border-gray-200">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              <UserPlus size={18} />
              Inviter des membres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsModal({
  group,
  onClose,
  onUpdate,
  onLeave,
}: {
  group: Group;
  onClose: () => void;
  onUpdate: () => void;
  onLeave: () => void;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('groups')
        .update({
          name,
          description,
        })
        .eq('id', group.id);

      if (error) throw error;

      toast.success('Groupe mis à jour');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error('Impossible de mettre à jour le groupe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Paramètres du groupe</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du groupe
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={handleUpdate}
            disabled={!name || loading}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onLeave}
            className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Quitter le groupe
          </button>
        </div>
      </div>
    </div>
  );
}
