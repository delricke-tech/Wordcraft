import { Link } from 'react-router-dom';
import { Brain, FileText, BookOpen, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-teal-600" />
            <span className="text-2xl font-bold text-gray-900">WordCraft</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/library"
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Accéder à mes cours
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  S'inscrire gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-8">
            <Sparkles size={16} />
            Votre bibliothèque de cours collaborative
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Organisez vos cours <br />
            <span className="text-teal-600">intelligemment</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Une plateforme tout-en-un pour gérer vos documents, créer des fiches d'étude,
            générer des quiz et collaborer avec vos camarades.
          </p>

          {user ? (
            <Link
              to="/library"
              className="inline-flex items-center gap-3 px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              <FileText size={24} />
              Accéder à ma bibliothèque
              <ArrowRight size={20} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              Commencer gratuitement
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Bibliothèque organisée
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Importez vos PDF, documents Word et créez des dossiers pour organiser
                tous vos cours en un seul endroit.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-teal-600" />
                  Upload illimité de fichiers
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-teal-600" />
                  Organisation par dossiers
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-teal-600" />
                  Lecteur PDF intégré
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Fiches d'étude
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Créez des fiches de révision interactives à partir de vos documents
                pour mémoriser efficacement.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-blue-600" />
                  Création rapide de fiches
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-blue-600" />
                  Révision espacée
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-blue-600" />
                  Mode étude interactif
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Assistant IA
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Utilisez l'intelligence artificielle pour générer automatiquement
                des quiz et des résumés de cours.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-purple-600" />
                  Quiz adaptatifs
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-purple-600" />
                  Résumés automatiques
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-purple-600" />
                  Questions personnalisées
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à transformer votre façon d'étudier ?
          </h2>
          <p className="text-teal-100 text-lg mb-8">
            {user 
              ? "Accédez à votre bibliothèque et commencez à organiser vos cours dès maintenant."
              : "Rejoignez des milliers d'étudiants qui utilisent déjà WordCraft."
            }
          </p>
          {user ? (
            <Link
              to="/library"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-teal-700 rounded-xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg"
            >
              <FileText size={24} />
              Accéder à mes cours
              <ArrowRight size={20} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-teal-700 rounded-xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg"
            >
              Créer un compte gratuit
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-teal-600" />
            <span className="font-bold text-gray-900">WordCraft</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} WordCraft. Votre bibliothèque de cours collaborative.
          </p>
        </div>
      </footer>
    </div>
  );
}

