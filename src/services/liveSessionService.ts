/**
 * Service pour les sessions live (vidéo, chat, enregistrements)
 * Phase 3.3 - Sessions & live
 * 
 * Date: 10 mars 2025
 */

import { supabase } from '../lib/supabase';

// Types pour les sessions live
export interface LiveSession {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  group_id?: string;
  session_type: 'meeting' | 'presentation' | 'study_session' | 'workshop';
  max_participants: number;
  is_public: boolean;
  requires_approval: boolean;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  room_url?: string;
  recording_url?: string;
  recording_enabled: boolean;
  screen_sharing_enabled: boolean;
  chat_enabled: boolean;
  reactions_enabled: boolean;
  password?: string;
  tags: string[];
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  host_name?: string;
  host_avatar?: string;
  host_display_name?: string;
  current_participants?: number;
  message_count?: number;
  reaction_count?: number;
}

export interface LiveSessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: 'host' | 'moderator' | 'participant' | 'speaker';
  joined_at?: string;
  left_at?: string;
  is_approved: boolean;
  audio_enabled: boolean;
  video_enabled: boolean;
  screen_sharing: boolean;
  hand_raised: boolean;
  connection_quality?: 'excellent' | 'good' | 'fair' | 'poor';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  user_display_name?: string;
  duration_seconds?: number;
}

export interface LiveSessionInvitation {
  id: string;
  session_id: string;
  invited_by: string;
  invited_user_id?: string;
  invited_email?: string;
  invitation_token: string;
  access_code?: string;
  role: 'host' | 'moderator' | 'participant' | 'speaker';
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sent_at: string;
  responded_at?: string;
  expires_at: string;
  session_title?: string;
  scheduled_start?: string;
  host_name?: string;
  host_display_name?: string;
}

export interface LiveSessionMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'system' | 'reaction' | 'file' | 'poll';
  metadata?: any;
  parent_message_id?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  user_display_name?: string;
  reaction_count?: number;
}

export interface LiveSessionReaction {
  id: string;
  session_id: string;
  user_id: string;
  reaction_type: 'emoji' | 'clap' | 'heart' | 'laugh' | 'thumbs_up' | 'thumbs_down';
  reaction_value: string;
  target_type: 'session' | 'message' | 'participant';
  target_id?: string;
  created_at: string;
}

export interface LiveSessionPoll {
  id: string;
  session_id: string;
  created_by: string;
  question: string;
  options: string[];
  poll_type: 'single' | 'multiple' | 'ranking';
  is_active: boolean;
  allow_anonymous: boolean;
  ends_at?: string;
  created_at: string;
}

export interface LiveSessionPollVote {
  id: string;
  poll_id: string;
  user_id?: string;
  selected_options: string[];
  voted_at: string;
}

export interface LiveSessionRecording {
  id: string;
  session_id: string;
  recording_url: string;
  recording_type: 'video' | 'audio' | 'screen' | 'combined';
  duration_seconds?: number;
  file_size_bytes?: number;
  thumbnail_url?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_public: boolean;
  download_count: number;
  created_at: string;
  processed_at?: string;
}

export interface LiveSessionSummary {
  id: string;
  session_id: string;
  summary_type: 'ai' | 'manual' | 'highlights';
  title?: string;
  content: string;
  key_points: string[];
  action_items: string[];
  tags: string[];
  generated_by?: string;
  ai_model_used?: string;
  confidence_score?: number;
  is_public: boolean;
  created_at: string;
}

export interface CreateSessionData {
  title: string;
  description?: string;
  group_id?: string;
  session_type: 'meeting' | 'presentation' | 'study_session' | 'workshop';
  max_participants?: number;
  is_public?: boolean;
  requires_approval?: boolean;
  scheduled_start?: string;
  scheduled_end?: string;
  recording_enabled?: boolean;
  screen_sharing_enabled?: boolean;
  chat_enabled?: boolean;
  reactions_enabled?: boolean;
  password?: string;
  tags?: string[];
}

export interface CreateInvitationData {
  invited_email?: string;
  invited_user_id?: string;
  role: 'host' | 'moderator' | 'participant' | 'speaker';
  message?: string;
}

// ========================================
// SERVICES SESSIONS
// ========================================

/**
 * Créer une nouvelle session live
 */
export async function createLiveSession(data: CreateSessionData): Promise<LiveSession> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert({
        title: data.title,
        description: data.description,
        host_id: currentUserId,
        group_id: data.group_id,
        session_type: data.session_type,
        max_participants: data.max_participants || 50,
        is_public: data.is_public || false,
        requires_approval: data.requires_approval || false,
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end,
        recording_enabled: data.recording_enabled || false,
        screen_sharing_enabled: data.screen_sharing_enabled !== false,
        chat_enabled: data.chat_enabled !== false,
        reactions_enabled: data.reactions_enabled !== false,
        password: data.password,
        tags: data.tags || []
      })
      .select(`
        *,
        host:profiles(full_name, avatar_url),
        host_profile:public_profiles(display_name)
      `)
      .single();

    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Erreur création session live:', error);
    throw error;
  }
}

/**
 * Obtenir les sessions de l'utilisateur
 */
export async function getUserSessions(status?: LiveSession['status']): Promise<LiveSession[]> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    let query = supabase
      .from('upcoming_user_sessions')
      .select('*')
      .eq('user_id', currentUserId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('scheduled_start', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur sessions utilisateur:', error);
    throw error;
  }
}

/**
 * Obtenir les sessions publiques
 */
export async function getPublicSessions(limit: number = 20): Promise<LiveSession[]> {
  try {
    const { data, error } = await supabase
      .from('live_sessions_with_host')
      .select('*')
      .eq('is_public', true)
      .in('status', ['scheduled', 'live'])
      .order('scheduled_start', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur sessions publiques:', error);
    throw error;
  }
}

/**
 * Obtenir les détails d'une session
 */
export async function getLiveSession(sessionId: string): Promise<LiveSession | null> {
  try {
    const { data, error } = await supabase
      .from('live_sessions_with_host')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erreur détails session:', error);
    return null;
  }
}

/**
 * Mettre à jour une session
 */
export async function updateLiveSession(sessionId: string, data: Partial<CreateSessionData>): Promise<LiveSession> {
  try {
    const { data: session, error } = await supabase
      .from('live_sessions')
      .update(data)
      .eq('id', sessionId)
      .select(`
        *,
        host:profiles(full_name, avatar_url),
        host_profile:public_profiles(display_name)
      `)
      .single();

    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Erreur mise à jour session:', error);
    throw error;
  }
}

/**
 * Démarrer une session
 */
export async function startLiveSession(sessionId: string, roomUrl: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_sessions')
      .update({ 
        status: 'live',
        actual_start: new Date().toISOString(),
        room_url: roomUrl
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur démarrage session:', error);
    throw error;
  }
}

/**
 * Terminer une session
 */
export async function endLiveSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_sessions')
      .update({ 
        status: 'ended',
        actual_end: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur fin session:', error);
    throw error;
  }
}

/**
 * Annuler une session
 */
export async function cancelLiveSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_sessions')
      .update({ 
        status: 'cancelled'
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur annulation session:', error);
    throw error;
  }
}

// ========================================
// SERVICES PARTICIPANTS
// ========================================

/**
 * Rejoindre une session
 */
export async function joinLiveSession(sessionId: string): Promise<LiveSessionParticipant> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('live_session_participants')
      .insert({
        session_id: sessionId,
        user_id: currentUserId,
        role: 'participant',
        joined_at: new Date().toISOString(),
        is_approved: true
      })
      .select(`
        *,
        user:profiles(full_name, avatar_url),
        user_profile:public_profiles(display_name)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur rejoindre session:', error);
    throw error;
  }
}

/**
 * Quitter une session
 */
export async function leaveLiveSession(sessionId: string): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('live_session_participants')
      .update({ 
        left_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', currentUserId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur quitter session:', error);
    throw error;
  }
}

/**
 * Obtenir les participants d'une session
 */
export async function getSessionParticipants(sessionId: string): Promise<LiveSessionParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('live_session_participants_with_user')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur participants session:', error);
    throw error;
  }
}

/**
 * Mettre à jour le rôle d'un participant
 */
export async function updateParticipantRole(sessionId: string, userId: string, role: LiveSessionParticipant['role']): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_session_participants')
      .update({ role })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur mise à jour rôle participant:', error);
    throw error;
  }
}

/**
 * Mettre à jour le statut audio/vidéo d'un participant
 */
export async function updateParticipantMedia(
  sessionId: string, 
  userId: string, 
  updates: {
    audio_enabled?: boolean;
    video_enabled?: boolean;
    screen_sharing?: boolean;
    hand_raised?: boolean;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_session_participants')
      .update(updates)
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur mise à jour média participant:', error);
    throw error;
  }
}

// ========================================
// SERVICES INVITATIONS
// ========================================

/**
 * Générer un token d'invitation unique
 */
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Générer un code d'accès court
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Inviter à une session
 */
export async function inviteToLiveSession(sessionId: string, data: CreateInvitationData): Promise<LiveSessionInvitation> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const invitationToken = generateInvitationToken();
    const accessCode = generateAccessCode();

    const { data: invitation, error } = await supabase
      .from('live_session_invitations')
      .insert({
        session_id: sessionId,
        invited_by: currentUserId,
        invited_email: data.invited_email,
        invited_user_id: data.invited_user_id,
        invitation_token: invitationToken,
        access_code: accessCode,
        role: data.role,
        message: data.message
      })
      .select(`
        *,
        session:live_sessions(title, scheduled_start),
        host:profiles(full_name),
        host_profile:public_profiles(display_name)
      `)
      .single();

    if (error) throw error;
    return invitation;
  } catch (error) {
    console.error('Erreur invitation session:', error);
    throw error;
  }
}

/**
 * Obtenir les invitations en attente de l'utilisateur
 */
export async function getPendingSessionInvitations(): Promise<LiveSessionInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('pending_session_invitations')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur invitations en attente:', error);
    throw error;
  }
}

/**
 * Accepter une invitation de session
 */
export async function acceptSessionInvitation(invitationId: string): Promise<void> {
  try {
    // Récupérer les détails de l'invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('live_session_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;

    // Ajouter comme participant
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { error: joinError } = await supabase
      .from('live_session_participants')
      .insert({
        session_id: invitation.session_id,
        user_id: currentUserId,
        role: invitation.role,
        joined_at: new Date().toISOString(),
        is_approved: true
      });

    if (joinError) throw joinError;

    // Marquer l'invitation comme acceptée
    const { error: updateError } = await supabase
      .from('live_session_invitations')
      .update({ 
        status: 'accepted', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Erreur acceptation invitation session:', error);
    throw error;
  }
}

/**
 * Refuser une invitation de session
 */
export async function declineSessionInvitation(invitationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_session_invitations')
      .update({ 
        status: 'declined', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', invitationId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur refus invitation session:', error);
    throw error;
  }
}

/**
 * Obtenir une invitation par son token
 */
export async function getSessionInvitationByToken(token: string): Promise<LiveSessionInvitation | null> {
  try {
    const { data, error } = await supabase
      .from('live_session_invitations')
      .select(`
        *,
        session:live_sessions(title, scheduled_start),
        host:profiles(full_name),
        host_profile:public_profiles(display_name)
      `)
      .eq('invitation_token', token)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erreur invitation par token:', error);
    return null;
  }
}

/**
 * Obtenir une invitation par son code d'accès
 */
export async function getSessionInvitationByCode(code: string): Promise<LiveSessionInvitation | null> {
  try {
    const { data, error } = await supabase
      .from('live_session_invitations')
      .select(`
        *,
        session:live_sessions(title, scheduled_start),
        host:profiles(full_name),
        host_profile:public_profiles(display_name)
      `)
      .eq('access_code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erreur invitation par code:', error);
    return null;
  }
}

// ========================================
// SERVICES MESSAGES
// ========================================

/**
 * Envoyer un message dans une session
 */
export async function sendSessionMessage(
  sessionId: string, 
  content: string, 
  messageType: LiveSessionMessage['message_type'] = 'text',
  metadata?: any,
  parentMessageId?: string
): Promise<LiveSessionMessage> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('live_session_messages')
      .insert({
        session_id: sessionId,
        user_id: currentUserId,
        content,
        message_type: messageType,
        metadata,
        parent_message_id: parentMessageId
      })
      .select(`
        *,
        user:profiles(full_name, avatar_url),
        user_profile:public_profiles(display_name)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur envoi message session:', error);
    throw error;
  }
}

/**
 * Obtenir les messages d'une session
 */
export async function getSessionMessages(sessionId: string, limit: number = 50, offset: number = 0): Promise<LiveSessionMessage[]> {
  try {
    const { data, error } = await supabase
      .from('live_session_messages_with_user')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur messages session:', error);
    throw error;
  }
}

/**
 * Supprimer un message
 */
export async function deleteSessionMessage(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('live_session_messages')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression message session:', error);
    throw error;
  }
}

// ========================================
// SERVICES RÉACTIONS
// ========================================

/**
 * Ajouter une réaction à une session
 */
export async function addSessionReaction(
  sessionId: string,
  reactionType: LiveSessionReaction['reaction_type'],
  reactionValue: string,
  targetType: LiveSessionReaction['target_type'],
  targetId?: string
): Promise<LiveSessionReaction> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('live_session_reactions')
      .insert({
        session_id: sessionId,
        user_id: currentUserId,
        reaction_type: reactionType,
        reaction_value: reactionValue,
        target_type: targetType,
        target_id: targetId
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur ajout réaction session:', error);
    throw error;
  }
}

/**
 * Supprimer une réaction
 */
export async function removeSessionReaction(
  sessionId: string,
  reactionType: LiveSessionReaction['reaction_type'],
  reactionValue: string,
  targetType: LiveSessionReaction['target_type'],
  targetId?: string
): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('live_session_reactions')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', currentUserId)
      .eq('reaction_type', reactionType)
      .eq('reaction_value', reactionValue)
      .eq('target_type', targetType)
      .eq('target_id', targetId || '');

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression réaction session:', error);
    throw error;
  }
}

/**
 * Obtenir les réactions d'une session
 */
export async function getSessionReactions(sessionId: string): Promise<LiveSessionReaction[]> {
  try {
    const { data, error } = await supabase
      .from('live_session_reactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur réactions session:', error);
    throw error;
  }
}

// ========================================
// SERVICES SONDAGES
// ========================================

/**
 * Créer un sondage dans une session
 */
export async function createSessionPoll(
  sessionId: string,
  question: string,
  options: string[],
  pollType: LiveSessionPoll['poll_type'] = 'single',
  endsAt?: string,
  allowAnonymous: boolean = false
): Promise<LiveSessionPoll> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('live_session_polls')
      .insert({
        session_id: sessionId,
        created_by: currentUserId,
        question,
        options,
        poll_type: pollType,
        ends_at: endsAt,
        allow_anonymous: allowAnonymous
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur création sondage session:', error);
    throw error;
  }
}

/**
 * Voter dans un sondage
 */
export async function voteInSessionPoll(pollId: string, selectedOptions: string[]): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('live_session_poll_votes')
      .insert({
        poll_id: pollId,
        user_id: currentUserId,
        selected_options: selectedOptions
      });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur vote sondage session:', error);
    throw error;
  }
}

/**
 * Obtenir les sondages d'une session
 */
export async function getSessionPolls(sessionId: string): Promise<LiveSessionPoll[]> {
  try {
    const { data, error } = await supabase
      .from('live_session_polls')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur sondages session:', error);
    throw error;
  }
}

// ========================================
// SERVICES ENREGISTREMENTS
// ========================================

/**
 * Ajouter un enregistrement de session
 */
export async function addSessionRecording(
  sessionId: string,
  recordingUrl: string,
  recordingType: LiveSessionRecording['recording_type'] = 'video'
): Promise<LiveSessionRecording> {
  try {
    const { data, error } = await supabase
      .from('live_session_recordings')
      .insert({
        session_id: sessionId,
        recording_url: recordingUrl,
        recording_type: recordingType,
        processing_status: 'pending'
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur ajout enregistrement session:', error);
    throw error;
  }
}

/**
 * Obtenir les enregistrements d'une session
 */
export async function getSessionRecordings(sessionId: string): Promise<LiveSessionRecording[]> {
  try {
    const { data, error } = await supabase
      .from('live_session_recordings')
      .select('*')
      .eq('session_id', sessionId)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur enregistrements session:', error);
    throw error;
  }
}

/**
 * Mettre à jour le statut de traitement d'un enregistrement
 */
export async function updateRecordingStatus(
  recordingId: string,
  status: LiveSessionRecording['processing_status'],
  metadata?: {
    duration_seconds?: number;
    file_size_bytes?: number;
    thumbnail_url?: string;
  }
): Promise<void> {
  try {
    const updateData: any = { processing_status: status };
    if (metadata) {
      Object.assign(updateData, metadata);
    }
    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('live_session_recordings')
      .update(updateData)
      .eq('id', recordingId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur mise à jour statut enregistrement:', error);
    throw error;
  }
}

// ========================================
// SERVICES RÉSUMÉS
// ========================================

/**
 * Créer un résumé de session
 */
export async function createSessionSummary(
  sessionId: string,
  summaryType: LiveSessionSummary['summary_type'],
  title: string,
  content: string,
  keyPoints: string[] = [],
  actionItems: string[] = [],
  tags: string[] = []
): Promise<LiveSessionSummary> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('live_session_summaries')
      .insert({
        session_id: sessionId,
        summary_type: summaryType,
        title,
        content,
        key_points: keyPoints,
        action_items: actionItems,
        tags,
        generated_by: currentUserId
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur création résumé session:', error);
    throw error;
  }
}

/**
 * Obtenir les résumés d'une session
 */
export async function getSessionSummaries(sessionId: string): Promise<LiveSessionSummary[]> {
  try {
    const { data, error } = await supabase
      .from('live_session_summaries')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur résumés session:', error);
    throw error;
  }
}

/**
 * Générer un résumé avec IA
 */
export async function generateAISummary(sessionId: string): Promise<LiveSessionSummary> {
  try {
    // Récupérer les messages et participants pour le contexte
    const [messages, participants] = await Promise.all([
      getSessionMessages(sessionId, 100),
      getSessionParticipants(sessionId)
    ]);

    // Construire le contexte pour l'IA
    const context = {
      session_id: sessionId,
      messages: messages.map(m => ({
        user: m.user_display_name || m.user_name,
        content: m.content,
        timestamp: m.created_at
      })),
      participants: participants.map(p => ({
        name: p.user_display_name || p.user_name,
        role: p.role,
        duration: p.duration_seconds
      }))
    };

    // TODO: Intégrer avec un service IA pour générer le résumé
    // Pour l'instant, créer un résumé basique
    const summaryTitle = `Résumé de la session du ${new Date().toLocaleDateString()}`;
    const summaryContent = `
Session avec ${participants.length} participants et ${messages.length} messages échangés.

Participants principaux:
${participants.slice(0, 5).map(p => `- ${p.user_display_name || p.user_name} (${p.role})`).join('\n')}

Points clés:
- Session de ${Math.round((Date.now() - new Date(participants[0]?.joined_at || Date.now()).getTime()) / 60000)} minutes
- ${messages.length} messages échangés
- ${participants.length} participants actifs
    `.trim();

    return await createSessionSummary(
      sessionId,
      'ai',
      summaryTitle,
      summaryContent,
      [],
      [],
      ['session', 'résumé', 'ia'],
      0.8
    );
  } catch (error) {
    console.error('Erreur génération résumé IA:', error);
    throw error;
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Vérifier si l'utilisateur peut rejoindre une session
 */
export async function canJoinSession(sessionId: string): Promise<boolean> {
  try {
    const session = await getLiveSession(sessionId);
    if (!session) return false;

    // Vérifier si la session est active
    if (!['scheduled', 'live'].includes(session.status)) return false;

    // Vérifier si la session est publique ou si l'utilisateur est invité
    if (session.is_public) return true;

    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { data: invitation } = await supabase
      .from('live_session_invitations')
      .select('id')
      .eq('session_id', sessionId)
      .or(`invited_user_id.eq.${currentUserId},invited_email.eq.(${
        (await supabase.from('profiles').select('email').eq('id', currentUserId).single()).data?.email
      })`)
      .eq('status', 'accepted')
      .single();

    return !!invitation;
  } catch (error) {
    console.error('Erreur vérification accès session:', error);
    return false;
  }
}

/**
 * Obtenir les statistiques d'une session
 */
export async function getSessionStats(sessionId: string): Promise<{
  currentParticipants: number;
  totalMessages: number;
  totalReactions: number;
  peakParticipants: number;
  averageDuration: number;
}> {
  try {
    const [session, messages, reactions, participants] = await Promise.all([
      getLiveSession(sessionId),
      getSessionMessages(sessionId, 1000),
      getSessionReactions(sessionId),
      getSessionParticipants(sessionId)
    ]);

    const currentParticipants = participants.filter(p => !p.left_at).length;
    const totalMessages = messages.length;
    const totalReactions = reactions.length;
    const peakParticipants = participants.length;
    
    const durations = participants
      .filter(p => p.joined_at && p.left_at)
      .map(p => p.duration_seconds || 0);
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    return {
      currentParticipants,
      totalMessages,
      totalReactions,
      peakParticipants,
      averageDuration
    };
  } catch (error) {
    console.error('Erreur statistiques session:', error);
    throw error;
  }
}

/**
 * Rechercher des sessions publiques
 */
export async function searchPublicSessions(query: string, limit: number = 20): Promise<LiveSession[]> {
  try {
    const { data, error } = await supabase
      .from('live_sessions_with_host')
      .select('*')
      .eq('is_public', true)
      .in('status', ['scheduled', 'live'])
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('scheduled_start', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur recherche sessions:', error);
    throw error;
  }
}
