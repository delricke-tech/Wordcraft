import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Loader2, Eye, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ChatMessage, DocumentContext, sendChatMessage } from '../services/openaiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface PDFViewerProps {
  documentId: string;
  documentName: string;
  storagePath: string;
  onClose?: () => void;
}

/**
 * Composant PDFViewer pour afficher les PDFs
 * 
 * IMPORTANT : Utilise le storage_path (nom nettoyé) pour récupérer le fichier
 * depuis Supabase Storage, mais affiche le name original (avec accents) à l'utilisateur.
 * 
 * Cela évite les erreurs "Invalid key" dues aux accents et caractères spéciaux.
 */
export function PDFViewer({ documentId, documentName, storagePath, onClose }: PDFViewerProps) {
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  
  // ✅ États pour le chat AI intégré
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  useEffect(() => {
    loadPDF();
    loadDocumentContext();
  }, [storagePath, documentId]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 ===== CHARGEMENT PDF =====');
      console.log('  - Document ID:', documentId);
      console.log('  - Nom affiché:', documentName);
      console.log('  - Storage path:', storagePath);
      console.log('  - Bucket:', 'documents');

      // Vérifier que storage_path n'est pas vide
      if (!storagePath || storagePath.trim() === '') {
        console.error('❌ storage_path est vide ou manquant');
        throw new Error('Le chemin du fichier est manquant. Vérifiez que la colonne storage_path existe en base de données.');
      }

      // RÈGLE IMPORTANTE : Utiliser storage_path (nom nettoyé) pour récupérer le fichier
      // Cela évite les erreurs "Invalid key" dues aux accents
      
      console.log('🔐 Tentative de génération d\'URL signée...');
      
      // Utiliser directement l'URL signée (recommandé pour la sécurité)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600); // 3600 secondes = 1 heure

      if (signedUrlError) {
        console.error('❌ Erreur lors de la génération de l\'URL signée:', signedUrlError);
        console.error('  - Code:', signedUrlError.message);
        console.error('  - Storage path utilisé:', storagePath);
        
        // Essayer avec l'URL publique en dernier recours
        console.log('🔄 Tentative avec URL publique...');
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          console.log('✅ URL publique générée (fallback):', publicUrlData.publicUrl);
          setPdfUrl(publicUrlData.publicUrl);
          setLoading(false);
          return;
        }
        
        throw new Error(`Impossible de charger le PDF : ${signedUrlError.message}`);
      }

      if (signedUrlData?.signedUrl) {
        console.log('✅ URL signée générée avec succès');
        console.log('  - URL valide pendant: 1 heure');
        console.log('  - URL (tronquée):', signedUrlData.signedUrl.substring(0, 100) + '...');
        setPdfUrl(signedUrlData.signedUrl);
      } else {
        console.error('❌ Aucune URL générée');
        throw new Error('Impossible de générer une URL pour le PDF');
      }

    } catch (err: any) {
      console.error('💥 ===== ERREUR LORS DU CHARGEMENT =====');
      console.error('Type:', err.name);
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
      
      setError(err.message || 'Erreur lors du chargement du PDF');
      toast.error('Erreur', {
        description: 'Impossible de charger le PDF. Consultez la console (F12) pour plus de détails.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/library');
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      console.log('⬇️ Téléchargement du PDF:', documentName);
      
      // Créer un lien temporaire pour télécharger le fichier
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = documentName; // Utiliser le nom original avec accents
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Téléchargement démarré', {
        description: `"${documentName}" est en cours de téléchargement`
      });
    } catch (err: any) {
      console.error('❌ Erreur lors du téléchargement:', err);
      toast.error('Erreur', {
        description: 'Impossible de télécharger le fichier'
      });
    }
  };

  // Fermeture au clavier (Échap)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0)); // Max 300%
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5)); // Min 50%
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  // ✅ Charger le contexte du document pour l'IA
  const loadDocumentContext = async () => {
    try {
      console.log('🤖 Chargement du contexte pour l\'IA...');
      
      // Récupérer les informations du document depuis la BDD
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, storage_path, extracted_text')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('❌ Erreur lors du chargement du contexte:', error);
        return;
      }

      if (data) {
        console.log('✅ Contexte chargé:', {
          id: data.id,
          name: data.name,
          has_text: !!data.extracted_text,
          text_length: data.extracted_text?.length || 0
        });

        setExtractedText(data.extracted_text);
        setDocumentContext({
          documentId: data.id,
          documentName: data.name || documentName,
          storagePath: data.storage_path || storagePath,
          extractedText: data.extracted_text
        });

        // Message de bienvenue
        if (data.extracted_text) {
          setMessages([{
            role: 'assistant',
            content: `Bonjour ! 👋 Je suis votre assistant IA pour le document **${data.name || documentName}**.\n\nJe peux vous aider à comprendre son contenu. Posez-moi vos questions !`,
            timestamp: new Date()
          }]);
        }
      }
    } catch (err) {
      console.error('💥 Erreur lors du chargement du contexte:', err);
    }
  };

  // ✅ Envoyer un message au chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoadingChat || !documentContext) return;

    // ✅ RÈGLE 5 : Vérifier si content_text est disponible
    if (!documentContext.extractedText || documentContext.extractedText.trim() === '') {
      toast.warning('Analyse du document en cours...', {
        description: 'Le texte de ce document est en cours d\'extraction. Veuillez patienter quelques instants.',
        duration: 4000
      });
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoadingChat(true);

    try {
      console.log('📤 Envoi du message à l\'IA...');
      
      const response = await sendChatMessage(
        inputMessage,
        documentContext,
        messages
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      
      toast.error('Erreur', {
        description: error.message || 'Impossible d\'envoyer le message'
      });

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `⚠️ **Erreur**\n\n${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={handleClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Fermer"
          >
            <X size={24} />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">
              {documentName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Lecteur PDF
            </p>
          </div>
        </div>

        {/* Contrôles de Zoom */}
        <div className="flex items-center gap-2 mx-4">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Dézoomer"
          >
            <ZoomOut size={20} />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Réinitialiser le zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoomer"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        {/* Bouton Télécharger */}
        <button
          onClick={handleDownload}
          disabled={!pdfUrl}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} />
          <span className="hidden sm:inline">Télécharger</span>
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-4">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-gray-300">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-lg">Chargement du PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 text-red-400 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <X size={32} />
            </div>
            <div>
              <p className="text-lg font-semibold mb-2">Erreur de chargement</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <button
              onClick={loadPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && pdfUrl && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            {/* Bouton d'ouverture dans un nouvel onglet (en cas de problème d'iframe) */}
            <button
              onClick={() => {
                console.log('🔗 Ouverture du PDF dans un nouvel onglet');
                window.open(pdfUrl, '_blank');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mb-4"
            >
              <Eye size={20} />
              Ouvrir dans un nouvel onglet
            </button>

            {/* iframe pour affichage intégré */}
            <div className="w-full h-full">
              <iframe
                src={`${pdfUrl}#zoom=${scale * 100}`}
                className="w-full h-full border-0 rounded-lg shadow-2xl"
                style={{
                  maxWidth: `${scale * 100}%`,
                  maxHeight: `${scale * 100}%`,
                }}
                title={documentName}
                onLoad={() => {
                  console.log('✅ iframe chargée avec succès');
                }}
                onError={(e) => {
                  console.error('❌ Erreur de chargement de l\'iframe:', e);
                  toast.error('Erreur d\'affichage', {
                    description: 'Utilisez le bouton "Ouvrir dans un nouvel onglet" ci-dessus'
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer avec infos */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>📄 Format: PDF</span>
            <span>🔒 Connexion sécurisée</span>
          </div>
          <div>
            <span className="text-gray-500">
              Appuyez sur <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Échap</kbd> pour fermer
            </span>
          </div>
        </div>
      </div>

      {/* ✅ RÈGLE 1 : Icône flottante Glassmorphism en bas à droite */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center group"
          style={{
            background: 'rgba(99, 102, 241, 0.9)', // Indigo semi-transparent
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
          title="Ouvrir le chat IA"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </motion.div>
          
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-75 animate-ping" />
        </motion.button>
      )}

      {/* ✅ RÈGLE 2 : Panneau de chat latéral (Glassmorphism) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full md:w-[450px] z-50 flex flex-col"
            style={{
              background: 'rgba(17, 24, 39, 0.95)', // Gris foncé semi-transparent
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Header du chat */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Assistant IA</h3>
                    <p className="text-xs text-white/60">Copilot PDF</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* ✅ RÈGLE 4 : Afficher le titre du document avec la colonne 'name' (accents) */}
              <div 
                className="px-3 py-2 rounded-lg text-xs text-white/80 truncate"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                title={documentContext?.documentName || documentName}
              >
                📄 {documentContext?.documentName || documentName}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* ✅ RÈGLE 5 : Message si content_text est vide */}
              {!extractedText && (
                <div 
                  className="p-4 rounded-lg text-sm text-amber-200"
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)'
                  }}
                >
                  <p className="font-semibold mb-1">⏳ Analyse du document en cours...</p>
                  <p className="text-xs text-amber-200/70">
                    Le texte de ce document est en cours d'extraction. Veuillez patienter quelques instants.
                  </p>
                </div>
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
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
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

              {isLoadingChat && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div 
                    className="bg-white/10 px-4 py-3 rounded-2xl" 
                    style={{ 
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-center gap-2 text-white">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">L'IA réfléchit...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={extractedText ? "Posez une question sur le document..." : "En attente de l'extraction..."}
                  disabled={isLoadingChat || !extractedText}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                  style={{ 
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoadingChat || !extractedText}
                  className="px-4 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
                  title={!extractedText ? "En attente de l'extraction du texte" : "Envoyer"}
                >
                  {isLoadingChat ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-2 text-center">
                L'IA peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

