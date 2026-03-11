/**
 * Composant de partage externe (liens publics)
 * 
 * Ce composant permet de créer et gérer des liens de partage publics
 * pour les documents, notes et autres contenus avec contrôle d'accès
 * 
 * Date: 11 mars 2026
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  createShareLink,
  getShareLinks,
  updateShareLink,
  deleteShareLink,
  getShareAnalytics,
  verifySharePassword,
  generateShareUrl,
  type ShareLink,
  type ShareLinkOptions,
  type ShareAnalytics,
  type SharePermissions,
  type ShareSettings
} from '../services/externalSharingService';
import type { User } from '../contexts/AuthContext';

interface ExternalSharingProps {
  user: User;
  targetId: string;
  targetType: 'document' | 'note' | 'conversation' | 'flashcard' | 'quiz' | 'collection' | 'folder';
  targetTitle: string;
  onShareCreated?: (shareLink: ShareLink) => void;
  className?: string;
  compact?: boolean;
}

const ExternalSharing: React.FC<ExternalSharingProps> = ({
  user,
  targetId,
  targetType,
  targetTitle,
  onShareCreated,
  className = '',
  compact = false
}) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [selectedShare, setSelectedShare] = useState<ShareLink | null>(null);
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // État pour le formulaire de création
  const [newShareOptions, setNewShareOptions] = useState<ShareLinkOptions>({
    title: targetTitle,
    description: '',
    password: '',
    expiresAt: '',
    maxViews: undefined,
    permissions: {
      canView: true,
      canDownload: true,
      canComment: false,
      canShare: false,
      canEdit: false,
      canPrint: false
    },
    settings: {
      allowDownload: true,
      allowComment: false,
      allowShare: false,
      showMetadata: true,
      watermark: false,
      theme: 'auto',
      language: 'fr'
    }
  });

  // Charger les liens de partage existants
  useEffect(() => {
    loadShareLinks();
  }, [user.id, targetId]);

  const loadShareLinks = async () => {
    try {
      const links = await getShareLinks(user.id, {
        targetType,
        isActive: true
      });
      setShareLinks(links);
    } catch (err) {
      console.error('Erreur chargement liens partage:', err);
    }
  };

  // Créer un nouveau lien de partage
  const handleCreateShare = async () => {
    if (!newShareOptions.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const shareLink = await createShareLink(targetId, targetType, newShareOptions, user.id);
      setShareLinks(prev => [shareLink, ...prev]);
      setShowCreateModal(false);
      resetNewShareOptions();
      
      onShareCreated?.(shareLink);
      console.log('✅ Lien de partage créé:', shareLink.title);

    } catch (err) {
      setError('Impossible de créer le lien de partage');
      console.error('Erreur création lien partage:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copier l'URL de partage
  const handleCopyUrl = useCallback((shareLink: ShareLink) => {
    const url = generateShareUrl(shareLink.token);
    
    navigator.clipboard.writeText(url).then(() => {
      console.log('✅ URL copiée dans le presse-papiers');
    }).catch(err => {
      console.error('Erreur copie URL:', err);
      setError('Impossible de copier l\'URL');
    });
  }, []);

  // Désactiver un lien de partage
  const handleDeactivateShare = async (shareId: string) => {
    try {
      await updateShareLink(shareId, { isActive: false });
      setShareLinks(prev => prev.filter(link => link.id !== shareId));
      console.log('✅ Lien de partage désactivé');
    } catch (err) {
      setError('Impossible de désactiver le lien de partage');
      console.error('Erreur désactivation lien partage:', err);
    }
  };

  // Supprimer un lien de partage
  const handleDeleteShare = async (shareId: string) => {
    try {
      await deleteShareLink(shareId);
      setShareLinks(prev => prev.filter(link => link.id !== shareId));
      console.log('✅ Lien de partage supprimé');
    } catch (err) {
      setError('Impossible de supprimer le lien de partage');
      console.error('Erreur suppression lien partage:', err);
    }
  };

  // Voir les analytics d'un partage
  const handleViewAnalytics = async (shareLink: ShareLink) => {
    try {
      const analyticsData = await getShareAnalytics(shareLink.id);
      setAnalytics(analyticsData);
      setSelectedShare(shareLink);
      setShowAnalyticsModal(true);
    } catch (err) {
      setError('Impossible de charger les analytics');
      console.error('Erreur analytics:', err);
    }
  };

  // Réinitialiser le formulaire
  const resetNewShareOptions = () => {
    setNewShareOptions({
      title: targetTitle,
      description: '',
      password: '',
      expiresAt: '',
      maxViews: undefined,
      permissions: {
        canView: true,
        canDownload: true,
        canComment: false,
        canShare: false,
        canEdit: false,
        canPrint: false
      },
      settings: {
        allowDownload: true,
        allowComment: false,
        allowShare: false,
        showMetadata: true,
        watermark: false,
        theme: 'auto',
        language: 'fr'
      }
    });
  };

  // Render compact
  if (compact) {
    return (
      <div className={`external-sharing-compact ${className}`}>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <span>🔗</span>
          <span>Partager</span>
        </button>

        {/* Modal de création compact */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Partager {targetTitle}</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={newShareOptions.title}
                      onChange={(e) => setNewShareOptions(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe (optionnel)</label>
                    <input
                      type="password"
                      value={newShareOptions.password}
                      onChange={(e) => setNewShareOptions(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Laisser vide pour un accès libre"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canDownload}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canDownload: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Autoriser le téléchargement
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetNewShareOptions();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateShare}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render complet
  return (
    <div className={`external-sharing ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>🔗</span>
            Partage Externe
          </h3>
          <p className="text-sm text-gray-600">
            Créez des liens de partage publics pour {targetTitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {shareLinks.length > 0 && (
            <button
              onClick={() => setShowManageModal(true)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Gérer ({shareLinks.length})
            </button>
          )}
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Nouveau Partage
          </button>
        </div>
      </div>

      {/* Erreur */}
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

      {/* Liste des liens de partage */}
      {shareLinks.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-4xl mb-4">🔗</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Aucun lien de partage</h4>
          <p className="text-gray-600 mb-4">Créez votre premier lien pour partager {targetTitle}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Créer un lien
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {shareLinks.map((shareLink) => (
            <div
              key={shareLink.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">{shareLink.title}</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Actif
                    </span>
                    {shareLink.password && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                        🔒 Protégé
                      </span>
                    )}
                  </div>
                  
                  {shareLink.description && (
                    <p className="text-sm text-gray-600 mb-2">{shareLink.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs text-gray-500">
                      Vues: {shareLink.currentViews}/{shareLink.maxViews || '∞'}
                    </span>
                    {shareLink.expiresAt && (
                      <span className="text-xs text-gray-500">
                        Expire: {new Date(shareLink.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Créé: {new Date(shareLink.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Permissions: {Object.entries(shareLink.permissions)
                      .filter(([_, value]) => value)
                      .map(([key]) => key.replace('can', '').toLowerCase())
                      .join(', ')}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(shareLink)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    title="Copier l'URL"
                  >
                    📋
                  </button>
                  
                  <button
                    onClick={() => handleViewAnalytics(shareLink)}
                    className="p-2 text-purple-500 hover:bg-purple-50 rounded transition-colors"
                    title="Voir les analytics"
                  >
                    📊
                  </button>
                  
                  <button
                    onClick={() => handleDeactivateShare(shareLink.id)}
                    className="p-2 text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
                    title="Désactiver"
                  >
                    ⏸️
                  </button>
                  
                  <button
                    onClick={() => handleDeleteShare(shareLink.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Créer un lien de partage</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={newShareOptions.title}
                      onChange={(e) => setNewShareOptions(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <input
                      type="password"
                      value={newShareOptions.password}
                      onChange={(e) => setNewShareOptions(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newShareOptions.description}
                    onChange={(e) => setNewShareOptions(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Description du partage"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                    <input
                      type="datetime-local"
                      value={newShareOptions.expiresAt}
                      onChange={(e) => setNewShareOptions(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre maximal de vues</label>
                    <input
                      type="number"
                      value={newShareOptions.maxViews || ''}
                      onChange={(e) => setNewShareOptions(prev => ({ 
                        ...prev, 
                        maxViews: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Illimité"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Permissions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canView}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canView: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Voir
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canDownload}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canDownload: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Télécharger
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canComment}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canComment: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Commenter
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canShare}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canShare: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Partager
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canEdit}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canEdit: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Éditer
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.permissions.canPrint}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canPrint: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Imprimer
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Paramètres d'affichage</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.settings.allowDownload}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowDownload: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Autoriser téléchargement
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.settings.allowComment}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowComment: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Autoriser commentaires
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.settings.allowShare}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowShare: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Autoriser partage
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.settings.showMetadata}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, showMetadata: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Afficher métadonnées
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newShareOptions.settings.watermark}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, watermark: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      Filigrane
                    </label>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thème</label>
                      <select
                        value={newShareOptions.settings.theme}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, theme: e.target.value as any }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="auto">Auto</option>
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                      <select
                        value={newShareOptions.settings.language}
                        onChange={(e) => setNewShareOptions(prev => ({
                          ...prev,
                          settings: { ...prev.settings, language: e.target.value as any }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewShareOptions();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateShare}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des analytics */}
      {showAnalyticsModal && analytics && selectedShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Analytics - {selectedShare.title}
                </h3>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">{analytics.totalViews}</div>
                  <div className="text-xs text-blue-600">Vues totales</div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">{analytics.uniqueViews}</div>
                  <div className="text-xs text-green-600">Vues uniques</div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-700">{analytics.totalDownloads}</div>
                  <div className="text-xs text-purple-600">Téléchargements</div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-700">{Math.round(analytics.averageDuration)}s</div>
                  <div className="text-xs text-yellow-600">Durée moyenne</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Top pays</h4>
                  <div className="space-y-2">
                    {analytics.topCountries.slice(0, 5).map((country, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{country.country}</span>
                        <span className="text-gray-600">{country.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Top referrers</h4>
                  <div className="space-y-2">
                    {analytics.topReferrers.slice(0, 5).map((referrer, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{referrer.referrer || 'Direct'}</span>
                        <span className="text-gray-600">{referrer.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalSharing;
