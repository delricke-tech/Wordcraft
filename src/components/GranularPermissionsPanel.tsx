/**
 * Panneau de permissions granulaires détaillées
 * 
 * Ce composant permet de gérer des permissions fines et détaillées
 * pour les utilisateurs, groupes et ressources avec héritage et rôles
 * 
 * Date: 12 mars 2026
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  User, 
  Settings, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  Share2, 
  Download, 
  Upload,
  Copy,
  MessageSquare,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Save,
  RotateCcw,
  Key,
  Crown,
  UserCheck,
  UserX,
  FolderOpen,
  FileText,
  Video,
  MessageSquareText,
  Brain,
  Star,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPermissions,
  updatePermission,
  createPermission,
  deletePermission,
  getPermissionTemplates,
  applyPermissionTemplate,
  checkPermission,
  getPermissionHierarchy,
  getEffectivePermissions,
  type Permission,
  type PermissionTemplate,
  type PermissionLevel,
  type ResourceType,
  type PermissionAction,
  type PermissionCheck,
  type GranularPermission,
  type PermissionRule
} from '../services/permissionsService';

interface GranularPermissionsPanelProps {
  resourceId?: string;
  resourceType?: ResourceType;
  userId?: string;
  groupId?: string;
  onPermissionChange?: (permission: GranularPermission) => void;
  className?: string;
  compact?: boolean;
  showInheritance?: boolean;
  showTemplates?: boolean;
}

interface PermissionState {
  resourceId: string;
  resourceType: ResourceType;
  permissions: Map<string, GranularPermission>;
  templates: PermissionTemplate[];
  inheritance: PermissionRule[];
  effectivePermissions: Map<string, PermissionLevel>;
  loading: boolean;
  searchQuery: string;
  selectedTemplate: string;
  showAdvanced: boolean;
}

const PERMISSION_ACTIONS: Record<PermissionAction, {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}> = {
  view: {
    icon: Eye,
    label: 'Voir',
    description: 'Peut voir la ressource',
    color: 'blue'
  },
  edit: {
    icon: Edit3,
    label: 'Modifier',
    description: 'Peut modifier la ressource',
    color: 'green'
  },
  delete: {
    icon: Trash2,
    label: 'Supprimer',
    description: 'Peut supprimer la ressource',
    color: 'red'
  },
  share: {
    icon: Share2,
    label: 'Partager',
    description: 'Peut partager la ressource',
    color: 'purple'
  },
  download: {
    icon: Download,
    label: 'Télécharger',
    description: 'Peut télécharger la ressource',
    color: 'indigo'
  },
  upload: {
    icon: Upload,
    label: 'Uploader',
    description: 'Peut uploader des fichiers',
    color: 'orange'
  },
  copy: {
    icon: Copy,
    label: 'Copier',
    description: 'Peut copier la ressource',
    color: 'cyan'
  },
  comment: {
    icon: MessageSquare,
    label: 'Commenter',
    description: 'Peut commenter la ressource',
    color: 'pink'
  },
  manage: {
    icon: Settings,
    label: 'Gérer',
    description: 'Peut gérer les permissions',
    color: 'yellow'
  }
};

const RESOURCE_TYPES: Record<ResourceType, {
  icon: React.ElementType;
  label: string;
  color: string;
}> = {
  document: {
    icon: FileText,
    label: 'Document',
    color: 'blue'
  },
  folder: {
    icon: FolderOpen,
    label: 'Dossier',
    color: 'yellow'
  },
  workspace: {
    icon: Users,
    label: 'Espace de travail',
    color: 'purple'
  },
  group: {
    icon: Users,
    label: 'Groupe',
    color: 'green'
  },
  conversation: {
    icon: MessageSquareText,
    label: 'Conversation',
    color: 'orange'
  },
  flashcard: {
    icon: Brain,
    label: 'Fiche',
    color: 'pink'
  },
  quiz: {
    icon: Star,
    label: 'Quiz',
    color: 'indigo'
  },
  session: {
    icon: Video,
    label: 'Session',
    color: 'red'
  }
};

const PERMISSION_LEVELS: Record<PermissionLevel, {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  value: number;
}> = {
  none: {
    icon: XCircle,
    label: 'Aucun',
    description: 'Aucune permission',
    color: 'gray',
    value: 0
  },
  read: {
    icon: Eye,
    label: 'Lecture',
    description: 'Lecture seule',
    color: 'blue',
    value: 1
  },
  write: {
    icon: Edit3,
    label: 'Écriture',
    description: 'Lecture et écriture',
    color: 'green',
    value: 2
  },
  admin: {
    icon: Crown,
    label: 'Admin',
    description: 'Contrôle total',
    color: 'purple',
    value: 3
  },
  owner: {
    icon: Key,
    label: 'Propriétaire',
    description: 'Propriétaire de la ressource',
    color: 'yellow',
    value: 4
  }
};

const GranularPermissionsPanel: React.FC<GranularPermissionsPanelProps> = ({
  resourceId,
  resourceType = 'document',
  userId,
  groupId,
  onPermissionChange,
  className = '',
  compact = false,
  showInheritance = true,
  showTemplates = true
}) => {
  const { user } = useAuth();
  const [state, setState] = useState<PermissionState>({
    resourceId: resourceId || '',
    resourceType,
    permissions: new Map(),
    templates: [],
    inheritance: [],
    effectivePermissions: new Map(),
    loading: false,
    searchQuery: '',
    selectedTemplate: '',
    showAdvanced: false
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  // Charger les permissions
  useEffect(() => {
    if (resourceId) {
      loadPermissions();
    }
  }, [resourceId, resourceType]);

  const loadPermissions = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Charger les permissions directes
      const permissions = await getPermissions({
        resourceId,
        resourceType,
        userId,
        groupId
      });

      // Charger les templates
      const templates = showTemplates ? await getPermissionTemplates() : [];

      // Charger l'héritage
      const inheritance = showInheritance ? await getPermissionHierarchy(resourceId, resourceType) : [];

      // Calculer les permissions effectives
      const effectivePermissions = await getEffectivePermissions(resourceId, resourceType);

      setState(prev => ({
        ...prev,
        permissions: new Map(permissions.map(p => [p.id, p])),
        templates,
        inheritance,
        effectivePermissions: new Map(
          Object.entries(effectivePermissions).map(([key, value]) => [key, value])
        ),
        loading: false
      }));

    } catch (error) {
      console.error('❌ Erreur chargement permissions:', error);
      toast.error('Erreur lors du chargement des permissions');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Mettre à jour une permission
  const updatePermissionLevel = async (permissionId: string, level: PermissionLevel) => {
    try {
      await updatePermission(permissionId, { level });
      
      setState(prev => {
        const newPermissions = new Map(prev.permissions);
        const permission = newPermissions.get(permissionId);
        if (permission) {
          newPermissions.set(permissionId, { ...permission, level });
        }
        return { ...prev, permissions: newPermissions };
      });

      toast.success('Permission mise à jour');
      onPermissionChange?.(state.permissions.get(permissionId)!);

    } catch (error) {
      console.error('❌ Erreur mise à jour permission:', error);
      toast.error('Erreur lors de la mise à jour de la permission');
    }
  };

  // Ajouter une permission
  const addPermission = async (targetUserId: string, targetGroupId?: string) => {
    try {
      const permission = await createPermission({
        resourceId,
        resourceType,
        userId: targetUserId,
        groupId: targetGroupId,
        level: 'read',
        actions: ['view']
      });

      setState(prev => {
        const newPermissions = new Map(prev.permissions);
        newPermissions.set(permission.id, permission);
        return { ...prev, permissions: newPermissions };
      });

      toast.success('Permission ajoutée');

    } catch (error) {
      console.error('❌ Erreur ajout permission:', error);
      toast.error('Erreur lors de l\'ajout de la permission');
    }
  };

  // Supprimer une permission
  const removePermission = async (permissionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) return;

    try {
      await deletePermission(permissionId);

      setState(prev => {
        const newPermissions = new Map(prev.permissions);
        newPermissions.delete(permissionId);
        return { ...prev, permissions: newPermissions };
      });

      toast.success('Permission supprimée');

    } catch (error) {
      console.error('❌ Erreur suppression permission:', error);
      toast.error('Erreur lors de la suppression de la permission');
    }
  };

  // Appliquer un template
  const applyTemplate = async (templateId: string) => {
    try {
      await applyPermissionTemplate(templateId, resourceId, resourceType);
      await loadPermissions(); // Recharger les permissions
      toast.success('Template appliqué avec succès');

    } catch (error) {
      console.error('❌ Erreur application template:', error);
      toast.error('Erreur lors de l\'application du template');
    }
  };

  // Vérifier une permission
  const checkUserPermission = useCallback(async (action: PermissionAction): Promise<boolean> => {
    if (!user) return false;

    try {
      const hasPermission = await checkPermission({
        userId: user.id,
        resourceId,
        resourceType,
        action
      });
      return hasPermission;
    } catch (error) {
      console.error('❌ Erreur vérification permission:', error);
      return false;
    }
  }, [user, resourceId, resourceType]);

  // Basculer une section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Filtrer les permissions
  const filteredPermissions = useMemo(() => {
    const permissions = Array.from(state.permissions.values());
    
    if (!state.searchQuery) return permissions;

    const query = state.searchQuery.toLowerCase();
    return permissions.filter(p => 
      p.userName?.toLowerCase().includes(query) ||
      p.groupName?.toLowerCase().includes(query) ||
      p.level.toLowerCase().includes(query)
    );
  }, [state.permissions, state.searchQuery]);

  // Rendu d'une permission
  const renderPermission = (permission: GranularPermission) => {
    const levelInfo = PERMISSION_LEVELS[permission.level];
    const isOwner = permission.level === 'owner';
    const canEdit = checkUserPermission('manage');

    return (
      <motion.div
        key={permission.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="border border-gray-200 rounded-lg p-4 bg-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {permission.userId ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {permission.userName || permission.groupName}
              </div>
              <div className="text-sm text-gray-500">
                {permission.userId ? 'Utilisateur' : 'Groupe'}
                {permission.email && ` • ${permission.email}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions rapides */}
            <div className="flex items-center gap-1">
              {Object.entries(PERMISSION_ACTIONS).slice(0, 4).map(([action, info]) => (
                <button
                  key={action}
                  className={`p-1.5 rounded ${
                    permission.actions?.includes(action as PermissionAction)
                      ? `bg-${info.color}-100 text-${info.color}-600`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  title={info.description}
                >
                  <info.icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Niveau de permission */}
            <div className="flex items-center gap-2">
              <levelInfo.icon className={`w-4 h-4 text-${levelInfo.color}-600`} />
              <select
                value={permission.level}
                onChange={(e) => updatePermissionLevel(permission.id, e.target.value as PermissionLevel)}
                disabled={isOwner || !canEdit}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {Object.entries(PERMISSION_LEVELS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            {!isOwner && canEdit && (
              <button
                onClick={() => removePermission(permission.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Actions détaillées */}
        {state.showAdvanced && (
          <div className="border-t border-gray-200 pt-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Actions détaillées:</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PERMISSION_ACTIONS).map(([action, info]) => (
                <label
                  key={action}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={permission.actions?.includes(action as PermissionAction)}
                    onChange={(e) => {
                      // TODO: Implémenter la mise à jour des actions
                    }}
                    className="rounded"
                  />
                  <info.icon className="w-3 h-3" />
                  {info.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`granular-permissions-panel ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Permissions granulaires
            </h3>
            <p className="text-sm text-gray-600">
              {RESOURCE_TYPES[resourceType].label} • {state.permissions.size} permission(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setState(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
            className={`p-2 rounded ${
              state.showAdvanced ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
            title="Mode avancé"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={loadPermissions}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            title="Actualiser"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Templates */}
      {showTemplates && state.templates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">Templates de permissions</h4>
            <button
              onClick={() => toggleSection('templates')}
              className="p-1"
            >
              {expandedSections.has('templates') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {expandedSections.has('templates') && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {state.templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Héritage */}
      {showInheritance && state.inheritance.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">Héritage de permissions</h4>
            <button
              onClick={() => toggleSection('inheritance')}
              className="p-1"
            >
              {expandedSections.has('inheritance') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {expandedSections.has('inheritance') && (
            <div className="space-y-2">
              {state.inheritance.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4" />
                  <span>{rule.source} → {rule.target}</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {rule.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recherche et filtres */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des permissions..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
          <Filter className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => {/* TODO: Ajouter une permission */}}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Liste des permissions */}
      <div className="space-y-3">
        {state.loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Chargement des permissions...</p>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">Aucune permission</h4>
            <p className="text-gray-600">
              {state.searchQuery ? 'Aucune permission trouvée' : 'Ajoutez des permissions pour gérer l\'accès'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredPermissions.map(permission => renderPermission(permission))}
          </AnimatePresence>
        )}
      </div>

      {/* Statistiques */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {state.permissions.size}
              </div>
              <div className="text-gray-600">Permissions totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.from(state.permissions.values()).filter(p => p.level === 'admin').length}
              </div>
              <div className="text-gray-600">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {state.inheritance.length}
              </div>
              <div className="text-gray-600">Règles d'héritage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {state.templates.length}
              </div>
              <div className="text-gray-600">Templates</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GranularPermissionsPanel;
