// client/src/pages/PurchaseRequestFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PurchaseRequestFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    justification: '',
    amount: '',
    currency: 'EUR',
    category: '',
    custom_category_text: '',
    urgency: 'normal',
    supplier_name: '',
    supplier_contact: '',
    supplier_email: '',
    supplier_phone: '',
    needed_date: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Équipement informatique',
    'Logiciels & Licences',
    'Mobilier',
    'Services',
    'Formation',
    'Fournitures',
    'Autre'
  ];

  useEffect(() => {
    if (isEditing) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const request = response.data.request;
      setFormData({
        title: request.title || '',
        description: request.description || '',
        justification: request.justification || '',
        amount: request.amount || '',
        currency: request.currency || 'EUR',
        category: request.category || '',
        custom_category_text: request.custom_category_text || '',
        urgency: request.urgency || 'normal',
        supplier_name: request.supplier_name || '',
        supplier_contact: request.supplier_contact || '',
        supplier_email: request.supplier_email || '',
        supplier_phone: request.supplier_phone || '',
        needed_date: request.needed_date ? request.needed_date.split('T')[0] : ''
      });
    } catch (error) {
      alert('Erreur chargement demande : ' + (error.response?.data?.error || error.message));
      navigate('/purchase-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.justification.trim()) {
      newErrors.justification = 'La justification est requise';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    }

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
    }

    if (formData.category === 'Autre' && !formData.custom_category_text.trim()) {
      newErrors.custom_category_text = 'Veuillez préciser la catégorie';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, submitForApproval = false) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // Créer ou mettre à jour
      if (isEditing) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchase-requests`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Si création, on récupère l'ID pour soumettre après si demandé
        if (submitForApproval) {
          const newId = response.data.id;
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/purchase-requests/${newId}/submit`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      // Si édition et soumission demandée
      if (isEditing && submitForApproval) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}/submit`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert(submitForApproval 
        ? 'Demande soumise pour validation !' 
        : 'Demande enregistrée !'
      );
      navigate('/purchase-requests');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      const errorDetails = error.response?.data?.details;
      
      if (errorDetails && Array.isArray(errorDetails)) {
        // Erreurs de validation
        const newErrors = {};
        errorDetails.forEach(err => {
          const field = Object.keys(err)[0];
          newErrors[field] = err[field];
        });
        setErrors(newErrors);
      } else {
        alert('Erreur : ' + errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/purchase-requests')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Retour à la liste
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Modifier la demande' : 'Nouvelle demande d\'achat'}
        </h1>
        <p className="text-gray-600 mt-1">
          Remplissez le formulaire pour créer une demande de validation
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Informations générales */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Ex: MacBook Pro 14 pouces"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description détaillée de la demande"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                rows={4}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.justification ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Pourquoi cet achat est-il nécessaire ? Quel est le contexte ?"
              />
              {errors.justification && <p className="text-red-500 text-sm mt-1">{errors.justification}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Sélectionnez...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgence
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normale</option>
                  <option value="urgent">Urgente</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>

            {formData.category === 'Autre' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Précisez la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="custom_category_text"
                  value={formData.custom_category_text}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.custom_category_text ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ex: Équipement de sécurité"
                />
                {errors.custom_category_text && <p className="text-red-500 text-sm mt-1">{errors.custom_category_text}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date souhaitée
              </label>
              <input
                type="date"
                name="needed_date"
                value={formData.needed_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Informations fournisseur */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fournisseur (optionnel)</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du fournisseur
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Apple Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <input
                  type="text"
                  name="supplier_contact"
                  value={formData.supplier_contact}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom du contact"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="supplier_email"
                  value={formData.supplier_email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@fournisseur.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="supplier_phone"
                  value={formData.supplier_phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/purchase-requests')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer comme brouillon'}
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Soumission...' : 'Soumettre pour validation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequestFormPage;