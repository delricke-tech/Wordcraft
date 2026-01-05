import { useState, useRef, useEffect } from 'react';

import { Sparkles, Send, Copy, Check, Upload, FileText, X, Loader, Trash2 } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { extractTextFromFile } from '../services/textExtractor';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type UploadedDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  extractedAt: Date;
};

export function AIAssistant() {

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  // 🔄 Restaurer les documents depuis localStorage au chargement
  useEffect(() => {
    const savedDocuments = localStorage.getItem('aiAssistant_uploadedDocuments');
    const savedMessages = localStorage.getItem('aiAssistant_messages');
    
    if (savedDocuments) {
      try {
        const parsed = JSON.parse(savedDocuments);
        // Reconvertir les dates
        const documentsWithDates = parsed.map((doc: any) => ({
          ...doc,
          extractedAt: new Date(doc.extractedAt)
        }));
        setUploadedDocuments(documentsWithDates);
        console.log('✅ Documents restaurés depuis localStorage:', documentsWithDates.length);
      } catch (error) {
        console.error('❌ Erreur lors de la restauration des documents:', error);
      }
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Reconvertir les dates
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        console.log('✅ Messages restaurés depuis localStorage:', messagesWithDates.length);
      } catch (error) {
        console.error('❌ Erreur lors de la restauration des messages:', error);
      }
    }
  }, []);

  // 💾 Sauvegarder les documents dans localStorage à chaque modification
  useEffect(() => {
    if (uploadedDocuments.length > 0) {
      localStorage.setItem('aiAssistant_uploadedDocuments', JSON.stringify(uploadedDocuments));
      console.log('💾 Documents sauvegardés dans localStorage:', uploadedDocuments.length);
    }
  }, [uploadedDocuments]);

  // 💾 Sauvegarder les messages dans localStorage à chaque modification
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiAssistant_messages', JSON.stringify(messages));
      console.log('💾 Messages sauvegardés dans localStorage:', messages.length);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.length === uploadedDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(uploadedDocuments.map(doc => doc.id));
    }
  };

  const deleteSelectedDocuments = () => {
    if (selectedDocuments.length === 0) return;
    
    // Suppression silencieuse sans confirmation
    const newDocuments = uploadedDocuments.filter(doc => !selectedDocuments.includes(doc.id));
    setUploadedDocuments(newDocuments);
    setSelectedDocuments([]);
    
    // Mettre à jour localStorage
    if (newDocuments.length === 0) {
      localStorage.removeItem('aiAssistant_uploadedDocuments');
    } else {
      localStorage.setItem('aiAssistant_uploadedDocuments', JSON.stringify(newDocuments));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 📱 Limites de taille selon l'appareil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const MAX_FILE_SIZE_MOBILE = 10 * 1024 * 1024; // 10 MB sur mobile
    const MAX_FILE_SIZE_DESKTOP = 50 * 1024 * 1024; // 50 MB sur desktop
    const MAX_FILE_SIZE = isMobile ? MAX_FILE_SIZE_MOBILE : MAX_FILE_SIZE_DESKTOP;

    // Vérifier la taille des fichiers AVANT de commencer l'extraction
    const oversizedFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE_SIZE) {
        oversizedFiles.push(`${files[i].name} (${(files[i].size / 1024 / 1024).toFixed(1)} MB)`);
      }
    }

    if (oversizedFiles.length > 0) {
      const maxSizeMB = isMobile ? 10 : 50;
      alert(
        `❌ Fichier(s) trop volumineux :\n\n${oversizedFiles.join('\n')}\n\n` +
        `Limite ${isMobile ? 'sur mobile' : 'sur ordinateur'} : ${maxSizeMB} MB par fichier.\n\n` +
        `💡 Conseils :\n` +
        `- Compressez vos PDF\n` +
        `- Divisez les gros documents\n` +
        `- Utilisez un ordinateur pour les gros fichiers`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);

    try {
      const newDocuments: UploadedDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`📄 Extraction du document ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

        try {
          const extractedText = await extractTextFromFile(file);
          
          // Vérifier que le texte extrait n'est pas trop long pour localStorage
          const estimatedStorageSize = new Blob([JSON.stringify({
            id: `doc-${Date.now()}-${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            content: extractedText,
            extractedAt: new Date(),
          })]).size;

          if (estimatedStorageSize > 5 * 1024 * 1024) { // 5 MB max par document dans localStorage
            console.warn(`⚠️ Document "${file.name}" trop volumineux pour le stockage (${(estimatedStorageSize / 1024 / 1024).toFixed(1)} MB)`);
            alert(
              `⚠️ Le document "${file.name}" contient trop de texte pour être stocké.\n\n` +
              `Taille extraite : ${(estimatedStorageSize / 1024 / 1024).toFixed(1)} MB\n` +
              `Limite : 5 MB\n\n` +
              `💡 Essayez avec un document plus court ou divisez-le en plusieurs parties.`
            );
            continue;
          }
          
          newDocuments.push({
            id: `doc-${Date.now()}-${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            content: extractedText,
            extractedAt: new Date(),
          });

          console.log(`✅ Document "${file.name}" extrait (${extractedText.length} caractères, ${(estimatedStorageSize / 1024).toFixed(0)} KB stockage)`);
        } catch (error) {
          console.error(`❌ Erreur extraction "${file.name}":`, error);
          alert(`❌ Erreur lors de l'extraction de "${file.name}":\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      setUploadedDocuments(prev => [...prev, ...newDocuments]);

      // Message de confirmation
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ **${newDocuments.length} document(s) importé(s) avec succès !**\n\nVous pouvez maintenant me poser des questions sur ces cours. Par exemple :\n- "Résume-moi tous les cours"\n- "Quels sont les concepts clés abordés ?"\n- "Crée-moi un quiz sur ces documents"`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);

    } catch (error) {
      console.error('Erreur upload documents:', error);
      alert('Erreur lors de l\'import des documents');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (docId: string) => {
    const newDocuments = uploadedDocuments.filter(doc => doc.id !== docId);
    setUploadedDocuments(newDocuments);
    
    // Mettre à jour localStorage
    if (newDocuments.length === 0) {
      localStorage.removeItem('aiAssistant_uploadedDocuments');
    } else {
      localStorage.setItem('aiAssistant_uploadedDocuments', JSON.stringify(newDocuments));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Construire le contexte des documents
      let documentsContext = '';
      if (uploadedDocuments.length > 0) {
        documentsContext = '\n\n📚 **DOCUMENTS DE COURS IMPORTÉS** :\n\n';
        uploadedDocuments.forEach((doc, index) => {
          documentsContext += `--- DOCUMENT ${index + 1}: ${doc.name} ---\n${doc.content.substring(0, 3000)}\n\n`;
        });
        documentsContext += '\n⚠️ Base tes réponses UNIQUEMENT sur ces documents de cours.\n';
      }

      // ✅ Appeler l'Edge Function Supabase pour éviter CORS
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          messages: [
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            {
              role: 'user',
              content: input
            }
          ],
          context: documentsContext,
          documentsCount: uploadedDocuments.length
        },
      });

      console.log('🤖 Réponse Edge Function chat-ai:', { data, error });

      if (error) {
        console.error('❌ Erreur chat-ai:', error);
        throw new Error(error.message || 'Erreur lors de l\'appel à l\'API');
      }

      if (!data) {
        console.error('❌ Pas de data retournée');
        throw new Error('Aucune réponse de l\'Edge Function');
      }

      // L'Edge Function retourne 'message' au lieu de 'content'
      const aiResponse = data?.message || data?.content || 'Désolé, je n\'ai pas pu générer de réponse.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'IA:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erreur: ${error instanceof Error ? error.message : 'Impossible de contacter l\'assistant IA'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 🗑️ Effacer tout (documents + messages)
  const clearAll = () => {
    if (confirm('Voulez-vous vraiment effacer tous les documents et messages ? Cette action est irréversible.')) {
      setUploadedDocuments([]);
      setMessages([]);
      setSelectedDocuments([]);
      localStorage.removeItem('aiAssistant_uploadedDocuments');
      localStorage.removeItem('aiAssistant_messages');
      console.log('🗑️ Tout a été effacé');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 lg:gap-6 bg-[#020617] p-2 sm:p-4 text-slate-100 overflow-x-hidden">
      {/* Panneau latéral - Documents importés */}
      <div className="w-full lg:w-80 lg:flex-shrink-0 bg-[#09090b] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[40vh] lg:max-h-none">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-200 mb-2">Documents de cours</h3>
          <p className="text-xs text-slate-400 mb-4">
            {uploadedDocuments.length} document{uploadedDocuments.length > 1 ? 's' : ''} importé{uploadedDocuments.length > 1 ? 's' : ''}
            {selectedDocuments.length > 0 && (
              <span className="text-blue-400 ml-1">
                • {selectedDocuments.length} sélectionné{selectedDocuments.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.doc,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.webp"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          
          {/* Boutons d'action */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Extraction...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Importer</span>
                </>
              )}
            </button>
            
            {uploadedDocuments.length > 0 && (
              <button
                onClick={deleteSelectedDocuments}
                disabled={selectedDocuments.length === 0}
                className="px-3 py-2 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-red-600/20"
                title="Supprimer les documents sélectionnés"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* Sélectionner tout / Effacer tout */}
          {uploadedDocuments.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={selectAllDocuments}
                className="flex-1 text-xs text-slate-400 hover:text-blue-400 py-1 transition-colors"
              >
                {selectedDocuments.length === uploadedDocuments.length ? '☑️ Tout désélectionner' : '☐ Tout sélectionner'}
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-300 py-1 px-2 transition-colors"
                title="Effacer tous les documents et messages"
              >
                🗑️ Tout effacer
              </button>
            </div>
          )}
          
          {uploadedDocuments.length > 50 && (
            <p className="text-xs text-yellow-400 mt-2">
              ⚠️ Beaucoup de documents ({uploadedDocuments.length}) - les réponses peuvent être plus lentes
            </p>
          )}
        </div>

        {/* Liste des documents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {uploadedDocuments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun document importé</p>
              <p className="text-xs mt-1">Cliquez sur "Importer" pour ajouter des cours</p>
            </div>
          ) : (
            uploadedDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`bg-[#18181b] border rounded-lg p-3 transition-colors group cursor-pointer ${
                  selectedDocuments.includes(doc.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-800 hover:border-blue-500/50'
                }`}
                onClick={() => toggleDocumentSelection(doc.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedDocuments.includes(doc.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-600 hover:border-blue-400'
                    }`}>
                      {selectedDocuments.includes(doc.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </div>

                  {/* Info document */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-blue-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {doc.name}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(doc.size)} • {doc.content.length.toLocaleString()} caractères
                    </p>
                  </div>

                  {/* Bouton supprimer individuel */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info formats supportés */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-1">
            📄 Documents : PDF, DOCX, PPTX, XLSX, TXT
          </p>
          <p className="text-xs text-slate-500 mb-1">
            📸 Photos/Images : JPG, PNG, GIF, BMP, WEBP
          </p>
          <p className="text-xs text-green-400 mb-1">
            ✅ Nombre illimité • OCR automatique • Excel supporté
          </p>
          <p className="text-xs text-yellow-400">
            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) 
              ? '⚠️ Mobile : 10 MB max/fichier' 
              : '⚠️ Desktop : 50 MB max/fichier'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#09090b] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-[50vh] lg:min-h-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#09090b] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-black flex items-center justify-center border border-blue-500/20">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-200">Assistant WordCraft</h2>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
              Connecté : {user?.email || 'Utilisateur'}
            </p>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#18181b] border border-slate-800 text-slate-300'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(m.content, m.id)}
                    className="absolute -right-10 top-2 p-1 text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedId === m.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#18181b] border border-slate-800 text-slate-300 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-slate-400">L'IA réfléchit...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barre d'envoi */}
        <div className="p-3 sm:p-4 bg-[#0c0c0e] border-t border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Posez votre question..."
              disabled={isLoading}
              className="flex-1 bg-[#18181b] border-slate-700 text-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              style={{ fontSize: '16px' }} /* Empêche le zoom sur iOS */
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 p-2 sm:p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}