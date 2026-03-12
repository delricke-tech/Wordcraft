/**
 * Composant pour afficher les messages en streaming
 * Affiche le texte en temps réel avec curseur et animations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  onComplete?: () => void;
  className?: string;
}

export function StreamingMessage({ 
  content, 
  isStreaming, 
  onComplete,
  className = ''
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Effet pour mettre à jour le contenu affiché
  useEffect(() => {
    if (content !== displayedContent) {
      setIsTyping(true);
      setDisplayedContent(content);
      
      // Arrêter l'animation de frappe après un délai
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [content, displayedContent]);

  // Effet pour détecter la fin du streaming
  useEffect(() => {
    if (!isStreaming && displayedContent) {
      onComplete?.();
    }
  }, [isStreaming, displayedContent, onComplete]);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 max-w-[85%] sm:max-w-[80%]"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* En-tête du message streaming */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-300">
              {isStreaming ? 'IA en train d\'écrire...' : 'Réponse IA'}
            </span>
          </div>
          
          {isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Contenu du message */}
        <div className="text-white leading-relaxed">
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-white/60 text-sm">Traitement...</span>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Afficher le contenu avec effet machine à écrire */}
                <TypewriterText 
                  text={displayedContent}
                  isStreaming={isStreaming}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Curseur de fin de streaming */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ 
              repeat: Infinity, 
              duration: 1,
              ease: "easeInOut"
            }}
            className="inline-block w-0.5 h-5 bg-blue-400 ml-1 align-middle"
          />
        )}
      </motion.div>

      {/* Indicateur de streaming en bas */}
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 text-xs text-blue-300"
        >
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span>Génération en cours...</span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Sous-composant pour l'effet machine à écrire
 */
function TypewriterText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const [visibleText, setVisibleText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setVisibleText(text);
      setCurrentIndex(text.length);
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setVisibleText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20 + Math.random() * 30); // Vitesse variable pour un effet naturel

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, isStreaming]);

  return (
    <span>
      {visibleText}
      {isStreaming && currentIndex < text.length && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ 
            repeat: Infinity, 
            duration: 1,
            ease: "easeInOut"
          }}
          className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5"
        />
      )}
    </span>
  );
}

/**
 * Composant pour afficher un indicateur de streaming global
 */
export function StreamingIndicator({ 
  isActive, 
  message = "IA en train de répondre..." 
}: { 
  isActive: boolean; 
  message?: string; 
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <span className="text-sm text-blue-300 font-medium">
            {message}
          </span>
          
          {/* Points animés */}
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
