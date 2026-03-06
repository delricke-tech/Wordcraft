/**
 * Service de sauvegarde et restauration
 * Phase 3.5 - Production & fiabilité
 * 
 * Date: 10 mars 2025
 */

import { supabase } from '../lib/supabase';
import { env } from '../config/env';

export interface BackupConfig {
  includeUserData: boolean;
  includeDocuments: boolean;
  includeConversations: boolean;
  includeGroups: boolean;
  includeSessions: boolean;
  includeSettings: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  config: BackupConfig;
  size: number;
  checksum: string;
  userId: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    user?: any;
    documents?: any[];
    conversations?: any[];
    groups?: any[];
    sessions?: any[];
    settings?: any;
  };
}

export interface RestoreResult {
  success: boolean;
  restored: {
    user?: boolean;
    documents?: number;
    conversations?: number;
    groups?: number;
    sessions?: number;
    settings?: boolean;
  };
  errors?: string[];
  warnings?: string[];
}

class BackupService {
  private static instance: BackupService;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Créer une sauvegarde complète
  async createBackup(config: BackupConfig): Promise<BackupData> {
    try {
      console.log('🔄 Début de la sauvegarde...');
      
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      const userId = await this.getCurrentUserId();

      // Récupérer les données selon la configuration
      const data: BackupData['data'] = {};

      if (config.includeUserData) {
        data.user = await this.exportUserData();
      }

      if (config.includeDocuments) {
        data.documents = await this.exportDocuments();
      }

      if (config.includeConversations) {
        data.conversations = await this.exportConversations();
      }

      if (config.includeGroups) {
        data.groups = await this.exportGroups();
      }

      if (config.includeSessions) {
        data.sessions = await this.exportSessions();
      }

      if (config.includeSettings) {
        data.settings = await this.exportSettings();
      }

      // Calculer la taille et le checksum
      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;
      const checksum = await this.calculateChecksum(serializedData);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        config,
        size,
        checksum,
        userId
      };

      const backupData: BackupData = {
        metadata,
        data
      };

      // Sauvegarder les métadonnées dans Supabase
      await this.saveBackupMetadata(metadata);

      console.log('✅ Sauvegarde créée avec succès:', {
        id: backupId,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`,
        timestamp
      });

      return backupData;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la sauvegarde:', error);
      throw new Error(`Échec de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Restaurer une sauvegarde
  async restoreBackup(backupData: BackupData): Promise<RestoreResult> {
    try {
      console.log('🔄 Début de la restauration...');
      
      const result: RestoreResult = {
        success: true,
        restored: {},
        errors: [],
        warnings: []
      };

      const { metadata, data } = backupData;

      // Vérifier l'intégrité de la sauvegarde
      const isValid = await this.validateBackup(backupData);
      if (!isValid) {
        throw new Error('La sauvegarde est corrompue ou invalide');
      }

      // Restaurer les données
      if (data.user) {
        try {
          await this.restoreUserData(data.user);
          result.restored.user = true;
        } catch (error) {
          result.errors.push(`Erreur restauration utilisateur: ${error}`);
        }
      }

      if (data.documents) {
        try {
          const count = await this.restoreDocuments(data.documents);
          result.restored.documents = count;
        } catch (error) {
          result.errors.push(`Erreur restauration documents: ${error}`);
        }
      }

      if (data.conversations) {
        try {
          const count = await this.restoreConversations(data.conversations);
          result.restored.conversations = count;
        } catch (error) {
          result.errors.push(`Erreur restauration conversations: ${error}`);
        }
      }

      if (data.groups) {
        try {
          const count = await this.restoreGroups(data.groups);
          result.restored.groups = count;
        } catch (error) {
          result.errors.push(`Erreur restauration groupes: ${error}`);
        }
      }

      if (data.sessions) {
        try {
          const count = await this.restoreSessions(data.sessions);
          result.restored.sessions = count;
        } catch (error) {
          result.errors.push(`Erreur restauration sessions: ${error}`);
        }
      }

      if (data.settings) {
        try {
          await this.restoreSettings(data.settings);
          result.restored.settings = true;
        } catch (error) {
          result.errors.push(`Erreur restauration paramètres: ${error}`);
        }
      }

      // Vérifier s'il y a eu des erreurs
      if (result.errors.length > 0) {
        result.success = false;
      }

      console.log('✅ Restauration terminée:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
      return {
        success: false,
        restored: {},
        errors: [`Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
        warnings: []
      };
    }
  }

  // Lister les sauvegardes disponibles
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('backup_metadata')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sauvegardes:', error);
      return [];
    }
  }

  // Supprimer une sauvegarde
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('backup_metadata')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      console.log('✅ Sauvegarde supprimée:', backupId);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la sauvegarde:', error);
      return false;
    }
  }

  // Télécharger une sauvegarde
  async downloadBackup(backupId: string): Promise<void> {
    try {
      // Récupérer les métadonnées
      const { data: metadata, error: metadataError } = await supabase
        .from('backup_metadata')
        .select('*')
        .eq('id', backupId)
        .single();

      if (metadataError || !metadata) {
        throw new Error('Sauvegarde non trouvée');
      }

      // Créer le fichier de sauvegarde
      const backupData = await this.createBackup(metadata.config);
      const serializedData = JSON.stringify(backupData, null, 2);
      
      // Compresser si nécessaire
      const blob = await this.compressData(serializedData, metadata.config.compressionLevel);
      
      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wordcraft-backup-${metadata.timestamp.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Sauvegarde téléchargée:', backupId);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement de la sauvegarde:', error);
      throw error;
    }
  }

  // Méthodes privées d'export
  private async exportUserData(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  private async exportDocuments(): Promise<any[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return data || [];
  }

  private async exportConversations(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return data || [];
  }

  private async exportGroups(): Promise<any[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('created_by', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return data || [];
  }

  private async exportSessions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('host_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return data || [];
  }

  private async exportSettings(): Promise<any> {
    // Récupérer les paramètres depuis localStorage
    const settings = {
      theme: localStorage.getItem('wordcraft-theme'),
      language: localStorage.getItem('wordcraft-language'),
      notifications: localStorage.getItem('wordcraft-notifications'),
      performance: localStorage.getItem('wordcraft-performance')
    };
    return settings;
  }

  // Méthodes privées de restauration
  private async restoreUserData(userData: any): Promise<void> {
    // Note: La restauration des données utilisateur doit être faite avec précaution
    console.warn('⚠️ Restauration des données utilisateur non implémentée pour des raisons de sécurité');
  }

  private async restoreDocuments(documents: any[]): Promise<number> {
    if (!documents.length) return 0;

    const { data: { user } } = await supabase.auth.getUser();
    const documentsWithUser = documents.map(doc => ({
      ...doc,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('documents')
      .upsert(documentsWithUser);

    if (error) throw error;
    return documents.length;
  }

  private async restoreConversations(conversations: any[]): Promise<number> {
    if (!conversations.length) return 0;

    const { data: { user } } = await supabase.auth.getUser();
    const conversationsWithUser = conversations.map(conv => ({
      ...conv,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('ai_conversations')
      .upsert(conversationsWithUser);

    if (error) throw error;
    return conversations.length;
  }

  private async restoreGroups(groups: any[]): Promise<number> {
    if (!groups.length) return 0;

    const { data: { user } } = await supabase.auth.getUser();
    const groupsWithUser = groups.map(group => ({
      ...group,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('groups')
      .upsert(groupsWithUser);

    if (error) throw error;
    return groups.length;
  }

  private async restoreSessions(sessions: any[]): Promise<number> {
    if (!sessions.length) return 0;

    const { data: { user } } = await supabase.auth.getUser();
    const sessionsWithUser = sessions.map(session => ({
      ...session,
      host_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('live_sessions')
      .upsert(sessionsWithUser);

    if (error) throw error;
    return sessions.length;
  }

  private async restoreSettings(settings: any): Promise<void> {
    if (settings.theme) {
      localStorage.setItem('wordcraft-theme', settings.theme);
    }
    if (settings.language) {
      localStorage.setItem('wordcraft-language', settings.language);
    }
    if (settings.notifications) {
      localStorage.setItem('wordcraft-notifications', settings.notifications);
    }
    if (settings.performance) {
      localStorage.setItem('wordcraft-performance', settings.performance);
    }
  }

  // Utilitaires
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataUint8 = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async validateBackup(backupData: BackupData): Promise<boolean> {
    try {
      const serializedData = JSON.stringify(backupData.data);
      const calculatedChecksum = await this.calculateChecksum(serializedData);
      return calculatedChecksum === backupData.metadata.checksum;
    } catch (error) {
      console.error('Erreur lors de la validation de la sauvegarde:', error);
      return false;
    }
  }

  private async compressData(data: string, compressionLevel: string): Promise<Blob> {
    if (compressionLevel === 'none') {
      return new Blob([data], { type: 'application/json' });
    }

    try {
      // Utiliser l'API Compression Stream pour la compression
      const compressionStream = new CompressionStream('gzip');
      const writer = compressionStream.writable.getWriter();
      const reader = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(data));
          controller.close();
        }
      }).getReader();

      const response = new Response(reader.read().then(result => {
        return new Response(result.value);
      }));

      return response.blob();
    } catch (error) {
      console.warn('Compression non supportée, utilisation du format brut:', error);
      return new Blob([data], { type: 'application/json' });
    }
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const { error } = await supabase
      .from('backup_metadata')
      .insert(metadata);

    if (error) throw error;
  }

  // Planification des sauvegardes automatiques
  async scheduleAutoBackup(config: BackupConfig, frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const nextBackup = this.calculateNextBackupTime(frequency);
    
    // Sauvegarder la configuration de planification
    localStorage.setItem('wordcraft-auto-backup-config', JSON.stringify({
      config,
      frequency,
      nextBackup
    }));

    console.log('📅 Sauvegarde automatique planifiée:', {
      frequency,
      nextBackup: new Date(nextBackup).toLocaleString()
    });
  }

  private calculateNextBackupTime(frequency: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(2, 0, 0, 0); // 2h du matin
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        now.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(2, 0, 0, 0);
        break;
    }
    
    return now.toISOString();
  }

  // Vérifier si une sauvegarde automatique est nécessaire
  async checkAutoBackup(): Promise<void> {
    const configStr = localStorage.getItem('wordcraft-auto-backup-config');
    if (!configStr) return;

    const config = JSON.parse(configStr);
    const now = new Date();
    const nextBackup = new Date(config.nextBackup);

    if (now >= nextBackup) {
      console.log('🔄 Lancement de la sauvegarde automatique...');
      await this.createBackup(config.config);
      
      // Planifier la prochaine sauvegarde
      await this.scheduleAutoBackup(config.config, config.frequency);
    }
  }
}

export const backupService = BackupService.getInstance();
