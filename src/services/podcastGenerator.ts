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
    this.openai = getOpenAIClient();
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

    const prompt = `Tu es un expert en création de podcasts éducatifs. Génère un script de podcast dynamique et engageant à partir du contenu fourni.

CONSIGNES :
- Durée cible : ${finalConfig.duration} minutes
- Style : ${finalConfig.style}
- Format : Dialogue entre 2 animateurs (HOST1 et HOST2)
- HOST1 : Présentatrice principale, explique les concepts
- HOST2 : Co-animateur, pose des questions, reformule, ajoute des exemples
- Ton : Professionnel mais accessible, comme une discussion entre experts
- Structure : Introduction → Développement → Exemples → Conclusion

RÈGLES DE FORMATAGE :
- Utilise EXACTEMENT "HOST1:" et "HOST2:" pour chaque intervention
- Chaque intervention doit être de 20-60 mots maximum
- Alterne régulièrement les interventions
- Inclus des transitions naturelles ("C'est intéressant...", "Pour aller plus loin...")
- Ajoute des moments d'interaction ("Vous voyez ?", "Imaginez...")

CONTENU À TRAITER :
${content}

GÉNÈRE LE SCRIPT COMPLET :`;

    try {
      console.log('🎙️ Génération du script de podcast en cours...');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un créateur de podcasts éducatifs expert. Tu génères des scripts engageants et bien structurés.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const script = response.choices[0]?.message?.content || '';
      
      console.log('✅ Script de podcast généré avec succès');
      return script;
      
    } catch (error) {
      console.error('❌ Erreur génération script podcast:', error);
      throw new Error(`Échec de la génération du script: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Parse le script pour extraire les segments par voix
   */
  parseScriptToSegments(script: string): PodcastSegment[] {
    const lines = script.split('\n').filter(line => line.trim());
    const segments: PodcastSegment[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('HOST1:')) {
        const text = trimmedLine.replace('HOST1:', '').trim();
        if (text) {
          segments.push({ speaker: 'HOST1', text });
        }
      } else if (trimmedLine.startsWith('HOST2:')) {
        const text = trimmedLine.replace('HOST2:', '').trim();
        if (text) {
          segments.push({ speaker: 'HOST2', text });
        }
      }
    }

    console.log(`📝 Script parsé : ${segments.length} segments trouvés`);
    return segments;
  }

  /**
   * Génère l'audio complet du podcast
   */
  async generatePodcastAudio(
    content: string,
    config: Partial<PodcastConfig> = {}
  ): Promise<GeneratedPodcast> {
    const finalConfig: PodcastConfig = {
      title: 'Podcast WordCraft IA',
      duration: 7,
      style: 'conversationnel',
      voices: {
        host1: 'nova',
        host2: 'alloy'
      },
      ...config
    };

    try {
      console.log('🎙️ Début génération podcast complet...');

      // 1. Générer le script
      const script = await this.generatePodcastScript(content, config);
      
      // 2. Parser les segments
      const segments = this.parseScriptToSegments(script);
      
      // 3. Générer l'audio pour chaque segment
      const audioFiles: GeneratedAudio[] = [];
      let totalDuration = 0;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const voice = segment.speaker === 'HOST1' ? finalConfig.voices.host1 : finalConfig.voices.host2;
        
        console.log(`🎤 Génération audio segment ${i + 1}/${segments.length} (${segment.speaker})`);
        
        const audio = await ttsService.generateSpeech({
          text: segment.text,
          voice,
          model: 'tts-1-hd',
          speed: 1.0
        });

        audioFiles.push(audio);
        totalDuration += audio.duration;
      }

      // 4. Créer le transcript complet
      const transcript = this.createTranscript(segments);

      const result: GeneratedPodcast = {
        title: finalConfig.title,
        segments,
        audioFiles,
        totalDuration,
        transcript
      };

      console.log(`✅ Podcast généré - Durée totale: ${totalDuration.toFixed(1)}s`);
      return result;

    } catch (error) {
      console.error('❌ Erreur génération podcast:', error);
      throw new Error(`Échec de la génération du podcast: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Combine tous les segments audio en un seul fichier
   */
  async combineAudioSegments(audioFiles: GeneratedAudio[]): Promise<ArrayBuffer> {
    // Pour l'instant, retourne le premier segment
    // TODO: Implémenter la combinaison réelle des fichiers audio
    if (audioFiles.length === 0) {
      throw new Error('Aucun segment audio à combiner');
    }

    console.log('🔀 Combinaison des segments audio...');
    
    // Simulation : retourne le premier segment (à améliorer avec Web Audio API)
    return audioFiles[0].audioBuffer;
  }

  /**
   * Crée le transcript formaté du podcast
   */
  createTranscript(segments: PodcastSegment[]): string {
    let transcript = `# ${segments[0]?.speaker === 'HOST1' ? 'Podcast WordCraft IA' : 'Transcript'}\n\n`;
    
    for (const segment of segments) {
      const speakerName = segment.speaker === 'HOST1' ? '🎙️ Présentatrice' : '🎙️ Co-animateur';
      transcript += `**${speakerName}:** ${segment.text}\n\n`;
    }

    return transcript;
  }

  /**
   * Télécharge le podcast complet
   */
  async downloadPodcast(podcast: GeneratedPodcast): Promise<void> {
    try {
      // Combiner tous les segments
      const combinedAudio = await this.combineAudioSegments(podcast.audioFiles);
      
      // Créer le nom de fichier
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `podcast-${podcast.title.replace(/\s+/g, '-')}-${timestamp}.mp3`;
      
      // Télécharger l'audio
      ttsService.downloadAudio(combinedAudio, filename);
      
      // Télécharger le transcript
      const transcriptBlob = new Blob([podcast.transcript], { type: 'text/markdown' });
      const transcriptUrl = URL.createObjectURL(transcriptBlob);
      
      const a = document.createElement('a');
      a.href = transcriptUrl;
      a.download = `transcript-${filename.replace('.mp3', '.md')}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(transcriptUrl);
      
      console.log(`📥 Podcast et transcript téléchargés: ${filename}`);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement podcast:', error);
      throw new Error(`Échec du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Teste la génération complète
   */
  async testPodcastGeneration(): Promise<boolean> {
    try {
      const testContent = "Ceci est un test de génération de podcast avec OpenAI TTS.";
      await this.generatePodcastAudio(testContent, {
        title: 'Test Podcast',
        duration: 1
      });
      return true;
    } catch (error) {
      console.error('❌ Test génération podcast échoué:', error);
      return false;
    }
  }
}

export const podcastGenerator = new PodcastGenerator();
export default podcastGenerator;
