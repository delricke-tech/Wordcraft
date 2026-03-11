import OpenAI from 'openai';

export interface TTSOptions {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
  model?: 'tts-1' | 'tts-1-hd';
}

export interface GeneratedAudio {
  audioBuffer: ArrayBuffer;
  duration: number;
  voice: string;
  size: number;
}

class TTSService {
  private openai: OpenAI;

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Clé OpenAI manquante pour TTS');
    }
    
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Génère de l'audio à partir du texte avec OpenAI TTS
   */
  async generateSpeech(options: TTSOptions): Promise<GeneratedAudio> {
    const {
      text,
      voice = 'nova', // Voix française par défaut
      speed = 1.0,
      model = 'tts-1-hd' // Haute qualité par défaut
    } = options;

    try {
      console.log(`🎤 Génération audio avec OpenAI TTS - Voix: ${voice}, Modèle: ${model}`);
      
      const mp3 = await this.openai.audio.speech.create({
        model,
        voice,
        input: text,
        response_format: 'mp3',
        speed,
      });

      const audioBuffer = await mp3.arrayBuffer();
      
      // Calculer la durée approximative (basé sur le nombre de mots et vitesse)
      const wordCount = text.split(' ').length;
      const estimatedDuration = (wordCount / 150) * 60 / speed; // 150 mots/minute moyen

      const result: GeneratedAudio = {
        audioBuffer,
        duration: estimatedDuration,
        voice,
        size: audioBuffer.byteLength
      };

      console.log(`✅ Audio généré - Durée: ${estimatedDuration.toFixed(1)}s, Taille: ${(result.size / 1024).toFixed(1)}KB`);
      
      return result;
    } catch (error) {
      console.error('❌ Erreur génération TTS:', error);
      throw new Error(`Échec de la génération audio: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Liste des voix disponibles en français
   */
  getFrenchVoices(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'nova',
        name: 'Nova',
        description: 'Voix féminine naturelle et professionnelle'
      },
      {
        id: 'alloy',
        name: 'Alloy',
        description: 'Voix neutre équilibrée'
      },
      {
        id: 'echo',
        name: 'Echo',
        description: 'Voix masculine claire et directe'
      },
      {
        id: 'fable',
        name: 'Fable',
        description: 'Voix masculine chaleureuse'
      },
      {
        id: 'onyx',
        name: 'Onyx',
        description: 'Voix masculine profonde et autoritaire'
      },
      {
        id: 'shimmer',
        name: 'Shimmer',
        description: 'Voix féminine lumineuse et expressive'
      }
    ];
  }

  /**
   * Convertit ArrayBuffer en URL Blob pour lecture
   */
  createAudioURL(audioBuffer: ArrayBuffer): string {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  /**
   * Télécharge le fichier audio généré
   */
  downloadAudio(audioBuffer: ArrayBuffer, filename: string = 'audio.mp3'): void {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📥 Audio téléchargé: ${filename}`);
  }

  /**
   * Teste la connexion avec OpenAI TTS
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateSpeech({
        text: "Test de connexion avec OpenAI TTS.",
        voice: 'nova'
      });
      return true;
    } catch (error) {
      console.error('❌ Test connexion TTS échoué:', error);
      return false;
    }
  }
}

export const ttsService = new TTSService();
export default ttsService;
