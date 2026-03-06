/**
 * Service de collaboration pour la gestion des groupes, invitations et partage
 * Phase 3.1 - Groupes & partage
 * 
 * Date: 8 mars 2025
 */

import { supabase } from '../lib/supabase';

// Types pour la collaboration
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  is_private: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
  user_role?: 'admin' | 'moderator' | 'member';
  user_joined_at?: string;
  member_count?: number;
  message_count?: number;
  shared_documents_count?: number;
  shared_cards_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  invited_by?: string;
  user?: {
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email?: string;
  invited_user_id?: string;
  invitation_token: string;
  role: 'admin' | 'moderator' | 'member';
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  responded_at?: string;
  group_name?: string;
  invited_by_name?: string;
  invited_by_avatar?: string;
}

export interface SharedDocument {
  id: string;
  group_id: string;
  document_id: string;
  shared_by: string;
  shared_at: string;
  is_visible: boolean;
  permissions: 'view' | 'edit' | 'admin';
  document?: {
    name: string;
    file_type: string;
    storage_path: string;
  };
  sharer?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface SharedStudyCard {
  id: string;
  group_id: string;
  study_card_id: string;
  shared_by: string;
  shared_at: string;
  is_visible: boolean;
  permissions: 'view' | 'edit' | 'admin';
  study_card?: {
    title: string;
    content: string;
    tags: string[];
  };
  sharer?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface SharedQuiz {
  id: string;
  group_id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_data: any;
  shared_by: string;
  shared_at: string;
  is_visible: boolean;
  permissions: 'view' | 'edit' | 'admin';
  sharer?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system' | 'invitation';
  metadata?: any;
  parent_message_id?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  reaction_count?: number;
  reactions?: GroupMessageReaction[];
}

export interface GroupMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateGroupData {
  name: string;
  description?: string;
  is_private?: boolean;
  max_members?: number;
}

export interface InviteUserData {
  email?: string;
  user_id?: string;
  role: 'admin' | 'moderator' | 'member';
  message?: string;
}

// ========================================
// SERVICES GROUPS
// ========================================

/**
 * Créer un nouveau groupe
 */
export async function createGroup(data: CreateGroupData): Promise<Group> {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: data.name,
        description: data.description,
        is_private: data.is_private || false,
        max_members: data.max_members || 50,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;

    // Ajouter le créateur comme admin du groupe
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin'
      });

    return group;
  } catch (error) {
    console.error('Erreur création groupe:', error);
    throw error;
  }
}

/**
 * Obtenir tous les groupes de l'utilisateur
 */
export async function getUserGroups(): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from('group_details')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur récupération groupes:', error);
    throw error;
  }
}

/**
 * Obtenir les détails d'un groupe
 */
export async function getGroupDetails(groupId: string): Promise<Group> {
  try {
    const { data, error } = await supabase
      .from('group_details')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur détails groupe:', error);
    throw error;
  }
}

/**
 * Mettre à jour un groupe
 */
export async function updateGroup(groupId: string, data: Partial<CreateGroupData>): Promise<Group> {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return group;
  } catch (error) {
    console.error('Erreur mise à jour groupe:', error);
    throw error;
  }
}

/**
 * Supprimer un groupe
 */
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression groupe:', error);
    throw error;
  }
}

// ========================================
// SERVICES MEMBRES
// ========================================

/**
 * Obtenir les membres d'un groupe
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:profiles(full_name, avatar_url, email)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur récupération membres:', error);
    throw error;
  }
}

/**
 * Mettre à jour le rôle d'un membre
 */
export async function updateMemberRole(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member'): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    throw error;
  }
}

/**
 * Retirer un membre du groupe
 */
export async function removeMember(groupId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur retrait membre:', error);
    throw error;
  }
}

/**
 * Quitter un groupe
 */
export async function leaveGroup(groupId: string): Promise<void> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur départ groupe:', error);
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
 * Inviter un utilisateur dans un groupe
 */
export async function inviteToGroup(groupId: string, inviteData: InviteUserData): Promise<GroupInvitation> {
  try {
    const invitationToken = generateInvitationToken();
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        invited_by: currentUserId,
        invited_email: inviteData.email,
        invited_user_id: inviteData.user_id,
        invitation_token: invitationToken,
        role: inviteData.role,
        message: inviteData.message
      })
      .select(`
        *,
        group:groups(name),
        invited_by_user:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur invitation:', error);
    throw error;
  }
}

/**
 * Obtenir les invitations en attente de l'utilisateur
 */
export async function getPendingInvitations(): Promise<GroupInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('pending_invitations')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur invitations en attente:', error);
    throw error;
  }
}

/**
 * Accepter une invitation
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Récupérer les détails de l'invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;

    // Ajouter l'utilisateur au groupe
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: invitation.group_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by
      });

    if (joinError) throw joinError;

    // Marquer l'invitation comme acceptée
    const { error: updateError } = await supabase
      .from('group_invitations')
      .update({ 
        status: 'accepted', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Erreur acceptation invitation:', error);
    throw error;
  }
}

/**
 * Refuser une invitation
 */
export async function declineInvitation(invitationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_invitations')
      .update({ 
        status: 'declined', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', invitationId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur refus invitation:', error);
    throw error;
  }
}

/**
 * Obtenir une invitation par son token
 */
export async function getInvitationByToken(token: string): Promise<GroupInvitation> {
  try {
    const { data, error } = await supabase
      .from('group_invitations')
      .select(`
        *,
        group:groups(name),
        invited_by_user:profiles(full_name, avatar_url)
      `)
      .eq('invitation_token', token)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur récupération invitation par token:', error);
    throw error;
  }
}

// ========================================
// SERVICES PARTAGE
// ========================================

/**
 * Partager un document avec un groupe
 */
export async function shareDocumentWithGroup(groupId: string, documentId: string, permissions: 'view' | 'edit' | 'admin' = 'view'): Promise<SharedDocument> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('shared_documents')
      .insert({
        group_id: groupId,
        document_id: documentId,
        shared_by: currentUserId,
        permissions
      })
      .select(`
        *,
        document:documents(name, file_type, storage_path),
        sharer:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur partage document:', error);
    throw error;
  }
}

/**
 * Obtenir les documents partagés d'un groupe
 */
export async function getGroupSharedDocuments(groupId: string): Promise<SharedDocument[]> {
  try {
    const { data, error } = await supabase
      .from('shared_documents')
      .select(`
        *,
        document:documents(name, file_type, storage_path),
        sharer:profiles(full_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .eq('is_visible', true)
      .order('shared_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur documents partagés:', error);
    throw error;
  }
}

/**
 * Partager une fiche de révision avec un groupe
 */
export async function shareStudyCardWithGroup(groupId: string, studyCardId: string, permissions: 'view' | 'edit' | 'admin' = 'view'): Promise<SharedStudyCard> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('shared_study_cards')
      .insert({
        group_id: groupId,
        study_card_id: studyCardId,
        shared_by: currentUserId,
        permissions
      })
      .select(`
        *,
        study_card:study_cards(title, content, tags),
        sharer:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur partage fiche:', error);
    throw error;
  }
}

/**
 * Obtenir les fiches partagées d'un groupe
 */
export async function getGroupSharedStudyCards(groupId: string): Promise<SharedStudyCard[]> {
  try {
    const { data, error } = await supabase
      .from('shared_study_cards')
      .select(`
        *,
        study_card:study_cards(title, content, tags),
        sharer:profiles(full_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .eq('is_visible', true)
      .order('shared_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur fiches partagées:', error);
    throw error;
  }
}

/**
 * Partager un quiz avec un groupe
 */
export async function shareQuizWithGroup(groupId: string, quizId: string, quizTitle: string, quizData: any, permissions: 'view' | 'edit' | 'admin' = 'view'): Promise<SharedQuiz> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('shared_quizzes')
      .insert({
        group_id: groupId,
        quiz_id: quizId,
        quiz_title: quizTitle,
        quiz_data: quizData,
        shared_by: currentUserId,
        permissions
      })
      .select(`
        *,
        sharer:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur partage quiz:', error);
    throw error;
  }
}

/**
 * Obtenir les quiz partagés d'un groupe
 */
export async function getGroupSharedQuizzes(groupId: string): Promise<SharedQuiz[]> {
  try {
    const { data, error } = await supabase
      .from('shared_quizzes')
      .select(`
        *,
        sharer:profiles(full_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .eq('is_visible', true)
      .order('shared_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur quiz partagés:', error);
    throw error;
  }
}

// ========================================
// SERVICES MESSAGES
// ========================================

/**
 * Envoyer un message dans un groupe
 */
export async function sendGroupMessage(groupId: string, content: string, messageType: 'text' | 'file' | 'system' | 'invitation' = 'text', metadata?: any, parentMessageId?: string): Promise<GroupMessage> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: currentUserId,
        content,
        message_type: messageType,
        metadata,
        parent_message_id: parentMessageId
      })
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur envoi message:', error);
    throw error;
  }
}

/**
 * Obtenir les messages d'un groupe
 */
export async function getGroupMessages(groupId: string, limit: number = 50, offset: number = 0): Promise<GroupMessage[]> {
  try {
    const { data, error } = await supabase
      .from('group_messages_with_user')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur messages groupe:', error);
    throw error;
  }
}

/**
 * Éditer un message
 */
export async function editGroupMessage(messageId: string, content: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_messages')
      .update({ 
        content, 
        is_edited: true, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur édition message:', error);
    throw error;
  }
}

/**
 * Supprimer un message
 */
export async function deleteGroupMessage(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression message:', error);
    throw error;
  }
}

/**
 * Ajouter une réaction à un message
 */
export async function addMessageReaction(messageId: string, emoji: string): Promise<GroupMessageReaction> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('group_message_reactions')
      .insert({
        message_id: messageId,
        user_id: currentUserId,
        emoji
      })
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur ajout réaction:', error);
    throw error;
  }
}

/**
 * Supprimer une réaction
 */
export async function removeMessageReaction(messageId: string, emoji: string): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('group_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', currentUserId)
      .eq('emoji', emoji);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression réaction:', error);
    throw error;
  }
}

/**
 * Obtenir les réactions d'un message
 */
export async function getMessageReactions(messageId: string): Promise<GroupMessageReaction[]> {
  try {
    const { data, error } = await supabase
      .from('group_message_reactions')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur réactions message:', error);
    throw error;
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Vérifier si l'utilisateur est membre d'un groupe
 */
export async function isGroupMember(groupId: string): Promise<boolean> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return !!data;
  } catch (error) {
    console.error('Erreur vérification membership:', error);
    return false;
  }
}

/**
 * Obtenir le rôle de l'utilisateur dans un groupe
 */
export async function getUserRoleInGroup(groupId: string): Promise<'admin' | 'moderator' | 'member' | null> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.role || null;
  } catch (error) {
    console.error('Erreur récupération rôle:', error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur peut gérer le groupe
 */
export async function canManageGroup(groupId: string): Promise<boolean> {
  const role = await getUserRoleInGroup(groupId);
  return role === 'admin' || role === 'moderator';
}

/**
 * Obtenir les statistiques d'un groupe
 */
export async function getGroupStats(groupId: string): Promise<{
  memberCount: number;
  messageCount: number;
  sharedDocumentsCount: number;
  sharedCardsCount: number;
  sharedQuizzesCount: number;
}> {
  try {
    const { data, error } = await supabase
      .from('group_details')
      .select('member_count, message_count, shared_documents_count, shared_cards_count')
      .eq('id', groupId)
      .single();

    if (error) throw error;

    // Compter les quiz partagés
    const { count: quizCount, error: quizError } = await supabase
      .from('shared_quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_visible', true);

    if (quizError) throw quizError;

    return {
      memberCount: data?.member_count || 0,
      messageCount: data?.message_count || 0,
      sharedDocumentsCount: data?.shared_documents_count || 0,
      sharedCardsCount: data?.shared_cards_count || 0,
      sharedQuizzesCount: quizCount || 0
    };
  } catch (error) {
    console.error('Erreur statistiques groupe:', error);
    throw error;
  }
}
