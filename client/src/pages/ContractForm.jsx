// client/src/pages/ContractForm.jsx
// ✅ VERSION FINALE - Avec extraction intelligente PDF

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FileText, DollarSign, Calendar, Bell, CheckCircle2, X, AlertCircle, Users, Calculator, ShieldAlert, Sparkles } from 'lucide-react';
import API_URL from '../config/api';
import ContractExtractionModal from '../components/ContractExtractionModal';

const ContractForm = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        provider: '',
        monthly_cost: '',
        renewal_date: '',
        notice_period_days: 0,
        pricing_model: 'fixed',
        license_count: '',
        licenses_used: '',
        real_users: '',
        unit_cost: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showExtractionModal, setShowExtractionModal] = useState(false); // ✅ NOUVEAU

    // Calculs
    const calculatedCost = formData.pricing_model === 'per_user' && formData.license_count && formData.unit_cost
        ? (parseFloat(formData.license_count) * parseFloat(formData.unit_cost)).toFixed(2)
        : null;

    const realUsers = formData.real_users ? parseInt(formData.real_users) : 0;
    const licenseCount = formData.license_count ? parseInt(formData.license_count) : 0;
    const isOverconsumed = formData.license_count && realUsers > licenseCount;
    const missingLicenses = isOverconsumed ? realUsers - licenseCount : 0;
    const unitCost = formData.unit_cost ? parseFloat(formData.unit_cost) : 0;
    const overconsumptionCost = missingLicenses * unitCost;

    const usageRate = formData.license_count && formData.licenses_used
        ? ((parseFloat(formData.licenses_used) / parseFloat(formData.license_count)) * 100).toFixed(0)
        : null;

    const unusedLicenses = formData.license_count && formData.licenses_used
        ? parseFloat(formData.license_count) - parseFloat(formData.licenses_used)
        : null;

    const wastedCost = unusedLicenses && formData.unit_cost && unusedLicenses > 0
        ? (unusedLicenses * parseFloat(formData.unit_cost)).toFixed(2)
        : null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // ✅ NOUVEAU : Handler extraction intelligente
    const handleExtractionSuccess = (extractedData) => {
        console.log('✅ Données extraites:', extractedData);
        
        // Pré-remplir le formulaire avec les données extraites
        setFormData({
            ...formData,
            name: extractedData.name || '',
            provider: extractedData.provider || '',
            monthly_cost: extractedData.monthly_cost || '',
            renewal_date: extractedData.renewal_date || '',
            notice_period_days: extractedData.notice_period_days || 0,
            license_count: extractedData.license_count || '',
            pricing_model: extractedData.pricing_model === 'per_user' ? 'per_user' : 'fixed',
            unit_cost: extractedData.unit_cost || ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        // Validation
        if (!formData.name || !formData.renewal_date) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setLoading(false);
            return;
        }

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

        // ✅ Construction conditionnelle
        const dataToSend = {
            name: formData.name.trim(),
            provider: formData.provider ? formData.provider.trim() : null,
            renewal_date: formData.renewal_date || null,
            notice_period_days: formData.notice_period_days && formData.notice_period_days !== '' ? parseInt(formData.notice_period_days) : null,
            pricing_model: formData.pricing_model,
            status: 'active'
        };

        // Ajouter monthly_cost selon le modèle
        if (formData.pricing_model === 'per_user') {
            dataToSend.monthly_cost = parseFloat(calculatedCost);
        } else {
            dataToSend.monthly_cost = formData.monthly_cost && formData.monthly_cost !== '' ? parseFloat(formData.monthly_cost) : null;
        }

        // ✅ N'envoyer les champs licences QUE si pricing_model = "per_user"
        if (formData.pricing_model === 'per_user') {
            dataToSend.license_count = formData.license_count && formData.license_count !== '' ? parseInt(formData.license_count) : null;
            dataToSend.licenses_used = formData.licenses_used && formData.licenses_used !== '' ? parseInt(formData.licenses_used) : null;
            dataToSend.real_users = formData.real_users && formData.real_users !== '' ? parseInt(formData.real_users) : null;
            dataToSend.unit_cost = formData.unit_cost && formData.unit_cost !== '' ? parseFloat(formData.unit_cost) : null;
        }

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
                window.location.href = '/contracts';
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
                    
                    {/* ✅ NOUVEAU : Bouton extraction IA */}
                    <div className="mb-8">
                        <button
                            type="button"
                            onClick={() => setShowExtractionModal(true)}
                            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <Sparkles className="w-5 h-5" />
                            Extraire d'un contrat PDF (IA)
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Analysez un PDF et pré-remplissez automatiquement le formulaire
                        </p>
                    </div>

                    {/* Séparateur */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">ou remplir manuellement</span>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3" style={{animation: 'shake 0.5s ease-out'}}>
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900 text-sm">Erreur</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3" style={{animation: 'slideDown 0.3s ease-out'}}>
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-green-900 text-sm">Succès !</p>
                                <p className="text-sm text-green-700">Contrat créé avec succès ! Redirection...</p>
                            </div>
                        </div>
                    )}

                    {/* ALERTE SURCONSOMMATION */}
                    {isOverconsumed && (
                        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-5 animate-pulse">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ShieldAlert className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-red-900 mb-2">🚨 Surconsommation Détectée</h3>
                                    <div className="space-y-2 text-sm text-red-800">
                                        <p>
                                            <strong>{missingLicenses} licences manquantes</strong> : 
                                            vous avez {realUsers} utilisateurs réels pour seulement {licenseCount} licences achetées
                                        </p>
                                        <p className="font-semibold text-red-900">
                                            💰 Surcoût estimé : {overconsumptionCost.toFixed(2)} €/mois 
                                            ({(overconsumptionCost * 12).toFixed(0)} €/an)
                                        </p>
                                        <p className="text-xs bg-white/50 p-2 rounded border border-red-200">
                                            ⚠️ <strong>Action requise :</strong> Acheter {missingLicenses} licences supplémentaires 
                                            ou désactiver {missingLicenses} comptes utilisateurs
                                        </p>
                                    </div>
                                </div>
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

                        {/* TYPE DE TARIFICATION */}
                        <div>
                            <label htmlFor="pricing_model" className="block text-sm font-semibold text-gray-700 mb-2">
                                Type de tarification <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, pricing_model: 'fixed', license_count: '', licenses_used: '', real_users: '', unit_cost: ''})}
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

                        {/* SI PRIX FIXE → COÛT MENSUEL */}
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

                        {/* SI PAR UTILISATEUR → LICENCES */}
                        {formData.pricing_model === 'per_user' && (
                            <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                    Gestion des Licences
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Licences achetées */}
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
                                        <p className="text-xs text-gray-600 mt-1">💼 Nombre de licences dans le contrat</p>
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
                                        <p className="text-xs text-gray-600 mt-1">💵 Prix par licence/utilisateur</p>
                                    </div>
                                </div>

                                {/* Licences attribuées */}
                                <div>
                                    <label htmlFor="licenses_used" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Licences attribuées
                                    </label>
                                    <input
                                        id="licenses_used"
                                        name="licenses_used"
                                        type="number"
                                        min="0"
                                        max={formData.license_count || undefined}
                                        value={formData.licenses_used}
                                        onChange={handleChange}
                                        placeholder="Ex: 45"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-600 mt-1">👥 Licences assignées légalement (max {formData.license_count || '—'})</p>
                                </div>

                                {/* Utilisateurs réels */}
                                <div>
                                    <label htmlFor="real_users" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Utilisateurs réels <span className="text-gray-500 font-normal">(optionnel)</span>
                                    </label>
                                    <input
                                        id="real_users"
                                        name="real_users"
                                        type="number"
                                        min="0"
                                        value={formData.real_users}
                                        onChange={handleChange}
                                        placeholder="Ex: 70"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-600 mt-1">🔍 Nombre réel d'utilisateurs connectés (peut dépasser les licences achetées)</p>
                                </div>

                                {/* CALCUL AUTOMATIQUE */}
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

                                {/* ANALYSE UTILISATION */}
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

                                        {/* Alerte Gaspillage */}
                                        {unusedLicenses > 0 && wastedCost && !isOverconsumed && (
                                            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-yellow-900">⚠️ Gaspillage détecté</p>
                                                        <p className="text-xs text-yellow-700 mt-1">
                                                            {unusedLicenses} licence{unusedLicenses > 1 ? 's' : ''} inutilisée{unusedLicenses > 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-yellow-600">{wastedCost}€</p>
                                                        <p className="text-xs text-yellow-700">gaspillés/mois</p>
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

            {/* ✅ NOUVEAU : Modal extraction */}
            <ContractExtractionModal 
                isOpen={showExtractionModal}
                onClose={() => setShowExtractionModal(false)}
                onExtractSuccess={handleExtractionSuccess}
            />
        </div>
    );
};

export default ContractForm;
