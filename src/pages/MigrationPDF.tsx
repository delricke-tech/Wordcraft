/**
 * Page de migration pour extraire le texte de tous les PDFs
 * et remplir la colonne extracted_text
 * 
 * Date: 29 décembre 2024
 */

import { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, AlertCircle, FileText } from 'lucide-react';
import { migratePDFContent, MigrationProgress } from '../services/migratePDFContent';
import { toast } from 'sonner';

export function MigrationPDF() {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  });

  const handleStartMigration = async () => {
    setIsRunning(true);
    setIsComplete(false);
    
    toast.loading('Migration en cours...', { id: 'migration' });

    try {
      const result = await migratePDFContent((prog) => {
        setProgress(prog);
      });

      setProgress(result);
      setIsComplete(true);
      
      if (result.failed === 0) {
        toast.success(`Migration réussie ! ${result.succeeded} document(s) traité(s)`, { id: 'migration' });
      } else {
        toast.warning(`Migration terminée avec ${result.failed} erreur(s)`, { id: 'migration' });
      }
    } catch (error: any) {
      console.error('Erreur migration:', error);
      toast.error(`Erreur: ${error.message}`, { id: 'migration' });
    } finally {
      setIsRunning(false);
    }
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Migration PDF → extracted_text
          </h1>
          <p className="text-slate-300">
            Cette page extrait le texte de tous vos PDFs et remplit la colonne <code className="bg-slate-800 px-2 py-1 rounded">extracted_text</code> pour l'IA.
          </p>
        </div>

        {/* Card principale */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* Explication */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-medium mb-1">Comment ça marche ?</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Récupère tous les documents PDF avec <code>extracted_text</code> vide</li>
                  <li>Pour chaque document, utilise <code>storage_path</code> (sans accents) pour lire le fichier</li>
                  <li>Extrait le texte avec pdfjs-dist</li>
                  <li>Met à jour la colonne <code>extracted_text</code> en base de données</li>
                  <li>L'IA pourra ensuite utiliser ces données pour répondre</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Bouton de lancement */}
          {!isRunning && !isComplete && (
            <button
              onClick={handleStartMigration}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
            >
              <Play className="w-6 h-6" />
              Lancer la migration
            </button>
          )}

          {/* Progression */}
          {isRunning && (
            <div className="space-y-6">
              {/* Barre de progression */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    Progression
                  </span>
                  <span className="text-sm font-bold text-white">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{progress.total}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <Loader2 className="w-6 h-6 text-blue-400 mx-auto mb-2 animate-spin" />
                  <div className="text-2xl font-bold text-white">{progress.processed}</div>
                  <div className="text-xs text-slate-400">Traités</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{progress.succeeded}</div>
                  <div className="text-xs text-slate-400">Réussis</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{progress.failed}</div>
                  <div className="text-xs text-slate-400">Échoués</div>
                </div>
              </div>

              {/* Document en cours */}
              {progress.current && (
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-400 mb-1">En cours...</p>
                      <p className="text-white font-medium truncate">{progress.current}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Résultat final */}
          {isComplete && (
            <div className="space-y-6">
              {/* Résumé */}
              <div className={`p-6 rounded-xl border-2 ${
                progress.failed === 0 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {progress.failed === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {progress.failed === 0 ? 'Migration réussie !' : 'Migration terminée avec erreurs'}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {progress.succeeded} document(s) traité(s) avec succès
                      {progress.failed > 0 && `, ${progress.failed} erreur(s)`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{progress.total}</div>
                    <div className="text-xs text-slate-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{progress.succeeded}</div>
                    <div className="text-xs text-slate-400">Réussis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">{progress.failed}</div>
                    <div className="text-xs text-slate-400">Échoués</div>
                  </div>
                </div>
              </div>

              {/* Erreurs */}
              {progress.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Erreurs rencontrées ({progress.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {progress.errors.map((err, index) => (
                      <div key={index} className="bg-slate-900/50 rounded p-3 text-sm">
                        <p className="text-white font-medium mb-1">{err.name}</p>
                        <p className="text-red-300 text-xs">{err.error}</p>
                        <p className="text-slate-500 text-xs mt-1">ID: {err.documentId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton recommencer */}
              <button
                onClick={() => {
                  setIsComplete(false);
                  setProgress({
                    total: 0,
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    errors: []
                  });
                }}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
              >
                Relancer une migration
              </button>
            </div>
          )}
        </div>

        {/* Note importante */}
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-sm text-purple-100">
            <strong>Note :</strong> Cette migration utilise <code className="bg-slate-800 px-1.5 py-0.5 rounded">storage_path</code> (sans accents) 
            pour lire les fichiers depuis Supabase Storage, conformément à la règle du projet [cite: 2025-12-27]. 
            Les noms avec accents sont préservés dans la colonne <code className="bg-slate-800 px-1.5 py-0.5 rounded">name</code> pour l'affichage.
          </p>
        </div>
      </div>
    </div>
  );
}

