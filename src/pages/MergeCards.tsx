import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, StudyCard } from '../lib/supabase';
import { toast } from 'sonner';

interface CardGroup {
  documentName: string;
  cards: StudyCard[];
  merged: boolean;
}

export function MergeCards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchAICards();
  }, []);

  const fetchAICards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('study_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_ai_generated', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper les cartes par document
      const groups: Record<string, StudyCard[]> = {};
      
      data?.forEach(card => {
        // Vérifier si c'est déjà une fiche complète
        const isCompleteCard = card.title.includes('Fiche complète :');
        
        if (isCompleteCard) {
          // Les fiches complètes sont déjà fusionnées
          return;
        }

        // Extraire le nom du document depuis les tags
        const docTag = card.tags?.find((tag: string) => 
          tag === 'pdf' || tag === 'docx' || tag.includes('.')
        );
        
        // Utiliser le premier tag comme clé de regroupement
        const groupKey = card.tags?.[0] || 'Sans tag';
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(card);
      });

      // Convertir en array et filtrer les groupes avec plus d'une carte
      const groupArray = Object.entries(groups)
        .filter(([_, cards]) => cards.length > 1)
        .map(([name, cards]) => ({
          documentName: name,
          cards,
          merged: false,
        }));

      setCardGroups(groupArray);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des cartes:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les fiches'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMergeGroup = async (group: CardGroup) => {
    if (!user) return;

    setMerging(group.documentName);
    
    try {
      // Regrouper le contenu de toutes les cartes
      const definitions: any[] = [];
      const keyPoints: string[] = [];
      const signs: string[] = [];
      const diagnostics: string[] = [];
      const treatments: string[] = [];
      const customSections: any[] = [];

      group.cards.forEach(card => {
        // Définitions
        if (card.content.definitions) {
          definitions.push(...card.content.definitions);
        }

        // Points clés
        if (card.content.key_points) {
          keyPoints.push(...card.content.key_points);
        }

        // Signes
        if (card.content.signs) {
          signs.push(...card.content.signs);
        }

        // Diagnostics
        if (card.content.diagnostics) {
          diagnostics.push(...card.content.diagnostics);
        }

        // Traitements
        if (card.content.treatments) {
          treatments.push(...card.content.treatments);
        }

        // Sections personnalisées
        if (card.content.custom_sections) {
          customSections.push(...card.content.custom_sections);
        }

        // Si le contenu est simple (titre = front, content = back)
        if (!card.content.definitions?.length && 
            !card.content.key_points?.length && 
            card.title) {
          // C'est probablement une ancienne fiche avec titre/contenu simple
          const firstKeyPoint = card.content.key_points?.[0];
          if (firstKeyPoint) {
            keyPoints.push(`${card.title}\n${firstKeyPoint}`);
          } else {
            keyPoints.push(card.title);
          }
        }
      });

      // Créer la fiche fusionnée
      const mergedCard = {
        user_id: user.id,
        title: `Fiche complète : ${group.documentName}`,
        content: {
          definitions,
          key_points: keyPoints,
          signs,
          diagnostics,
          treatments,
          custom_sections: customSections,
        },
        tags: ['IA', 'fiche-complete', group.documentName],
        is_ai_generated: true,
        mastery_level: 0,
        review_count: 0,
      };

      // Insérer la fiche fusionnée
      const { data: newCard, error: insertError } = await supabase
        .from('study_cards')
        .insert(mergedCard)
        .select()
        .single();

      if (insertError) throw insertError;

      // Supprimer les anciennes cartes individuelles
      const cardIds = group.cards.map(c => c.id);
      const { error: deleteError } = await supabase
        .from('study_cards')
        .delete()
        .in('id', cardIds);

      if (deleteError) throw deleteError;

      toast.success('Fusion réussie !', {
        description: `${group.cards.length} fiches fusionnées en une seule`,
        duration: 5000,
      });

      // Rafraîchir la liste
      await fetchAICards();

    } catch (error: any) {
      console.error('❌ Erreur lors de la fusion:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de fusionner les fiches'
      });
    } finally {
      setMerging(null);
    }
  };

  const handleDeleteGroup = async (group: CardGroup) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ces ${group.cards.length} fiches ?`)) {
      return;
    }

    try {
      const cardIds = group.cards.map(c => c.id);
      const { error } = await supabase
        .from('study_cards')
        .delete()
        .in('id', cardIds);

      if (error) throw error;

      toast.success('Fiches supprimées', {
        description: `${group.cards.length} fiches supprimées`
      });

      // Rafraîchir la liste
      await fetchAICards();

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erreur', {
        description: 'Impossible de supprimer les fiches'
      });
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">
              Regroupement des Fiches
            </h1>
            <p className="text-gray-500 mt-1">
              Fusionnez vos anciennes fiches multiples en une seule fiche complète
            </p>
          </div>
        </div>
      </div>

      {/* Alerte d'information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Comment ça marche ?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Cet outil détecte automatiquement les fiches IA multiples du même document</li>
            <li>En cliquant sur "Fusionner", toutes les fiches seront regroupées en UNE SEULE fiche complète</li>
            <li>Les anciennes fiches individuelles seront automatiquement supprimées</li>
            <li>Le contenu sera organisé par sections (Définitions, Concepts, etc.)</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : cardGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune fiche à regrouper !
          </h3>
          <p className="text-gray-500 mb-6">
            Toutes vos fiches IA sont déjà au bon format ou uniques
          </p>
          <button
            onClick={() => navigate('/cards')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retour aux fiches
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {cardGroups.length} document{cardGroups.length > 1 ? 's' : ''} avec fiches multiples détecté{cardGroups.length > 1 ? 's' : ''}
          </div>

          {cardGroups.map((group, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-teal-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {group.documentName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {group.cards.length} fiches individuelles à fusionner
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedGroup(
                        expandedGroup === group.documentName ? null : group.documentName
                      )}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={16} />
                      {expandedGroup === group.documentName ? 'Masquer' : 'Voir les fiches'}
                    </button>
                    <button
                      onClick={() => handleMergeGroup(group)}
                      disabled={merging === group.documentName}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {merging === group.documentName ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Fusion en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Fusionner
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Supprimer ces fiches"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Liste des fiches du groupe */}
                {expandedGroup === group.documentName && (
                  <div className="mt-4 space-y-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Fiches qui seront fusionnées :
                    </p>
                    {group.cards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <span className="text-teal-600 mt-0.5">•</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{card.title}</div>
                          {card.content.key_points?.[0] && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {card.content.key_points[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {card.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
