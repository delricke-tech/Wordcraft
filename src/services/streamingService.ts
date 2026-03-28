/**
 * Service pour le streaming des réponses IA avec Server-Sent Events (SSE)
 * Permet des réponses en temps réel depuis l'edge function
 */

import { supabase } from '../lib/supabase';

export interface StreamChunk {
  content: string;
  timestamp: string;
}

export interface StreamEvent {
  type: 'start' | 'chunk' | 'end' | 'error';
  data: unknown;
  timestamp: string;
}

export interface StreamingOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onStart?: (data: unknown) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onEventSource?: (eventSource: EventSource) => void;
}

/**
 * Envoie un message avec streaming en temps réel
 */
export async function sendStreamingChatMessage(
  messages: Array<{ role: string; content: string }>,
  context?: any,
  options: StreamingOptions = {}
): Promise<void> {
  try {
    console.log('🚀 Démarrage streaming chat IA');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Non authentifié');
    }

    const response = await supabase.functions.invoke('chat-stream', {
      body: {
        messages,
        context
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) {
      throw new Error(`Erreur streaming: ${response.error.message}`);
    }

    // La réponse est un stream SSE, nous devons le traiter
    const streamUrl = response.data.url;
    if (!streamUrl) {
      throw new Error('URL de stream non reçue');
    }

    // Créer EventSource pour le streaming
    const eventSource = new EventSource(streamUrl, {
      withCredentials: true
    });
    options.onEventSource?.(eventSource);

    let closed = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const safeClose = () => {
      if (closed) return;
      closed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      eventSource.close();
    };

    eventSource.addEventListener('start', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📝 Début de la réponse streaming:', data);
        options.onStart?.(data);
      } catch (error) {
        console.error('❌ Erreur parsing event start:', error);
      }
    });

    eventSource.addEventListener('chunk', (event) => {
      try {
        const chunk: StreamChunk = JSON.parse(event.data);
        console.log('📦 Chunk reçu:', chunk.content.length, 'caractères');
        options.onChunk?.(chunk);
      } catch (error) {
        console.error('❌ Erreur parsing chunk:', error);
      }
    });

    eventSource.addEventListener('end', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('✅ Fin du streaming:', data);
        options.onEnd?.();
        safeClose();
      } catch (error) {
        console.error('❌ Erreur parsing event end:', error);
        safeClose();
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.error('❌ Erreur streaming:', data);
        options.onError?.(data.error);
        safeClose();
      } catch (error) {
        console.error('❌ Erreur parsing event error:', error);
        options.onError?.('Erreur inconnue lors du streaming');
        safeClose();
      }
    });

    // Gérer les erreurs de connexion
    eventSource.onerror = (error) => {
      console.error('❌ Erreur connexion EventSource:', error);
      options.onError?.('Erreur de connexion au streaming');
      safeClose();
    };

    // Timeout après 5 minutes
    timeoutId = setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        console.warn('⏰ Timeout du streaming après 5 minutes');
        options.onError?.('Timeout du streaming');
        safeClose();
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('❌ Erreur sendStreamingChatMessage:', error);
    options.onError?.(error.message || 'Erreur inconnue');
  }
}

/**
 * Alternative: Streaming via fetch avec ReadableStream
 */
export async function sendStreamingChatMessageAlt(
  messages: Array<{ role: string; content: string }>,
  context?: any,
  options: StreamingOptions = {}
): Promise<void> {
  try {
    console.log('🚀 Démarrage streaming chat IA (alternative)');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/chat-stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        context
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossible de lire le stream de réponse');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        options.onEnd?.();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7);
          continue;
        }

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.content) {
              options.onChunk?.(parsed);
            }
            
            if (parsed.done) {
              options.onEnd?.();
              return;
            }
            
            if (parsed.error) {
              options.onError?.(parsed.error);
              return;
            }
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing data SSE:', parseError);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur sendStreamingChatMessageAlt:', error);
    options.onError?.(error.message || 'Erreur inconnue');
  }
}

/**
 * Classe pour gérer une session de streaming
 */
export class StreamingSession {
  private eventSource: EventSource | null = null;
  private isActive = false;
  private options: StreamingOptions;

  constructor(options: StreamingOptions) {
    this.options = options;
  }

  async start(
    messages: Array<{ role: string; content: string }>,
    context?: any
  ): Promise<void> {
    if (this.isActive) {
      throw new Error('Une session de streaming est déjà active');
    }

    this.isActive = true;
    console.log('🚀 Démarrage session streaming');

    try {
      await sendStreamingChatMessage(messages, context, {
        onEventSource: (es) => {
          // S'assurer qu'une session suivante ne garde pas l'ancienne connexion
          if (this.eventSource && this.eventSource !== es) {
            try {
              this.eventSource.close();
            } catch {
              // ignore
            }
          }
          this.eventSource = es;
        },
        onChunk: (chunk) => {
          this.options.onChunk?.(chunk);
        },
        onStart: (data) => {
          this.options.onStart?.(data);
        },
        onEnd: () => {
          this.isActive = false;
          this.eventSource = null;
          this.options.onEnd?.();
        },
        onError: (error) => {
          this.isActive = false;
          this.eventSource = null;
          this.options.onError?.(error);
        }
      });
    } catch (error) {
      this.isActive = false;
      this.eventSource = null;
      this.options.onError?.(error.message || 'Erreur inconnue');
    }
  }

  stop(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isActive = false;
    console.log('🛑 Session streaming arrêtée');
  }

  isStreamingActive(): boolean {
    return this.isActive;
  }
}
