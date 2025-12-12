// client/src/components/ContractForm.jsx
// Version FINALE avec real_users pour surconsommation

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { X, Save, AlertTriangle, Loader, DollarSign, Calendar, FileText, Users, ShieldAlert } from 'lucide-react';
import API_URL from '../config/api';

const ContractForm = ({ contract, onClose, onSave }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        provider: '',
        monthly_cost: '',
        renewal_date: '',
        notice_period_days: '',
        status: 'active',
        pricing_model: 'fixed',
        license_count: '',
        licenses_used: '',
        real_users: '', // ✨ NOUVEAU CHAMP
        unit_cost: ''
    });

    useEffect(() => {
        if (contract) {
            setFormData({
                name: contract.name || '',
                provider: contract.provider || '',
                monthly_cost: contract.monthly_cost || '',
                renewal_date: contract.renewal_date ? contract.renewal_date.split('T')[0] : '',
                notice_period_days: contract.notice_period_days || '',
                status: contract.status || 'active',
                pricing_model: contract.pricing_model || 'fixed',
                license_count: contract.license_count || '',
                licenses_used: contract.licenses_used || '',
                real_users: contract.real_users || '', // ✨ CHARGEMENT
                unit_cost: contract.unit_cost || ''
            });
        }
    }, [contract]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✨ CALCUL SURCONSOMMATION avec real_users
    const realUsers = formData.real_users ? parseInt(formData.real_users) : 0;
    const licenseCount = formData.license_count ? parseInt(formData.license_count) : 0;
    const isOverconsumed = formData.license_count && realUsers > licenseCount;
    const missingLicenses = isOverconsumed ? realUsers - licenseCount : 0;
    const unitCost = formData.unit_cost ? parseFloat(formData.unit_cost) : 0;
    const overconsumptionCost = missingLicenses * unitCost;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validation basique
            if (!formData.name.trim()) {
                throw new Error('Le nom du contrat est requis');
            }
            if (!formData.monthly_cost || parseFloat(formData.monthly_cost) <= 0) {
                throw new Error('Le coût mensuel doit être supérieur à 0');
            }

            // ✨ SUPPRESSION validation bloquante licenses_used > license_count
            // On accepte maintenant la surconsommation via real_users

            const dataToSend = {
                name: formData.name.trim(),
                provider: formData.provider.trim(),
                monthly_cost: parseFloat(formData.monthly_cost),
                renewal_date: formData.renewal_date || null,
                notice_period_days: formData.notice_period_days ? parseInt(formData.notice_period_days) : null,
                status: formData.status,
                pricing_model: formData.pricing_model,
                license_count: formData.license_count ? parseInt(formData.license_count) : null,
                licenses_used: formData.licenses_used ? parseInt(formData.licenses_used) : null,
                real_users: formData.real_users ? parseInt(formData.real_users) : null, // ✨ ENVOI
                unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null
            };

            const url = contract 
                ? `${API_URL}/api/contracts/${contract.id}`
                : `${API_URL}/api/contracts`;
            
            const method = contract ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
            }

            const savedContract = await response.json();
            onSave(savedContract);
            onClose();
        } catch (err) {
            setError(err.message);
            console.error('Erreur form:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            {contract ? 'Modifier le contrat' : 'Nouveau contrat'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all hover:rotate-90"
                        aria-label="Fermer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* ✨ ALERTE SURCONSOMMATION */}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nom */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Nom du contrat *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="Ex: Slack Pro"
                            />
                        </div>

                        {/* Fournisseur */}
                        <div>
                            <label htmlFor="provider" className="block text-sm font-semibold text-gray-700 mb-2">
                                Fournisseur
                            </label>
                            <input
                                id="provider"
                                name="provider"
                                type="text"
                                value={formData.provider}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="Ex: Slack Technologies"
                            />
                        </div>

                        {/* Coût mensuel */}
                        <div>
                            <label htmlFor="monthly_cost" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                Coût mensuel (€) *
                            </label>
                            <input
                                id="monthly_cost"
                                name="monthly_cost"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={formData.monthly_cost}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="Ex: 299.99"
                            />
                        </div>

                        {/* Date de renouvellement */}
                        <div>
                            <label htmlFor="renewal_date" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Date de renouvellement
                            </label>
                            <input
                                id="renewal_date"
                                name="renewal_date"
                                type="date"
                                value={formData.renewal_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                            />
                        </div>

                        {/* Période de préavis */}
                        <div>
                            <label htmlFor="notice_period_days" className="block text-sm font-semibold text-gray-700 mb-2">
                                Période de préavis (jours)
                            </label>
                            <input
                                id="notice_period_days"
                                name="notice_period_days"
                                type="number"
                                min="0"
                                value={formData.notice_period_days}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="Ex: 30"
                            />
                        </div>

                        {/* Statut */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                            >
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                        </div>
                    </div>

                    {/* Modèle de tarification */}
                    <div className="mt-6">
                        <label htmlFor="pricing_model" className="block text-sm font-semibold text-gray-700 mb-2">
                            Modèle de tarification
                        </label>
                        <select
                            id="pricing_model"
                            name="pricing_model"
                            value={formData.pricing_model}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                        >
                            <option value="fixed">Coût fixe</option>
                            <option value="per_user">Par utilisateur</option>
                            <option value="usage_based">Basé sur l'utilisation</option>
                        </select>
                    </div>

                    {/* Section Licences (si per_user) */}
                    {formData.pricing_model === 'per_user' && (
                        <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Gestion des Licences</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Licences achetées */}
                                <div>
                                    <label htmlFor="license_count" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Licences achetées
                                    </label>
                                    <input
                                        id="license_count"
                                        name="license_count"
                                        type="number"
                                        min="0"
                                        value={formData.license_count}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                        placeholder="Ex: 50"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">💼 Nombre de licences dans le contrat</p>
                                </div>

                                {/* Licences utilisées */}
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
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                        placeholder="Ex: 45"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">👥 Licences assignées légalement (max {formData.license_count || '—'})</p>
                                </div>

                                {/* ✨ NOUVEAU : Utilisateurs réels */}
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
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                        placeholder="Ex: 70"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">🔍 Nombre réel d'utilisateurs connectés (peut dépasser les licences achetées)</p>
                                </div>

                                {/* Coût unitaire */}
                                <div>
                                    <label htmlFor="unit_cost" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Coût unitaire (€)
                                    </label>
                                    <input
                                        id="unit_cost"
                                        name="unit_cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.unit_cost}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                        placeholder="Ex: 8.00"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">💵 Prix par licence/utilisateur</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:scale-105"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {contract ? 'Mettre à jour' : 'Créer'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContractForm;