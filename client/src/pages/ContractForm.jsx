// client/src/pages/ContractForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const ContractForm = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

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
            
            // Redirection vers la page d'accueil après 1.5 secondes
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (err) {
            console.error('Échec de la création:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">
                Ajouter un Nouveau Contrat
            </h1>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                {error && (
                    <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg">
                        Contrat créé avec succès ! Redirection...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Nom du contrat */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du Contrat <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Microsoft 365, Adobe Creative Cloud..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Fournisseur */}
                    <div>
                        <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                            Fournisseur
                        </label>
                        <input
                            id="provider"
                            name="provider"
                            type="text"
                            value={formData.provider}
                            onChange={handleChange}
                            placeholder="Ex: Microsoft, Adobe, Google..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Coût mensuel */}
                    <div>
                        <label htmlFor="monthly_cost" className="block text-sm font-medium text-gray-700 mb-1">
                            Coût Mensuel (€) <span className="text-red-500">*</span>
                        </label>
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Date de renouvellement */}
                    <div>
                        <label htmlFor="renewal_date" className="block text-sm font-medium text-gray-700 mb-1">
                            Date de Prochain Renouvellement <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="renewal_date"
                            name="renewal_date"
                            type="date"
                            required
                            value={formData.renewal_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Délai de préavis */}
                    <div>
                        <label htmlFor="notice_period_days" className="block text-sm font-medium text-gray-700 mb-1">
                            Délai de Préavis (Jours)
                        </label>
                        <input
                            id="notice_period_days"
                            name="notice_period_days"
                            type="number"
                            min="0"
                            value={formData.notice_period_days}
                            onChange={handleChange}
                            placeholder="Ex: 30"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Nombre de jours avant le renouvellement pour résilier le contrat
                        </p>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-medium disabled:bg-indigo-400"
                            disabled={loading}
                        >
                            {loading ? 'Création...' : 'Créer le Contrat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContractForm;