import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Au moins 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Une majuscule' },
    { met: /[a-z]/.test(password), text: 'Une minuscule' },
    { met: /[0-9]/.test(password), text: 'Un chiffre' },
  ];

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

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Tentative d\'inscription...');
      console.log('📧 Email:', email);
      console.log('👤 Nom:', fullName);

      const { error } = await signUp(email, password, fullName);

      if (error) {
        console.error('❌ Erreur d\'inscription:', error);
        setError(error.message);
        toast.error('Erreur d\'inscription', {
          description: error.message
        });
        setLoading(false);
        return;
      }

      // Confirmation email désactivée - l'utilisateur est automatiquement connecté
      console.log('✅ Inscription réussie ! Redirection vers la bibliothèque...');
      toast.success('Compte créé !', {
        description: 'Bienvenue sur WordCraft ! Redirection en cours...'
      });
      
      // Redirection vers la bibliothèque
      setTimeout(() => {
        navigate('/library');
      }, 1000);

    } catch (err: any) {
      console.error('❌ Erreur inattendue:', err);
      setError('Une erreur inattendue s\'est produite');
      toast.error('Erreur', {
        description: 'Une erreur inattendue s\'est produite'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10 text-white" />
            <span className="text-2xl font-bold text-white">WordCraft</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Commencez votre voyage vers un apprentissage plus intelligent
          </h1>
          <p className="text-teal-100 text-lg">
            Rejoignez des milliers d'etudiants qui transforment deja leur facon d'etudier.
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">Generation de fiches alimentee par l'IA</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">Quiz adaptatifs qui apprennent avec vous</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">Sessions collaboratives en temps reel</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <p className="text-teal-200 text-sm">Plan gratuit disponible pour toujours</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Brain className="w-10 h-10 text-teal-600" />
            <span className="text-2xl font-bold text-gray-900">WordCraft</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Creez votre compte</h2>
            <p className="text-gray-500 mb-8">Commencez a apprendre plus intelligemment des aujourd'hui</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white text-gray-900"
                    style={{ caretColor: '#14b8a6' }}
                    placeholder="Jean Dupont"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white text-gray-900"
                    style={{ caretColor: '#14b8a6' }}
                    placeholder="vous@exemple.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white text-gray-900"
                    style={{ caretColor: '#14b8a6' }}
                    placeholder="Creez un mot de passe fort"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.text}
                      className={`flex items-center gap-1.5 text-xs ${
                        req.met ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <Check size={12} />
                      {req.text}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white text-gray-900"
                    style={{ caretColor: '#14b8a6' }}
                    placeholder="Confirmez votre mot de passe"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-600">
                  J'accepte les{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700">
                    Conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700">
                    Politique de confidentialite
                  </a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creation du compte...' : 'Creer un compte'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Vous avez deja un compte ?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
