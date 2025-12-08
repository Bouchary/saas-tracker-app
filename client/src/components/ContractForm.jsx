// client/src/components/ContractForm.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

// 🌟 UTILISATION DE LA VARIABLE D'ENVIRONNEMENT VITE 🌟
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_URL = `${API_BASE_URL}/contracts`; // URL complète pour la ressource contracts

// La prop 'contractToEdit' est acceptée
const ContractForm = ({ onClose, onContractAdded, contractToEdit }) => {
  const { token } = useAuth();
  const isEditing = !!contractToEdit;

  const initialFormState = {
    name: '',
    provider: '',
    monthly_cost: '',
    renewal_date: '',
    notice_period_days: 0,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // EFFET POUR PRÉ-REMPLIR EN CAS D'ÉDITION (inchangé)
  useEffect(() => {
    if (isEditing) {
      const formattedDate = contractToEdit.renewal_date 
        ? new Date(contractToEdit.renewal_date).toISOString().split('T')[0]
        : '';
        
      setFormData({
        name: contractToEdit.name || '',
        provider: contractToEdit.provider || '',
        monthly_cost: String(contractToEdit.monthly_cost) || '',
        renewal_date: formattedDate,
        notice_period_days: contractToEdit.notice_period_days || 0,
      });
    }
  }, [contractToEdit, isEditing]);

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
    setLoading(true);

    const dataToSend = {
      ...formData,
      monthly_cost: parseFloat(formData.monthly_cost) || 0,
      notice_period_days: parseInt(formData.notice_period_days) || 0,
    };

    // LOGIQUE DE L'API : PATCH pour l'édition, POST pour la création
    const method = isEditing ? 'PATCH' : 'POST';
    const url = isEditing ? `${API_URL}/${contractToEdit.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de l'${isEditing ? 'édition' : 'création'} du contrat.`);
      }

      const updatedContract = await response.json();
      
      onContractAdded(updatedContract); 
      onClose(); 

    } catch (err) {
      console.error("Échec de l'opération:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = isEditing ? 'Éditer le Contrat' : 'Ajouter un Nouveau Contrat';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">
            &times;
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom du Contrat (Requis)" name="name" value={formData.name} onChange={handleChange} required />
          <Input label="Fournisseur" name="provider" value={formData.provider} onChange={handleChange} />
          <Input 
            label="Coût Mensuel (€)" 
            name="monthly_cost" 
            type="number" 
            value={formData.monthly_cost} 
            onChange={handleChange} 
            required 
            step="0.01"
            min="0"
          />
          <Input 
            label="Date de Prochain Renouvellement (Requis)" 
            name="renewal_date" 
            type="date" 
            value={formData.renewal_date} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Délai de Préavis (Jours)" 
            name="notice_period_days" 
            type="number" 
            value={formData.notice_period_days} 
            onChange={handleChange} 
            min="0"
          />

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-400"
              disabled={loading}
            >
              {loading ? 'Envoi...' : (isEditing ? 'Sauvegarder les Modifications' : 'Ajouter Contrat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant utilitaire pour les champs d'entrée (inchangé)
const Input = ({ label, name, type = 'text', ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            id={name}
            name={name}
            type={type}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            {...props}
        />
    </div>
);

export default ContractForm;