/**
 * Service de gestion des conversations IA avec persistance
 * Permet de sauvegarder et récupérer l'historique des conversations
 * 
 * Date: 6 mars 2025
 */

import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface ConversationMessage {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    document_ids?: string[];
    detail_level?: 'concis' | 'standard' | 'détaillé';
    model_used?: string;
    tokens_used?: number;
    citations?: any[]; // Ajouter les citations
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  document_context: {
    document_ids: string[];
    document_names: string[];
  };
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

/**
 * Crée une nouvelle conversation
 */
export async function createConversation(
  userId: string,
  title: string,
  documentIds: string[],
  documentNames: string[]
): Promise<Conversation> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title,
        document_context: {
          document_ids: documentIds,
          document_names: documentNames
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erreur création conversation:', error);
    throw new Error(`Impossible de créer la conversation: ${error.message}`);
  }
}

/**
 * Ajoute un message à une conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: ConversationMessage['metadata']
): Promise<ConversationMessage> {
  try {
    const { data, error } = await supabase
      .from('ai_conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        timestamp: new Date().toISOString(),
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le timestamp de la conversation
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (error: any) {
    console.error('Erreur ajout message:', error);
    throw new Error(`Impossible d'ajouter le message: ${error.message}`);
  }
}

/**
 * Récupère toutes les conversations d'un utilisateur
 */
export async function getUserConversations(
  userId: string,
  limit: number = 20
): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        ai_conversation_messages(count)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Formater les données pour inclure le nombre de messages
    return (data || []).map(conv => ({
      ...conv,
      message_count: conv.ai_conversation_messages?.[0]?.count || 0
    }));
  } catch (error: any) {
    console.error('Erreur récupération conversations:', error);
    throw new Error(`Impossible de charger les conversations: ${error.message}`);
  }
}

/**
 * Récupère une conversation avec tous ses messages
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages> {
  try {
    // Récupérer la conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError) throw convError;

    // Récupérer les messages
    const { data: messages, error: msgError } = await supabase
      .from('ai_conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (msgError) throw msgError;

    return {
      ...conversation,
      messages: messages || []
    };
  } catch (error: any) {
    console.error('Erreur récupération conversation détaillée:', error);
    throw new Error(`Impossible de charger la conversation: ${error.message}`);
  }
}

/**
 * Met à jour le titre d'une conversation
 */
export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  newTitle: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ 
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erreur mise à jour titre:', error);
    throw new Error(`Impossible de mettre à jour le titre: ${error.message}`);
  }
}

/**
 * Supprime une conversation et tous ses messages
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Supprimer d'abord les messages (cascade devrait gérer ça, mais par sécurité)
    const { error: msgError } = await supabase
      .from('ai_conversation_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (msgError) throw msgError;

    // Supprimer la conversation
    const { error: convError } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (convError) throw convError;
  } catch (error: any) {
    console.error('Erreur suppression conversation:', error);
    throw new Error(`Impossible de supprimer la conversation: ${error.message}`);
  }
}

/**
 * Exporte une conversation au format texte
 */
export function exportConversationAsText(
  conversation: ConversationWithMessages
): string {
  let exportText = `📝 Conversation: ${conversation.title}\n`;
  exportText += `📅 Créée le: ${new Date(conversation.created_at).toLocaleDateString('fr-FR')}\n`;
  exportText += `📄 Documents: ${conversation.document_context.document_names.join(', ')}\n`;
  exportText += `${'='.repeat(50)}\n\n`;

  conversation.messages.forEach((msg, index) => {
    const timestamp = new Date(msg.timestamp).toLocaleString('fr-FR');
    const role = msg.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant IA';
    
    exportText += `${role} - ${timestamp}\n`;
    exportText += `${msg.content}\n`;
    exportText += `${'-'.repeat(30)}\n\n`;
  });

  exportText += `\n📊 Export généré le: ${new Date().toLocaleString('fr-FR')}`;
  exportText += `\n🔗 WordCraft IA - Assistant Intelligent`;

  return exportText;
}

/**
 * Exporte une conversation au format Markdown
 */
export function exportConversationAsMarkdown(
  conversation: ConversationWithMessages
): string {
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**📅 Créée le:** ${new Date(conversation.created_at).toLocaleDateString('fr-FR')}\n\n`;
  markdown += `**📄 Documents:** ${conversation.document_context.document_names.join(', ')}\n\n`;
  markdown += `---\n\n`;

  conversation.messages.forEach((msg) => {
    const timestamp = new Date(msg.timestamp).toLocaleString('fr-FR');
    const role = msg.role === 'user' ? '👤 **Utilisateur**' : '🤖 **Assistant IA**';
    
    markdown += `${role} - *${timestamp}*\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `---\n\n`;
  });

  markdown += `\n*📊 Export généré le ${new Date().toLocaleString('fr-FR')} par WordCraft IA*`;

  return markdown;
}

/**
 * Génère un titre automatique pour une conversation basé sur le premier message
 */
export function generateConversationTitle(firstUserMessage: string): string {
  // Extraire les premiers mots significatifs
  const words = firstUserMessage
    .replace(/[^\w\s]/gi, '') // Enlever la ponctuation
    .split(/\s+/) // Diviser en mots
    .filter(word => word.length > 2) // Garder les mots de plus de 2 caractères
    .slice(0, 6); // Prendre les 6 premiers mots

  if (words.length === 0) {
    return 'Nouvelle conversation';
  }

  const title = words.join(' ').toLowerCase();
  return title.charAt(0).toUpperCase() + title.slice(1);
}
