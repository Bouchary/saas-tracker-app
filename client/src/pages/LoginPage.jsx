// client/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';  // ← Ajout de Link
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
        // Si c'est une erreur de validation (400) avec des détails
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
      
      login(userPayload, data.token);
      navigate('/'); 

    } catch (err) {
      console.error("Erreur de soumission du formulaire:", err);
      setError(err.message || 'Échec de la connexion/inscription. Vérifiez les logs.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg space-y-1">
            <p className="font-semibold mb-2">Erreurs de validation :</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, index) => (
                <li key={index}>
                  <strong>{err.field}</strong> : {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form 
          className="space-y-6" 
          onSubmit={handleSubmit}
          data-lpignore="true" 
          autoComplete="off"   
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
              autoComplete="off" 
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition"
              disabled={loading}
              autoComplete="new-password" 
            />
            {!isLogin && (
              <p className="mt-1 text-xs text-gray-500">
                Min 8 caractères, 1 majuscule, 1 chiffre
              </p>
            )}
          </div>

          {/* ✅ NOUVEAU : Lien "Mot de passe oublié" (visible seulement en mode Login) */}
          {isLogin && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link 
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition"
            disabled={loading}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se Connecter' : 'S\'inscrire')}
          </button>
        </form>
        
        <div className="text-sm text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setValidationErrors([]);
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
            disabled={loading}
          >
            {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;