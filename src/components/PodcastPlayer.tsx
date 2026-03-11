import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Clock, Mic, Users, FileText } from 'lucide-react';
import { podcastGenerator, GeneratedPodcast, PodcastConfig } from '../services/podcastGenerator';
import { ttsService } from '../services/ttsService';

interface PodcastPlayerProps {
  content: string;
  title?: string;
  onPodcastGenerated?: (podcast: GeneratedPodcast) => void;
}

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  content,
  title = 'Podcast WordCraft IA',
  onPodcastGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [podcast, setPodcast] = useState<GeneratedPodcast | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [config, setConfig] = useState<PodcastConfig>({
    title,
    duration: 7,
    style: 'conversationnel',
    voices: {
      host1: 'nova',
      host2: 'alloy'
    }
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Mettre à jour la barre de progression
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [podcast]);

  // Gérer le clic sur la barre de progression
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Gérer la lecture/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Gérer le volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Générer le podcast
  const generatePodcast = async () => {
    if (!content.trim()) {
      alert('Veuillez fournir du contenu pour générer le podcast.');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🎙️ Début génération podcast...');
      
      const generatedPodcast = await podcastGenerator.generatePodcastAudio(content, config);
      
      setPodcast(generatedPodcast);
      
      // Créer l'URL audio pour la lecture
      if (audioRef.current && generatedPodcast.audioFiles.length > 0) {
        const audioUrl = ttsService.createAudioURL(generatedPodcast.audioFiles[0].audioBuffer);
        audioRef.current.src = audioUrl;
      }

      console.log('✅ Podcast généré avec succès !');
      onPodcastGenerated?.(generatedPodcast);
      
    } catch (error) {
      console.error('❌ Erreur génération podcast:', error);
      alert(`Erreur lors de la génération du podcast: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Télécharger le podcast
  const downloadPodcast = async () => {
    if (!podcast) return;

    try {
      await podcastGenerator.downloadPodcast(podcast);
    } catch (error) {
      console.error('❌ Erreur téléchargement podcast:', error);
      alert(`Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Formater le temps
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculer le pourcentage de progression
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const frenchVoices = ttsService.getFrenchVoices();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Podcast IA</h2>
            <p className="text-sm text-gray-600">Audio Overview 2 voix</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{config.duration} min</span>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style du podcast
          </label>
          <select
            value={config.style}
            onChange={(e) => setConfig({...config, style: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="conversationnel">Conversationnel</option>
            <option value="éducatif">Éducatif</option>
            <option value="journalistique">Journalistique</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voix Présentatrice (HOST1)
          </label>
          <select
            value={config.voices.host1}
            onChange={(e) => setConfig({...config, voices: {...config.voices, host1: e.target.value as any}})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {frenchVoices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name} - {voice.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voix Co-animateur (HOST2)
          </label>
          <select
            value={config.voices.host2}
            onChange={(e) => setConfig({...config, voices: {...config.voices, host2: e.target.value as any}})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {frenchVoices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name} - {voice.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bouton de génération */}
      <div className="mb-6">
        <button
          onClick={generatePodcast}
          disabled={isGenerating || !content.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Génération en cours...</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Générer le Podcast</span>
            </>
          )}
        </button>
      </div>

      {/* Player Audio */}
      {podcast && (
        <div className="space-y-4">
          {/* Audio Player */}
          <div className="bg-gray-50 rounded-lg p-4">
            <audio ref={audioRef} className="w-full" />
            
            {/* Contrôles de lecture */}
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={togglePlayPause}
                className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-12">
                    {formatTime(currentTime)}
                  </span>
                  
                  <div
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="flex-1 bg-gray-200 rounded-full h-2 cursor-pointer relative"
                  >
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-100"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  
                  <span className="text-sm text-gray-600 w-12">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-gray-600" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>2 voix • {podcast.totalDuration.toFixed(1)}s</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Transcript</span>
                </button>
                
                <button
                  onClick={downloadPodcast}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transcript */}
          {showTranscript && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Transcript du Podcast</span>
              </h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {podcast.transcript}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PodcastPlayer;
