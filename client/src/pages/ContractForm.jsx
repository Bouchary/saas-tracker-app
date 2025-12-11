// client/src/pages/ContractForm.jsx
// Version MODERNE avec design amélioré + validation visuelle - LOGIQUE ORIGINALE CONSERVÉE

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FileText, DollarSign, Calendar, Bell, CheckCircle2, X, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';

const ContractForm = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    // ✅ ÉTATS ORIGINAUX CONSERVÉS
    const [formData, setFormData] = useState({
        name: '',
        provider: '',
        monthly_cost: '',
        renewal_date: '',
        notice_period_days: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // ✅ HANDLERS ORIGINAUX CONSERVÉS
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        // Validation basique
        if (!formData.name || !formData.monthly_cost || !formData.renewal_date) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setLoading(false);
            return;
        }

        const dataToSend = {
            ...formData,
            monthly_cost: parseFloat(formData.monthly_cost) || 0,
            notice_period_days: parseInt(formData.notice_period_days) || 0,
        };

        try {
            const response = await fetch(`${API_URL}/api/contracts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création du contrat.');
            }

            const newContract = await response.json();
            console.log('Contrat créé:', newContract);
            
            setSuccess(true);
            
            // Redirection vers la liste des contrats après 1.5 secondes
            setTimeout(() => {
                navigate('/contracts');
            }, 1500);

        } catch (err) {
            console.error('Échec de la création:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/contracts');
    };

    // ✨ VALIDATION VISUELLE EN TEMPS RÉEL (NOUVEAU)
    const isFieldValid = (field) => {
        if (field === 'name') return formData.name.length > 0;
        if (field === 'monthly_cost') return formData.monthly_cost && parseFloat(formData.monthly_cost) > 0;
        if (field === 'renewal_date') return formData.renewal_date.length > 0;
        return true;
    };

    const isFormValid = formData.name && formData.monthly_cost && formData.renewal_date;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* ✨ HEADER MODERNE */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Ajouter un Nouveau Contrat</h1>
                    <p className="text-indigo-100 text-lg">Remplissez les informations ci-dessous</p>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-4xl">
                {/* ✨ CARTE FORMULAIRE MODERNISÉE */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10 -mt-16">
                    {/* ✨ MESSAGES D'ERREUR/SUCCÈS MODERNISÉS */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900 text-sm">Erreur</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3 animate-slide-down">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-green-900 text-sm">Succès !</p>
                                <p className="text-sm text-green-700">Contrat créé avec succès ! Redirection...</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ✨ NOM DU CONTRAT AVEC ICÔNE */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Nom du Contrat <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ex: Microsoft 365, Adobe Creative Cloud..."
                                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        formData.name ? 'border-green-300 bg-green-50/30' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {formData.name && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✨ FOURNISSEUR AVEC ICÔNE */}
                        <div>
                            <label htmlFor="provider" className="block text-sm font-semibold text-gray-700 mb-2">
                                Fournisseur
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="provider"
                                    name="provider"
                                    type="text"
                                    value={formData.provider}
                                    onChange={handleChange}
                                    placeholder="Ex: Microsoft, Adobe, Google..."
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* ✨ COÛT MENSUEL AVEC ICÔNE */}
                        <div>
                            <label htmlFor="monthly_cost" className="block text-sm font-semibold text-gray-700 mb-2">
                                Coût Mensuel (€) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="monthly_cost"
                                    name="monthly_cost"
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.monthly_cost}
                                    onChange={handleChange}
                                    placeholder="Ex: 49.99"
                                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        formData.monthly_cost && parseFloat(formData.monthly_cost) > 0 
                                            ? 'border-green-300 bg-green-50/30' 
                                            : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {formData.monthly_cost && parseFloat(formData.monthly_cost) > 0 && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✨ DATE DE RENOUVELLEMENT AVEC ICÔNE */}
                        <div>
                            <label htmlFor="renewal_date" className="block text-sm font-semibold text-gray-700 mb-2">
                                Date de Prochain Renouvellement <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="renewal_date"
                                    name="renewal_date"
                                    type="date"
                                    required
                                    value={formData.renewal_date}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                                        formData.renewal_date ? 'border-green-300 bg-green-50/30' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {formData.renewal_date && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✨ DÉLAI DE PRÉAVIS AVEC ICÔNE */}
                        <div>
                            <label htmlFor="notice_period_days" className="block text-sm font-semibold text-gray-700 mb-2">
                                Délai de Préavis (Jours)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Bell className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="notice_period_days"
                                    name="notice_period_days"
                                    type="number"
                                    min="0"
                                    value={formData.notice_period_days}
                                    onChange={handleChange}
                                    placeholder="Ex: 30"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    disabled={loading}
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                                <span>💡</span>
                                <span>Nombre de jours avant le renouvellement pour résilier le contrat</span>
                            </p>
                        </div>

                        {/* ✨ INDICATEUR DE PROGRESSION */}
                        {!success && (
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Progression du formulaire</span>
                                    <span className="text-sm font-semibold text-indigo-600">
                                        {[formData.name, formData.monthly_cost, formData.renewal_date].filter(Boolean).length} / 3
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                                        style={{ 
                                            width: `${([formData.name, formData.monthly_cost, formData.renewal_date].filter(Boolean).length / 3) * 100}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* ✨ BOUTONS D'ACTION MODERNISÉS */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-gray-100">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-semibold flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                <X className="w-4 h-4" />
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className={`px-6 py-3 text-white rounded-xl transition font-semibold flex items-center justify-center gap-2 ${
                                    isFormValid && !loading
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-105'
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                disabled={loading || !isFormValid}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Créer le Contrat
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ✨ STYLES D'ANIMATION */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-shake {
                    animation: shake 0.5s ease-out;
                }

                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ContractForm;