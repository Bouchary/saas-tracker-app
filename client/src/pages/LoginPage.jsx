// client/src/pages/LoginPage.jsx
// ✅ VERSION CORRIGÉE avec stockage explicite du token

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Check, X } from 'lucide-react';
import API_URL from '../config/api';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour la validation du mot de passe
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validation du mot de passe en temps réel
  useEffect(() => {
    if (!isLogin && password) {
      const validation = {
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      setPasswordValidation(validation);
      
      // Calculer la force du mot de passe
      const strength = Object.values(validation).filter(Boolean).length;
      setPasswordStrength(strength);
    } else {
      setPasswordValidation({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
      setPasswordStrength(0);
    }
  }, [password, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400 && data.details) {
          setValidationErrors(data.details);
          throw new Error('Veuillez corriger les erreurs ci-dessous.');
        }
        throw new Error(data.error || `Erreur ${isLogin ? 'de connexion' : 'd\'inscription'}.`);
      }

      const userPayload = {
        id: data.id,
        email: data.email,
      };
      
      // ✅ CORRECTION : STOCKER LE TOKEN EXPLICITEMENT DANS LOCALSTORAGE
      console.log('🔐 Stockage du token:', data.token.substring(0, 30) + '...');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userPayload));
      console.log('✅ Token stocké avec succès');
      
      login(userPayload, data.token);
      navigate('/contracts'); // Redirige vers la liste des contrats après connexion

    } catch (err) {
      console.error("Erreur de soumission du formulaire:", err);
      setError(err.message || 'Échec de la connexion/inscription.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir la couleur de la barre de force
  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-orange-500';
    if (passwordStrength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Fonction pour obtenir le texte de la force
  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Faible';
    if (passwordStrength <= 3) return 'Moyen';
    if (passwordStrength <= 4) return 'Fort';
    return 'Très fort';
  };
  
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Image de fond avec overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay gradient pour assombrir et améliorer la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-purple-900/60 to-blue-900/70"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-md px-6 py-8">
        {/* Logo/Titre au-dessus */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            SaaS Tracker
          </h1>
          <p className="text-indigo-200 text-sm">
            Gérez vos abonnements en toute simplicité
          </p>
        </div>

        {/* Carte glassmorphism */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8 animate-slide-up">
          {/* Onglets Login/Register */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setValidationErrors([]);
                setPassword('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
              disabled={loading}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setValidationErrors([]);
                setPassword('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
              disabled={loading}
            >
              Inscription
            </button>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-300/50 backdrop-blur-sm animate-shake">
              <p className="text-sm text-white font-medium">{error}</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-300/50 backdrop-blur-sm">
              <p className="font-semibold text-white mb-2 text-sm">Erreurs de validation :</p>
              <ul className="space-y-1 text-sm text-white/90">
                {validationErrors.map((err, index) => (
                  <li key={index}>
                    <strong>{err.field}</strong> : {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulaire */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition"
                  placeholder="votre@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-white/60 hover:text-white transition" />
                  ) : (
                    <Eye className="h-5 w-5 text-white/60 hover:text-white transition" />
                  )}
                </button>
              </div>

              {/* Validation en temps réel (uniquement pour inscription) */}
              {!isLogin && password && (
                <div className="mt-4 space-y-3">
                  {/* Barre de force du mot de passe */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/80">Force du mot de passe</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength <= 2 ? 'text-red-300' :
                        passwordStrength <= 3 ? 'text-orange-300' :
                        passwordStrength <= 4 ? 'text-yellow-300' :
                        'text-green-300'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Critères de validation */}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className={`flex items-center gap-2 ${passwordValidation.hasMinLength ? 'text-green-300' : 'text-white/60'}`}>
                      {passwordValidation.hasMinLength ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Au moins 8 caractères</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-300' : 'text-white/60'}`}>
                      {passwordValidation.hasUpperCase ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Une lettre majuscule</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-300' : 'text-white/60'}`}>
                      {passwordValidation.hasLowerCase ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Une lettre minuscule</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-300' : 'text-white/60'}`}>
                      {passwordValidation.hasNumber ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Un chiffre</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-300' : 'text-white/60'}`}>
                      {passwordValidation.hasSpecialChar ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Un caractère spécial (!@#$%...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lien mot de passe oublié */}
            {isLogin && (
              <div className="flex items-center justify-end">
                <Link 
                  to="/forgot-password"
                  className="text-sm font-medium text-white hover:text-indigo-200 transition"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:bg-white/50 disabled:cursor-not-allowed transition-all duration-300 group"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  Chargement...
                </>
              ) : (
                <>
                  {isLogin ? 'Se Connecter' : 'S\'inscrire'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Texte en dessous */}
        <p className="mt-6 text-center text-sm text-white/80">
          En continuant, vous acceptez nos{' '}
          <Link to="/cgu" className="underline hover:text-white transition">
            conditions d'utilisation
          </Link>
          {' '}et notre{' '}
          <Link to="/privacy" className="underline hover:text-white transition">
            politique de confidentialité
          </Link>
        </p>
      </div>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;