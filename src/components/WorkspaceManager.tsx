/**
 * Composant de gestion des workspaces (multi-projets organisés)
 * 
 * Ce composant permet de créer, gérer et organiser les espaces de travail
 * pour les projets et collaborations multi-utilisateurs
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  getWorkspaceMembers,
  removeMember,
  createProject,
  getWorkspaceProjects,
  hasPermission,
  getUserPermissions,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceProject,
  type WorkspaceSettings
} from '../services/workspaceService';
import type { User } from '../contexts/AuthContext';

interface WorkspaceManagerProps {
  user: User;
  onWorkspaceSelect?: (workspace: Workspace) => void;
  className?: string;
}

interface CreateWorkspaceModal {
  isOpen: boolean;
  name: string;
  description: string;
  isPublic: boolean;
  settings: Partial<WorkspaceSettings>;
}

interface InviteMemberModal {
  isOpen: boolean;
  workspaceId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  user,
  onWorkspaceSelect,
  className = ''
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workspaces' | 'members' | 'projects'>('workspaces');

  // Modals
  const [createModal, setCreateModal] = useState<CreateWorkspaceModal>({
    isOpen: false,
    name: '',
    description: '',
    isPublic: false,
    settings: {}
  });

  const [inviteModal, setInviteModal] = useState<InviteMemberModal>({
    isOpen: false,
    workspaceId: '',
    email: '',
    role: 'member'
  });

  // Charger les workspaces au montage
  useEffect(() => {
    loadWorkspaces();
  }, [user.id]);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userWorkspaces = await getUserWorkspaces(user.id);
      setWorkspaces(userWorkspaces);
      
      if (userWorkspaces.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(userWorkspaces[0]);
        onWorkspaceSelect?.(userWorkspaces[0]);
      }
    } catch (err) {
      setError('Impossible de charger les workspaces');
      console.error('Erreur chargement workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau workspace
  const handleCreateWorkspace = async () => {
    if (!createModal.name.trim()) {
      setError('Le nom du workspace est requis');
      return;
    }

    try {
      const newWorkspace = await createWorkspace(
        createModal.name,
        createModal.description,
        user.id,
        createModal.settings
      );

      setWorkspaces(prev => [newWorkspace, ...prev]);
      setCreateModal({ isOpen: false, name: '', description: '', isPublic: false, settings: {} });
      
      // Sélectionner le nouveau workspace
      setSelectedWorkspace(newWorkspace);
      onWorkspaceSelect?.(newWorkspace);
      
      console.log('✅ Workspace créé:', newWorkspace.name);
    } catch (err) {
      setError('Impossible de créer le workspace');
      console.error('Erreur création workspace:', err);
    }
  };

  // Supprimer un workspace
  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce workspace ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      
      if (selectedWorkspace?.id === workspaceId) {
        const remaining = workspaces.filter(w => w.id !== workspaceId);
        setSelectedWorkspace(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length > 0) {
          onWorkspaceSelect?.(remaining[0]);
        }
      }
      
      console.log('✅ Workspace supprimé');
    } catch (err) {
      setError('Impossible de supprimer le workspace');
      console.error('Erreur suppression workspace:', err);
    }
  };

  // Inviter un membre
  const handleInviteMember = async () => {
    if (!inviteModal.email.trim()) {
      setError('L\'email est requis');
      return;
    }

    try {
      // Note: Dans une vraie implémentation, il faudrait chercher l'utilisateur par email
      // Pour l'instant, nous simulons avec un ID utilisateur
      const userId = 'temp-user-id'; // À remplacer par une vraie recherche
      
      await addMember(inviteModal.workspaceId, userId, inviteModal.role);
      setInviteModal({ isOpen: false, workspaceId: '', email: '', role: 'member' });
      
      // Recharger les membres si le workspace est sélectionné
      if (selectedWorkspace?.id === inviteModal.workspaceId) {
        // Recharger les détails du workspace
        const updatedWorkspace = await getWorkspace(inviteModal.workspaceId);
        if (updatedWorkspace) {
          setSelectedWorkspace(updatedWorkspace);
        }
      }
      
      console.log('✅ Membre invité');
    } catch (err) {
      setError('Impossible d\'inviter le membre');
      console.error('Erreur invitation membre:', err);
    }
  };

  // Vérifier les permissions
  const checkPermission = useCallback(async (permission: string) => {
    if (!selectedWorkspace) return false;
    return await hasPermission(selectedWorkspace.id, user.id, permission as any);
  }, [selectedWorkspace, user.id]);

  // Render du contenu principal
  const renderContent = () => {
    switch (activeTab) {
      case 'workspaces':
        return renderWorkspacesTab();
      case 'members':
        return renderMembersTab();
      case 'projects':
        return renderProjectsTab();
      default:
        return renderWorkspacesTab();
    }
  };

  const renderWorkspacesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Mes Workspaces</h3>
        <button
          onClick={() => setCreateModal({ ...createModal, isOpen: true })}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Nouveau Workspace
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📁</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun workspace</h4>
          <p className="text-gray-600 mb-4">Créez votre premier workspace pour organiser vos projets</p>
          <button
            onClick={() => setCreateModal({ ...createModal, isOpen: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Créer un workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                selectedWorkspace?.id === workspace.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedWorkspace(workspace);
                onWorkspaceSelect?.(workspace);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{workspace.name}</h4>
                  {workspace.description && (
                    <p className="text-sm text-gray-600 mt-1">{workspace.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  workspace.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {workspace.is_public ? 'Public' : 'Privé'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span>👥</span>
                    {workspace.member_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📄</span>
                    {workspace.document_count || 0}
                  </span>
                </div>
                <span className="text-xs">
                  {new Date(workspace.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkspace(workspace);
                    onWorkspaceSelect?.(workspace);
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Ouvrir
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWorkspace(workspace.id);
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMembersTab = () => {
    if (!selectedWorkspace) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Sélectionnez un workspace</h4>
          <p className="text-gray-600">Choisissez un workspace pour voir ses membres</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Membres de {selectedWorkspace.name}
            </h3>
            <p className="text-sm text-gray-600">
              Gérez les membres et leurs permissions
            </p>
          </div>
          <button
            onClick={() => setInviteModal({ ...inviteModal, isOpen: true, workspaceId: selectedWorkspace.id })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Inviter un membre
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4">
            <h4 className="font-medium text-gray-800 mb-3">Liste des membres</h4>
            {/* Note: Dans une vraie implémentation, charger les membres réels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.email}</p>
                    <p className="text-sm text-gray-600">Owner</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Owner</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectsTab = () => {
    if (!selectedWorkspace) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Sélectionnez un workspace</h4>
          <p className="text-gray-600">Choisissez un workspace pour voir ses projets</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Projets de {selectedWorkspace.name}
            </h3>
            <p className="text-sm text-gray-600">
              Organisez vos projets par thématiques
            </p>
          </div>
          <button
            onClick={() => {
              // Note: Implémenter la création de projet
              console.log('Créer un projet');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Nouveau projet
          </button>
        </div>

        <div className="text-center py-8">
          <div className="text-4xl mb-4">📂</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun projet</h4>
          <p className="text-gray-600">Créez votre premier projet dans ce workspace</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`workspace-manager ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🏢</span>
          Workspaces
        </h2>
        <p className="text-gray-600">Organisez vos projets et collaborations</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['workspaces', 'members', 'projects'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'workspaces' && 'Workspaces'}
              {tab === 'members' && 'Membres'}
              {tab === 'projects' && 'Projets'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Modal de création */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800">Créer un workspace</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={createModal.name}
                  onChange={(e) => setCreateModal({ ...createModal, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nom du workspace"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createModal.description}
                  onChange={(e) => setCreateModal({ ...createModal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Description du workspace"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={createModal.isPublic}
                  onChange={(e) => setCreateModal({ ...createModal, isPublic: e.target.checked })}
                  className="rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Workspace public</label>
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setCreateModal({ ...createModal, isOpen: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'invitation */}
      {inviteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800">Inviter un membre</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteModal.email}
                  onChange={(e) => setInviteModal({ ...inviteModal, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={inviteModal.role}
                  onChange={(e) => setInviteModal({ ...inviteModal, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Membre</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setInviteModal({ ...inviteModal, isOpen: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleInviteMember}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Inviter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManager;
