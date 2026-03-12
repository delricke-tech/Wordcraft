import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Upload,
  Link as LinkIcon,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationsPanel, useNotifications } from '../NotificationsPanel';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const createOptions = [
    { icon: Upload, label: 'Importer un document', action: () => navigate('/library?upload=true') },
    { icon: LinkIcon, label: 'Importer une URL', action: () => navigate('/library?import=true') },
    { icon: BookOpen, label: 'Nouvelle fiche', action: () => navigate('/cards/new') },
    { icon: ClipboardList, label: 'Nouveau quiz', action: () => navigate('/quizzes/new') },
    // Fonctionnalités désactivées temporairement
    // { icon: Users, label: 'Nouveau groupe', action: () => navigate('/groups/new') },
    // { icon: Video, label: 'Nouvelle session', action: () => navigate('/sessions/new') },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher documents, fiches, quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={createMenuRef}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Creer
            <ChevronDown size={16} />
          </button>

          {showCreateMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              {createOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    option.action();
                    setShowCreateMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <option.icon size={18} className="text-gray-400" />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <NotificationsPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium text-sm">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded-full capitalize">
                  {profile?.subscription_tier || 'Gratuit'}
                </span>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={18} className="text-gray-400" />
                  Voir le profil
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={18} className="text-gray-400" />
                  Parametres
                </Link>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  Se deconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
