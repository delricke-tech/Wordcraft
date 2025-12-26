import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Brain,
  ClipboardList,
  Calendar,
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Tableau de bord' },
  { to: '/library', icon: FileText, label: 'Bibliotheque' },
  { to: '/cards', icon: BookOpen, label: 'Fiches' },
  { to: '/quizzes', icon: ClipboardList, label: 'Quiz' },
  { to: '/revision', icon: Calendar, label: 'Revision' },
  { to: '/groups', icon: Users, label: 'Groupes' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/sessions', icon: Video, label: 'Sessions' },
  { to: '/ai-assistant', icon: Sparkles, label: 'Assistant IA' },
];

const teacherItems = [
  { to: '/teacher/courses', icon: GraduationCap, label: 'Mes cours' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-teal-600" />
            <span className="font-bold text-xl text-gray-900">WordCraft</span>
          </div>
        )}
        {collapsed && <Brain className="w-8 h-8 text-teal-600 mx-auto" />}
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

        {isTeacher && (
          <>
            <div className={`my-4 px-4 ${collapsed ? 'hidden' : ''}`}>
              <div className="h-px bg-gray-200" />
              <span className="block mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Enseignant
              </span>
            </div>
            <ul className="space-y-1 px-2">
              {teacherItems.map((item) => (
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
          </>
        )}
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
  );
}
