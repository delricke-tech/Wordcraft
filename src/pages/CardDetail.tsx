import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  FileDown,
  Pencil,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, StudyCard } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [card, setCard] = useState<StudyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    definitions: true,
    keyPoints: true,
    customSections: true,
  });

  useEffect(() => {
    if (id) {
      fetchCard();
    }
  }, [id]);

  const fetchCard = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('study_cards')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCard(data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la fiche:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger la fiche'
      });
      navigate('/cards');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!card) return;

    // Créer le contenu du fichier texte
    let content = `# ${card.title}\n\n`;
    content += `Généré par WordCraft IA\n`;
    content += `Date : ${format(new Date(card.created_at), 'dd MMMM yyyy', { locale: fr })}\n\n`;
    content += `─────────────────────────────────────\n\n`;

    // Ajouter les définitions
    if (card.content.definitions && card.content.definitions.length > 0) {
      content += `## 📖 DÉFINITIONS\n\n`;
      card.content.definitions.forEach((def: any) => {
        content += `**${def.term}**\n${def.definition}\n\n`;
      });
    }

    // Ajouter les points clés
    if (card.content.key_points && card.content.key_points.length > 0) {
      content += `## 💡 CONCEPTS CLÉS\n\n`;
      card.content.key_points.forEach((point: string) => {
        content += `${point}\n\n`;
      });
    }

    // Ajouter les signes
    if (card.content.signs && card.content.signs.length > 0) {
      content += `## 🔍 SIGNES\n\n`;
      card.content.signs.forEach((sign: string) => {
        content += `• ${sign}\n`;
      });
      content += `\n`;
    }

    // Ajouter les diagnostics
    if (card.content.diagnostics && card.content.diagnostics.length > 0) {
      content += `## 🩺 DIAGNOSTICS\n\n`;
      card.content.diagnostics.forEach((diag: string) => {
        content += `• ${diag}\n`;
      });
      content += `\n`;
    }

    // Ajouter les traitements
    if (card.content.treatments && card.content.treatments.length > 0) {
      content += `## 💊 TRAITEMENTS\n\n`;
      card.content.treatments.forEach((treatment: string) => {
        content += `• ${treatment}\n`;
      });
      content += `\n`;
    }

    // Ajouter les sections personnalisées
    if (card.content.custom_sections && card.content.custom_sections.length > 0) {
      card.content.custom_sections.forEach((section: any) => {
        content += `## ${section.title}\n\n`;
        content += `${section.content}\n\n`;
      });
    }

    // Créer un blob et télécharger
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiche-${card.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Téléchargement réussi !', {
      description: 'La fiche a été téléchargée en format texte'
    });
  };

  const handleDelete = async () => {
    if (!card || !window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) return;

    try {
      const { error } = await supabase
        .from('study_cards')
        .delete()
        .eq('id', card.id);

      if (error) throw error;

      toast.success('Fiche supprimée', {
        description: 'La fiche a été supprimée avec succès'
      });
      navigate('/cards');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erreur', {
        description: 'Impossible de supprimer la fiche'
      });
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fiche introuvable</h3>
        <Link to="/cards" className="text-teal-600 hover:text-teal-700">
          Retour aux fiches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cards')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{card.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">
                Créé le {format(new Date(card.created_at), 'dd MMMM yyyy', { locale: fr })}
              </span>
              {card.is_ai_generated && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-600 rounded flex items-center gap-1">
                  <Sparkles size={12} /> Généré par IA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <FileDown size={18} />
            Télécharger
          </button>
          <Link
            to={`/cards/${card.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Pencil size={18} />
            Modifier
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            <Trash2 size={18} />
            Supprimer
          </button>
        </div>
      </div>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Niveau de maîtrise</div>
          <div className="text-2xl font-bold text-gray-900">{card.mastery_level}%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Révisions effectuées</div>
          <div className="text-2xl font-bold text-gray-900">{card.review_count}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Prochaine révision</div>
          <div className="text-lg font-bold text-gray-900">
            {card.next_review_at
              ? format(new Date(card.next_review_at), 'dd/MM/yyyy', { locale: fr })
              : 'Non programmée'}
          </div>
        </div>
      </div>

      {/* Contenu de la fiche */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Définitions */}
        {card.content.definitions && card.content.definitions.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('definitions')}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Définitions ({card.content.definitions.length})
                </h2>
              </div>
              {expandedSections.definitions ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {expandedSections.definitions && (
              <div className="px-6 pb-6 space-y-4">
                {card.content.definitions.map((def: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{def.term}</h3>
                    <p className="text-gray-700 leading-relaxed">{def.definition}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Points clés */}
        {card.content.key_points && card.content.key_points.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('keyPoints')}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Concepts Clés ({card.content.key_points.length})
                </h2>
              </div>
              {expandedSections.keyPoints ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {expandedSections.keyPoints && (
              <div className="px-6 pb-6 space-y-3">
                {card.content.key_points.map((point: string, index: number) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-900 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signes */}
        {card.content.signs && card.content.signs.length > 0 && (
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔍</span>
              <h2 className="text-xl font-bold text-gray-900">Signes</h2>
            </div>
            <ul className="space-y-2">
              {card.content.signs.map((sign: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Diagnostics */}
        {card.content.diagnostics && card.content.diagnostics.length > 0 && (
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🩺</span>
              <h2 className="text-xl font-bold text-gray-900">Diagnostics</h2>
            </div>
            <ul className="space-y-2">
              {card.content.diagnostics.map((diag: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>{diag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Traitements */}
        {card.content.treatments && card.content.treatments.length > 0 && (
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💊</span>
              <h2 className="text-xl font-bold text-gray-900">Traitements</h2>
            </div>
            <ul className="space-y-2">
              {card.content.treatments.map((treatment: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>{treatment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections personnalisées */}
        {card.content.custom_sections && card.content.custom_sections.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('customSections')}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Sections Supplémentaires ({card.content.custom_sections.length})
                </h2>
              </div>
              {expandedSections.customSections ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {expandedSections.customSections && (
              <div className="px-6 pb-6 space-y-6 pt-6">
                {card.content.custom_sections.map((section: any, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">{section.title}</h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
