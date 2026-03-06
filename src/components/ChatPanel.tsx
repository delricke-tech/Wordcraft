/**
 * Panneau de chat IA avec design Glassmorphism
 * 
 * Interface moderne avec :
 * - Transparence et flou (backdrop-filter)
 * - Animations Framer Motion
 * - Support Markdown avec formules mathématiques
 * - Bouton Résumer et Trombone
 * 
 * Date: 28 décembre 2024
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Paperclip, 
  X, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Loader2,
  Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChatMessage, DocumentContext, sendChatMessage, summarizeDocument, analyzeUploadedDocument } from '../services/openaiService';
import { 
  createConversation, 
  addMessage, 
  getUserConversations, 
  getConversationWithMessages,
  updateConversationTitle,
  deleteConversation,
  exportConversationAsText,
  exportConversationAsMarkdown,
  generateConversationTitle,
  type Conversation,
  type ConversationWithMessages 
} from '../services/conversationService';
import { supabase } from '../lib/supabase';
import { DocumentSelector } from './DocumentSelector';
import { ContentGenerator } from './ContentGenerator';
import { toast } from 'sonner';

interface ChatPanelProps {
  documentContext?: DocumentContext; // Rendu optionnel pour le mode multi-documents
  isOpen: boolean;
  onToggle: () => void;
  isExtractingText?: boolean;
}

interface SelectedDocument {
  id: string;
  name: string;
  file_type: string;
  extracted_text?: string;
}

export function ChatPanel({ documentContext, isOpen, onToggle, isExtractingText = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [detailLevel, setDetailLevel] = useState<'concis' | 'standard' | 'détaillé'>('détaillé');
  
  // Nouveaux états pour multi-documents et conversations
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversationList, setShowConversationList] = useState(false);
  const [isMultiDocumentMode, setIsMultiDocumentMode] = useState(false);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestions de questions basées sur le contexte
  const suggestions = [
    { icon: '📝', text: 'Fais-moi un résumé', emoji: '📋' },
    { icon: '🎯', text: 'Quels sont les points clés ?', emoji: '⭐' },
    { icon: '❓', text: 'Explique-moi les concepts principaux', emoji: '💡' },
    { icon: '📚', text: 'Quelles sont les définitions importantes ?', emoji: '📖' },
    { icon: '🧪', text: 'Donne-moi des exemples pratiques', emoji: '✨' },
    { icon: '📊', text: 'Quelles formules dois-je retenir ?', emoji: '🔢' },
  ];

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Charger les conversations de l'utilisateur
  useEffect(() => {
    if (isOpen) {
      loadUserConversations();
    }
  }, [isOpen]);

  // Gérer le mode multi-documents vs document unique
  useEffect(() => {
    if (documentContext && !isMultiDocumentMode) {
      // Mode document unique (comportement existant)
      setSelectedDocuments([{
        id: documentContext.documentId,
        name: documentContext.documentName,
        file_type: 'pdf', // ou récupérer depuis le document
        extracted_text: documentContext.extractedText
      }]);
    }
  }, [documentContext, isMultiDocumentMode]);

  // Charger les conversations de l'utilisateur
  const loadUserConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userConversations = await getUserConversations(user.id);
      setConversations(userConversations);
    } catch (error: any) {
      console.error('Erreur chargement conversations:', error);
    }
  };

  // Créer une nouvelle conversation
  const createNewConversation = async (firstMessage: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const title = generateConversationTitle(firstMessage);
      const documentIds = selectedDocuments.map(doc => doc.id);
      const documentNames = selectedDocuments.map(doc => doc.name);

      const conversation = await createConversation(user.id, title, documentIds, documentNames);
      setCurrentConversation(conversation);
      
      // Ajouter le premier message
      await addMessage(conversation.id, 'user', firstMessage, {
        document_ids: documentIds,
        detail_level: detailLevel
      });

      // Recharger la liste des conversations
      await loadUserConversations();
      
      return conversation;
    } catch (error: any) {
      console.error('Erreur création conversation:', error);
      toast.error('Erreur', {
        description: 'Impossible de créer la conversation'
      });
      return null;
    }
  };

  // Charger une conversation existante
  const loadConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const conversationWithMessages = await getConversationWithMessages(conversationId, user.id);
      setCurrentConversation(conversationWithMessages);
      
      // Convertir les messages au format ChatMessage
      const chatMessages: ChatMessage[] = conversationWithMessages.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(chatMessages);
      setShowSuggestions(false);
      
      // Charger les documents du contexte
      if (conversationWithMessages.document_context.document_ids.length > 1) {
        setIsMultiDocumentMode(true);
        // Charger les documents sélectionnés depuis le contexte
        const docs: SelectedDocument[] = [];
        for (let i = 0; i < conversationWithMessages.document_context.document_ids.length; i++) {
          docs.push({
            id: conversationWithMessages.document_context.document_ids[i],
            name: conversationWithMessages.document_context.document_names[i],
            file_type: 'pdf', // à récupérer depuis la BDD
            extracted_text: '' // à charger si nécessaire
          });
        }
        setSelectedDocuments(docs);
      }
    } catch (error: any) {
      console.error('Erreur chargement conversation:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger la conversation'
      });
    }
  };

  // Message de bienvenue
  useEffect(() => {
    if (documentContext.documentName && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Bonjour ! 👋 Je suis votre assistant IA pour le document **${documentContext.documentName}**.

Je peux vous aider à :
- Comprendre le contenu du document
- Répondre à vos questions
- Expliquer des concepts complexes
- Générer un résumé

N'hésitez pas à me poser des questions !`,
        timestamp: new Date()
      }]);
    }
  }, [documentContext.documentName]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim() || isLoading) return;

    // Vérifier qu'on a des documents sélectionnés
    if (selectedDocuments.length === 0) {
      toast.error('Aucun document sélectionné', {
        description: 'Veuillez sélectionner au moins un document pour discuter'
      });
      return;
    }

    // Vérifier que les documents ont du texte extrait
    const hasValidText = selectedDocuments.some(doc => 
      doc.extracted_text && doc.extracted_text.trim().length > 0
    );
    
    if (!hasValidText) {
      toast.error('Documents non analysés', {
        description: 'Les documents sélectionnés n\'ont pas encore été analysés. Veuillez patienter...'
      });
      return;
    }

    // Masquer les suggestions après le premier message
    setShowSuggestions(false);

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Créer ou utiliser une conversation existante
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await createNewConversation(messageToSend);
      }

      if (!conversation) {
        throw new Error('Impossible de créer ou charger la conversation');
      }

      // Combiner le texte de tous les documents sélectionnés
      const combinedText = selectedDocuments
        .filter(doc => doc.extracted_text)
        .map(doc => `=== ${doc.name} ===\n${doc.extracted_text}`)
        .join('\n\n');

      // Créer le contexte multi-documents
      const multiDocContext: DocumentContext = {
        documentId: selectedDocuments[0].id, // Premier document comme ID principal
        documentName: selectedDocuments.length === 1 
          ? selectedDocuments[0].name 
          : `${selectedDocuments.length} documents`,
        storagePath: '', // Pas utilisé en mode multi-documents
        extractedText: combinedText
      };

      console.log('📤 Envoi du message avec contexte multi-documents...');
      console.log('  - Message:', messageToSend);
      console.log('  - Documents:', selectedDocuments.length);
      console.log('  - Texte combiné:', combinedText.length, 'caractères');
      
      const response = await sendChatMessage(
        messageToSend,
        multiDocContext,
        messages,
        {
          detailLevel: detailLevel,
          useWebSearch: false,
          includeCitations: true // Activer les citations automatiques
        }
      );

      console.log('📥 Réponse reçue de l\'IA');

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response, // Utiliser la propriété response
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Sauvegarder la réponse dans la conversation
      if (conversation) {
        await addMessage(conversation.id, 'assistant', response.response, {
          document_ids: selectedDocuments.map(doc => doc.id),
          detail_level: detailLevel,
          citations: response.citations // Sauvegarder les citations
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      
      let errorDescription = error.message;
      if (error.message.includes('n\'a pas encore été extrait')) {
        errorDescription = 'Le texte des documents n\'est pas encore disponible. Veuillez patienter...';
      }
      
      toast.error('Erreur', {
        description: errorDescription
      });

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `⚠️ **Erreur**\n\n${error.message}\n\nSi le problème persiste, essayez de :\n1. Sélectionner d'autres documents\n2. Attendre l'analyse des documents\n3. Recharger la page`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    // ✅ VÉRIFICATION : Le texte doit être disponible
    if (!documentContext.extractedText || documentContext.extractedText.trim() === '') {
      console.error('❌ Tentative de résumé sans texte extrait');
      toast.error('Erreur', {
        description: 'Le texte du document n\'est pas encore disponible. Veuillez patienter...'
      });
      return;
    }

    if (isSummarizing) return;

    setIsSummarizing(true);
    toast.loading('Génération du résumé en cours...', { id: 'summary' });

    try {
      console.log('📝 Demande de résumé...');
      console.log('  - Document:', documentContext.documentName);
      console.log('  - Texte disponible:', documentContext.extractedText.length, 'caractères');
      
      const summary = await summarizeDocument(
        documentContext.extractedText,
        documentContext.documentName
      );

      const summaryMessage: ChatMessage = {
        role: 'assistant',
        content: `📝 **Résumé du document "${documentContext.documentName}"**\n\n${summary}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMessage]);
      toast.success('Résumé généré !', { id: 'summary' });
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du résumé:', error);
      
      let errorDescription = error.message || 'Impossible de générer le résumé';
      if (error.message.includes('n\'a pas encore été extrait')) {
        errorDescription = 'Le texte de ce cours n\'est pas encore disponible.';
      }
      
      toast.error('Erreur', {
        id: 'summary',
        description: errorDescription
      });

      // Afficher aussi le message d'erreur dans le chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `⚠️ **Erreur lors de la génération du résumé**\n\n${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading(`Analyse de ${file.name}...`);

    try {
      const extractedText = await analyzeUploadedDocument(file);

      const fileMessage: ChatMessage = {
        role: 'assistant',
        content: `📎 **Fichier analysé : ${file.name}**\n\nJ'ai extrait le contenu de ce document. Vous pouvez maintenant me poser des questions dessus !`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fileMessage]);
      toast.success('Fichier analysé !', { id: loadingToast });

      // Mettre à jour le contexte avec le nouveau texte
      documentContext.extractedText = (documentContext.extractedText || '') + '\n\n' + extractedText;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'analyse du fichier:', error);
      toast.error('Erreur', {
        id: loadingToast,
        description: error.message
      });
    }

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gérer le clic sur la bulle flottante avec vérification du contexte
  const handleToggleClick = () => {
    // Si le panel est déjà ouvert, le fermer simplement
    if (isOpen) {
      onToggle();
      return;
    }

    // Si l'extraction est en cours, afficher un message
    if (isExtractingText) {
      console.log('⏳ Extraction du texte en cours...');
      toast.info('Analyse du texte en cours...', {
        description: 'L\'IA analyse le document. La bulle s\'activera automatiquement une fois prête.',
        duration: 3000
      });
      return;
    }

    // Si le panel n'est pas ouvert, vérifier d'abord si le texte est disponible
    console.log('📄 Vérification du contexte du document...');
    console.log('  - Document ID:', documentContext.documentId);
    console.log('  - Document Name:', documentContext.documentName);
    console.log('  - Storage Path:', documentContext.storagePath);
    console.log('  - Extracted Text:', documentContext.extractedText ? `${documentContext.extractedText.length} caractères` : 'NULL');

    // Si le texte n'est pas disponible (NULL ou vide), afficher un message
    if (!documentContext.extractedText || documentContext.extractedText.trim() === '') {
      console.warn('⚠️ Le texte du document n\'est pas encore extrait');
      toast.warning('Analyse du texte en cours...', {
        description: `Le document "${documentContext.documentName}" est en cours d\'analyse. Veuillez patienter quelques instants...`,
        duration: 4000
      });
      return;
    }

    // Si tout est OK, ouvrir le panel
    console.log('✅ Texte disponible, ouverture du chat...');
    console.log('✅ Fichier identifié via storage_path:', documentContext.storagePath);
    onToggle();
  };

  return (
    <>
      {/* Bouton de toggle (bulle flottante opérationnelle) */}
      <motion.button
        onClick={handleToggleClick}
        disabled={isExtractingText}
        className={`fixed top-1/2 right-0 -translate-y-1/2 z-50 backdrop-blur-md text-white p-3 rounded-l-xl shadow-lg hover:shadow-xl transition-all ${
          isExtractingText 
            ? 'bg-gradient-to-br from-orange-500/90 to-amber-500/90 cursor-wait opacity-90' 
            : 'bg-gradient-to-br from-purple-600/90 to-blue-600/90 cursor-pointer'
        }`}
        whileHover={!isExtractingText ? { scale: 1.05, x: -4 } : {}}
        whileTap={!isExtractingText ? { scale: 0.95 } : {}}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        title={
          isExtractingText 
            ? 'Analyse du document en cours...'
            : !documentContext.extractedText 
            ? 'Analyse du document en cours...'
            : `Discuter avec l'IA à propos de ${documentContext.documentName}`
        }
      >
        {isExtractingText ? (
          <div className="relative">
            <Loader2 size={24} className="animate-spin" />
            <Sparkles size={12} className="absolute -top-1 -right-1 animate-pulse" />
          </div>
        ) : isOpen ? (
          <ChevronRight size={24} />
        ) : (
          <ChevronLeft size={24} />
        )}
      </motion.button>

      {/* Panneau de chat - Glassmorphism Optimisé */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[90vw] md:w-[500px] max-w-full z-40 flex flex-col"
            style={{
              background: 'rgba(15, 23, 42, 0.85)', // Fond sombre avec transparence
              backdropFilter: 'blur(24px) saturate(180%)', // Flou + saturation pour effet verre
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Assistant IA</h3>
                    <p className="text-xs text-white/70">Propulsé par OpenAI GPT-4</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bouton conversations */}
                  <button
                    onClick={() => setShowConversationList(!showConversationList)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Historique des conversations"
                  >
                    <ChevronLeft className={`w-5 h-5 text-white transition-transform ${
                      showConversationList ? 'rotate-180' : ''
                    }`} />
                  </button>
                  <button
                    onClick={onToggle}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Sélecteur de documents */}
              <DocumentSelector
                selectedDocuments={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
                maxDocuments={5}
                className="mb-4"
              />

              {/* Sélecteur de niveau de détail */}
              <div className="mb-3">
                <label className="text-xs text-white/70 mb-2 block">📊 Niveau de détail :</label>
                <div className="flex gap-2">
                  {(['concis', 'standard', 'détaillé'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDetailLevel(level)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        detailLevel === level
                          ? 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                      style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                    >
                      {level === 'concis' && '🎯 Concis'}
                      {level === 'standard' && '⚖️ Standard'}
                      {level === 'détaillé' && '📚 Détaillé'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-1">
                  {detailLevel === 'concis' && '• Réponses courtes et précises'}
                  {detailLevel === 'standard' && '• Réponses équilibrées avec exemples'}
                  {detailLevel === 'détaillé' && '• Réponses exhaustives et approfondies ✨'}
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <button
                  onClick={handleSummarize}
                  disabled={!documentContext?.extractedText || isSummarizing}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Résumer
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowContentGenerator(!showContentGenerator)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                >
                  <Brain className="w-4 h-4" />
                  Contenu IA
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Générateur de contenu */}
              {showContentGenerator && selectedDocuments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <ContentGenerator
                    documentId={selectedDocuments[0].id}
                    documentName={selectedDocuments[0].name}
                    documentContent={selectedDocuments[0].extracted_text || ''}
                    onGenerated={(type) => {
                      toast.success(`Contenu généré`, {
                        description: `${type} créé avec succès`
                      });
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Suggestions interactives */}
              {showSuggestions && messages.length <= 1 && documentContext.extractedText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-white/70 font-medium mb-3">💡 Suggestions de questions :</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSendMessage(suggestion.text)}
                        disabled={isLoading}
                        className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left text-white transition-all border border-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                        style={{ 
                          backdropFilter: 'blur(12px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                        <span className="text-sm flex-1">{suggestion.text}</span>
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                </motion.div>
              )}

              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500/80 to-blue-500/80 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                          code: ({ className, children, ...props }) => {
                            // Vérifier si c'est un code block ou inline
                            const isCodeBlock = className?.includes('language-');
                            return isCodeBlock ? (
                              <code className={className || ''} {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <p className="text-xs opacity-60 mt-2">
                      {msg.timestamp?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div 
                    className="bg-white/10 px-4 py-3 rounded-2xl" 
                    style={{ 
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div className="flex items-center gap-2 text-white">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">L'IA réfléchit...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 sm:p-6 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={showSuggestions && messages.length <= 1 ? "Ou tapez votre propre question..." : "Posez une question sur le document..."}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                  style={{ 
                    backdropFilter: 'blur(12px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-3 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/50 mt-2 text-center">
                L'IA peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

