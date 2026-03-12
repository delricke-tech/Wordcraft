import { useState, useEffect } from 'react';
import { 
  Shield, 
  X,
  Check,
  Loader2,
  Users,
  AlertCircle,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { permissionsService, Permission, Role } from '../services/permissionsService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface PermissionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
}

export function PermissionsPanel({ isOpen, onClose, documentId }: PermissionsPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('viewer');

  useEffect(() => {
    if (isOpen && user) {
      loadPermissions();
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    try {
      const perms = await permissionsService.getDocumentPermissions(documentId || '');
      setPermissions(perms);
      
      const allRoles = await permissionsService.getAvailableRoles();
      setRoles(allRoles);
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
    }
  };

  const handleAddPermission = async () => {
    if (!documentId || !user) return;
    
    setLoading(true);
    try {
      await permissionsService.grantPermission({
        documentId,
        userId: user.id,
        roleId: selectedRole,
        grantedBy: user.id
      });
      toast.success('Permission ajoutée avec succès');
      loadPermissions();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    setLoading(true);
    try {
      await permissionsService.revokePermission(permissionId);
      toast.success('Permission révoquée');
      loadPermissions();
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'editor': return <Edit2 className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <Users className="w-4 h-4 text-green-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'editor': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'viewer': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Permissions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les accès et rôles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add Permission */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Ajouter un membre
            </h3>
            <div className="flex gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPermission}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter
              </button>
            </div>
          </div>

          {/* Permissions List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Membres ({permissions.length})
            </h3>
            {permissions.length > 0 ? (
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {perm.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {perm.userName || perm.userEmail}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getRoleColor(perm.roleId)}`}>
                          {getRoleIcon(perm.roleId)}
                          {roles.find(r => r.id === perm.roleId)?.name || perm.roleId}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePermission(perm.id)}
                      disabled={loading}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune permission définie</p>
                <p className="text-sm mt-1">Ajoutez des membres pour collaborer</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Rôles :</strong> Admin (tous les droits), Éditeur (modification), 
                Lecteur (lecture seule)
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
