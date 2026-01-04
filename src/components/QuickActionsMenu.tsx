import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  MessageSquare,
  Video,
  BookOpen,
  ClipboardList,
  Users,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';

type QuickAction = {
  id: string;
  icon: any;
  label: string;
  path: string;
  color: string;
  description: string;
};

const quickActions: QuickAction[] = [
  {
    id: 'session',
    icon: Video,
    label: 'Session vidéo',
    path: '/sessions',
    color: 'bg-purple-500 hover:bg-purple-600',
    description: 'Lancer une session d\'étude',
  },
  {
    id: 'message',
    icon: MessageSquare,
    label: 'Message',
    path: '/messages',
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Envoyer un message',
  },
  {
    id: 'group',
    icon: Users,
    label: 'Groupe',
    path: '/groups',
    color: 'bg-green-500 hover:bg-green-600',
    description: 'Créer un groupe',
  },
  {
    id: 'fiche',
    icon: BookOpen,
    label: 'Fiche',
    path: '/cards',
    color: 'bg-teal-500 hover:bg-teal-600',
    description: 'Nouvelle fiche d\'étude',
  },
  {
    id: 'quiz',
    icon: ClipboardList,
    label: 'Quiz',
    path: '/quizzes',
    color: 'bg-amber-500 hover:bg-amber-600',
    description: 'Créer un quiz',
  },
  {
    id: 'document',
    icon: FileText,
    label: 'Document',
    path: '/library',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    description: 'Importer un document',
  },
  {
    id: 'ai',
    icon: Sparkles,
    label: 'Assistant IA',
    path: '/ai-assistant',
    color: 'bg-pink-500 hover:bg-pink-600',
    description: 'Poser une question à l\'IA',
  },
];

export function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAction = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Ne pas afficher si on est sur la page de connexion
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Menu contextuel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          {/* Actions rapides */}
          <div className="pointer-events-auto mb-20 space-y-3 animate-in slide-in-from-bottom-4">
            {quickActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.path)}
                className="flex items-center gap-3 bg-white rounded-full shadow-lg border border-gray-200 pr-4 pl-3 py-3 hover:shadow-xl transition-all group"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white shadow-md`}>
                  <action.icon size={24} />
                </div>
                <div className="text-left pr-4">
                  <p className="font-semibold text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay pour fermer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bouton flottant principal (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white z-50 transition-all hover:scale-110 ${
          isOpen ? 'bg-red-500 hover:bg-red-600 rotate-45' : 'bg-teal-600 hover:bg-teal-700'
        }`}
        title={isOpen ? 'Fermer' : 'Actions rapides'}
      >
        {isOpen ? <X size={28} /> : <Plus size={28} />}
      </button>
    </>
  );
}
