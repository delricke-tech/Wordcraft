import { useState, useRef, useEffect } from 'react';

import { Sparkles, Send, Copy, Check, Upload, FileText, X, Loader } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { extractTextFromFile } from '../services/textExtractor';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type QuickAction = {
  id: string;
  icon: any;
  label: string;
  description: string;
  prompt: string;
  credits: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions: QuickAction[] = [
    {
      id: 'summarize',
      icon: Sparkles,
      label: 'Résumer',
      description: 'Générer un résumé',
      prompt: 'Résume ce texte :',
      credits: 2
    }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Limiter à 20 documents
    const maxFiles = 20;
    const currentCount = uploadedDocuments.length;
    const remainingSlots = maxFiles - currentCount;

    if (files.length > remainingSlots) {
      alert(`Vous pouvez importer maximum ${maxFiles} documents. Il reste ${remainingSlots} emplacements.`);
      return;
    }

    setIsUploading(true);

    try {
      const newDocuments: UploadedDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`📄 Extraction du document ${i + 1}/${files.length}: ${file.name}`);

        try {
          const extractedText = await extractTextFromFile(file);
          
          newDocuments.push({
            id: `doc-${Date.now()}-${i}`,
            name: file.name,
            type: file.type,
            size: file.size,
            content: extractedText,
            extractedAt: new Date(),
          });

          console.log(`✅ Document "${file.name}" extrait (${extractedText.length} caractères)`);
        } catch (error) {
          console.error(`❌ Erreur extraction "${file.name}":`, error);
          alert(`Erreur lors de l'extraction de "${file.name}"`);
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
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
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
      // Appel à l'API OpenAI avec contexte des documents
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Clé API OpenAI non configurée');
      }

      // Construire le contexte des documents
      let documentsContext = '';
      if (uploadedDocuments.length > 0) {
        documentsContext = '\n\n📚 **DOCUMENTS DE COURS IMPORTÉS** :\n\n';
        uploadedDocuments.forEach((doc, index) => {
          documentsContext += `--- DOCUMENT ${index + 1}: ${doc.name} ---\n${doc.content}\n\n`;
        });
        documentsContext += '\n⚠️ Base tes réponses UNIQUEMENT sur ces documents de cours.\n';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Tu es WordCraft AI, un assistant pédagogique intelligent spécialisé dans l'analyse de cours académiques. 

Tu as actuellement accès à ${uploadedDocuments.length} document(s) de cours.

TES CAPACITÉS :
- Résumer des cours
- Expliquer des concepts complexes
- Créer des quiz et fiches de révision
- Répondre à des questions précises sur les cours
- Comparer différents documents
- Identifier les concepts clés

RÈGLES :
- Réponds TOUJOURS en français
- Sois précis et pédagogique
- Si tu cites un document, indique son nom
- Si la question nécessite un document mais qu'aucun n'est fourni, demande à l'utilisateur d'en importer
${documentsContext}`
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            {
              role: 'user',
              content: input
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erreur lors de l\'appel à l\'API');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erreur: ${error instanceof Error ? error.message : 'Impossible de contacter l\'API OpenAI. Vérifiez votre clé API dans le fichier .env'}`,
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

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 bg-[#020617] p-4 text-slate-100">
      {/* Panneau latéral - Documents importés */}
      <div className="w-80 bg-[#09090b] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-200 mb-2">Documents de cours</h3>
          <p className="text-xs text-slate-400 mb-4">
            {uploadedDocuments.length}/20 documents importés
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.doc,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading || uploadedDocuments.length >= 20}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || uploadedDocuments.length >= 20}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isUploading ? (
              <>
                <Loader className="animate-spin" size={18} />
                <span>Extraction...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Importer des cours</span>
              </>
            )}
          </button>
          {uploadedDocuments.length >= 20 && (
            <p className="text-xs text-red-400 mt-2">Limite atteinte (20 max)</p>
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
                className="bg-[#18181b] border border-slate-800 rounded-lg p-3 hover:border-blue-500 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
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
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
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
          <p className="text-xs text-slate-500">
            📄 Formats supportés : PDF, DOCX, TXT, Images (OCR)
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#09090b] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#18181b] border border-slate-800 text-slate-300'
              }`}>
                {m.content}
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

        {/* Actions Rapides (Pour utiliser la variable quickActions) */}
        <div className="px-4 pb-2 flex gap-2">
          {quickActions.map(action => (
            <button
              key={action.id}
              className="text-xs bg-[#18181b] border border-slate-800 px-3 py-1 rounded-full text-slate-400 hover:border-blue-500"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Barre d'envoi */}
        <div className="p-4 bg-[#0c0c0e] border-t border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Posez votre question..."
              disabled={isLoading}
              className="flex-1 bg-[#18181b] border-slate-700 text-slate-200 rounded-xl px-4 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}