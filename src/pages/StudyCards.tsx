import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  Play,
  Pencil,
  Trash2,
  Clock,
  Target,
  Sparkles,
  X,
  FileDown,
  Eye,
  Loader2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, StudyCard } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export function StudyCards() {
  useAuth();
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]); // ✅ Sélection multiple
  const [selectionMode, setSelectionMode] = useState(false); // ✅ Mode sélection

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('study_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCards(data || []);
      const tags = new Set<string>();
      data?.forEach((card) => card.tags?.forEach((tag: string) => tags.add(tag)));
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    const { error } = await supabase.from('study_cards').delete().eq('id', id);
    if (!error) {
      setCards(cards.filter((c) => c.id !== id));
      toast.success('Fiche supprimée !');
    }
  };

  // ✅ Suppression multiple
  const handleDeleteSelected = async () => {
    if (selectedCards.length === 0) return;
    
    const confirmed = confirm(`Supprimer ${selectedCards.length} fiche(s) sélectionnée(s) ?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('study_cards')
      .delete()
      .in('id', selectedCards);

    if (!error) {
      setCards(cards.filter((c) => !selectedCards.includes(c.id)));
      setSelectedCards([]);
      setSelectionMode(false);
      toast.success(`${selectedCards.length} fiche(s) supprimée(s) !`);
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Sélectionner/désélectionner tout
  const handleSelectAll = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(c => c.id));
    }
  };

  // ✅ Toggle sélection d'une carte
  const handleToggleCard = (id: string) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cId => cId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleDownloadCard = (card: StudyCard, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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

  const filteredCards = cards.filter((card) => {
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || card.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600 bg-green-100';
    if (level >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const dueCards = cards.filter(
    (card) => card.next_review_at && new Date(card.next_review_at) <= new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiches d'etude</h1>
          <p className="text-gray-500 mt-1">Creez et gerez vos fiches d'etude</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Boutons sélection multiple */}
          {selectionMode ? (
            <>
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedCards([]);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
                Annuler
              </button>
              {selectedCards.length > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedCards.length} sélectionné(s)
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                    Supprimer ({selectedCards.length})
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {cards.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Sélectionner
                </button>
              )}
              {dueCards.length > 0 && (
                <Link
                  to="/revision"
                  className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  <Play size={18} />
                  Reviser {dueCards.length} en attente
                </Link>
              )}
              <button
                onClick={() => setShowNewCardModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus size={18} />
                Nouvelle fiche
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total fiches</span>
            <BookOpen size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{cards.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">A reviser</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{dueCards.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Maitrisees</span>
            <Target size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {cards.filter((c) => c.mastery_level >= 80).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Generees par IA</span>
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {cards.filter((c) => c.is_ai_generated).length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des fiches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Tous les tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune fiche pour l'instant</h3>
          <p className="text-gray-500 mb-6">Creez votre premiere fiche ou generez-en a partir d'un document</p>
          <button
            onClick={() => setShowNewCardModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            Creer une fiche
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className={`bg-white border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all group relative ${
                selectedCards.includes(card.id) ? 'border-teal-500' : 'border-gray-200'
              }`}
            >
              {/* ✅ Checkbox en mode sélection */}
              {selectionMode && (
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedCards.includes(card.id)}
                    onChange={() => handleToggleCard(card.id)}
                    className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <Link to={`/cards/${card.id}`} className={selectionMode ? 'ml-8' : ''}>
                    <h3 className="font-semibold text-gray-900 hover:text-teal-600 line-clamp-2">
                      {card.title}
                    </h3>
                  </Link>
                  <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {card.content.key_points && card.content.key_points.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {card.content.key_points[0]}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {card.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {card.is_ai_generated && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-600 rounded flex items-center gap-1">
                      <Sparkles size={10} /> IA
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-2 py-0.5 rounded font-medium ${getMasteryColor(card.mastery_level)}`}>
                    {card.mastery_level}%
                  </span>
                  <span className="text-gray-500">
                    {card.review_count} revisions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/cards/${card.id}`}
                    className="p-1.5 hover:bg-blue-100 rounded"
                    title="Lire la fiche complète"
                  >
                    <Eye size={16} className="text-blue-600" />
                  </Link>
                  <button
                    onClick={(e) => handleDownloadCard(card, e)}
                    className="p-1.5 hover:bg-teal-100 rounded"
                    title="Télécharger"
                  >
                    <FileDown size={16} className="text-teal-600" />
                  </button>
                  <Link
                    to={`/cards/${card.id}/study`}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Etudier"
                  >
                    <Play size={16} className="text-teal-600" />
                  </Link>
                  <Link
                    to={`/cards/${card.id}/edit`}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Modifier"
                  >
                    <Pencil size={16} className="text-gray-500" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    className="p-1.5 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiche
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maitrise
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prochaine revision
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revisions
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/cards/${card.id}`} className="flex items-center gap-3">
                      <BookOpen size={20} className="text-teal-600" />
                      <div>
                        <span className="font-medium text-gray-900 hover:text-teal-600">
                          {card.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {card.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs text-gray-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded font-medium text-sm ${getMasteryColor(card.mastery_level)}`}>
                      {card.mastery_level}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {card.next_review_at
                      ? formatDistanceToNow(new Date(card.next_review_at), { addSuffix: true, locale: fr })
                      : 'Non programmee'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{card.review_count}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/cards/${card.id}`}
                        className="p-1.5 hover:bg-blue-50 rounded"
                        title="Lire la fiche complète"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </Link>
                      <button
                        onClick={(e) => handleDownloadCard(card, e)}
                        className="p-1.5 hover:bg-teal-50 rounded"
                        title="Télécharger"
                      >
                        <FileDown size={16} className="text-teal-600" />
                      </button>
                      <Link
                        to={`/cards/${card.id}/study`}
                        className="p-1.5 hover:bg-teal-50 rounded"
                        title="Etudier"
                      >
                        <Play size={16} className="text-teal-600" />
                      </Link>
                      <Link
                        to={`/cards/${card.id}/edit`}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="Modifier"
                      >
                        <Pencil size={16} className="text-gray-500" />
                      </Link>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewCardModal && (
        <NewCardModal
          onClose={() => setShowNewCardModal(false)}
          onCreated={fetchCards}
        />
      )}
    </div>
  );
}

function NewCardModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [title, setTitle] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Fichier uploadé
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (mode === 'ai') {
      fetchDocuments();
    }
  }, [mode]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, file_type, storage_path')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  const handleCreate = async () => {
    if (!user || !title) return;

    setLoading(true);
    const { error } = await supabase.from('study_cards').insert({
      user_id: user.id,
      title,
      content: {
        definitions: [],
        signs: [],
        diagnostics: [],
        treatments: [],
        key_points: [],
        custom_sections: [],
      },
    });

    if (!error) {
      toast.success('Fiche créée avec succès !');
      onCreated();
      onClose();
    } else {
      toast.error('Erreur lors de la création de la fiche');
    }
    setLoading(false);
  };

  const handleGenerateFromDocument = async () => {
    if (!user || (!selectedDocument && !uploadedFile)) return;

    setGenerating(true);
    const loadingToast = toast.loading('Génération des flashcards par IA...');

    try {
      let doc: any;
      let extractedText: string;

      // Si un fichier a été uploadé, l'utiliser directement
      if (uploadedFile) {
        console.log('📤 Upload et extraction depuis fichier uploadé:', uploadedFile.name);
        
        // Extraire le texte directement du fichier
        toast.loading('Extraction du texte...', { id: loadingToast });
        const { extractText } = await import('../services/textExtractor');
        const { getFileType } = await import('../utils/fileUtils');
        
        const fileType = getFileType(uploadedFile.name);
        const extractResult = await extractText(uploadedFile, fileType);
        extractedText = typeof extractResult === 'string' ? extractResult : extractResult.text;

        // Créer un objet document temporaire
        doc = {
          name: uploadedFile.name,
          id: 'temp-' + Date.now(),
        };
      } else {
        // Sinon, récupérer le document existant
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', selectedDocument)
          .single();

        if (docError || !docData) {
          throw new Error('Document introuvable');
        }

        doc = docData;

        // 2. Extraire le texte
        toast.loading('Extraction du texte...', { id: loadingToast });
        const { extractText } = await import('../services/textExtractor');
        const extractResult = await extractText(doc.storage_path, doc.file_type);
        extractedText = typeof extractResult === 'string' ? extractResult : extractResult.text;
      }

      if (!extractedText || extractedText.trim() === '') {
        throw new Error('Impossible d\'extraire le texte du document');
      }

      // 3. Générer les flashcards avec le nombre choisi
      toast.loading(`Génération de ${flashcardCount} flashcards...`, { id: loadingToast });
      const { generateFlashcardsFromText } = await import('../services/flashcardGenerator');
      const result = await generateFlashcardsFromText(extractedText, doc.name, doc.id, flashcardCount);

      if (!result.cards || result.cards.length === 0) {
        throw new Error('Aucune flashcard générée');
      }

      // 4. Créer la fiche avec le contenu généré
      const flashcardContent = {
        definitions: result.cards
          .filter(c => c.type === 'definition')
          .map(c => ({ term: c.front, definition: c.back })),
        key_points: result.cards
          .filter(c => c.type === 'concept')
          .map(c => `${c.front}: ${c.back}`),
        signs: [],
        diagnostics: [],
        treatments: [],
        custom_sections: result.cards
          .filter(c => c.type === 'date' || c.type === 'formula')
          .map(c => ({
            title: c.type === 'date' ? '📅 Dates importantes' : '📐 Formules',
            content: `${c.front}: ${c.back}`
          })),
      };

      // ✅ Préparer les données : ne pas inclure document_id si temporaire
      const cardData: any = {
        user_id: user.id,
        title: `Fiche IA - ${doc.name}`,
        content: flashcardContent,
        is_ai_generated: true,
      };

      // ✅ Ajouter document_id SEULEMENT si c'est un vrai UUID (pas temp-xxx)
      if (doc.id && !doc.id.startsWith('temp-')) {
        cardData.document_id = doc.id;
      }

      const { error: insertError } = await supabase.from('study_cards').insert(cardData);

      if (insertError) throw insertError;

      toast.success(`${result.cards.length} flashcards générées avec succès !`, { id: loadingToast });
      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Erreur génération flashcards:', error);
      toast.error(error.message || 'Erreur lors de la génération', { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle fiche</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Choix du mode */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              mode === 'manual'
                ? 'border-teal-600 bg-teal-50 text-teal-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Pencil size={20} />
            <span className="font-medium">Manuelle</span>
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              mode === 'ai'
                ? 'border-purple-600 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sparkles size={20} />
            <span className="font-medium">IA depuis document</span>
          </button>
        </div>

        {/* Mode manuel */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre de la fiche
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Anatomie du coeur"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!title || loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer la fiche'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mode IA */}
        {mode === 'ai' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sélectionner un document
              </label>
              <select
                value={selectedDocument}
                onChange={(e) => {
                  setSelectedDocument(e.target.value);
                  if (e.target.value) setUploadedFile(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!!uploadedFile}
              >
                <option value="">Choisir un document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                L'IA va analyser le document et créer automatiquement des flashcards
              </p>
            </div>

            {/* NOUVEAU : Upload de fichier */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-medium">OU</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Uploader un nouveau document
                </label>
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    uploadedFile 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                  } ${selectedDocument ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                          setSelectedDocument('');
                        }
                      }}
                      disabled={!!selectedDocument}
                      className="hidden"
                    />
                    <Upload size={20} className={uploadedFile ? 'text-purple-600' : 'text-gray-400'} />
                    <span className={`text-sm ${uploadedFile ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                      {uploadedFile ? uploadedFile.name : 'Choisir un fichier (PDF, DOCX, TXT, Image)'}
                    </span>
                  </label>
                  {uploadedFile && (
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés : PDF, DOCX, TXT, Images (JPG, PNG)
                </p>
              </div>
            </div>

            {/* NOUVEAU : Nombre de flashcards */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre de flashcards
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="10"
                  max="30"
                  value={flashcardCount}
                  onChange={(e) => setFlashcardCount(Math.max(10, Math.min(30, parseInt(e.target.value) || 15)))}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={flashcardCount}
                    onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-20">{flashcardCount} cards</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommandé : 15 flashcards (Léger : 10-12 | Moyen : 15-20 | Complet : 20-30)
              </p>
            </div>

            {!selectedDocument && !uploadedFile && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  Sélectionnez un document existant ou uploadez un nouveau fichier.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerateFromDocument}
                disabled={(!selectedDocument && !uploadedFile) || generating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Générer par IA
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
