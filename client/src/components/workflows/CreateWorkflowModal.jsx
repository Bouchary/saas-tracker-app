// ============================================================================
// MODAL CRÉATION WORKFLOW - Depuis fiche employé
// ============================================================================
// Fichier : client/src/components/workflows/CreateWorkflowModal.jsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Rocket, LogOut, Calendar, FileText, AlertCircle, Loader } from 'lucide-react';

const CreateWorkflowModal = ({ isOpen, onClose, employeeId, employeeName, onSuccess }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'onboarding',
    template_id: '',
    target_date: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      // Set default target date to today
      setFormData(prev => ({
        ...prev,
        target_date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [isOpen, formData.type]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(
        `${apiUrl}/api/workflows/templates?type=${formData.type}&is_active=true`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
      
      // Auto-select first template
      if (data.templates && data.templates.length > 0) {
        setFormData(prev => ({
          ...prev,
          template_id: data.templates[0].id
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Impossible de charger les templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.template_id || !formData.target_date) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          template_id: parseInt(formData.template_id),
          workflow_type: formData.type,
          target_date: formData.target_date
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow');
      }
      
      const data = await response.json();
      
      // Success!
      if (onSuccess) onSuccess(data.workflow);
      onClose();
      
    } catch (err) {
      console.error('Error creating workflow:', err);
      setError(err.message || 'Erreur lors de la création du workflow');
    } finally {
      setCreating(false);
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      template_id: '' // Reset template selection
    }));
  };

  if (!isOpen) return null;

  const selectedTemplate = templates.find(t => t.id === parseInt(formData.template_id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Rocket className="w-7 h-7 text-blue-600" />
            Créer un workflow
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={creating}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium">
              Workflow pour : <span className="font-bold">{employeeName}</span>
            </p>
          </div>

          {/* Type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de workflow
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('onboarding')}
                disabled={creating}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'onboarding'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Rocket className={`w-6 h-6 ${
                    formData.type === 'onboarding' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className={`font-semibold ${
                    formData.type === 'onboarding' ? 'text-green-900' : 'text-gray-700'
                  }`}>
                    Onboarding
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Arrivée d'un nouvel employé
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('offboarding')}
                disabled={creating}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'offboarding'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <LogOut className={`w-6 h-6 ${
                    formData.type === 'offboarding' ? 'text-orange-600' : 'text-gray-400'
                  }`} />
                  <span className={`font-semibold ${
                    formData.type === 'offboarding' ? 'text-orange-900' : 'text-gray-700'
                  }`}>
                    Offboarding
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Départ d'un employé
                </p>
              </button>
            </div>
          </div>

          {/* Template selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Template
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement des templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Aucun template actif disponible pour ce type de workflow.
                </p>
              </div>
            ) : (
              <select
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                disabled={creating}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Sélectionner un template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.total_tasks} tâches)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Template info */}
          {selectedTemplate && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedTemplate.name}
              </h4>
              {selectedTemplate.description && (
                <p className="text-sm text-gray-700 mb-3">
                  {selectedTemplate.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📋 {selectedTemplate.total_tasks} tâches</span>
                {selectedTemplate.department && (
                  <span>🏢 {selectedTemplate.department}</span>
                )}
                {selectedTemplate.job_title && (
                  <span>👤 {selectedTemplate.job_title}</span>
                )}
              </div>
            </div>
          )}

          {/* Target date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date cible
              <span className="text-xs text-gray-500 font-normal">
                ({formData.type === 'onboarding' ? 'Premier jour' : 'Dernier jour'})
              </span>
            </label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              disabled={creating}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Les échéances des tâches seront calculées automatiquement à partir de cette date.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating || loading || templates.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Créer le workflow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkflowModal;