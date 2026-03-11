/**
 * Service pour les fonctionnalités sociales
 * Phase 3.2 - Social & découverte
 * 
 * Date: 9 mars 2025
 */

import { supabase } from '../lib/supabase';

// Types pour les fonctionnalités sociales
export interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  location?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  is_public: boolean;
  show_email: boolean;
  show_groups: boolean;
  show_stats: boolean;
  allow_friend_requests: boolean;
  interests: string[];
  skills: string[];
  education?: Array<{
    school: string;
    degree: string;
    year: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    years: string;
  }>;
  created_at: string;
  updated_at: string;
  friends_count?: number;
  groups_count?: number;
  shared_documents_count?: number;
  shared_cards_count?: number;
  public_activities_count?: number;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  created_at: string;
  responded_at?: string;
  sender_name?: string;
  sender_avatar?: string;
  sender_display_name?: string;
  receiver_name?: string;
  receiver_avatar?: string;
  receiver_display_name?: string;
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_id?: string;
  friend_name?: string;
  friend_avatar?: string;
  friend_display_name?: string;
  friend_bio?: string;
  friendship_date?: string;
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  requested_by: string;
  created_at: string;
  responded_at?: string;
}

export interface ActivityFeedItem {
  id: string;
  actor_id: string;
  action_type: 'joined_group' | 'shared_document' | 'shared_card' | 'shared_quiz' | 'created_group' | 'added_friend' | 'left_group' | 'updated_profile';
  target_type?: 'group' | 'document' | 'study_card' | 'quiz' | 'user';
  target_id?: string;
  target_name?: string;
  metadata?: any;
  is_public: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
  actor_display_name?: string;
}

export interface TrendingGroup {
  id: string;
  group_id: string;
  score: number;
  member_growth_rate: number;
  activity_score: number;
  discovery_views: number;
  last_calculated: string;
  name?: string;
  description?: string;
  is_private?: boolean;
  group_created_at?: string;
  current_member_count?: number;
  messages_last_week?: number;
}

export interface DiscoveryView {
  id: string;
  user_id: string;
  target_type: 'group' | 'user' | 'document' | 'study_card';
  target_id: string;
  viewed_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest: string;
  category: 'academic' | 'professional' | 'hobby' | 'other';
  proficiency_level: number; // 1-5
  created_at: string;
}

export interface SuggestedGroup {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_at: string;
  member_count?: number;
  interest_similarity_score: number;
}

export interface CreateProfileData {
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  location?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  is_public?: boolean;
  show_email?: boolean;
  show_groups?: boolean;
  show_stats?: boolean;
  allow_friend_requests?: boolean;
  interests?: string[];
  skills?: string[];
  education?: Array<{
    school: string;
    degree: string;
    year: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    years: string;
  }>;
}

// ========================================
// SERVICES PROFILS PUBLICS
// ========================================

/**
 * Créer ou mettre à jour un profil public
 */
export async function createOrUpdatePublicProfile(data: CreateProfileData): Promise<PublicProfile> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    const { data: profile, error } = await supabase
      .from('public_profiles')
      .upsert({
        user_id: userId,
        display_name: data.display_name,
        bio: data.bio,
        avatar_url: data.avatar_url,
        cover_image_url: data.cover_image_url,
        location: data.location,
        website: data.website,
        github_url: data.github_url,
        linkedin_url: data.linkedin_url,
        twitter_url: data.twitter_url,
        is_public: data.is_public ?? true,
        show_email: data.show_email ?? false,
        show_groups: data.show_groups ?? true,
        show_stats: data.show_stats ?? true,
        allow_friend_requests: data.allow_friend_requests ?? true,
        interests: data.interests || [],
        skills: data.skills || [],
        education: data.education || [],
        experience: data.experience || []
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Erreur création/mise à jour profil:', error);
    throw error;
  }
}

/**
 * Obtenir le profil public d'un utilisateur
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  try {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('public_profile_details')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  } catch (error) {
    console.error('Erreur récupération profil public:', error);
    return null;
  }
}

/**
 * Obtenir le profil public de l'utilisateur connecté
 */
export async function getMyPublicProfile(): Promise<PublicProfile | null> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;
    return await getPublicProfile(userId);
  } catch (error) {
    console.error('Erreur récupération mon profil:', error);
    return null;
  }
}

/**
 * Rechercher des profils publics
 */
export async function searchPublicProfiles(query: string, limit: number = 20): Promise<PublicProfile[]> {
  try {
    const { data, error } = await supabase
      .from('public_profile_details')
      .select('*')
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%,interests.cs.{${query}}`)
      .eq('is_public', true)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur recherche profils:', error);
    throw error;
  }
}

// ========================================
// SERVICES AMIS
// ========================================

/**
 * Envoyer une demande d'ami
 */
export async function sendFriendRequest(receiverId: string, message?: string): Promise<FriendRequest> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        message
      })
      .select(`
        *,
        sender:profiles(full_name, avatar_url),
        sender_profile:public_profiles(display_name),
        receiver:profiles(full_name, avatar_url),
        receiver_profile:public_profiles(display_name)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur envoi demande d\'ami:', error);
    throw error;
  }
}

/**
 * Obtenir les demandes d'amis reçues
 */
export async function getReceivedFriendRequests(): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('received_friend_requests')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur demandes reçues:', error);
    throw error;
  }
}

/**
 * Obtenir les demandes d'amis envoyées
 */
export async function getSentFriendRequests(): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('sent_friend_requests')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur demandes envoyées:', error);
    throw error;
  }
}

/**
 * Accepter une demande d'ami
 */
export async function acceptFriendRequest(requestId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ 
        status: 'accepted', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur acceptation demande d\'ami:', error);
    throw error;
  }
}

/**
 * Refuser une demande d'ami
 */
export async function declineFriendRequest(requestId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ 
        status: 'declined', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur refus demande d\'ami:', error);
    throw error;
  }
}

/**
 * Retirer une demande d'ami envoyée
 */
export async function withdrawFriendRequest(requestId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ 
        status: 'withdrawn' 
      })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur retrait demande d\'ami:', error);
    throw error;
  }
}

/**
 * Obtenir les amis de l'utilisateur
 */
export async function getUserFriends(): Promise<Friendship[]> {
  try {
    const { data, error } = await supabase
      .from('user_friends')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur récupération amis:', error);
    throw error;
  }
}

/**
 * Supprimer un ami
 */
export async function removeFriend(friendId: string): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .or(`user1_id.eq.${friendId},user2_id.eq.${friendId}`);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression ami:', error);
    throw error;
  }
}

/**
 * Vérifier si deux utilisateurs sont amis
 */
export async function areUsersFriends(userId1: string, userId2: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id')
      .or(`user1_id.eq.${userId1},user2_id.eq.${userId1}`)
      .or(`user1_id.eq.${userId2},user2_id.eq.${userId2}`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Erreur vérification amitié:', error);
    return false;
  }
}

// ========================================
// SERVICES DEMANDES D'ADHÉSION GROUPES
// ========================================

/**
 * Demander à rejoindre un groupe
 */
export async function requestToJoinGroup(groupId: string, message?: string): Promise<GroupJoinRequest> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('group_join_requests')
      .insert({
        group_id: groupId,
        user_id: currentUserId,
        message,
        requested_by: currentUserId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur demande adhésion groupe:', error);
    throw error;
  }
}

/**
 * Accepter une demande d'adhésion
 */
export async function acceptGroupJoinRequest(requestId: string): Promise<void> {
  try {
    // Récupérer la demande
    const { data: request, error: fetchError } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Ajouter comme membre
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: request.group_id,
        user_id: request.user_id,
        role: 'member'
      });

    if (joinError) throw joinError;

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('group_join_requests')
      .update({ 
        status: 'accepted', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Erreur acceptation demande groupe:', error);
    throw error;
  }
}

/**
 * Refuser une demande d'adhésion
 */
export async function declineGroupJoinRequest(requestId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_join_requests')
      .update({ 
        status: 'declined', 
        responded_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur refus demande groupe:', error);
    throw error;
  }
}

// ========================================
// SERVICES ACTIVITÉ SOCIAL
// ========================================

/**
 * Obtenir le fil d'activité social
 */
export async function getSocialActivityFeed(limit: number = 50, offset: number = 0): Promise<ActivityFeedItem[]> {
  try {
    const { data, error } = await supabase
      .from('social_activity_feed')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur fil d\'activité:', error);
    throw error;
  }
}

/**
 * Obtenir l'activité d'un utilisateur spécifique
 */
export async function getUserActivity(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        *,
        actor:profiles(full_name, avatar_url),
        actor_profile:public_profiles(display_name)
      `)
      .eq('actor_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur activité utilisateur:', error);
    throw error;
  }
}

/**
 * Enregistrer une activité manuelle
 */
export async function logActivity(
  actionType: ActivityFeedItem['action_type'],
  targetType?: ActivityFeedItem['target_type'],
  targetId?: string,
  targetName?: string,
  metadata?: any,
  isPublic: boolean = true
): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('activity_feed')
      .insert({
        actor_id: currentUserId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        metadata,
        is_public: isPublic
      });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur enregistrement activité:', error);
    throw error;
  }
}

// ========================================
// SERVICES DÉCOUVERTE
// ========================================

/**
 * Obtenir les groupes tendances
 */
export async function getTrendingGroups(limit: number = 10): Promise<TrendingGroup[]> {
  try {
    const { data, error } = await supabase
      .from('trending_groups_details')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur groupes tendances:', error);
    throw error;
  }
}

/**
 * Obtenir les groupes suggérés basés sur les intérêts
 */
export async function getSuggestedGroups(limit: number = 20): Promise<SuggestedGroup[]> {
  try {
    const { data, error } = await supabase
      .from('suggested_groups')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur groupes suggérés:', error);
    throw error;
  }
}

/**
 * Enregistrer une vue dans la découverte
 */
export async function logDiscoveryView(
  targetType: DiscoveryView['target_type'],
  targetId: string
): Promise<void> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('discovery_views')
      .insert({
        user_id: currentUserId,
        target_type: targetType,
        target_id: targetId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur enregistrement vue découverte:', error);
    throw error;
  }
}

/**
 * Rechercher des groupes
 */
export async function searchGroups(query: string, limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_private', false)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur recherche groupes:', error);
    throw error;
  }
}

// ========================================
// SERVICES INTÉRÊTS
// ========================================

/**
 * Ajouter un intérêt
 */
export async function addUserInterest(
  interest: string,
  category: UserInterest['category'] = 'other',
  proficiencyLevel: number = 1
): Promise<UserInterest> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('user_interests')
      .insert({
        user_id: currentUserId,
        interest: interest.trim(),
        category,
        proficiency_level: proficiencyLevel
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur ajout intérêt:', error);
    throw error;
  }
}

/**
 * Obtenir les intérêts d'un utilisateur
 */
export async function getUserInterests(userId?: string): Promise<UserInterest[]> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur intérêts utilisateur:', error);
    throw error;
  }
}

/**
 * Supprimer un intérêt
 */
export async function removeUserInterest(interestId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_interests')
      .delete()
      .eq('id', interestId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression intérêt:', error);
    throw error;
  }
}

/**
 * Mettre à jour un intérêt
 */
export async function updateUserInterest(
  interestId: string,
  category?: UserInterest['category'],
  proficiencyLevel?: number
): Promise<void> {
  try {
    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (proficiencyLevel !== undefined) updateData.proficiency_level = proficiencyLevel;

    const { error } = await supabase
      .from('user_interests')
      .update(updateData)
      .eq('id', interestId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur mise à jour intérêt:', error);
    throw error;
  }
}

/**
 * Obtenir les intérêts populaires
 */
export async function getPopularInterests(limit: number = 50): Promise<{ interest: string; count: number }[]> {
  try {
    const { data, error } = await supabase
      .from('user_interests')
      .select('interest')
      .limit(1000); // Limiter pour éviter les requêtes trop longues

    if (error) throw error;

    // Compter les occurrences
    const interestCounts = data.reduce((acc: any, item) => {
      acc[item.interest] = (acc[item.interest] || 0) + 1;
      return acc;
    }, {});

    // Trier et limiter
    return Object.entries(interestCounts)
      .map(([interest, count]) => ({ interest, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Erreur intérêts populaires:', error);
    throw error;
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Obtenir les statistiques sociales d'un utilisateur
 */
export async function getUserSocialStats(userId?: string): Promise<{
  friendsCount: number;
  groupsCount: number;
  sharedDocumentsCount: number;
  sharedCardsCount: number;
  publicActivitiesCount: number;
  interestsCount: number;
}> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    const [friends, groups, documents, cards, activities, interests] = await Promise.all([
      supabase.from('user_friends').select('friend_id').eq('friend_id', targetUserId),
      supabase.from('group_members').select('group_id').eq('user_id', targetUserId),
      supabase.from('shared_documents').select('id').eq('shared_by', targetUserId),
      supabase.from('shared_study_cards').select('id').eq('shared_by', targetUserId),
      supabase.from('activity_feed').select('id').eq('actor_id', targetUserId).eq('is_public', true),
      supabase.from('user_interests').select('id').eq('user_id', targetUserId)
    ]);

    return {
      friendsCount: friends.data?.length || 0,
      groupsCount: groups.data?.length || 0,
      sharedDocumentsCount: documents.data?.length || 0,
      sharedCardsCount: cards.data?.length || 0,
      publicActivitiesCount: activities.data?.length || 0,
      interestsCount: interests.data?.length || 0
    };
  } catch (error) {
    console.error('Erreur statistiques sociales:', error);
    throw error;
  }
}

/**
 * Obtenir des suggestions d'amis basées sur les intérêts et groupes communs
 */
export async function getFriendSuggestions(limit: number = 10): Promise<PublicProfile[]> {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    // Obtenir les intérêts de l'utilisateur
    const { data: userInterests } = await supabase
      .from('user_interests')
      .select('interest')
      .eq('user_id', currentUserId);

    if (!userInterests || userInterests.length === 0) return [];

    const interests = userInterests.map(ui => ui.interest);

    // Trouver des utilisateurs avec des intérêts similaires
    const { data, error } = await supabase
      .from('public_profile_details')
      .select('*')
      .eq('is_public', true)
      .neq('user_id', currentUserId)
      .contains('interests', interests)
      .limit(limit * 2); // Doubler pour filtrer ensuite

    if (error) throw error;

    // Filtrer les utilisateurs déjà amis ou avec des demandes en cours
    const { data: existingConnections } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    const connectedUserIds = new Set([
      currentUserId,
      ...(existingConnections?.map(r => r.sender_id) || []),
      ...(existingConnections?.map(r => r.receiver_id) || [])
    ]);

    return (data || [])
      .filter(profile => !connectedUserIds.has(profile.user_id))
      .slice(0, limit);
  } catch (error) {
    console.error('Erreur suggestions d\'amis:', error);
    throw error;
  }
}
