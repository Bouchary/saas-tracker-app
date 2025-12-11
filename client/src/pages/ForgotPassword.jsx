// client/src/pages/ForgotPassword.jsx
// Page pour demander la réinitialisation du mot de passe

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la demande');
            }

            setSuccess(true);

        } catch (err) {
            console.error('Erreur:', err);
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Retour */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour à la connexion
                </Link>

                {/* En-tête */}
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Mot de passe oublié
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                </div>

                {/* Formulaire ou message de succès */}
                {!success ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm">
                            <div>
                                <label htmlFor="email" className="sr-only">
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Adresse email"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Message d'erreur */}
                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Bouton submit */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-5 h-5 mr-2" />
                                        Envoyer le lien
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="rounded-lg bg-green-50 p-6 border border-green-200">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    Email envoyé !
                                </h3>
                                <p className="text-sm text-green-700 mb-4">
                                    Si un compte existe avec l'adresse <strong>{email}</strong>, vous allez recevoir un email avec un lien de réinitialisation.
                                </p>
                                <p className="text-sm text-green-700">
                                    Vérifiez également votre dossier spam.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Informations supplémentaires */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Le lien de réinitialisation est valide pendant 1 heure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
