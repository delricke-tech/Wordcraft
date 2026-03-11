/**
 * Service de gestion des workspaces (multi-projets organisés)
 * 
 * Ce service permet de créer et gérer des espaces de travail
 * pour organiser les projets, documents et collaborations
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  settings: WorkspaceSettings;
  created_at: string;
  updated_at: string;
  member_count?: number;
  document_count?: number;
  project_count?: number;
}

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en' | 'es';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
    comments: boolean;
    shares: boolean;
  };
  privacy: {
    allow_invites: boolean;
    require_approval: boolean;
    default_member_role: 'admin' | 'member' | 'viewer';
  };
  features: {
    enable_chat: boolean;
    enable_collaboration: boolean;
    enable_ai_features: boolean;
    enable_analytics: boolean;
    enable_exports: boolean;
  };
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: WorkspacePermissions;
  joined_at: string;
  last_active_at?: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface WorkspacePermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
  can_manage_members: boolean;
  can_manage_settings: boolean;
  can_export: boolean;
  can_share: boolean;
}

export interface WorkspaceProject {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'deleted';
  created_by: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
  member_count?: number;
  tags?: string[];
  settings?: {
    is_public: boolean;
    allow_comments: boolean;
    require_approval: boolean;
  };
}

class WorkspaceService {
  /**
   * Crée un nouveau workspace
   */
  async createWorkspace(
    name: string,
    description: string,
    ownerId: string,
    settings: Partial<WorkspaceSettings> = {}
  ): Promise<Workspace> {
    try {
      const defaultSettings: WorkspaceSettings = {
        theme: 'light',
        language: 'fr',
        timezone: 'Europe/Paris',
        notifications: {
          email: true,
          push: true,
          mentions: true,
          comments: true,
          shares: true
        },
        privacy: {
          allow_invites: true,
          require_approval: false,
          default_member_role: 'member'
        },
        features: {
          enable_chat: true,
          enable_collaboration: true,
          enable_ai_features: true,
          enable_analytics: true,
          enable_exports: true
        },
        ...settings
      };

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          description,
          owner_id: ownerId,
          is_public: false,
          settings: defaultSettings
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le workspace');

      // Ajouter le créateur comme owner
      await this.addMember(data.id, ownerId, 'owner');

      console.log('✅ Workspace créé:', data.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur création workspace:', error);
      throw new Error(`Échec de la création du workspace: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère tous les workspaces d'un utilisateur
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          role,
          workspaces!inner(
            id,
            name,
            description,
            is_public,
            created_at,
            updated_at,
            settings
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      if (!data) return [];

      // Compter les membres et documents pour chaque workspace
      const workspaces = await Promise.all(
        data.map(async (member: any) => {
          const workspace = member.workspaces;
          const [memberCount, documentCount] = await Promise.all([
            this.getWorkspaceMemberCount(workspace.id),
            this.getWorkspaceDocumentCount(workspace.id)
          ]);

          return {
            ...workspace,
            member_count: memberCount,
            document_count: documentCount,
            user_role: member.role
          } as Workspace;
        })
      );

      return workspaces;

    } catch (error) {
      console.error('❌ Erreur récupération workspaces:', error);
      throw new Error(`Échec de la récupération des workspaces: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère un workspace spécifique
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(role, user_id)
        `)
        .eq('id', workspaceId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Compter les membres et documents
      const [memberCount, documentCount] = await Promise.all([
        this.getWorkspaceMemberCount(workspaceId),
        this.getWorkspaceDocumentCount(workspaceId)
      ]);

      return {
        ...data,
        member_count: memberCount,
        document_count: documentCount
      };

    } catch (error) {
      console.error('❌ Erreur récupération workspace:', error);
      throw new Error(`Échec de la récupération du workspace: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un workspace
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
  ): Promise<Workspace> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', workspaceId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Workspace non trouvé');

      console.log('✅ Workspace mis à jour:', data.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur mise à jour workspace:', error);
      throw new Error(`Échec de la mise à jour du workspace: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      console.log('✅ Workspace supprimé');

    } catch (error) {
      console.error('❌ Erreur suppression workspace:', error);
      throw new Error(`Échec de la suppression du workspace: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Ajoute un membre à un workspace
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'viewer'
  ): Promise<WorkspaceMember> {
    try {
      const permissions = this.getPermissionsForRole(role);

      const { data, error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role,
          permissions
        })
        .select(`
          *,
          user:profiles(id, email, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible d\'ajouter le membre');

      console.log('✅ Membre ajouté au workspace');
      return data;

    } catch (error) {
      console.error('❌ Erreur ajout membre:', error);
      throw new Error(`Échec de l'ajout du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les membres d'un workspace
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          user:profiles(id, email, full_name, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération membres:', error);
      throw new Error(`Échec de la récupération des membres: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour le rôle d'un membre
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: 'owner' | 'admin' | 'member' | 'viewer'
  ): Promise<void> {
    try {
      const permissions = this.getPermissionsForRole(newRole);

      const { error } = await supabase
        .from('workspace_members')
        .update({
          role: newRole,
          permissions
        })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Rôle du membre mis à jour');

    } catch (error) {
      console.error('❌ Erreur mise à jour rôle:', error);
      throw new Error(`Échec de la mise à jour du rôle: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un membre d'un workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Membre supprimé du workspace');

    } catch (error) {
      console.error('❌ Erreur suppression membre:', error);
      throw new Error(`Échec de la suppression du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée un projet dans un workspace
   */
  async createProject(
    workspaceId: string,
    name: string,
    description: string,
    createdBy: string,
    settings: any = {}
  ): Promise<WorkspaceProject> {
    try {
      const { data, error } = await supabase
        .from('workspace_projects')
        .insert({
          workspace_id: workspaceId,
          name,
          description,
          created_by: createdBy,
          status: 'active',
          settings
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le projet');

      console.log('✅ Projet créé dans le workspace');
      return data;

    } catch (error) {
      console.error('❌ Erreur création projet:', error);
      throw new Error(`Échec de la création du projet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les projets d'un workspace
   */
  async getWorkspaceProjects(workspaceId: string): Promise<WorkspaceProject[]> {
    try {
      const { data, error } = await supabase
        .from('workspace_projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération projets:', error);
      throw new Error(`Échec de la récupération des projets: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async hasPermission(
    workspaceId: string,
    userId: string,
    permission: keyof WorkspacePermissions
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('permissions')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) return false;

      return data.permissions[permission] || false;

    } catch (error) {
      console.error('❌ Erreur vérification permission:', error);
      return false;
    }
  }

  /**
   * Récupère les permissions d'un utilisateur dans un workspace
   */
  async getUserPermissions(workspaceId: string, userId: string): Promise<WorkspacePermissions | null> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('permissions, role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data.permissions;

    } catch (error) {
      console.error('❌ Erreur récupération permissions:', error);
      return null;
    }
  }

  /**
   * Définit les permissions selon le rôle
   */
  private getPermissionsForRole(role: string): WorkspacePermissions {
    switch (role) {
      case 'owner':
        return {
          can_view: true,
          can_edit: true,
          can_delete: true,
          can_invite: true,
          can_manage_members: true,
          can_manage_settings: true,
          can_export: true,
          can_share: true
        };
      case 'admin':
        return {
          can_view: true,
          can_edit: true,
          can_delete: true,
          can_invite: true,
          can_manage_members: true,
          can_manage_settings: false,
          can_export: true,
          can_share: true
        };
      case 'member':
        return {
          can_view: true,
          can_edit: true,
          can_delete: false,
          can_invite: false,
          can_manage_members: false,
          can_manage_settings: false,
          can_export: true,
          can_share: true
        };
      case 'viewer':
        return {
          can_view: true,
          can_edit: false,
          can_delete: false,
          can_invite: false,
          can_manage_members: false,
          can_manage_settings: false,
          can_export: false,
          can_share: false
        };
      default:
        return {
          can_view: false,
          can_edit: false,
          can_delete: false,
          can_invite: false,
          can_manage_members: false,
          can_manage_settings: false,
          can_export: false,
          can_share: false
        };
    }
  }

  /**
   * Compte le nombre de membres dans un workspace
   */
  private async getWorkspaceMemberCount(workspaceId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return count || 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Compte le nombre de documents dans un workspace
   */
  private async getWorkspaceDocumentCount(workspaceId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return count || 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Archive un workspace
   */
  async archiveWorkspace(workspaceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ status: 'archived' })
        .eq('id', workspaceId);

      if (error) throw error;

      console.log('✅ Workspace archivé');

    } catch (error) {
      console.error('❌ Erreur archivage workspace:', error);
      throw new Error(`Échec de l'archivage du workspace: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Duplique un workspace
   */
  async duplicateWorkspace(
    workspaceId: string,
    newName: string,
    ownerId: string
  ): Promise<Workspace> {
    try {
      const originalWorkspace = await this.getWorkspace(workspaceId);
      if (!originalWorkspace) throw new Error('Workspace original non trouvé');

      const newWorkspace = await this.createWorkspace(
        newName,
        `Copie de: ${originalWorkspace.description || ''}`,
        ownerId,
        originalWorkspace.settings
      );

      // Copier les projets
      const projects = await this.getWorkspaceProjects(workspaceId);
      for (const project of projects) {
        await this.createProject(
          newWorkspace.id,
          project.name,
          project.description || '',
          ownerId,
          project.settings
        );
      }

      console.log('✅ Workspace dupliqué');
      return newWorkspace;

    } catch (error) {
      console.error('❌ Erreur duplication workspace:', error);
      throw new Error(`Échec de la duplication du workspace: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Instance singleton
export const workspaceService = new WorkspaceService();

// Export des fonctions utilitaires
export const createWorkspace = (
  name: string,
  description: string,
  ownerId: string,
  settings?: Partial<WorkspaceSettings>
) => workspaceService.createWorkspace(name, description, ownerId, settings);

export const getUserWorkspaces = (userId: string) => 
  workspaceService.getUserWorkspaces(userId);

export const getWorkspace = (workspaceId: string) => 
  workspaceService.getWorkspace(workspaceId);

export const updateWorkspace = (
  workspaceId: string,
  updates: Partial<Workspace>
) => workspaceService.updateWorkspace(workspaceId, updates);

export const deleteWorkspace = (workspaceId: string) => 
  workspaceService.deleteWorkspace(workspaceId);

export const addMember = (
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' | 'viewer'
) => workspaceService.addMember(workspaceId, userId, role);

export const getWorkspaceMembers = (workspaceId: string) => 
  workspaceService.getWorkspaceMembers(workspaceId);

export const removeMember = (workspaceId: string, userId: string) => 
  workspaceService.removeMember(workspaceId, userId);

export const createProject = (
  workspaceId: string,
  name: string,
  description: string,
  createdBy: string,
  settings?: any
) => workspaceService.createProject(workspaceId, name, description, createdBy, settings);

export const getWorkspaceProjects = (workspaceId: string) => 
  workspaceService.getWorkspaceProjects(workspaceId);

export const hasPermission = (
  workspaceId: string,
  userId: string,
  permission: keyof WorkspacePermissions
) => workspaceService.hasPermission(workspaceId, userId, permission);

export const getUserPermissions = (workspaceId: string, userId: string) => 
  workspaceService.getUserPermissions(workspaceId, userId);
