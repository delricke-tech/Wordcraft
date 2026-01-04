import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Au moins 8 caractères' },
    { met: /[A-Z]/.test(password), text: 'Une majuscule' },
    { met: /[a-z]/.test(password), text: 'Une minuscule' },
    { met: /[0-9]/.test(password), text: 'Un chiffre' },
  ];

  // Vérifier si l'utilisateur a un token de récupération
  useEffect(() => {
    const checkRecoveryToken = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error('Lien invalide ou expiré');
        navigate('/forgot-password');
      }
    };
    checkRecoveryToken();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!passwordRequirements.every((req) => req.met)) {
      setError('Veuillez respecter toutes les exigences du mot de passe');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Mot de passe modifié !', {
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      });

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Erreur réinitialisation:', err);
      setError(err.message || 'Une erreur est survenue');
      toast.error('Erreur', {
        description: err.message || 'Impossible de réinitialiser le mot de passe',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0B1623' }}>
      {/* Panneau gauche */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden p-12" style={{ background: 'linear-gradient(135deg, #152554 0%, #0B1623 100%)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10 text-white" />
            <span className="text-2xl font-bold text-white">WordCraft</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Créer un nouveau mot de passe
          </h1>
          <p className="text-[#59cfff] text-lg">
            Choisissez un mot de passe fort et unique pour sécuriser votre compte.
          </p>
        </div>
        <div className="relative">
          <p className="text-[#b9e2e8] text-sm">
            Votre nouveau mot de passe doit respecter toutes les exigences de sécurité
          </p>
        </div>
      </div>

      {/* Panneau droite */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Brain className="w-10 h-10 text-[#1559d8]" />
            <span className="text-2xl font-bold text-white">WordCraft</span>
          </div>

          <div className="rounded-2xl shadow-xl p-8" style={{ background: '#172133', border: '1px solid #223155' }}>
            {success ? (
              // Message de succès
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Mot de passe modifié !</h2>
                  <p className="text-[#a3b8d8]">
                    Votre mot de passe a été réinitialisé avec succès.
                  </p>
                </div>
                <div className="bg-[#0f1820] border border-[#223155] rounded-lg p-4">
                  <p className="text-sm text-[#b9d6f8]">
                    Redirection vers la page de connexion...
                  </p>
                </div>
              </div>
            ) : (
              // Formulaire
              <>
                <h2 className="text-2xl font-bold mb-2 text-white">Nouveau mot de passe</h2>
                <p className="text-[#a3b8d8] mb-8">
                  Créez un mot de passe fort pour protéger votre compte.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-100/10 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#b9d6f8]">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e6383]" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-2.5 border border-[#223155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1559d8] focus:border-transparent transition-all text-white bg-[#0f1820] placeholder-[#7fa8df]"
                        style={{ caretColor: '#59cfff' }}
                        placeholder="Créez un mot de passe fort"
                        required
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7fa8df] hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req) => (
                        <div
                          key={req.text}
                          className={`flex items-center gap-1.5 text-xs ${
                            req.met ? 'text-green-400' : 'text-[#7fa8df]'
                          }`}
                        >
                          <Check size={12} />
                          {req.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5 text-[#b9d6f8]">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e6383]" />
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-[#223155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1559d8] focus:border-transparent transition-all text-white bg-[#0f1820] placeholder-[#7fa8df]"
                        style={{ caretColor: '#59cfff' }}
                        placeholder="Confirmez votre mot de passe"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? 'linear-gradient(90deg, #223155 0%, #1559d8 100%)'
                        : 'linear-gradient(90deg,#1559d8 0%,#217cf3 100%)',
                      color: '#fff',
                      boxShadow: loading ? '0 0 0 0 #0000' : '0 2px 8px 0 #1559d840',
                    }}
                  >
                    {loading ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
