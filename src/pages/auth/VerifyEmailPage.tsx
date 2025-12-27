import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, AlertCircle, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus le premier input au chargement
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(''); // Effacer l'erreur lors de la saisie

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Gérer le backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Gérer Enter
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
    
    // Focus le dernier champ rempli
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Veuillez entrer le code complet à 6 chiffres');
      return;
    }

    console.log('🔐 Tentative de vérification OTP...');
    console.log('📧 Email:', email);
    console.log('🔢 Code:', verificationCode);

    setLoading(true);
    setError('');

    try {
      // Vérifier le code OTP avec Supabase
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email',
      });

      console.log('📡 Réponse Supabase:', { data, error: otpError });

      if (otpError) {
        console.error('❌ Erreur de vérification:', otpError);
        setError(otpError.message === 'Token has expired or is invalid' 
          ? 'Code invalide ou expiré. Veuillez réessayer.'
          : otpError.message
        );
        toast.error('Code invalide', {
          description: 'Le code de vérification est incorrect ou a expiré.'
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Vérification réussie! Utilisateur:', data.user.id);
        toast.success('Email vérifié !', {
          description: 'Votre compte a été créé avec succès.'
        });
        
        // Rediriger vers la bibliothèque après un court délai
        setTimeout(() => {
          navigate('/library');
        }, 1000);
      } else {
        console.warn('⚠️ Vérification réussie mais pas d\'utilisateur retourné');
        setError('Une erreur inattendue s\'est produite');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Erreur générale:', err);
      setError('Une erreur s\'est produite. Veuillez réessayer.');
      toast.error('Erreur de vérification', {
        description: err.message || 'Une erreur inattendue s\'est produite.'
      });
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    console.log('📧 Renvoi du code pour:', email);
    
    toast.promise(
      supabase.auth.resend({
        type: 'signup',
        email: email,
      }),
      {
        loading: 'Envoi du code...',
        success: 'Code renvoyé ! Vérifiez vos emails.',
        error: 'Erreur lors de l\'envoi du code.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Brain className="w-10 h-10 text-teal-600" />
          <span className="text-2xl font-bold text-gray-900">WordCraft</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vérifiez votre email
            </h2>
            <p className="text-gray-500">
              Nous avons envoyé un code de vérification à
            </p>
            <p className="text-teal-600 font-medium mt-1">{email}</p>
          </div>

          {/* Champs de saisie du code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Entrez le code à 6 chiffres
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={loading}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    error
                      ? 'border-red-300 bg-red-50'
                      : digit
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              ))}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Bouton de vérification */}
          <button
            onClick={handleVerify}
            disabled={loading || code.some(d => !d)}
            className={`w-full py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 ${
              loading || code.some(d => !d)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              <>
                <Check size={20} />
                Vérifier
              </>
            )}
          </button>

          {/* Bouton pour renvoyer le code */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vous n'avez pas reçu le code ? Renvoyer
            </button>
          </div>

          {/* Lien pour modifier l'email */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/register')}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Modifier l'adresse email
            </button>
          </div>
        </div>

        {/* Information de sécurité */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Le code expire dans 10 minutes</p>
        </div>
      </div>
    </div>
  );
}

