/**
 * Configuration et utilitaires pour Daily.co (Vidéo/Audio)
 */

import DailyIframe, { DailyCall } from '@daily-co/daily-js';

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;

/**
 * Créer une salle Daily.co pour une session
 */
export async function createDailyRoom(roomName: string): Promise<{ url: string; name: string }> {
  if (!DAILY_API_KEY) {
    console.warn('⚠️ VITE_DAILY_API_KEY non configurée - Mode sans vidéo');
    return { url: '', name: roomName };
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 10,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Daily.co API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      name: data.name,
    };
  } catch (error) {
    console.error('Erreur création salle Daily.co:', error);
    throw error;
  }
}

/**
 * Rejoindre une salle Daily.co
 */
export async function joinDailyRoom(
  containerRef: HTMLElement,
  roomUrl: string,
  userName: string
): Promise<DailyCall> {
  const callFrame = DailyIframe.createFrame(containerRef, {
    showLeaveButton: false,
    showFullscreenButton: true,
    iframeStyle: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '12px',
    },
  });

  await callFrame.join({
    url: roomUrl,
    userName: userName,
    audioSource: true,
    videoSource: true,
  });

  return callFrame;
}

/**
 * Quitter une salle Daily.co
 */
export async function leaveDailyRoom(callFrame: DailyCall | null) {
  if (callFrame) {
    await callFrame.leave();
    callFrame.destroy();
  }
}

/**
 * Activer/désactiver la caméra
 */
export async function toggleCamera(callFrame: DailyCall, enabled: boolean) {
  await callFrame.setLocalVideo(enabled);
}

/**
 * Activer/désactiver le micro
 */
export async function toggleMicrophone(callFrame: DailyCall, enabled: boolean) {
  await callFrame.setLocalAudio(enabled);
}

/**
 * Démarrer/arrêter le partage d'écran
 */
export async function toggleScreenShare(callFrame: DailyCall, enabled: boolean) {
  if (enabled) {
    await callFrame.startScreenShare();
  } else {
    await callFrame.stopScreenShare();
  }
}

/**
 * Obtenir les statistiques de la salle
 */
export function getRoomStatistics(callFrame: DailyCall) {
  return callFrame.getNetworkStats();
}

/**
 * Vérifier si Daily.co est configuré
 */
export function isDailyConfigured(): boolean {
  return !!DAILY_API_KEY;
}
