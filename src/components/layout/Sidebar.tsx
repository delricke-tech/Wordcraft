import { NavLink, Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Brain,
  ClipboardList,
  Users,
  MessageSquare,
  Video,
  GraduationCap,
  Settings,
  CreditCard,
  Sparkles,
  Home,
  ChevronLeft,
  ChevronRight,
  Rss,
  UserCircle,
  Compass,
  Mic,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

// Fonctionnalités actives
const navItems = [
  { to: '/dashboard', icon: Home, label: 'Tableau de bord' },
  { to: '/profile', icon: UserCircle, label: 'Mon profil' },
  { to: '/library', icon: FileText, label: 'Bibliothèque' },
  { to: '/cards', icon: BookOpen, label: 'Fiches' },
  { to: '/quizzes', icon: ClipboardList, label: 'Quiz' },
  { to: '/ai-assistant', icon: Sparkles, label: 'Assistant IA' },
  { to: '/podcast', icon: Mic, label: 'Podcast IA' },
];

// Fonctionnalités à venir (désactivées temporairement)
const comingSoonItems = [
  { to: '/feed', icon: Rss, label: 'Fil d\'actualité' },
  { to: '/discover', icon: Compass, label: 'Découvrir' },
  { to: '/groups', icon: Users, label: 'Groupes' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/sessions', icon: Video, label: 'Sessions' },
  { to: '/teacher/courses', icon: GraduationCap, label: 'Mes cours (Enseignant)' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { profile } = useAuth();
  
  return (
    <>
      {/* Overlay sombre sur mobile quand la sidebar est ouverte */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 flex flex-col ${
          // Sur mobile : sidebar cachée ou pleine largeur (max 280px)
          // Sur desktop : comportement normal
          collapsed 
            ? '-translate-x-full md:translate-x-0 md:w-16' 
            : 'translate-x-0 w-64 md:w-64'
        }`}
      >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <Link to="/library" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Brain className="w-8 h-8 text-teal-600" />
            <span className="font-bold text-xl text-gray-900">WordCraft</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/library" className="hover:opacity-80 transition-opacity" title="Aller à la bibliothèque">
            <Brain className="w-8 h-8 text-teal-600 mx-auto" />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Séparateur et fonctionnalités à venir */}
        <div className={`my-4 px-4 ${collapsed ? 'hidden' : ''}`}>
          <div className="h-px bg-gray-200" />
          <span className="block mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            À venir
          </span>
        </div>

        {/* Fonctionnalités à venir - désactivées */}
        <ul className="space-y-1 px-2">
          {comingSoonItems.map((item) => (
            <li key={item.to}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 opacity-60 cursor-not-allowed"
                title={`${item.label} - Fonctionnalité à venir`}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      Bientôt
                    </span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Parametres' : undefined}
        >
          <Settings size={20} />
          {!collapsed && <span className="font-medium">Parametres</span>}
        </NavLink>
        <NavLink
          to="/subscription"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Abonnement' : undefined}
        >
          <CreditCard size={20} />
          {!collapsed && <span className="font-medium">Abonnement</span>}
        </NavLink>
      </div>

      {!collapsed && profile && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-gray-600">{profile.ai_credits} Credits IA</span>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
