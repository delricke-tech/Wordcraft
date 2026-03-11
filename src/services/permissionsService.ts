/**
 * Service de permissions granulaires (rôles détaillés)
 * 
 * Ce service permet de gérer les permissions détaillées avec rôles,
 * héritage, restrictions et audit des accès
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number; // 0-100, plus élevé = plus de permissions
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
  restrictions: Restriction[];
  parentRoleId?: string;
  inheritsFrom?: string[];
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userCount?: number;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  effect: PermissionEffect;
  priority: number;
  description?: string;
  category: PermissionCategory;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface Restriction {
  id: string;
  resource: string;
  action: string;
  reason: string;
  conditions: PermissionCondition[];
  isActive: boolean;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

export type PermissionEffect = 'allow' | 'deny' | 'conditional';
export type PermissionCategory = 
  | 'documents'
  | 'notes'
  | 'conversations'
  | 'flashcards'
  | 'quiz'
  | 'bookmarks'
  | 'sharing'
  | 'collaboration'
  | 'comments'
  | 'mentions'
  | 'users'
  | 'roles'
  | 'settings'
  | 'analytics'
  | 'system';

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  context?: RoleContext;
  metadata: RoleMetadata;
}

export interface RoleContext {
  workspaceId?: string;
  projectId?: string;
  documentId?: string;
  teamId?: string;
  departmentId?: string;
  scope: 'global' | 'workspace' | 'project' | 'document' | 'team';
}

export interface RoleMetadata {
  assignmentReason?: string;
  notes?: string;
  temporary: boolean;
  autoRenew: boolean;
  lastAccessed?: string;
  accessCount: number;
}

export interface PermissionCheck {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  effect: PermissionEffect;
  reason?: string;
  roleId?: string;
  roleName?: string;
  conditions?: PermissionCondition[];
  restrictions?: Restriction[];
  evaluatedAt: string;
  cacheHit: boolean;
}

export interface PermissionAudit {
  id: string;
  userId: string;
  resource: string;
  action: string;
  resourceId?: string;
  result: boolean;
  effect: PermissionEffect;
  roleId: string;
  roleName: string;
  reason?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  context?: Record<string, any>;
  duration?: number; // Temps d'évaluation en ms
}

export interface RoleTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  permissions: Omit<Permission, 'id'>[];
  restrictions: Omit<Restriction, 'id' | 'createdBy' | 'createdAt'>[];
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

export interface PermissionStats {
  totalRoles: number;
  activeRoles: number;
  totalUsers: number;
  usersWithRoles: number;
  rolesByCategory: Record<string, number>;
  permissionDistribution: Record<PermissionCategory, number>;
  topRoles: Array<{ roleId: string; roleName: string; userCount: number }>;
  recentAssignments: UserRole[];
  auditEvents: PermissionAudit[];
  deniedRequests: Array<{ resource: string; action: string; count: number; lastDenied: string }>;
}

class PermissionsService {
  private permissionCache: Map<string, PermissionResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Crée un nouveau rôle
   */
  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>): Promise<Role> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: role.name,
          display_name: role.displayName,
          description: role.description,
          level: role.level,
          is_system: role.isSystem,
          is_active: role.isActive,
          permissions: role.permissions,
          restrictions: role.restrictions,
          parent_role_id: role.parentRoleId,
          inherits_from: role.inheritsFrom || [],
          color: role.color,
          icon: role.icon,
          created_by: role.createdBy
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le rôle');

      console.log('✅ Rôle créé:', data.name);
      return this.mapRoleFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création rôle:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère tous les rôles
   */
  async getRoles(options: {
    includeInactive?: boolean;
    includeSystem?: boolean;
    category?: PermissionCategory;
    limit?: number;
    offset?: number;
  } = {}): Promise<Role[]> {
    try {
      let query = supabase
        .from('roles')
        .select('*');

      if (!options.includeInactive) {
        query = query.eq('is_active', true);
      }

      if (!options.includeSystem) {
        query = query.eq('is_system', false);
      }

      if (options.category) {
        query = query.contains('permissions', JSON.stringify([{ category: options.category }]));
      }

      query = query.order('level', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapRoleFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération rôles:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Attribue un rôle à un utilisateur
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    options: {
      expiresAt?: string;
      context?: RoleContext;
      metadata?: Partial<RoleMetadata>;
    } = {}
  ): Promise<UserRole> {
    try {
      // Vérifier si l'utilisateur n'a pas déjà ce rôle
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .single();

      if (existing) {
        throw new Error('L\'utilisateur a déjà ce rôle actif');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          expires_at: options.expiresAt,
          is_active: true,
          context: options.context,
          metadata: {
            temporary: !!options.expiresAt,
            autoRenew: false,
            accessCount: 0,
            ...options.metadata
          }
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible d\'attribuer le rôle');

      console.log('✅ Rôle attribué:', roleId, 'à utilisateur:', userId);
      return this.mapUserRoleFromDB(data);

    } catch (error) {
      console.error('❌ Erreur attribution rôle:', error);
      throw new Error(`Échec de l'attribution: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Révoque un rôle d'un utilisateur
   */
  async revokeRole(userId: string, roleId: string, revokedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          is_active: false,
          expires_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (error) throw error;

      // Nettoyer le cache de permissions pour cet utilisateur
      this.clearUserPermissionCache(userId);

      console.log('✅ Rôle révoqué:', roleId, 'pour utilisateur:', userId);

    } catch (error) {
      console.error('❌ Erreur révocation rôle:', error);
      throw new Error(`Échec de la révocation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(check);

    // Vérifier le cache d'abord
    const cached = this.permissionCache.get(cacheKey);
    if (cached && (Date.now() - cached.evaluatedAt.getTime()) < this.CACHE_TTL) {
      return {
        ...cached,
        cacheHit: true,
        evaluatedAt: new Date().toISOString()
      };
    }

    try {
      // Récupérer les rôles actifs de l'utilisateur
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          context,
          expires_at,
          roles!inner(
            id,
            name,
            display_name,
            level,
            permissions,
            restrictions,
            inherits_from
          )
        `)
        .eq('user_id', check.userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (!userRoles || userRoles.length === 0) {
        const result: PermissionResult = {
          allowed: false,
          effect: 'deny',
          reason: 'Aucun rôle actif trouvé',
          evaluatedAt: new Date().toISOString(),
          cacheHit: false
        };

        this.permissionCache.set(cacheKey, result);
        await this.logPermissionCheck(check, result, startTime);
        return result;
      }

      // Évaluer les permissions pour chaque rôle
      let allowed = false;
      let effect: PermissionEffect = 'deny';
      let reason = '';
      let matchingRole: any = null;
      const matchingPermissions: Permission[] = [];
      const activeRestrictions: Restriction[] = [];

      for (const userRole of userRoles) {
        const role = userRole.roles;
        
        // Vérifier le contexte si spécifié
        if (check.context && userRole.context) {
          if (!this.isContextValid(check.context, userRole.context)) {
            continue;
          }
        }

        // Récupérer les permissions héritées
        const allPermissions = await this.getInheritedPermissions(role.inherits_from || []);
        const permissions = [...role.permissions, ...allPermissions];

        // Chercher une permission correspondante
        const matchingPerm = permissions.find(perm => 
          perm.resource === check.resource && perm.action === check.action
        );

        if (matchingPerm) {
          matchingPermissions.push(matchingPerm);

          // Vérifier les conditions
          if (this.evaluateConditions(matchingPerm.conditions || [], check.context)) {
            if (matchingPerm.effect === 'deny') {
              // Les deny ont priorité absolue
              allowed = false;
              effect = 'deny';
              reason = 'Permission explicitement refusée';
              matchingRole = role;
              break;
            } else if (matchingPerm.effect === 'allow' && !allowed) {
              allowed = true;
              effect = 'allow';
              reason = 'Permission accordée';
              matchingRole = role;
            }
          }
        }

        // Vérifier les restrictions
        const activeRoleRestrictions = role.restrictions.filter(r => 
          r.isActive && (!r.expiresAt || new Date(r.expiresAt) > new Date())
        );

        for (const restriction of activeRoleRestrictions) {
          if (restriction.resource === check.resource && restriction.action === check.action) {
            if (this.evaluateConditions(restriction.conditions, check.context)) {
              activeRestrictions.push(restriction);
              allowed = false;
              effect = 'deny';
              reason = `Restriction active: ${restriction.reason}`;
              matchingRole = role;
              break;
            }
          }
        }

        if (!allowed && effect === 'deny') break;
      }

      const result: PermissionResult = {
        allowed,
        effect,
        reason: reason || (allowed ? 'Permission accordée' : 'Permission refusée'),
        roleId: matchingRole?.id,
        roleName: matchingRole?.display_name || matchingRole?.name,
        conditions: matchingPermissions.flatMap(p => p.conditions || []),
        restrictions: activeRestrictions,
        evaluatedAt: new Date().toISOString(),
        cacheHit: false
      };

      // Mettre en cache le résultat
      this.permissionCache.set(cacheKey, result);

      // Logger la vérification
      await this.logPermissionCheck(check, result, startTime);

      return result;

    } catch (error) {
      console.error('❌ Erreur vérification permission:', error);
      const errorResult: PermissionResult = {
        allowed: false,
        effect: 'deny',
        reason: 'Erreur lors de la vérification',
        evaluatedAt: new Date().toISOString(),
        cacheHit: false
      };

      await this.logPermissionCheck(check, errorResult, startTime);
      return errorResult;
    }
  }

  /**
   * Récupère les rôles d'un utilisateur
   */
  async getUserRoles(userId: string, includeInactive = false): Promise<UserRole[]> {
    try {
      let query = supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_id,
          assigned_by,
          assigned_at,
          expires_at,
          is_active,
          context,
          metadata,
          roles!inner(
            id,
            name,
            display_name,
            level,
            color,
            icon
          )
        `)
        .eq('user_id', userId);

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      query = query.or('expires_at.is.null,expires_at.gt.now()');

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapUserRoleFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération rôles utilisateur:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les statistiques des permissions
   */
  async getPermissionStats(): Promise<PermissionStats> {
    try {
      const { data, error } = await supabase.rpc('get_permission_stats');

      if (error) throw error;

      const stats = data || {
        total_roles: 0,
        active_roles: 0,
        total_users: 0,
        users_with_roles: 0,
        roles_by_category: {},
        permission_distribution: {},
        top_roles: [],
        recent_assignments: [],
        audit_events: [],
        denied_requests: []
      };

      return {
        totalRoles: stats.total_roles,
        activeRoles: stats.active_roles,
        totalUsers: stats.total_users,
        usersWithRoles: stats.users_with_roles,
        rolesByCategory: stats.roles_by_category,
        permissionDistribution: stats.permission_distribution,
        topRoles: stats.top_roles,
        recentAssignments: (stats.recent_assignments || []).map(this.mapUserRoleFromDB),
        auditEvents: stats.audit_events || [],
        deniedRequests: stats.denied_requests || []
      };

    } catch (error) {
      console.error('❌ Erreur statistiques permissions:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée un template de rôle
   */
  async createRoleTemplate(template: Omit<RoleTemplate, 'id' | 'createdAt' | 'usageCount' | 'rating'>): Promise<RoleTemplate> {
    try {
      const { data, error } = await supabase
        .from('role_templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          permissions: template.permissions,
          restrictions: template.restrictions,
          is_public: template.isPublic,
          usage_count: 0,
          rating: 0,
          created_by: template.createdBy,
          tags: template.tags || []
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le template');

      console.log('✅ Template de rôle créé:', data.name);
      return this.mapRoleTemplateFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création template rôle:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les templates de rôles
   */
  async getRoleTemplates(options: {
    category?: string;
    isPublic?: boolean;
    tags?: string[];
    limit?: number;
  } = {}): Promise<RoleTemplate[]> {
    try {
      let query = supabase
        .from('role_templates')
        .select('*')
        .order('rating', { ascending: false })
        .order('usage_count', { ascending: false });

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.isPublic !== undefined) {
        query = query.eq('is_public', options.isPublic);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapRoleTemplateFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération templates rôles:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Évalue les conditions de permission
   */
  private evaluateConditions(conditions: PermissionCondition[], context?: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;
    if (!context) return false;

    for (const condition of conditions) {
      const fieldValue = context[condition.field];
      const conditionValue = condition.value;

      let result = false;

      switch (condition.operator) {
        case 'eq':
          result = fieldValue === conditionValue;
          break;
        case 'ne':
          result = fieldValue !== conditionValue;
          break;
        case 'gt':
          result = Number(fieldValue) > Number(conditionValue);
          break;
        case 'gte':
          result = Number(fieldValue) >= Number(conditionValue);
          break;
        case 'lt':
          result = Number(fieldValue) < Number(conditionValue);
          break;
        case 'lte':
          result = Number(fieldValue) <= Number(conditionValue);
          break;
        case 'in':
          result = Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
          break;
        case 'nin':
          result = Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
          break;
        case 'contains':
          result = typeof fieldValue === 'string' && fieldValue.includes(conditionValue);
          break;
        case 'startsWith':
          result = typeof fieldValue === 'string' && fieldValue.startsWith(conditionValue);
          break;
        case 'endsWith':
          result = typeof fieldValue === 'string' && fieldValue.endsWith(conditionValue);
          break;
      }

      if (!result && condition.logic !== 'OR') {
        return false;
      }
    }

    return true;
  }

  /**
   * Vérifie la validité du contexte
   */
  private isContextValid(checkContext: Record<string, any>, roleContext: RoleContext): boolean {
    // Si le contexte du rôle est global, il est toujours valide
    if (roleContext.scope === 'global') return true;

    // Vérifier la correspondance des contextes spécifiques
    if (roleContext.workspaceId && checkContext.workspaceId !== roleContext.workspaceId) return false;
    if (roleContext.projectId && checkContext.projectId !== roleContext.projectId) return false;
    if (roleContext.documentId && checkContext.documentId !== roleContext.documentId) return false;
    if (roleContext.teamId && checkContext.teamId !== roleContext.teamId) return false;
    if (roleContext.departmentId && checkContext.departmentId !== roleContext.departmentId) return false;

    return true;
  }

  /**
   * Récupère les permissions héritées
   */
  private async getInheritedPermissions(parentRoleIds: string[]): Promise<Permission[]> {
    if (parentRoleIds.length === 0) return [];

    try {
      const { data } = await supabase
        .from('roles')
        .select('permissions')
        .in('id', parentRoleIds)
        .eq('is_active', true);

      if (!data) return [];

      return data.flatMap(role => role.permissions || []);

    } catch (error) {
      console.error('❌ Erreur récupération permissions héritées:', error);
      return [];
    }
  }

  /**
   * Construit la clé de cache
   */
  private buildCacheKey(check: PermissionCheck): string {
    const contextStr = check.context ? JSON.stringify(check.context) : '';
    return `${check.userId}:${check.resource}:${check.action}:${check.resourceId || ''}:${contextStr}`;
  }

  /**
   * Nettoie le cache de permissions pour un utilisateur
   */
  private clearUserPermissionCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  /**
   * Logger une vérification de permission
   */
  private async logPermissionCheck(check: PermissionCheck, result: PermissionResult, startTime: number): Promise<void> {
    try {
      await supabase
        .from('permission_audit')
        .insert({
          user_id: check.userId,
          resource: check.resource,
          action: check.action,
          resource_id: check.resourceId,
          result: result.allowed,
          effect: result.effect,
          role_id: result.roleId || '',
          role_name: result.roleName || '',
          reason: result.reason,
          ip_address: 'client', // À implémenter avec la vraie IP
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          context: check.context,
          duration: Date.now() - startTime
        });

    } catch (error) {
      console.error('❌ Erreur logging permission check:', error);
    }
  }

  /**
   * Mappe un rôle depuis la base de données
   */
  private mapRoleFromDB(data: any): Role {
    return {
      id: data.id,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      level: data.level,
      isSystem: data.is_system,
      isActive: data.is_active,
      permissions: data.permissions || [],
      restrictions: data.restrictions || [],
      parentRoleId: data.parent_role_id,
      inheritsFrom: data.inherits_from || [],
      color: data.color,
      icon: data.icon,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      userCount: data.user_count
    };
  }

  /**
   * Mappe un rôle utilisateur depuis la base de données
   */
  private mapUserRoleFromDB(data: any): UserRole {
    return {
      id: data.id,
      userId: data.user_id,
      roleId: data.role_id,
      assignedBy: data.assigned_by,
      assignedAt: data.assigned_at,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      context: data.context,
      metadata: data.metadata || {}
    };
  }

  /**
   * Mappe un template de rôle depuis la base de données
   */
  private mapRoleTemplateFromDB(data: any): RoleTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      permissions: data.permissions || [],
      restrictions: data.restrictions || [],
      isPublic: data.is_public,
      usageCount: data.usage_count,
      rating: data.rating,
      createdBy: data.created_by,
      createdAt: data.created_at,
      tags: data.tags || []
    };
  }
}

// Instance singleton
export const permissionsService = new PermissionsService();

// Export des fonctions utilitaires
export const createRole = (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>) => 
  permissionsService.createRole(role);

export const getRoles = (options?: {
  includeInactive?: boolean;
  includeSystem?: boolean;
  category?: PermissionCategory;
  limit?: number;
  offset?: number;
}) => permissionsService.getRoles(options);

export const assignRole = (
  userId: string,
  roleId: string,
  assignedBy: string,
  options?: {
    expiresAt?: string;
    context?: RoleContext;
    metadata?: Partial<RoleMetadata>;
  }
) => permissionsService.assignRole(userId, roleId, assignedBy, options);

export const revokeRole = (userId: string, roleId: string, revokedBy: string) => 
  permissionsService.revokeRole(userId, roleId, revokedBy);

export const checkPermission = (check: PermissionCheck) => 
  permissionsService.checkPermission(check);

export const getUserRoles = (userId: string, includeInactive?: boolean) => 
  permissionsService.getUserRoles(userId, includeInactive);

export const getPermissionStats = () => 
  permissionsService.getPermissionStats();
