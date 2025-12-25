// ============================================================================
// PAGE WORKFLOWS - Liste complète des workflows onboarding/offboarding
// ============================================================================
// Fichier : client/src/pages/workflows/WorkflowsPage.jsx
// Route : /workflows
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { 
  Users, Filter, Search, CheckCircle2, Clock, AlertCircle, 
  TrendingUp, Rocket, LogOut, Calendar, User, Building,
  ArrowRight, RefreshCw, XCircle
} from 'lucide-react';

const WorkflowsPage = () => {
  const { token: authToken } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    fetchWorkflows();
  }, [filters.status, filters.type]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const token = authToken || localStorage.getItem('userToken') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('type', filters.type);
      
      const url = `${apiUrl}/api/workflows?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: 'En attente', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock
      },
      in_progress: { 
        label: 'En cours', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: TrendingUp
      },
      completed: { 
        label: 'Terminé', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2
      },
      cancelled: { 
        label: 'Annulé', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getWorkflowTypeConfig = (type) => {
    return type === 'onboarding' ? {
      icon: Rocket,
      label: 'Onboarding',
      color: 'text-green-600'
    } : {
      icon: LogOut,
      label: 'Offboarding',
      color: 'text-orange-600'
    };
  };

  // Filter workflows by search
  const filteredWorkflows = workflows.filter(workflow => {
    if (filters.search === '') return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      workflow.employee.first_name.toLowerCase().includes(searchLower) ||
      workflow.employee.last_name.toLowerCase().includes(searchLower) ||
      workflow.employee.department?.toLowerCase().includes(searchLower) ||
      workflow.employee.job_title?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = {
    total: workflows.length,
    onboarding: workflows.filter(w => w.workflow_type === 'onboarding').length,
    offboarding: workflows.filter(w => w.workflow_type === 'offboarding').length,
    active: workflows.filter(w => ['pending', 'in_progress'].includes(w.status)).length,
    overdue: workflows.reduce((sum, w) => sum + (w.overdue_tasks || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Chargement des workflows...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Tous les Workflows
              </h1>
              <p className="mt-2 text-gray-600">
                Vue d'ensemble des workflows d'onboarding et d'offboarding
              </p>
            </div>
            <Link
              to="/workflows/my-tasks"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mes tâches
            </Link>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.total)}</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg shadow-sm border-2 border-blue-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-600">Actifs</p>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-700">{formatNumber(stats.active)}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-600">Onboarding</p>
                <Rocket className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-700">{formatNumber(stats.onboarding)}</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg shadow-sm border-2 border-orange-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-orange-600">Offboarding</p>
                <LogOut className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-orange-700">{formatNumber(stats.offboarding)}</p>
            </div>
            
            <div className="bg-red-50 rounded-lg shadow-sm border-2 border-red-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-red-600">En retard</p>
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-700">{formatNumber(stats.overdue)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Nom, prénom, département, poste..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  Statut
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {/* Type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="all">Tous les types</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="offboarding">Offboarding</option>
                </select>
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchWorkflows}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Workflows list */}
        {error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-4">{error}</p>
            <button
              onClick={fetchWorkflows}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun workflow trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {workflows.length === 0
                ? "Il n'y a aucun workflow en cours pour le moment."
                : "Aucun workflow ne correspond à vos critères de recherche."}
            </p>
            {workflows.length > 0 && (
              <button
                onClick={() => setFilters({ status: 'all', type: 'all', search: '' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{formatNumber(filteredWorkflows.length)}</span> workflow{filteredWorkflows.length > 1 ? 's' : ''} trouvé{filteredWorkflows.length > 1 ? 's' : ''}
              {filters.search && ` pour "${filters.search}"`}
            </div>

            {/* Workflows grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredWorkflows.map((workflow) => {
                const typeConfig = getWorkflowTypeConfig(workflow.workflow_type);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <Link
                    key={workflow.id}
                    to={`/employees/${workflow.employee.id}`}
                    className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6 group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          workflow.workflow_type === 'onboarding' 
                            ? 'bg-green-100' 
                            : 'bg-orange-100'
                        }`}>
                          <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                            {workflow.employee.first_name} {workflow.employee.last_name}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{workflow.employee.job_title}</span>
                            {workflow.employee.department && (
                              <>
                                <span>•</span>
                                <Building className="w-4 h-4" />
                                <span>{workflow.employee.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(workflow.status)}
                      </div>
                    </div>

                    {/* Template */}
                    {workflow.template && (
                      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-400 rounded"></div>
                        <span className="font-medium">Template :</span>
                        <span>{workflow.template.name}</span>
                      </div>
                    )}

                    {/* Date & Days */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Date cible : {new Date(workflow.target_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {workflow.days_until_target !== null && (
                        <span className={`font-semibold flex items-center gap-1 ${
                          workflow.days_until_target < 0 ? 'text-red-600' :
                          workflow.days_until_target <= 7 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          <Clock className="w-4 h-4" />
                          {workflow.days_until_target < 0
                            ? `Il y a ${formatNumber(Math.abs(workflow.days_until_target))} jours`
                            : workflow.days_until_target === 0
                            ? "Aujourd'hui !"
                            : `Dans ${formatNumber(workflow.days_until_target)} jour${workflow.days_until_target > 1 ? 's' : ''}`
                          }
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Progression</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            {formatNumber(workflow.completed_tasks)} / {formatNumber(workflow.total_tasks)} tâches
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {Math.round(workflow.completion_percentage || 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
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

                    {/* Overdue alert */}
                    {workflow.overdue_tasks > 0 && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800 font-medium">
                          {formatNumber(workflow.overdue_tasks)} tâche{workflow.overdue_tasks > 1 ? 's' : ''} en retard
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowsPage;