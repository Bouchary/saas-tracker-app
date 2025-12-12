// client/src/pages/ContractForm.jsx
// Version COMPLÈTE avec gestion licences + calcul automatique

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FileText, DollarSign, Calendar, Bell, CheckCircle2, X, AlertCircle, Users, Calculator } from 'lucide-react';
import API_URL from '../config/api';

const ContractForm = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    // ✅ ÉTATS FORMULAIRE
    const [formData, setFormData] = useState({
        name: '',
        provider: '',
        monthly_cost: '',
        renewal_date: '',
        notice_period_days: 0,
        // ✨ NOUVEAUX CHAMPS LICENCES
        pricing_model: 'fixed',
        license_count: '',
        licenses_used: '',
        unit_cost: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // ✨ CALCUL AUTOMATIQUE DU COÛT
    const calculatedCost = formData.pricing_model === 'per_user' && formData.license_count && formData.unit_cost
        ? (parseFloat(formData.license_count) * parseFloat(formData.unit_cost)).toFixed(2)
        : null;

    // ✨ TAUX D'UTILISATION LICENCES
    const usageRate = formData.license_count && formData.licenses_used
        ? ((parseFloat(formData.licenses_used) / parseFloat(formData.license_count)) * 100).toFixed(0)
        : null;

    // ✨ LICENCES INUTILISÉES
    const unusedLicenses = formData.license_count && formData.licenses_used
        ? parseFloat(formData.license_count) - parseFloat(formData.licenses_used)
        : null;

    // ✨ COÛT GASPILLÉ
    const wastedCost = unusedLicenses && formData.unit_cost
        ? (unusedLicenses * parseFloat(formData.unit_cost)).toFixed(2)
        : null;

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

        // ✅ VALIDATION DE BASE
        if (!formData.name || !formData.renewal_date) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setLoading(false);
            return;
        }

        // ✅ VALIDATION COÛT
        if (formData.pricing_model === 'fixed' && !formData.monthly_cost) {
            setError('Le coût mensuel est requis pour un prix fixe.');
            setLoading(false);
            return;
        }

        if (formData.pricing_model === 'per_user' && (!formData.license_count || !formData.unit_cost)) {
            setError('Le nombre de licences et le coût unitaire sont requis pour une tarification par utilisateur.');
            setLoading(false);
            return;
        }

        // ✅ VALIDATION LICENCES
        if (formData.licenses_used && formData.license_count && 
            parseFloat(formData.licenses_used) > parseFloat(formData.license_count)) {
            setError('Le nombre de licences utilisées ne peut pas dépasser le nombre de licences achetées.');
            setLoading(false);
            return;
        }

        const dataToSend = {
            name: formData.name,
            provider: formData.provider || null,
            renewal_date: formData.renewal_date,
            notice_period_days: parseInt(formData.notice_period_days) || 0,
            pricing_model: formData.pricing_model,
            // ✨ CALCUL AUTO OU MANUEL
            monthly_cost: formData.pricing_model === 'per_user' 
                ? parseFloat(calculatedCost)
                : parseFloat(formData.monthly_cost) || 0,
            // ✨ LICENCES
            license_count: formData.license_count ? parseInt(formData.license_count) : null,
            licenses_used: formData.licenses_used ? parseInt(formData.licenses_used) : null,
            unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
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

    const isFormValid = formData.name && formData.renewal_date && 
        (formData.pricing_model === 'fixed' ? formData.monthly_cost : 
         (formData.license_count && formData.unit_cost));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Ajouter un Nouveau Contrat</h1>
                    <p className="text-indigo-100 text-lg">Remplissez les informations ci-dessous</p>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10 -mt-16">
                    {/* MESSAGES */}
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
                        {/* NOM */}
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

                        {/* FOURNISSEUR */}
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

                        {/* ✨ TYPE DE TARIFICATION */}
                        <div>
                            <label htmlFor="pricing_model" className="block text-sm font-semibold text-gray-700 mb-2">
                                Type de tarification <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, pricing_model: 'fixed', license_count: '', licenses_used: '', unit_cost: ''})}
                                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                                        formData.pricing_model === 'fixed'
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    disabled={loading}
                                >
                                    <DollarSign className="w-5 h-5 inline mr-2" />
                                    Prix fixe
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, pricing_model: 'per_user', monthly_cost: ''})}
                                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                                        formData.pricing_model === 'per_user'
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    disabled={loading}
                                >
                                    <Users className="w-5 h-5 inline mr-2" />
                                    Par utilisateur
                                </button>
                            </div>
                        </div>

                        {/* ✨ SI PRIX FIXE → COÛT MENSUEL */}
                        {formData.pricing_model === 'fixed' && (
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
                        )}

                        {/* ✨ SI PAR UTILISATEUR → LICENCES */}
                        {formData.pricing_model === 'per_user' && (
                            <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                    Gestion des Licences
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nombre de licences */}
                                    <div>
                                        <label htmlFor="license_count" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Licences achetées <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="license_count"
                                            name="license_count"
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.license_count}
                                            onChange={handleChange}
                                            placeholder="Ex: 50"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Coût unitaire */}
                                    <div>
                                        <label htmlFor="unit_cost" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Coût par licence (€) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="unit_cost"
                                            name="unit_cost"
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            value={formData.unit_cost}
                                            onChange={handleChange}
                                            placeholder="Ex: 8.00"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Licences utilisées (optionnel) */}
                                <div>
                                    <label htmlFor="licenses_used" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Licences utilisées (optionnel)
                                    </label>
                                    <input
                                        id="licenses_used"
                                        name="licenses_used"
                                        type="number"
                                        min="0"
                                        max={formData.license_count || undefined}
                                        value={formData.licenses_used}
                                        onChange={handleChange}
                                        placeholder="Ex: 32"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                        disabled={loading}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Pour suivre l'utilisation réelle et détecter le gaspillage
                                    </p>
                                </div>

                                {/* ✨ CALCUL AUTOMATIQUE */}
                                {calculatedCost && (
                                    <div className="p-4 bg-white rounded-xl border-2 border-indigo-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Calculator className="w-4 h-4 text-indigo-600" />
                                                Coût total calculé
                                            </span>
                                            <span className="text-2xl font-bold text-indigo-600">
                                                {calculatedCost} €/mois
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {formData.license_count} licences × {formData.unit_cost}€
                                        </p>
                                    </div>
                                )}

                                {/* ✨ ANALYSE UTILISATION */}
                                {usageRate && (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-700">Taux d'utilisation</span>
                                                <span className={`text-xl font-bold ${
                                                    usageRate >= 80 ? 'text-green-600' :
                                                    usageRate >= 50 ? 'text-orange-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {usageRate}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all ${
                                                        usageRate >= 80 ? 'bg-green-500' :
                                                        usageRate >= 50 ? 'bg-orange-500' :
                                                        'bg-red-500'
                                                    }`}
                                                    style={{ width: `${usageRate}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {formData.licenses_used} utilisées sur {formData.license_count}
                                            </p>
                                        </div>

                                        {unusedLicenses > 0 && wastedCost && (
                                            <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-red-900">⚠️ Gaspillage détecté</p>
                                                        <p className="text-xs text-red-700 mt-1">
                                                            {unusedLicenses} licence{unusedLicenses > 1 ? 's' : ''} inutilisée{unusedLicenses > 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-red-600">{wastedCost}€</p>
                                                        <p className="text-xs text-red-700">gaspillés/mois</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DATE RENOUVELLEMENT */}
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

                        {/* DÉLAI PRÉAVIS */}
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

                        {/* PROGRESSION */}
                        {!success && (
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Progression du formulaire</span>
                                    <span className="text-sm font-semibold text-indigo-600">
                                        {[formData.name, formData.renewal_date, 
                                          formData.pricing_model === 'fixed' ? formData.monthly_cost : (formData.license_count && formData.unit_cost)
                                        ].filter(Boolean).length} / 3
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                                        style={{ 
                                            width: `${([formData.name, formData.renewal_date, 
                                                formData.pricing_model === 'fixed' ? formData.monthly_cost : (formData.license_count && formData.unit_cost)
                                            ].filter(Boolean).length / 3) * 100}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* BOUTONS */}
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

            {/* STYLES */}
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
