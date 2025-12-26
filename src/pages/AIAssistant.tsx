import { useState, useRef, useEffect } from 'react';

import { Sparkles, Send, Copy, Check } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

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

export function AIAssistant() {

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Appel à l'API OpenAI avec votre clé
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Clé API OpenAI non configurée');
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
              content: 'Tu es WordCraft AI, un assistant pédagogique intelligent. Tu aides les étudiants avec leurs questions académiques, tu peux résumer des textes, expliquer des concepts, créer des quiz et des fiches de révision. Réponds toujours en français de manière claire et pédagogique.'
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
          max_tokens: 1000,
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