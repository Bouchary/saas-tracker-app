// ============================================================================
// ONGLET WORKFLOWS - Fiche Employé
// ============================================================================
// Fichier : client/src/components/employees/EmployeeWorkflowsTab.jsx
// Usage : 3e onglet dans EmployeeDetailPage (après Informations et Matériel)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EmployeeWorkflowsTab = ({ employeeId }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeWorkflows();
  }, [employeeId]);

  const fetchEmployeeWorkflows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Utiliser import.meta.env pour Vite au lieu de process.env
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(
        `${apiUrl}/api/workflows?employee_id=${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch workflows');
      
      const data = await response.json();
      setWorkflows(data.workflows || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('Impossible de charger les workflows');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-gray-100 text-gray-800' },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
      on_hold: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getWorkflowTypeIcon = (type) => {
    return type === 'onboarding' ? '🚀' : '👋';
  };

  const getWorkflowTypeName = (type) => {
    return type === 'onboarding' ? 'Onboarding' : 'Offboarding';
  };

  const getDaysUntilTarget = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Il y a ${Math.abs(diffDays)} jours`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: "Aujourd'hui", color: 'text-orange-600 font-semibold' };
    } else if (diffDays === 1) {
      return { text: 'Demain', color: 'text-orange-600' };
    } else if (diffDays <= 7) {
      return { text: `Dans ${diffDays} jours`, color: 'text-yellow-600' };
    } else {
      return { text: `Dans ${diffDays} jours`, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchEmployeeWorkflows}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucun workflow actif
        </h3>
        <p className="text-gray-600 mb-6">
          Cet employé n'a aucun workflow d'onboarding ou d'offboarding en cours.
        </p>
        <Link
          to={`/workflows?employee_id=${employeeId}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <span>➕</span>
          <span className="ml-2">Créer un workflow</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Workflows actifs</p>
            <p className="text-3xl font-bold text-gray-900">
              {workflows.filter(w => ['pending', 'in_progress'].includes(w.status)).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Progression moyenne</p>
            <p className="text-3xl font-bold text-blue-600">
              {workflows.length > 0
                ? Math.round(workflows.reduce((sum, w) => sum + (w.completion_percentage || 0), 0) / workflows.length)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tâches en retard</p>
            <p className="text-3xl font-bold text-red-600">
              {workflows.reduce((sum, w) => sum + (w.overdue_tasks || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des workflows */}
      <div className="space-y-4">
        {workflows.map((workflow) => {
          const daysInfo = getDaysUntilTarget(workflow.target_date);
          
          return (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <Link to={`/workflows/${workflow.id}`} className="block p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="text-4xl">
                      {getWorkflowTypeIcon(workflow.workflow_type)}
                    </div>
                    
                    {/* Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {getWorkflowTypeName(workflow.workflow_type)}
                      </h3>
                      {workflow.template && (
                        <p className="text-sm text-gray-600 mb-2">
                          Template : {workflow.template.name}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          📅 Date cible : {new Date(workflow.target_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className={daysInfo.color}>
                          {daysInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <div>
                    {getStatusBadge(workflow.status)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progression
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {workflow.completed_tasks || 0} / {workflow.total_tasks || 0} tâches
                      <span className="ml-2 text-blue-600">
                        ({Math.round(workflow.completion_percentage || 0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        workflow.completion_percentage === 100
                          ? 'bg-green-500'
                          : workflow.completion_percentage >= 50
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${workflow.completion_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Alerts */}
                {workflow.overdue_tasks > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ {workflow.overdue_tasks} tâche{workflow.overdue_tasks > 1 ? 's' : ''} en retard
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Démarré le {new Date(workflow.started_at).toLocaleDateString('fr-FR')}
                  </p>
                  <span className="text-sm text-blue-600 font-medium hover:underline">
                    Voir les détails →
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-6">
        <Link
          to="/workflows/my-tasks"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="mr-2">📋</span>
          <span>Voir toutes mes tâches</span>
        </Link>
      </div>
    </div>
  );
};

export default EmployeeWorkflowsTab;