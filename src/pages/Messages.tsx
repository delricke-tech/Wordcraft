import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Image,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../lib/supabase';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ContextualActions } from '../components/ContextualActions';

type Conversation = {
  id: string;
  participant: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

export function Messages() {
  const { user } = useAuth();
  const [conversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || '',
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Hier';
    return format(d, 'd MMM', { locale: fr });
  };

  const mockConversations: Conversation[] = [
    {
      id: '1',
      participant: {
        id: '1',
        email: 'alice@example.com',
        full_name: 'Alice Martin',
        role: 'student',
        subscription_tier: 'free',
        ai_credits: 50,
        study_field: 'Medicine',
        notification_preferences: { email: true, push: true, revision_reminders: true },
      },
      lastMessage: 'Tu as fini les notes de cardiologie ?',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 2,
    },
    {
      id: '2',
      participant: {
        id: '2',
        email: 'bob@example.com',
        full_name: 'Bob Johnson',
        role: 'student',
        subscription_tier: 'student_pro',
        ai_credits: 100,
        study_field: 'Medicine',
        notification_preferences: { email: true, push: true, revision_reminders: true },
      },
      lastMessage: 'Merci pour le partage du quiz !',
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 0,
    },
  ];

  const displayConversations = conversations.length > 0 ? conversations : mockConversations;

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : displayConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune conversation pour le moment</p>
            </div>
          ) : (
            displayConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-teal-50' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium">
                  {conv.participant.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate">
                      {conv.participant.full_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatMessageDate(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-teal-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="border-b border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium">
                    {selectedConversation.participant.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.participant.full_name}
                    </h3>
                    <span className="text-sm text-green-500">En ligne</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Phone size={20} className="text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Video size={20} className="text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* ✅ Actions contextuelles */}
              <div className="px-4 pb-3">
                <ContextualActions 
                  context="message" 
                  contextId={selectedConversation.id}
                  contextName={selectedConversation.participant.full_name || ''}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_id === user?.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      msg.sender_id === user?.id ? 'text-teal-200' : 'text-gray-400'
                    }`}>
                      <span className="text-xs">{format(new Date(msg.created_at), 'HH:mm')}</span>
                      {msg.sender_id === user?.id && (
                        msg.is_read ? <CheckCheck size={14} /> : <Check size={14} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip size={20} className="text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Image size={20} className="text-gray-500" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ecrire un message..."
                  className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Smile size={20} className="text-gray-500" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selectionnez une conversation</h3>
              <p className="text-gray-500">Choisissez une conversation dans la liste pour commencer a discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
