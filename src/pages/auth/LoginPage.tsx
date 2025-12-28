import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Palette "bleu nuit" : Fond: #0B1623, Accent: rgb(21,89,216), Inputs: #172133, Bordure: #223155, Texte: #fff

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    // Bleu nuit sur tout le body à la connexion (pas sur la page seulement!)
    document.body.style.background = '#0B1623';
    document.body.style.color = '#fff';

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/library');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0B1623' }}>
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
            Transformez votre apprentissage avec des outils d&#39;étude alimentés par l&#39;IA
          </h1>
          <p className="text-[#59cfff] text-lg">
            Convertissez vos documents en fiches intelligentes, quiz adaptatifs et sessions d&#39;étude collaboratives.
          </p>
          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-[#d2e9ff] text-sm">Étudiants actifs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">1M+</p>
              <p className="text-[#d2e9ff] text-sm">Fiches créées</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-[#d2e9ff] text-sm">Taux de réussite</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <p className="text-[#b9e2e8] text-sm">
            Approuvé par les étudiants en médecine des meilleures universités du monde
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Brain className="w-10 h-10 text-[#1559d8]" />
            <span className="text-2xl font-bold text-white">WordCraft</span>
          </div>

          <div className="rounded-2xl shadow-xl p-8" style={{ background: '#172133', border: '1px solid #223155' }}>
            <h2 className="text-2xl font-bold mb-2 text-white">Bon retour</h2>
            <p className="text-[#a3b8d8] mb-8">Connectez-vous pour continuer votre apprentissage</p>

            {error && (
              <div className="mb-6 p-4 bg-red-100/10 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[#b9d6f8]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e6383]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#223155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1559d8] focus:border-transparent transition-all text-white bg-[#1a2335] placeholder-[#7fa8df]"
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#b9d6f8]">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e6383]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-[#223155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1559d8] focus:border-transparent transition-all text-white bg-[#1a2335] placeholder-[#7fa8df]"
                    placeholder="Entrez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7fa8df] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#223155] text-[#1559d8] focus:ring-[#1559d8]"
                  />
                  <span className="text-sm text-[#b9d6f8]">Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-[#59cfff] hover:text-[#1559d8]">
                  Mot de passe oublié&nbsp;?
                </Link>
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
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#a3b8d8]">
              Vous n&apos;avez pas de compte ?{' '}
              <Link to="/register" className="text-[#59cfff] hover:text-[#1559d8] font-medium">
                Inscrivez-vous gratuitement
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
