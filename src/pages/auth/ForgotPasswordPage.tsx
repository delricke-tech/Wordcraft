import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Email envoyé !', {
        description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.',
      });
    } catch (err: any) {
      console.error('Erreur réinitialisation:', err);
      setError(err.message || 'Une erreur est survenue');
      toast.error('Erreur', {
        description: err.message || 'Impossible d\'envoyer l\'email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0B1623' }}>
      {/* Panneau gauche (identique à LoginPage) */}
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
            Récupération de mot de passe
          </h1>
          <p className="text-[#59cfff] text-lg">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>
        <div className="relative">
          <p className="text-[#b9e2e8] text-sm">
            Votre sécurité est notre priorité
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
            {/* Bouton retour */}
            <Link
              to="/login"
              className="flex items-center gap-2 text-[#59cfff] hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Retour à la connexion</span>
            </Link>

            {success ? (
              // Message de succès
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Email envoyé !</h2>
                  <p className="text-[#a3b8d8]">
                    Nous avons envoyé un lien de réinitialisation à <strong className="text-white">{email}</strong>
                  </p>
                </div>
                <div className="bg-[#0f1820] border border-[#223155] rounded-lg p-4">
                  <p className="text-sm text-[#b9d6f8]">
                    <strong>Vérifiez votre boîte mail</strong> et cliquez sur le lien pour réinitialiser votre mot de passe.
                  </p>
                  <p className="text-xs text-[#7fa8df] mt-2">
                    Le lien expire dans 1 heure.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="block w-full py-3 rounded-lg font-medium text-center transition-colors"
                  style={{
                    background: 'linear-gradient(90deg,#1559d8 0%,#217cf3 100%)',
                    color: '#fff',
                  }}
                >
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              // Formulaire
              <>
                <h2 className="text-2xl font-bold mb-2 text-white">Mot de passe oublié ?</h2>
                <p className="text-[#a3b8d8] mb-8">
                  Pas de souci ! Entrez votre email et nous vous enverrons un lien de réinitialisation.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-100/10 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[#b9d6f8]">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e6383]" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-[#223155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1559d8] focus:border-transparent transition-all text-white bg-[#0f1820] placeholder-[#7fa8df]"
                        style={{ caretColor: '#59cfff' }}
                        placeholder="vous@exemple.com"
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#7fa8df]">
                      Entrez l'email associé à votre compte WordCraft
                    </p>
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
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-[#a3b8d8]">
                    Vous n'avez pas reçu l'email ?{' '}
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-[#59cfff] hover:text-white font-medium"
                    >
                      Renvoyer
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
