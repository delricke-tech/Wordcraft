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
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChatMessage, DocumentContext, sendChatMessage, summarizeDocument, analyzeUploadedDocument } from '../services/openaiService';
import { toast } from 'sonner';

interface ChatPanelProps {
  documentContext: DocumentContext;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatPanel({ documentContext, isOpen, onToggle }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
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
        content: `⚠️ Désolé, une erreur s'est produite : ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!documentContext.extractedText || isSummarizing) return;

    setIsSummarizing(true);
    toast.loading('Génération du résumé en cours...', { id: 'summary' });

    try {
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
      toast.error('Erreur', {
        id: 'summary',
        description: error.message || 'Impossible de générer le résumé'
      });
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

  return (
    <>
      {/* Bouton de toggle */}
      <motion.button
        onClick={onToggle}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-gradient-to-br from-purple-600/90 to-blue-600/90 backdrop-blur-md text-white p-3 rounded-l-xl shadow-lg hover:shadow-xl transition-all"
        whileHover={{ scale: 1.05, x: -4 }}
        whileTap={{ scale: 0.95 }}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {isOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
      </motion.button>

      {/* Panneau de chat - Glassmorphism */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full md:w-[500px] z-40 flex flex-col"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Assistant IA</h3>
                    <p className="text-xs text-white/70">Propulsé par OpenAI</p>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <button
                  onClick={handleSummarize}
                  disabled={!documentContext.extractedText || isSummarizing}
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
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                        ? 'bg-gradient-to-br from-purple-500/80 to-blue-500/80 text-white'
                        : 'bg-white/20 text-white'
                    }`}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      className="prose prose-sm prose-invert max-w-none"
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm">{children}</code>
                          ) : (
                            <code className={className}>{children}</code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
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
                  <div className="bg-white/20 px-4 py-3 rounded-2xl" style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}>
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
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Posez une question sur le document..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                  style={{ backdropFilter: 'blur(10px)' }}
                />
                <button
                  onClick={handleSendMessage}
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

