/**
 * Page de correction automatique des documents orphelins
 * 
 * Attribue les documents sans dossier (folder_id NULL)
 * au dossier "Non classés"
 * 
 * Date: 29 décembre 2024
 */

import { useState } from 'react';
import { FolderPlus, Play, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { assignOrphanDocuments, countOrphanDocuments, OrphanStats } from '../services/documentOrphansManager';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function AutoFixOrphans() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [orphanCount, setOrphanCount] = useState<number | null>(null);
  const [stats, setStats] = useState<OrphanStats>({
    total: 0,
    assigned: 0,
    failed: 0,
    errors: []
  });

  const handleCheckOrphans = async () => {
    if (!user) return;
    
    toast.loading('Vérification...', { id: 'check' });
    const count = await countOrphanDocuments(user.id);
    setOrphanCount(count);
    toast.success(`${count} document(s) orphelin(s) trouvé(s)`, { id: 'check' });
  };

  const handleFix = async () => {
    if (!user) return;

    setIsRunning(true);
    setIsComplete(false);
    
    toast.loading('Correction en cours...', { id: 'fix' });

    try {
      const result = await assignOrphanDocuments(user.id);
      setStats(result);
      setIsComplete(true);
      
      if (result.failed === 0) {
        toast.success(`${result.assigned} document(s) assigné(s) !`, { id: 'fix' });
      } else {
        toast.warning(`${result.assigned} assignés, ${result.failed} erreur(s)`, { id: 'fix' });
      }
    } catch (error: any) {
      console.error('Erreur correction:', error);
      toast.error(`Erreur: ${error.message}`, { id: 'fix' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Correction Automatique des Documents Orphelins
          </h1>
          <p className="text-slate-300">
            Attribue automatiquement les documents sans dossier au dossier "Non classés"
          </p>
        </div>

        {/* Card principale */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* Explication */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-medium mb-1">Qu'est-ce qu'un document orphelin ?</p>
                <p>
                  Un document orphelin est un document dont <code className="bg-slate-800 px-1.5 py-0.5 rounded">folder_id</code> est NULL.
                  Cela peut arriver lors d'uploads directs ou si un dossier a été supprimé.
                  Cette fonction les attribue automatiquement au dossier "Non classés".
                </p>
              </div>
            </div>
          </div>

          {/* Vérification */}
          {!isRunning && !isComplete && (
            <div className="space-y-4">
              <button
                onClick={handleCheckOrphans}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all"
              >
                <FolderPlus className="w-5 h-5" />
                Vérifier les documents orphelins
              </button>

              {orphanCount !== null && (
                <div className={`p-4 rounded-xl border-2 ${
                  orphanCount === 0 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {orphanCount === 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {orphanCount === 0 
                          ? 'Aucun document orphelin !' 
                          : `${orphanCount} document(s) orphelin(s) trouvé(s)`
                        }
                      </p>
                      {orphanCount > 0 && (
                        <p className="text-sm text-slate-300 mt-1">
                          Cliquez sur "Corriger" pour les attribuer au dossier "Non classés"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {orphanCount !== null && orphanCount > 0 && (
                <button
                  onClick={handleFix}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
                >
                  <Play className="w-6 h-6" />
                  Corriger automatiquement
                </button>
              )}
            </div>
          )}

          {/* En cours */}
          {isRunning && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-white font-medium">Correction en cours...</p>
            </div>
          )}

          {/* Résultat */}
          {isComplete && (
            <div className="space-y-6">
              <div className={`p-6 rounded-xl border-2 ${
                stats.failed === 0 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {stats.failed === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {stats.failed === 0 ? 'Correction réussie !' : 'Correction terminée avec erreurs'}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {stats.assigned} document(s) assigné(s)
                      {stats.failed > 0 && `, ${stats.failed} erreur(s)`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-slate-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{stats.assigned}</div>
                    <div className="text-xs text-slate-400">Assignés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
                    <div className="text-xs text-slate-400">Échoués</div>
                  </div>
                </div>
              </div>

              {/* Erreurs */}
              {stats.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Erreurs ({stats.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {stats.errors.map((err, index) => (
                      <div key={index} className="bg-slate-900/50 rounded p-3 text-sm">
                        <p className="text-white font-medium">{err.name}</p>
                        <p className="text-red-300 text-xs">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setIsComplete(false);
                  setOrphanCount(null);
                  setStats({
                    total: 0,
                    assigned: 0,
                    failed: 0,
                    errors: []
                  });
                }}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
              >
                Nouvelle vérification
              </button>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-sm text-purple-100">
            <strong>Note :</strong> Cette fonction crée automatiquement un dossier "Non classés" 
            s'il n'existe pas déjà. Vous pouvez ensuite déplacer manuellement les documents 
            vers d'autres dossiers depuis la bibliothèque.
          </p>
        </div>
      </div>
    </div>
  );
}

