import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Video,
  Users,
  Share2,
  BookOpen,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

type ContextualActionsProps = {
  context: 'message' | 'group' | 'document' | 'fiche' | 'quiz' | 'session';
  contextId?: string;
  contextName?: string;
};

export function ContextualActions({ context, contextId, contextName }: ContextualActionsProps) {
  const navigate = useNavigate();

  const getActions = () => {
    switch (context) {
      case 'message':
        return [
          {
            icon: Video,
            label: 'Session vidéo',
            color: 'text-purple-600 hover:bg-purple-50',
            action: () => navigate('/sessions'),
          },
          {
            icon: Users,
            label: 'Créer groupe',
            color: 'text-green-600 hover:bg-green-50',
            action: () => navigate('/groups'),
          },
          {
            icon: Share2,
            label: 'Partager fiche',
            color: 'text-teal-600 hover:bg-teal-50',
            action: () => navigate('/cards'),
          },
        ];
      
      case 'group':
        return [
          {
            icon: Video,
            label: 'Lancer session',
            color: 'text-purple-600 hover:bg-purple-50',
            action: () => navigate('/sessions'),
          },
          {
            icon: MessageSquare,
            label: 'Discuter',
            color: 'text-blue-600 hover:bg-blue-50',
            action: () => navigate('/messages'),
          },
          {
            icon: ClipboardList,
            label: 'Quiz groupe',
            color: 'text-amber-600 hover:bg-amber-50',
            action: () => navigate('/quizzes'),
          },
        ];
      
      case 'document':
        return [
          {
            icon: BookOpen,
            label: 'Créer fiche',
            color: 'text-teal-600 hover:bg-teal-50',
            action: () => navigate('/cards'),
          },
          {
            icon: ClipboardList,
            label: 'Générer quiz',
            color: 'text-amber-600 hover:bg-amber-50',
            action: () => navigate('/quizzes'),
          },
          {
            icon: Sparkles,
            label: 'Demander IA',
            color: 'text-pink-600 hover:bg-pink-50',
            action: () => navigate('/ai-assistant'),
          },
        ];
      
      case 'fiche':
        return [
          {
            icon: ClipboardList,
            label: 'Quiz depuis fiche',
            color: 'text-amber-600 hover:bg-amber-50',
            action: () => navigate('/quizzes'),
          },
          {
            icon: Share2,
            label: 'Partager',
            color: 'text-blue-600 hover:bg-blue-50',
            action: () => navigate('/groups'),
          },
          {
            icon: MessageSquare,
            label: 'Discuter',
            color: 'text-blue-600 hover:bg-blue-50',
            action: () => navigate('/messages'),
          },
        ];
      
      case 'quiz':
        return [
          {
            icon: Video,
            label: 'Session quiz',
            color: 'text-purple-600 hover:bg-purple-50',
            action: () => navigate('/sessions'),
          },
          {
            icon: Share2,
            label: 'Partager',
            color: 'text-blue-600 hover:bg-blue-50',
            action: () => navigate('/groups'),
          },
          {
            icon: BookOpen,
            label: 'Créer fiche',
            color: 'text-teal-600 hover:bg-teal-50',
            action: () => navigate('/cards'),
          },
        ];
      
      case 'session':
        return [
          {
            icon: MessageSquare,
            label: 'Chat',
            color: 'text-blue-600 hover:bg-blue-50',
            action: () => navigate('/messages'),
          },
          {
            icon: BookOpen,
            label: 'Partager fiche',
            color: 'text-teal-600 hover:bg-teal-50',
            action: () => navigate('/cards'),
          },
          {
            icon: Sparkles,
            label: 'Aide IA',
            color: 'text-pink-600 hover:bg-pink-50',
            action: () => navigate('/ai-assistant'),
          },
        ];
      
      default:
        return [];
    }
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 transition-all ${action.color}`}
          title={action.label}
        >
          <action.icon size={18} />
          <span className="text-sm font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
