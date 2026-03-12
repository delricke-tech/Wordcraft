import { ttsService, GeneratedAudio } from './ttsService';
import OpenAI from 'openai';
import { getOpenAIClient } from './openaiService';

export interface PodcastSegment {
  speaker: 'HOST1' | 'HOST2';
  text: string;
  duration?: number;
}

export interface PodcastConfig {
  title: string;
  duration: number; // en minutes
  style: 'conversationnel' | 'éducatif' | 'journalistique';
  voices: {
    host1: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    host2: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  };
}

export interface GeneratedPodcast {
  title: string;
  segments: PodcastSegment[];
  audioFiles: GeneratedAudio[];
  totalDuration: number;
  transcript: string;
}

class PodcastGenerator {
  private openai: OpenAI;

  constructor() {
    // Initialisation différée pour éviter l'erreur d'accès avant initialisation
    setTimeout(() => {
      this.openai = getOpenAIClient();
    }, 0);
  }

  /**
   * Génère un script de podcast à 2 voix à partir du contenu
   */
  async generatePodcastScript(
    content: string, 
    config: Partial<PodcastConfig> = {}
  ): Promise<string> {
    const defaultConfig: PodcastConfig = {
      title: 'Podcast WordCraft IA',
      duration: 7, // 7 minutes par défaut
      style: 'conversationnel',
      voices: {
        host1: 'nova', // Voix féminine (présentatrice principale)
        host2: 'alloy'  // Voix masculine (co-animateur)
      }
    };

    const finalConfig = { ...defaultConfig, ...config };

    const prompt = `Tu es un expert en création de podcasts éducatifs. Génère un script de podcast à 2 voix sur le thème "${finalConfig.title}".

Style: ${finalConfig.style}
Durée cible: ${finalConfig.duration} minutes
Voix: HOST1 (${finalConfig.voices.host1}) = présentatrice principale, HOST2 (${finalConfig.voices.host2}) = co-animateur

Contenu à traiter:
${content}

Instructions:
- Crée un dialogue naturel et engageant entre les 2 voix
- Structure: Introduction → Développement → Conclusion
- Ajoute des transitions fluides entre les segments
- Inclus des exemples concrets quand c'est pertinent
- Adapte le ton au style ${finalConfig.style}
- Respecte la durée cible de ${finalConfig.duration} minutes
- Sépare clairement les dialogues avec "HOST1:" et "HOST2:"

Génère uniquement le script du podcast, sans commentaires métas.`;

    try {
      console.log('🎙️ Génération du script de podcast...');
      console.log('📝 Configuration:', finalConfig);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en création de podcasts éducatifs. Tu dois générer des scripts engageants et bien structurés.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const script = response.choices[0]?.message?.content || '';
      
      console.log('✅ Script généré avec succès');
      console.log('📄 Longueur du script:', script.length, 'caractères');
      
      return script;
    } catch (error) {
      console.error('❌ Erreur génération script:', error);
      throw new Error('Échec de la génération du script de podcast');
    }
  }

  /**
   * Convertit le script en segments audio
   */
  private parseScriptToSegments(script: string): PodcastSegment[] {
    const lines = script.split('\n').filter(line => line.trim());
    const segments: PodcastSegment[] = [];
    
    let currentSpeaker: 'HOST1' | 'HOST2' = 'HOST1';
    let currentText = '';
    
    for (const line of lines) {
      if (line.startsWith('HOST1:')) {
        if (currentText.trim()) {
          segments.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }
        currentSpeaker = 'HOST1';
        currentText = line.replace('HOST1:', '').trim();
      } else if (line.startsWith('HOST2:')) {
        if (currentText.trim()) {
          segments.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }
        currentSpeaker = 'HOST2';
        currentText = line.replace('HOST2:', '').trim();
      } else {
        currentText += ' ' + line;
      }
    }
    
    // Ajouter le dernier segment
    if (currentText.trim()) {
      segments.push({
        speaker: currentSpeaker,
        text: currentText.trim()
      });
    }
    
    console.log(`📋 Script parsé en ${segments.length} segments`);
    return segments;
  }

  /**
   * Génère le podcast complet (script + audio)
   */
  async generatePodcast(
    content: string,
    config: Partial<PodcastConfig> = {}
  ): Promise<GeneratedPodcast> {
    try {
      console.log('🎙️ Début génération podcast...');
      
      // 1. Générer le script
      const script = await this.generatePodcastScript(content, config);
      
      // 2. Parser en segments
      const segments = this.parseScriptToSegments(script);
      
      // 3. Générer l'audio pour chaque segment
      const audioFiles: GeneratedAudio[] = [];
      let totalDuration = 0;
      
      const finalConfig = { 
        title: 'Podcast WordCraft IA',
        duration: 7,
        style: 'conversationnel',
        voices: {
          host1: 'nova',
          host2: 'alloy'
        },
        ...config 
      };
      
      for (const segment of segments) {
        const voice = segment.speaker === 'HOST1' ? finalConfig.voices.host1 : finalConfig.voices.host2;
        
        console.log(`🎤 Génération audio segment ${segment.speaker} (${voice})...`);
        
        const audioFile = await ttsService.generateAudio(segment.text, voice);
        audioFiles.push(audioFile);
        
        // Estimation de la durée (1.5 secondes par 10 caractères)
        const estimatedDuration = (segment.text.length / 10) * 1.5;
        segment.duration = estimatedDuration;
        totalDuration += estimatedDuration;
      }
      
      const podcast: GeneratedPodcast = {
        title: finalConfig.title,
        segments,
        audioFiles,
        totalDuration,
        transcript: script
      };
      
      console.log('✅ Podcast généré avec succès');
      console.log(`📊 Durée totale: ${Math.round(totalDuration)} secondes`);
      console.log(`🎵 Nombre de fichiers audio: ${audioFiles.length}`);
      
      return podcast;
      
    } catch (error) {
      console.error('❌ Erreur génération podcast:', error);
      throw new Error('Échec de la génération du podcast');
    }
  }
}

// Export singleton
export const podcastGenerator = new PodcastGenerator();
